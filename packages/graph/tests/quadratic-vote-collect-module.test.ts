import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { CollectWithVote } from "../generated/schema"
import { CollectWithVote as CollectWithVoteEvent } from "../generated/QuadraticVoteCollectModule/QuadraticVoteCollectModule"
import { handleCollectWithVote } from "../src/quadratic-vote-collect-module"
import { createCollectWithVoteEvent } from "./quadratic-vote-collect-module-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let profileId = BigInt.fromI32(234)
    let pubId = BigInt.fromI32(234)
    let collector = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let currency = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let newCollectWithVoteEvent = createCollectWithVoteEvent(
      profileId,
      pubId,
      collector,
      currency,
      amount
    )
    handleCollectWithVote(newCollectWithVoteEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CollectWithVote created and stored", () => {
    assert.entityCount("CollectWithVote", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CollectWithVote",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "profileId",
      "234"
    )
    assert.fieldEquals(
      "CollectWithVote",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "pubId",
      "234"
    )
    assert.fieldEquals(
      "CollectWithVote",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "collector",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CollectWithVote",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "currency",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CollectWithVote",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
