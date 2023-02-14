import {
  AutotaskEvent,
  BlockTriggerEvent,
} from "defender-autotask-utils";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import {ethers} from "ethers";
import axios from 'axios';
import roundImplementationAbi from "../../abi/RoundImplementation.json" assert {type: "json"};
import {RelayerParams} from "defender-relay-client";


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
    console.error("No request found");
    return;
  }
  const {
    GRAPGHQL_ENDPOINT,
    PINATA_JWT,
  } = event.secrets || {} as Record<string, string | undefined>;

  // Contract Sentinel
  const contractPayload = event.request.body as BlockTriggerEvent;
  const {transaction, matchReasons} = contractPayload;

  console.log("Transaction: ", transaction);
  console.log("matchReasons: ", matchReasons);


  // @ts-ignore
  const decodedVotes = matchReasons[0].params.encodedVotes.map(x => ethers.utils.defaultAbiCoder.decode(["address", "address", "uint256"], x) as [string, string, string]);
  const creatorAddresses = decodedVotes.map((vote: any) => vote[1] as string);
  console.log("Creator addresses", creatorAddresses);
  // @ts-ignore
  const contractAddress = contractPayload.matchReasons[0].address as string;

  console.log('Decoded votes', decodedVotes);

  const provider = new DefenderRelayProvider(event as RelayerParams);
  const signer = new DefenderRelaySigner(event as RelayerParams, provider, {
    speed: "fast",
  });

  const forwarder = new ethers.Contract(contractAddress!, roundImplementationAbi, signer);


  let currentProjectsMeta: ProjectMetaEntry[] = [];
  try {
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
      {query: getProjectsMetaPtrQuery, variables: {roundId: contractAddress}}
    ).then(async (response) => {
      return response.data.data.round;
    });
    if (currentProjectsMetaPtr) {
      currentProjectsMeta = await fetchFromIPFS<ProjectMetaEntry[]>(currentProjectsMetaPtr.projectsMetaPtr.pointer);
    }
  } catch (error) {
    console.log(error);
    return;
  }

  console.log("✅ Current projects meta:", currentProjectsMeta);
  const newProjectsMeta = [...currentProjectsMeta];

  creatorAddresses.forEach((creatorAddress: string) => {
    const currentUserInProjects = newProjectsMeta.map(project => project.payoutAddress).includes(creatorAddress);
    if (currentUserInProjects) {
      console.log("User already added to ptr, does not have to be added to metadata");
      return;
    }
    newProjectsMeta.push({
      payoutAddress: creatorAddress,
      id: `${contractAddress}-${creatorAddress}`,
      status: "APPROVED"
    })
  })

  console.log("✅ New projects meta", newProjectsMeta);

  if (currentProjectsMeta.length === newProjectsMeta.length) {
    console.log("No new applicants, no need to update projectsMetaPtr");
    return;
  }

  const newPtr = await pinToIPFS({content: newProjectsMeta}, PINATA_JWT!);
  console.log('✅ Pinned new projects meta to ipfs', newPtr);

  const cid = newPtr.IpfsHash;

  const newRoundMetaPr = {
    protocol: 1,
    pointer: cid,
  };

  const tx = await forwarder.updateProjectsMetaPtr(newRoundMetaPr);
  console.log(`✅ Sent tx: ${tx.hash}`);
  return {txHash: tx.hash};
}


export const fetchFromIPFS = <T = unknown>(cid: string) => {
  return axios.get(
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