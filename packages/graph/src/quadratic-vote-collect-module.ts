import { CollectWithVote as CollectWithVoteEvent } from "../generated/QuadraticVoteCollectModule/QuadraticVoteCollectModule";
import { CollectWithVote } from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleCollectWithVote(event: CollectWithVoteEvent): void {
  let entity = new CollectWithVote(
    event.transaction.hash
      .toHexString()
      .concat("-".concat(event.logIndex.toString()))
  );
  entity.profileId = event.params.profileId;
  entity.pubId = event.params.pubId;
  entity.collector = event.params.collector;
  entity.currency = event.params.currency;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  log.info("Storing CollectWithVoteEvent: {}", [entity.id.toString()]);

  entity.save();
}
