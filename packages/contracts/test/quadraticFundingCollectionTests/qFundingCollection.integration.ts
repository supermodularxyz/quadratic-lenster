import { MockContract } from "@ethereum-waffle/mock-contract";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { ERC20 } from "../../types/contracts/mocks/ERC20";
import { LensHub } from "../../types/contracts/mocks/LensHub";
import { ProfileCreationProxy } from "../../types/contracts/mocks/ProfileCreationProxy";
import { QuadraticFundingRelayStrategyImplementation } from "../../types/contracts/mocks/QuadraticFundingRelayStrategyImplementation";
import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { LensUser } from "../lensTests/lens.fixture";
import { buildPostData, getDefaultSigners } from "../utils/utils";

export function shouldBehaveLikeQFCollectionModule() {
  let signers: { [key: string]: SignerWithAddress };
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WMATIC: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingRelayStrategyImplementation;
  let _currentBlockTimestamp: number;

  let _lensHub: LensHub;
  let _moduleGlobals: MockContract;
  let _profileCreation: ProfileCreationProxy;
  let _profiles: { [key: string]: LensUser };

  beforeEach("setup test", async function () {
    signers = await getDefaultSigners();

    // deploy gitcoin fixture
    const {
      qVoteCollectModule,
      roundImplementation,
      WETH,
      votingStrategy,
      currentBlockTimestamp,
      lensHub,
      moduleGlobals,
      profileCreation,
      profiles,
    } = await loadFixture(deployGitcoinMumbaiFixture);

    _qVoteCollectModule = qVoteCollectModule;
    _WMATIC = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;
    _currentBlockTimestamp = currentBlockTimestamp;
    _moduleGlobals = moduleGlobals;
    _profileCreation = profileCreation;
    _profiles = profiles;
    _lensHub = lensHub;
  });

  it("Should collect a post and simultaneously vote in an active round", async function () {
    const { admin } = signers;
    const { creator, collector } = _profiles;
    const voteAmount = ethers.utils.parseEther("2");

    // Start round

    await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */

    // Currency is ERC20 and whitelisted

    expect(await _moduleGlobals.isCurrencyWhitelisted(_WMATIC.address)).to.be.eq(true);
    expect(ethers.utils.formatEther(await _WMATIC.balanceOf(collector.account.address))).to.equal("10.0");
    await _WMATIC.connect(collector.account).approve(_votingStrategy.address, voteAmount);
    await _WMATIC.connect(collector.account).approve(_qVoteCollectModule.address, voteAmount);

    await _lensHub.connect(admin).whitelistCollectModule(_qVoteCollectModule.address, true);
    expect(await _lensHub.isCollectModuleWhitelisted(_qVoteCollectModule.address)).to.be.true;

    // We can create a post that uses our collect module

    const deadline = await _roundImplementation.roundEndTime();

    const _initData = [_WMATIC.address, 0, _roundImplementation.address, deadline];
    const initQFCollect = ethers.utils.defaultAbiCoder.encode(["address", "uint16", "address", "uint256"], _initData);

    const postData = buildPostData(1, _qVoteCollectModule.address, initQFCollect);

    await expect(_lensHub.connect(creator.account).post(postData)).to.not.be.reverted;

    // We can collect a post as a second user that triggers the collect module

    const _collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WMATIC.address, voteAmount]);

    await expect(_lensHub.connect(collector.account).collect(1, 1, _collectData)).to.emit(_votingStrategy, "Voted");
  });
}
