import {
  ADMIN_API_KEY,
  ADMIN_API_SECRET,
  CURATOR_ABI,
  DEFAULT_CURATOR,
} from "../constants.js";
import {
  AutotaskEvent,
  BlockTriggerEvent,
} from "defender-autotask-utils";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";
import ethers from "ethers";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };

export async function handler(event: AutotaskEvent) {
  // Or if you know what type of sentinel you'll be using
  if (!event.request) {
    console.error("No request found");
    return;
  }
  // Contract Sentinel
  const contractPayload = event.request.body as BlockTriggerEvent;
  const { transaction, matchReasons } = contractPayload;

  console.log("Transaction: ");
  console.log(transaction);
  console.log("matchReasons: ");
  console.log(matchReasons);

  const provider = new DefenderRelayProvider(creds);
  const signer = new DefenderRelaySigner(creds, provider, {
    speed: "fast",
  });
  const forwarder = new ethers.Contract(DEFAULT_CURATOR, CURATOR_ABI, signer);

  // TODO execture business logic

  const newRoundMetaPr = [1, "tr0l0l0l0l0l0l0l0l0l0l"];

  const tx = await forwarder.updateMetaPtr(newRoundMetaPr);
  console.log(`Sent tx: ${tx.hash}`);
  return { txHash: tx.hash };
}
