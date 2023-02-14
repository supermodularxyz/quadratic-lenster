import { MockContract, deployMockContract } from "@ethereum-waffle/mock-contract";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractAddress } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

import ModuleGlobalsAbi from "../../importedABI/ModuleGlobals.json";
import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { CollectNFT } from "../../types/contracts/mocks/CollectNFT";
import { FollowNFT } from "../../types/contracts/mocks/FollowNFT";
import { FreeCollectModule } from "../../types/contracts/mocks/FreeCollectModule";
import { LensHub } from "../../types/contracts/mocks/LensHub";
import { ProfileCreationProxy } from "../../types/contracts/mocks/ProfileCreationProxy";
import { SandboxGovernance } from "../../types/contracts/mocks/SandboxGovernance";
import { InteractionLogic } from "../../types/contracts/mocks/libraries/InteractionLogic";
import { ProfileTokenURILogic } from "../../types/contracts/mocks/libraries/ProfileTokenURILogic";
import { PublishingLogic } from "../../types/contracts/mocks/libraries/PublishingLogic";
import { getDefaultSigners } from "../utils/utils";

type LensFixture = {
  qVoteCollectModule: QuadraticVoteCollectModule;
  freeCollectModule: FreeCollectModule;
  lensHub: LensHub;
  moduleGlobals: MockContract;
  profileCreation: ProfileCreationProxy;
  collectNFT: CollectNFT;
  followNFT: FollowNFT;
  profiles: { [key: string]: LensUser };
};

export type LensUser = { account: SignerWithAddress; profile: ProfileData };

export type ProfileData = {
  to: string;
  handle: string;
  imageURI: string;
  followModule: string;
  followModuleInitData: [];
  followNFTURI: string;
};

const buildProfileData = (user: SignerWithAddress, handle: string) => {
  return {
    to: user.address,
    handle,
    imageURI: "https://ipfs.io/ipfs/QmY9dUwYu67puaWBMxRKW98LPbXCznPwHUbhX5NeWnCJbX",
    followModule: ethers.constants.AddressZero,
    followModuleInitData: [],
    followNFTURI: "https://ipfs.io/ipfs/QmTFLSXdEQ6qsSzaXaCSNtiv6wA56qq87ytXJ182dXDQJS",
  } as ProfileData;
};

export async function deployLensFixture() {
  const { admin, treasury, user, user2 } = await getDefaultSigners();

  // Libraries
  const InteractionLogicFactory = await ethers.getContractFactory("InteractionLogic");
  const _interactionLogic = <InteractionLogic>await InteractionLogicFactory.connect(admin).deploy();
  await _interactionLogic.deployed();

  const ProfileTokenURILogicFactory = await ethers.getContractFactory("ProfileTokenURILogic");
  const _profileTokenURILogic = <ProfileTokenURILogic>await ProfileTokenURILogicFactory.connect(admin).deploy();
  await _profileTokenURILogic.deployed();

  const PublishingLogicFactory = await ethers.getContractFactory("PublishingLogic");
  const _publishingLogic = <PublishingLogic>await PublishingLogicFactory.connect(admin).deploy();
  await _publishingLogic.deployed();

  // Collect NFT

  const transactionCount = await admin.getTransactionCount();

  const futureAddress = getContractAddress({
    from: admin.address,
    nonce: transactionCount + 4, // ~ 1, CollectNFT, 2 FollownNFT, 3 Implementation, 4 Proxy
  });
  const CollectNFTFactory = await ethers.getContractFactory("CollectNFT");
  const _collectNFT = <CollectNFT>await CollectNFTFactory.connect(admin).deploy(futureAddress);
  await _collectNFT.deployed();

  const FollowNFTFactory = await ethers.getContractFactory("FollowNFT");
  const _followNFT = <FollowNFT>await FollowNFTFactory.connect(admin).deploy(futureAddress);
  await _followNFT.deployed();

  // LensHub
  const LensHub = await ethers.getContractFactory("LensHub", {
    libraries: {
      InteractionLogic: _interactionLogic.address,
      ProfileTokenURILogic: _profileTokenURILogic.address,
      PublishingLogic: _publishingLogic.address,
    },
  });

  const _lensHub = <LensHub>await upgrades.deployProxy(LensHub, ["LensHub", "HUB", admin.address], {
    kind: "transparent",
    constructorArgs: [_followNFT.address, _collectNFT.address],
    unsafeAllow: [
      "constructor",
      "external-library-linking",
      "state-variable-immutable",
      "state-variable-assignment",
      "delegatecall",
    ],
  });

  await _lensHub.setState(0);
  const _mockModuleGlobals = await deployMockContract(admin, ModuleGlobalsAbi.abi);

  //deploy governance
  const GovernanceFactory = await ethers.getContractFactory("SandboxGovernance");
  const _governance = <SandboxGovernance>await GovernanceFactory.connect(admin).deploy(_lensHub.address, admin.address);
  await _governance.deployed();

  //deploy profile creation
  const ProfileCreationProxyFactory = await ethers.getContractFactory("ProfileCreationProxy");
  const _profileCreation = <ProfileCreationProxy>(
    await ProfileCreationProxyFactory.connect(admin).deploy(_lensHub.address)
  );
  await _profileCreation.deployed();

  await _lensHub.whitelistProfileCreator(_profileCreation.address, true);

  //deploy Free Collection Module.
  const FreeCollectModule = await ethers.getContractFactory("FreeCollectModule");
  const freeCollectModule = <FreeCollectModule>await FreeCollectModule.connect(admin).deploy(_lensHub.address);
  await freeCollectModule.deployed();

  await _lensHub.whitelistCollectModule(freeCollectModule.address, true);

  //deploy QF Collection Module.
  const QFCollectModule = await ethers.getContractFactory("QuadraticVoteCollectModule");
  const qVoteCollectModule = <QuadraticVoteCollectModule>(
    await QFCollectModule.connect(admin).deploy(_lensHub.address, _mockModuleGlobals.address)
  );
  await qVoteCollectModule.deployed();

  //set mocked contracts to return data needed for tests
  await _mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
  await _mockModuleGlobals.mock.getTreasuryData.returns(treasury.address, 1);

  // Profiles

  const _creator = buildProfileData(user, "creator");
  const _collector = buildProfileData(user2, "collector");

  await _profileCreation.connect(admin).proxyCreateProfile(_creator);
  await _profileCreation.connect(admin).proxyCreateProfile(_collector);

  return {
    qVoteCollectModule,
    lensHub: _lensHub,
    freeCollectModule,
    moduleGlobals: _mockModuleGlobals,
    profileCreation: _profileCreation,
    collectNFT: _collectNFT,
    followNFT: _followNFT,
    profiles: {
      creator: { account: user, profile: _creator },
      collector: { account: user2, profile: _collector },
    },
  } as LensFixture;
}
