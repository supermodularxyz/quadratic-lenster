import { shouldBehaveLikeQuadraticVoteModule } from "./qFundingCollection.unit";
import { shouldBehaveLikeQFCollectionModule } from "./qFundingCollection.integration";

describe("Quadratic Funding Collection Module", () => {
  shouldBehaveLikeQuadraticVoteModule();
  shouldBehaveLikeQFCollectionModule();
});
