import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { QuadraticFundingRelayStrategyImplementation } from "../../types/contracts/mocks/QuadraticFundingRelayStrategyImplementation";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { DEFAULT_VOTE } from "../utils/constants";
import { getCollectModulePubInitData, getDefaultSigners } from "../utils/utils";
import { ERC20 } from "./../../types/contracts/mocks/ERC20";
import { RoundImplementation } from "./../../types/contracts/mocks/RoundImplementation";
import { BPS_MAX } from "./../utils/constants";

export const shouldBehaveLikeQuadraticVoteModule = () => {
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WETH: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingRelayStrategyImplementation;
  let _signers: { [key: string]: SignerWithAddress };
  let _initData: (string | number | BigNumber)[];
  let collectModuleInitData: string;

  function getLensTreasuryAmount(lensTreasuryFee: BigNumber, voteAmount: BigNumber) {
    const treasuryAmount = voteAmount.mul(lensTreasuryFee).div(BPS_MAX);
    return treasuryAmount;
  }

  beforeEach("Setup QFVM", async () => {
    const signers = await getDefaultSigners();
    _signers = signers;

    // deploy gitcoin fixture
    const { qVoteCollectModule, roundImplementation, WETH, votingStrategy } = await loadFixture(
      deployGitcoinMumbaiFixture,
    );

    _qVoteCollectModule = qVoteCollectModule;
    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;
    _initData = [_WETH.address, 0, _roundImplementation.address, _votingStrategy.address];
    collectModuleInitData = getCollectModulePubInitData(_initData);
  });

  describe("QuadraticVoteCollectModule unit tests", () => {
    it("Should initialize the QVCM with WETH", async () => {
      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;
    });

    it.only("Should execute processCollect and vote", async () => {
      const { user2 } = _signers;

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      //start a round
      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);
      // must approve voteCollectModule and VotingStrategy.
      await expect(_WETH.connect(user2).approve(_qVoteCollectModule.address, DEFAULT_VOTE)).to.emit(_WETH, "Approval");
      await expect(_WETH.connect(user2).approve(_votingStrategy.address, DEFAULT_VOTE)).to.emit(_WETH, "Approval");

      //lens base treasury fee is 1 on mumbai
      const treasuryAmount = getLensTreasuryAmount(BigNumber.from("1"), DEFAULT_VOTE);

      await expect(_qVoteCollectModule.connect(user2).processCollect(1, user2.address, 1, 1, collectData))
        .to.emit(_votingStrategy, "Voted")
        .withArgs(
          _WETH.address,
          DEFAULT_VOTE.sub(treasuryAmount),
          user2.address,
          _roundImplementation.address,
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          _roundImplementation.address,
        );
    });

    it.only("Should execute processCollect with referral and vote", async () => {
      const { user2 } = _signers;

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);

      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      await expect(_WETH.connect(user2).approve(_qVoteCollectModule.address, DEFAULT_VOTE)).to.emit(_WETH, "Approval");
      await expect(_WETH.connect(user2).approve(_votingStrategy.address, DEFAULT_VOTE)).to.emit(_WETH, "Approval");

      //lens base treasury fee is 1 on mumbai
      const treasuryAmount = getLensTreasuryAmount(BigNumber.from("1"), DEFAULT_VOTE);

      await expect(_qVoteCollectModule.connect(user2).processCollect(22, user2.address, 1, 1, collectData))
        .to.emit(_votingStrategy, "Voted")
        .withArgs(
          _WETH.address,
          DEFAULT_VOTE.sub(treasuryAmount),
          user2.address,
          _roundImplementation.address,
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          _roundImplementation.address,
        );
    });
  });
};
