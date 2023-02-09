import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { ERC20 } from "../../types/contracts/mocks/ERC20";
import { QuadraticFundingVotingStrategyImplementation } from "../../types/contracts/mocks/QuadraticFundingVotingStrategyImplementation";
import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import {
  FIRST_PROFILE_ID,
  MOCK_FOLLOW_NFT_URI,
  MOCK_PROFILE_HANDLE,
  MOCK_PROFILE_URI,
  MOCK_URI,
  REFERRAL_FEE_BPS,
} from "../utils/constants";
import { getDefaultSigners } from "../utils/utils";
import { MockProfileCreationProxy } from "./../../types/contracts/mocks/MockProfileCreationProxy";
import { MockSandboxGovernance } from "./../../types/contracts/mocks/MockSandboxGovernance";

export function shouldBehaveLikeQFCollectionModule() {
  let signers: { [key: string]: SignerWithAddress };
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WMATIC: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingVotingStrategyImplementation;
  let _initData: (string | number | BigNumber)[];
  let _currentBlockTimestamp: number;

  let _lensHub: any;
  let _moduleGlobals: any;
  let _mockSandboxGovernance: MockSandboxGovernance;
  let _mockProfileCreationProxy: MockProfileCreationProxy;

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
      _mockERC721,
    } = await loadFixture(deployGitcoinMumbaiFixture);

    _qVoteCollectModule = qVoteCollectModule;
    _WMATIC = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;
    _currentBlockTimestamp = currentBlockTimestamp;
    _moduleGlobals = moduleGlobals;

    _initData = [_WMATIC.address, 0, _roundImplementation.address, _votingStrategy.address];

    _lensHub = lensHub;

    //deploy lenshub locally (fails in constructor with unpredictable gas error)

    //   const PublishingLogic = await ethers.getContractFactory("PublishingLogic");
    //   const publishingLogic = await PublishingLogic.deploy()
    //   const InteractionLogic = await ethers.getContractFactory("InteractionLogic");
    //   const interactionLogic = await InteractionLogic.deploy();
    //   const ProfileTokenURILogic = await ethers.getContractFactory("ProfileTokenURILogic");
    //   const profileTokenURILogic = await ProfileTokenURILogic.deploy();

    //  const hubLibs = {
    //   'contracts/mocks/libraries/PublishingLogic.sol:PublishingLogic': publishingLogic.address,
    //   'contracts/mocks/libraries/InteractionLogic.sol:InteractionLogic': interactionLogic.address,
    //   'contracts/mocks/libraries/ProfileTokenURILogic.sol:ProfileTokenURILogic':
    //   profileTokenURILogic.address,
    //   };

    // //  _lensHub = await new LensHub__factory(hubLibs, signers.admin).deploy(_mockERC721.address, _mockERC721.address);

    //   const LensHub = await ethers.getContractFactory("LensHub", {libraries: hubLibs});
    //   _lensHub = await LensHub.connect(signers.admin).deploy(_mockERC721.address, _mockERC721.address)

    //deploy sandbox mock contracts
    const MockSandboxGovernance = await ethers.getContractFactory("MockSandboxGovernance");
    _mockSandboxGovernance = <MockSandboxGovernance>(
      await MockSandboxGovernance.deploy(_lensHub.address, signers.admin.address)
    );

    const MockProfileCreationProxy = await ethers.getContractFactory("MockProfileCreationProxy");
    _mockProfileCreationProxy = <MockProfileCreationProxy>await MockProfileCreationProxy.deploy(_lensHub.address);
  });

  it.only("Should collect a post and simultaneously vote in an active round", async function () {
    expect(ethers.utils.formatEther(await _WMATIC.balanceOf(signers.user.address))).to.equal("10.0");
    await _WMATIC.approve(_votingStrategy.address, 100);

    // Prepare Votes
    const votes = [[_WMATIC.address, 5, signers.user.address]];

    const encodedVotes = votes.map((vote) =>
      ethers.utils.defaultAbiCoder.encode(["address", "uint256", "address"], vote),
    );

    await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */

    await expect(_roundImplementation.vote(encodedVotes)).to.not.be.reverted;
    // whitelist collect module
    // this is here to make sure we have all the steps in place to collect in the lens sandbox
    await expect(_mockSandboxGovernance.whitelistCollectModule(_qVoteCollectModule.address, true)).to.not.be.reverted;

    //create profile variables
    const profileVariables = {
      to: signers.user.address,
      handle: "testuserrrrr",
      imageURI: "https://ipfs.io/ipfs/QmY9dUwYu67puaWBMxRKW98LPbXCznPwHUbhX5NeWnCJbX",
      followModule: ethers.constants.AddressZero,
      followModuleInitData: [],
      followNFTURI: "https://ipfs.io/ipfs/QmTFLSXdEQ6qsSzaXaCSNtiv6wA56qq87ytXJ182dXDQJS",
    };

    // get profileId
    const profileId = await _mockProfileCreationProxy
      .connect(signers.user)
      .callStatic.proxyCreateProfile(profileVariables);

    //create profile
    const txn = await _mockProfileCreationProxy.connect(signers.user).proxyCreateProfile(profileVariables);
    await txn.wait();

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint16", "address", "address"],
      _initData,
    );

    expect(await _lensHub.isCollectModuleWhitelisted(_qVoteCollectModule.address)).to.be.eq(true);
    expect(await _moduleGlobals.isCurrencyWhitelisted(_WMATIC.address)).to.be.eq(true);

    const wethAmount = ethers.utils.parseEther("10");

    //approve module to spend weth
    await expect(_WMATIC.connect(signers.user).approve(_qVoteCollectModule.address, wethAmount)).to.not.be.reverted;

    const tx = await _lensHub.connect(signers.user).post({
      profileId: profileId,
      contentURI: MOCK_URI,
      collectModule: _qVoteCollectModule.address,
      collectModuleInitData: collectModuleInitData,
      referenceModule: ethers.constants.AddressZero,
      referenceModuleInitData: [],
    });

    await expect(tx).to.not.be.reverted;
    const collectData = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [_WMATIC.address, 0]);

    await expect(_lensHub.collect(1, 1, collectData)).to.not.be.reverted;
  });
}
