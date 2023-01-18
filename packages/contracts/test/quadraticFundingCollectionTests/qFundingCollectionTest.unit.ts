import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { deployLensMumbaiFixture } from "../lensTests/lens.fixture";
import { DEFAULT_VOTE, getDefaultSigners } from "../utils/constants";
import { getCollectModulePubInitData } from "../utils/utils";
import { ERC20 } from "./../../types/@openzeppelin/contracts/token/ERC20/ERC20";
import { RoundImplementation } from "./../../types/contracts/gitcoin/round/RoundImplementation";
import { QuadraticFundingVotingStrategyImplementation } from "./../../types/contracts/gitcoin/votingStrategy/QuadraticFundingStrategy/QuadraticFundingVotingStrategyImplementation";

export const shouldBehaveLikeQuadraticVoteModule = () => {
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WETH: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingVotingStrategyImplementation;
  let _signers: { [key: string]: SignerWithAddress };

  before("Setup QFVM", async () => {
    const signers = await getDefaultSigners();
    _signers = signers;

    // deploy lens fixture
    const { qVoteCollectModule } = await loadFixture(deployLensMumbaiFixture);
    _qVoteCollectModule = qVoteCollectModule;

    // deploy gitcoin fixture
    const { roundImplementation, WETH, votingStrategy } = await loadFixture(deployGitcoinMumbaiFixture);

    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;
  });

  describe("QuadraticVoteCollectModule unit tests", () => {
    it("Should initialize the QVCM with WETH", async () => {
      const initData = [_WETH.address, 100, _roundImplementation.address, _votingStrategy.address];
      console.log("INIT DATA: ", initData);

      const collectModuleInitData = getCollectModulePubInitData(initData);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;
    });

    it("Should execute processCollect and vote", async () => {
      const { user2 } = _signers;

      //TODO Refactor to default Init data
      const initData = [_WETH.address, 100, _roundImplementation.address, _votingStrategy.address];

      const collectModuleInitData = getCollectModulePubInitData(initData);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      //start a round
      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);

      await expect(_WETH.connect(user2).approve(_qVoteCollectModule.address, DEFAULT_VOTE)).to.emit(_WETH, "Approval");

      // TODO when fixed expect "Voted event"
      await expect(_qVoteCollectModule.connect(user2).processCollect(1, user2.address, 1, 1, collectData)).to.be
        .reverted;
    });

    it("Should execute processCollect with referral and vote", async () => {
      const { user2 } = _signers;

      const collectModuleInitData = getCollectModulePubInitData([
        _WETH.address,
        100,
        _roundImplementation.address,
        _votingStrategy.address,
      ]);
      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WETH.address, DEFAULT_VOTE]);

      await _WETH.connect(user2).approve(_qVoteCollectModule.address, DEFAULT_VOTE);

      // TODO when fixed expect "Voted event"
      await expect(_qVoteCollectModule.connect(user2).processCollect(22, user2.address, 1, 1, collectData)).to.be
        .reverted;
    });
  });
};
