import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { CollectWithVote } from "../generated/QuadraticVoteCollectModule/QuadraticVoteCollectModule"

export function createCollectWithVoteEvent(
  profileId: BigInt,
  pubId: BigInt,
  collector: Address,
  currency: Address,
  amount: BigInt
): CollectWithVote {
  let collectWithVoteEvent = changetype<CollectWithVote>(newMockEvent())

  collectWithVoteEvent.parameters = new Array()

  collectWithVoteEvent.parameters.push(
    new ethereum.EventParam(
      "profileId",
      ethereum.Value.fromUnsignedBigInt(profileId)
    )
  )
  collectWithVoteEvent.parameters.push(
    new ethereum.EventParam("pubId", ethereum.Value.fromUnsignedBigInt(pubId))
  )
  collectWithVoteEvent.parameters.push(
    new ethereum.EventParam("collector", ethereum.Value.fromAddress(collector))
  )
  collectWithVoteEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )
  collectWithVoteEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return collectWithVoteEvent
}
