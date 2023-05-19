import {
  AutotaskEvent,
  BlockTriggerEvent,
} from "defender-autotask-utils";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import {BytesLike, ethers} from "ethers";
import axios from 'axios';
import roundImplementationAbi from "../../abi/RoundImplementation.json" assert {type: "json"};
import {RelayerParams} from "defender-relay-client";
import ERC721 from "../../abi/ERC721.json" assert {type: "json"};

const getProjectsMetaPtrQuery = `
  query GetProjectsMetaPtr($roundId: String) {
    round(id: $roundId) {
      id
      projectsMetaPtr {
        id
        protocol
        pointer
      }
    }
  }
`;

export async function handler(event: AutotaskEvent) {
  // Or if you know what type of sentinel you'll be using
  if (!event.request) {
    throw new Error("❌ No request found");
  }

  const {
    GRAPGHQL_ENDPOINT,
    PINATA_JWT,
    LENS_HUB_PROXY_ADDRESS,
  } = event.secrets || {} as Record<string, string | undefined>;

  // Contract Sentinel
  const contractPayload = event.request.body as BlockTriggerEvent;
  const {matchReasons} = contractPayload;

  // debug logs
  // console.log("ℹ️ Transaction: ", transaction);
  // console.log("ℹ️ matchReasons: ", matchReasons);


  const params = (matchReasons[0] as any).params as Record<string, string | undefined>
  const {roundAddress, projectId, token: voteToken} = params;
  const accountId = ethers.utils.parseBytes32String(projectId as BytesLike);
  if (!roundAddress) {
    throw new Error("❌ Could not determine round address");
  }
  if (!accountId) {
    throw new Error("❌ Could not determine lens account id");
  }
  if (!voteToken) {
    throw new Error("❌ Could not determine vote token");
  }
  console.log("ℹ️ Project ID", projectId);
  console.log("ℹ️ Round address", roundAddress);
  console.log("ℹ️ Owner ID", accountId);
  console.log("ℹ️ Vote token", voteToken);

  // Setup relay signer
  const provider = new DefenderRelayProvider(event as RelayerParams);
  const signer = new DefenderRelaySigner(event as RelayerParams, provider, {
    speed: "fast",
  });
  const roundContract = new ethers.Contract(roundAddress, roundImplementationAbi, signer);

  const roundToken = await roundContract.token();
  if (!roundToken) {
    throw new Error("❌ Could not determine round token");
  }
  console.log("ℹ️ Round token", roundToken);

  if (roundToken.toLowerCase() !== voteToken.toLowerCase()) {
    throw new Error("❌ Vote cast in wrong token");
  }

  let currentProjectsMeta: ProjectMetaEntry[] = [];
  const currentProjectsMetaPtr = await axios.post<{
    data: {
      round: {
        id: string;
        projectsMetaPtr: {
          id: string;
          protocol: string;
          pointer: string;
        }
      }
    }
  }>(
    GRAPGHQL_ENDPOINT!,
    {query: getProjectsMetaPtrQuery, variables: {roundId: roundAddress.toLowerCase()}}
  ).then(async (response) => {
    return response.data.data.round;
  });
  if (currentProjectsMetaPtr?.projectsMetaPtr?.pointer) {
    const projectMetaOnIPfs = await fetchFromIPFS<ProjectMetaEntry[]>(currentProjectsMetaPtr.projectsMetaPtr.pointer);
    console.log('ℹ️ Project meta on IPFS', projectMetaOnIPfs);
    currentProjectsMeta = projectMetaOnIPfs;
  }

  console.log("ℹ️ Current projects meta:", currentProjectsMeta);
  const newProjectsMeta = [...currentProjectsMeta];

  // Check if user has already been added to applicants metadata
  const currentUserInProjects = newProjectsMeta.map(project => project.id).includes(accountId.toString());
  if (currentUserInProjects) {
    return "💡 User already added to ptr, does not have to be added to metadata";
  }


  // User needs to be added to applicants, fetch payout address using account id
  console.log("ℹ️ Lens Hub Proxy Address", LENS_HUB_PROXY_ADDRESS!);
  const erc721Contract = new ethers.Contract(
    LENS_HUB_PROXY_ADDRESS!,
    ERC721,
    signer
  );

  const creatorAddress = await erc721Contract.ownerOf(accountId);
  console.log("ℹ️ Creator Address", creatorAddress);
  newProjectsMeta.push({
    payoutAddress: creatorAddress,
    id: accountId.toString(),
    status: "APPROVED"
  })

  // Create new applicants metadata
  console.log("ℹ️ New projects meta", newProjectsMeta);

  // Pin new metadata to IPFS
  const newPtr = await pinToIPFS({content: newProjectsMeta}, PINATA_JWT!);
  console.log('✅ Pinned new projects meta to ipfs', newPtr);

  // Update round meta pointer
  const cid = newPtr.IpfsHash;
  const newRoundMetaPr = {
    protocol: 1,
    pointer: cid,
  };
  const sentTx = await roundContract.updateProjectsMetaPtr(newRoundMetaPr);

  // Complete
  console.log(`✅ Sent tx: ${sentTx.hash}`);
  return `✅ Updated projectsMetaPtr in transaction ${sentTx.hash}`;
}


export const fetchFromIPFS = <T = unknown>(cid: string) => {
  return axios.get(
    // TODO: Use Pinata gateway
    `https://ipfs.io/ipfs/${cid}`
  ).then((resp) => {
    return resp.data as Promise<T>;
  });
};

/**
 * Pin data to IPFS
 * The data could either be a file or a JSON object
 *
 * @param obj - the data to be pinned on IPFS
 * @param pinataJWT - the JTW for pinata to enable pinning
 * @returns the unique content identifier that points to the data
 */
export const pinToIPFS = (obj: any, pinataJWT: string) => {
  // content is a JSON object
  return axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {

      pinataMetadata: obj.metadata,
      pinataOptions: {
        cidVersion: 1,
      }, pinataContent: obj.content
    }
    , {
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
        "Content-Type": "application/json",
      },
    }).then((resp) => {
    return resp.data
  });
};

export type ProjectMetaEntry = { id: string; payoutAddress: string; status: string };
