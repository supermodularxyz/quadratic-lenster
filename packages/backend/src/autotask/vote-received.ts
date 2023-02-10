import {
  AutotaskEvent,
  BlockTriggerEvent,
} from "defender-autotask-utils";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import {BigNumber, ethers} from "ethers";
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
    ROUND_CONTRACT_ADDRESS,
    PINATA_JWT,
  } = event.secrets || {} as Record<string, string | undefined>;

  // Contract Sentinel
  const contractPayload = event.request.body as BlockTriggerEvent;
  const {transaction, matchReasons} = contractPayload;

  console.log("Transaction: ");
  console.log(transaction);
  console.log("matchReasons: ");
  console.log(matchReasons);


  // @ts-ignore
  const decodedVotes = matchReasons[0].params.encodedVotes.map(x => ethers.utils.defaultAbiCoder.decode(["address", "address", "uint256"], x) as [string, string, string]);
  const creatorAddresses = decodedVotes.map((vote: any) => vote[1] as string);
  console.log("Creator addresses", creatorAddresses);
  const contractAddress = contractPayload.matchedAddresses[0];

  // @ts-ignore
  console.log('Decoded votes', decodedVotes);


  // const decodedVotes = .encode(["address", "uint256", "address"], votes[i])

  const provider = new DefenderRelayProvider(event as RelayerParams);
  const signer = new DefenderRelaySigner(event as RelayerParams, provider, {
    speed: "fast",
  });

  console.log("Contract Address", ROUND_CONTRACT_ADDRESS);
  // console.log('ABI', roundImplementationAbi);
  const forwarder = new ethers.Contract(ROUND_CONTRACT_ADDRESS!, roundImplementationAbi, signer);
  // console.log("Forwarder", forwarder);


  let currentProjectsMeta: ProjectMetaEntry[] = [];
  try {
    // const options: RequestInit = {
    //   method: 'GET',
    //   body: JSON.stringify({query: getProjectsMetaPtrQuery, variables: {id: roundId}})
    // }
    console.log("Performing request");
    const currentProjectsMetaPtr = await axios.post<{
      round: {
        id: string;
        projectsMetaPtr: {
          id: string;
          protocol: string;
          pointer: string;
        }
      }
    }>(
      GRAPGHQL_ENDPOINT!,
      {query: getProjectsMetaPtrQuery, variables: {roundId: contractAddress}}
    ).then(async (response) => {
      console.log("Response data", response.data);
      return response.data.round;
    });
    if (currentProjectsMetaPtr) {
      currentProjectsMeta = await fetchFromIPFS<ProjectMetaEntry[]>(currentProjectsMetaPtr.projectsMetaPtr.pointer);
    }
  } catch (error) {
    console.log(error);
    return;
  }

  const newProjectsMeta = [...currentProjectsMeta];

  creatorAddresses.forEach((creatorAddress: string) => {
    const currentUserInProjects = newProjectsMeta.map(project => project.payoutAddress).includes(creatorAddress);
    if (!currentUserInProjects) {
      newProjectsMeta.push({
        payoutAddress: creatorAddress,
        id: `${contractAddress}-${creatorAddress}`,
        status: "APPROVED"
      })
      console.log("User already added to ptr, does not have to be added to metadata");
      return;
    }
  })

  console.log(newProjectsMeta);

  const newPtr = await pinToIPFS({content: newProjectsMeta}, PINATA_JWT!);
  console.log('Pinned new projects meta to ipfs', newPtr);

  const cid = newPtr.IpfsHash;

  const newRoundMetaPr = {
    protocol: 1,
    pointer: newPtr
  };

  const tx = await forwarder.updateProjectsMetaPtr(newRoundMetaPr);
  console.log(`Sent tx: ${tx.hash}`);
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