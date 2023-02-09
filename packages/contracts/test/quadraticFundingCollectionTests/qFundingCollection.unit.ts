import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { ERC20 } from "../../types/contracts/mocks/ERC20";
import { QuadraticFundingRelayStrategyImplementation } from "../../types/contracts/mocks/QuadraticFundingRelayStrategyImplementation";
import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { LensUser } from "../lensTests/lens.fixture";
import { DEFAULT_VOTE } from "../utils/constants";
import { getDefaultSigners } from "../utils/utils";

export const shouldBehaveLikeQuadraticVoteModule = () => {
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WETH: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingRelayStrategyImplementation;
  let _signers: { [key: string]: SignerWithAddress };
  let _initData: (string | number | BigNumber)[];
  let _currentBlockTimestamp: number;
  let _profiles: { [key: string]: LensUser };
  before("Setup QFVM", async () => {
    _signers = await getDefaultSigners();

    // deploy gitcoin fixture
    const { qVoteCollectModule, roundImplementation, WETH, votingStrategy, currentBlockTimestamp, profiles } =
      await loadFixture(deployGitcoinMumbaiFixture);

    _qVoteCollectModule = qVoteCollectModule;
    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;
    _initData = [_WETH.address, 100, _roundImplementation.address, _votingStrategy.address];
    _currentBlockTimestamp = currentBlockTimestamp;
    _profiles = profiles;
  });

  describe("QuadraticVoteCollectModule unit tests", () => {
    it("Should initialize the QVCM with ERC20", async () => {
      const _initData = [_WETH.address, 0, _roundImplementation.address, _votingStrategy.address];
      const initQFCollect = ethers.utils.defaultAbiCoder.encode(["address", "uint16", "address", "address"], _initData);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, initQFCollect)).to.not.be.reverted;
    });

    it("Should execute processCollect and vote", async () => {
      const { user2 } = _signers;
      const { collector } = _profiles;
      const _initData = [_WETH.address, 0, _roundImplementation.address, _votingStrategy.address];
      const initQFCollect = ethers.utils.defaultAbiCoder.encode(["address", "uint16", "address", "address"], _initData);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, initQFCollect)).to.not.be.reverted;

      //start a round

      await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */

      // Approvals for voting

      await _WETH.connect(user2).approve(_qVoteCollectModule.address, DEFAULT_VOTE);
      await _WETH.connect(user2).approve(_votingStrategy.address, DEFAULT_VOTE);

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);

      await expect(
        _qVoteCollectModule.connect(collector.account).processCollect(1, user2.address, 1, 1, collectData),
      ).to.emit(_votingStrategy, "Voted");
    });

    it("Should execute processCollect with referral and vote", async () => {
      const { collector } = _profiles;

      const _initData = [_WETH.address, 0, _roundImplementation.address, _votingStrategy.address];
      const initQFCollect = ethers.utils.defaultAbiCoder.encode(["address", "uint16", "address", "address"], _initData);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, initQFCollect)).to.not.be.reverted;

      await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */

      await _WETH.connect(collector.account).approve(_qVoteCollectModule.address, DEFAULT_VOTE);
      await _WETH.connect(collector.account).approve(_votingStrategy.address, DEFAULT_VOTE);

      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);
      await expect(
        _qVoteCollectModule.connect(collector.account).processCollect(22, collector.account.address, 1, 1, collectData),
      ).to.emit(_votingStrategy, "Voted");
    });
  });
};
