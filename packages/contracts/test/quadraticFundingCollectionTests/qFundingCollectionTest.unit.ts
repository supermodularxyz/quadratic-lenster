import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { DEFAULT_VOTE } from "../utils/constants";
import { getCollectModulePubInitData, getDefaultSigners } from "../utils/utils";
import { ERC20 } from "./../../types/contracts/mocks/ERC20";
import { QuadraticFundingVotingStrategyImplementation } from "./../../types/contracts/mocks/QuadraticFundingVotingStrategyImplementation";
import { RoundImplementation } from "./../../types/contracts/mocks/RoundImplementation";

export const shouldBehaveLikeQuadraticVoteModule = () => {
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WETH: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingVotingStrategyImplementation;
  let _signers: { [key: string]: SignerWithAddress };
  let _initData: (string | number | BigNumber)[];
  let collectModuleInitData: string;
  before("Setup QFVM", async () => {
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
    _initData = [_WETH.address, 100, _roundImplementation.address, _votingStrategy.address];

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

      // TODO when fixed expect correct "Voted event parameters"
      await expect(_qVoteCollectModule.connect(user2).processCollect(1, user2.address, 1, 1, collectData))
        .to.emit(_votingStrategy, "Voted")
        .withArgs(
          _WETH.address,
          "999900000000000000",
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

      await expect(_WETH.connect(user2).approve(_qVoteCollectModule.address, ethers.utils.parseEther("10"))).to.emit(
        _WETH,
        "Approval",
      );
      await expect(_WETH.connect(user2).approve(_votingStrategy.address, ethers.utils.parseEther("10"))).to.emit(
        _WETH,
        "Approval",
      );

      // TODO when fixed expect "Voted event parameters"
      await expect(_qVoteCollectModule.connect(user2).processCollect(22, user2.address, 1, 1, collectData))
        .to.emit(_votingStrategy, "Voted")
        .withArgs(
          _WETH.address,
          "989901000000000000",
          user2.address,
          _roundImplementation.address,
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          _roundImplementation.address,
        );
    });
  });
};
