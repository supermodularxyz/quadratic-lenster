import { shouldBehaveLikeQuadraticVoteModule } from "./qFundingCollection.unit";
import { shouldBehaveLikeQFCollectionModule } from "./qFundingCollection.behavior";

describe("Quadratic Funding Collection Module", () => {
  shouldBehaveLikeQuadraticVoteModule();
  shouldBehaveLikeQFCollectionModule();
});
