import { InteractionLogic } from './../../types/contracts/mocks/libraries/InteractionLogic';
import { lensMumbaiAddresses } from './../utils/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

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
import { QuadraticVoteCollectModule } from '../../types/contracts/QuadraticVoteCollectModule';
import { ERC20 } from '../../types/contracts/mocks/ERC20';
import { RoundImplementation } from '../../types/contracts/mocks/RoundImplementation';
import { QuadraticFundingVotingStrategyImplementation } from '../../types/contracts/mocks/QuadraticFundingVotingStrategyImplementation';
import { BigNumber } from 'ethers';
import { MockContract } from '@defi-wonderland/smock';
import { LensHub } from '../../types/contracts/mocks/LensHub';
import { pbkdf2 } from 'crypto';

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
  let _mockSandboxGovernance: any;
  let _mockProfileCreationProxy: any;
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
        moduleGlobals
      } = await loadFixture(deployGitcoinMumbaiFixture);

      _qVoteCollectModule = qVoteCollectModule;
      _WMATIC = WETH;
      _roundImplementation = roundImplementation;
      _votingStrategy = votingStrategy;
      _currentBlockTimestamp = currentBlockTimestamp;

      _lensHub = lensHub;

    //deploy lenshub locally (failed attempt)
    //   const PublishingLogic = await ethers.getContractFactory("PublishingLogic");
    //   const publishingLogic = await PublishingLogic.deploy()
    //   const InteractionLogic = await ethers.getContractFactory("InteractionLogic");
    //   const interactionLogic = await InteractionLogic.deploy();
    //   const ProfileTokenURILogic = await ethers.getContractFactory("ProfileTokenURILogic");
    //   const profileTokenURILogic = await ProfileTokenURILogic.deploy();
    //  const hubLibs = {
    //   'contracts/mocks/libraries/InteractionLogic.sol:\InteractionLogic': interactionLogic.address,
    //   'contracts/mocks/libraries/ProfileTokenURILogic.sol:ProfileTokenURILogic':
    //   profileTokenURILogic.address,
    //     'contracts/mocks/libraries/PublishingLogic.sol:PublishingLogic': publishingLogic.address,

    //   };
    //   const LensHub = await ethers.getContractFactory("LensHub", {libraries: hubLibs});
    //   _lensHub = await LensHub.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero);

      _moduleGlobals = moduleGlobals;
      _initData = [_WMATIC.address, 100, _roundImplementation.address, _votingStrategy.address];

      //deploy sandbox mock contracts
      const MockSandboxGovernance = await ethers.getContractFactory("MockSandboxGovernance");
      _mockSandboxGovernance = await MockSandboxGovernance.deploy(_lensHub.address, signers.admin.address);

      const MockProfileCreationProxy =  await ethers.getContractFactory("MockProfileCreationProxy");
      _mockProfileCreationProxy = await MockProfileCreationProxy.deploy(_lensHub.address);
      
  })
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
    await expect(_mockSandboxGovernance.whitelistCollectModule(_qVoteCollectModule.address, true)).to.not.be
      .reverted;




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
    const profileId = await _mockProfileCreationProxy.connect(signers.user).callStatic.proxyCreateProfile(profileVariables);

    //create profile
    const txn = await _mockProfileCreationProxy.connect(signers.user).proxyCreateProfile(profileVariables);
    await txn.wait();

    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, _WMATIC.address, signers.user.address, 100, true],
    );
    expect(await _lensHub.isCollectModuleWhitelisted(_qVoteCollectModule.address)).to.be.eq(true);
    expect(await _moduleGlobals.isCurrencyWhitelisted(_WMATIC.address)).to.be.eq(true);

    const wethAmount = ethers.utils.parseEther("10");

    //approve module to spend weth
    await expect(_WMATIC.connect(signers.user).approve(_qVoteCollectModule.address, wethAmount)).to.not.be.reverted;
    await expect(_WMATIC.connect(signers.user).approve(_lensHub.address, wethAmount)).to.not.be.reverted;
    await expect(_WMATIC.connect(signers.user).approve(_moduleGlobals.address, wethAmount)).to.not.be.reverted;

    
      const tx = await _lensHub.connect(signers.user).post({
        profileId: 1,
        contentURI: MOCK_URI,
        collectModule: _qVoteCollectModule.address,
        collectModuleInitData: collectModuleInitData,
        referenceModule: ethers.constants.AddressZero,
        referenceModuleInitData: [],
      });

      expect(tx).to.not.be.reverted;

      const recp = await tx.wait();

  });
}
