import { shouldBehaveLikeGrantsRound } from "./gitcoin.behavior";

describe("gitcoin Unit tests", () => {
  describe("Grants round", () => {
    shouldBehaveLikeGrantsRound();
  });
});
