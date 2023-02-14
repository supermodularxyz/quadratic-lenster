import { shouldBehaveLikeQFCollectionModule } from "./qFundingCollection.integration";
import { shouldBehaveLikeQuadraticVoteModule } from "./qFundingCollection.unit";

describe("Quadratic Funding Collection Module", () => {
  shouldBehaveLikeQuadraticVoteModule();
  shouldBehaveLikeQFCollectionModule();
});
