import { shouldBehaveLikeQuadraticVoteModule } from "./qFundingCollectionTest.unit";
import { shouldBehaveLikeQFCollectionModule } from "./quadraticFundingCollection.behavior";

describe("Quadratic Funding Collection Module", () => {
  shouldBehaveLikeQuadraticVoteModule();
  shouldBehaveLikeQFCollectionModule();
});
