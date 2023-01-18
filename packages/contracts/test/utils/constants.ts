import { ethers } from "hardhat";

export const DEFAULT_VOTE = ethers.utils.parseEther("1");

export const getDefaultSigners = async () => {
  const defaultSigners = await ethers.getSigners();
  return {
    admin: defaultSigners[0],
    user: defaultSigners[1],
    user2: defaultSigners[2],
  };
};

/*objects that contain all the deployed contract addresses for lens */
export const lensMumbaiAddresses = {
  /* use lenshubproxy for interactions */
  LensHubProxy: "0x60Ae865ee4C725cd04353b5AAb364553f56ceF82",
  lensHubImplementation: "0x45cf9Ba12b43F6c8B7148E06A6f84c5B9ad3Dd44",
  publishingLogic: "0x7f9bfF8493F821111741b93429A6A6F79DC546F0",
  interactionLogic: "0x845242e2Cd249af8D4f0D7085DefEAc3381815E3",
  profileTokenLogic: "0xf62c27B7B70A33739A7C088097fc20609A80eE58",
  feeCollectModule: "0xeb4f3EC9d01856Cec2413bA5338bF35CeF932D82",
  limitedFeeCollectModule: "0xFCDA2801a31ba70dfe542793020a934F880D54aB",
  timedFeeCollectModule: "0x36447b496ebc97DDA6d8c8113Fe30A30dC0126Db",
  limitedTimedFeeCollectModule: "0xDa76E44775C441eF53B9c769d175fB2948F15e1C",
  revertCollectModule: "0x5E70fFD2C6D04d65C3abeBa64E93082cfA348dF8",
  freeCollectModule: "0x0BE6bD7092ee83D44a6eC1D949626FeE48caB30c",
  feeFollowModule: "0xe7AB9BA11b97EAC820DbCc861869092b52B65C06",
  profileFollowModule: "0x8c32203df6b1A04E25145346e2DaAD0B4712C20D",
  revertFollowModule: "0x8c822Fc029EBdE62Da1Ed1072534c5e112dAE48c",
  followerOnlyReferenceModule: "0x7Ea109eC988a0200A1F79Ae9b78590F92D357a16",
  followNFT: "0x1a2bb1bc90aa5716f5eb85fd1823338bd1b6f772",
  collectNFT: "0x39dcB881eBdB0DF708412754468c99B4EbD2E370",
  lensPeriphery: "0xD5037d72877808cdE7F669563e9389930AF404E8",
  moduleGlobals: "0x1353aAdfE5FeD85382826757A95DE908bd21C4f9",
  mockProfileCreationProxy: "0x420f0257D43145bb002E69B14FF2Eb9630Fc4736",
  uiDataProvider: "0x4fF8EB275b2817fB2e7893bFF7ae7994e54e0730",
  governanceWallet: "0x1a1cdf59c94a682a067fa2d288c2167a8506abd7",
};

export const lensPolygonAddresses = {
  /* use lenshubproxy for interactions */
  LensHubProxy: "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d",
  lensHubImplementation: "0x96f1ba24294ffe0dfcd832d8376da4a4645a4cd6",
  publishingLogic: "0x931519D41797C73b9CE993B52c1af900373b5b43",
  interactionLogic: "0xb05BAe098D2b0E3048DE27F1931E50b0200a043B",
  profileTokenURILogic: "0x3FA902A571E941dCAc6081d57917994DDB0F9A9d",
  feeCollectModule: "0x1292E6dF9a4697DAAfDDBD61D5a7545A634af33d",
  limitedFeeCollectModule: "0xEF13EFa565FB29Cd55ECf3De2beb6c69bD988212",
  timedFeeCollectModule: "0xbf4E6C28d7f37C867CE62cf6ccb9efa4C7676F7F",
  limitedTimedFeeCollectModule: "0x7B94f57652cC1e5631532904A4A038435694636b",
  revertCollectModule: "0xa31FF85E840ED117E172BC9Ad89E55128A999205",
  freeCollectModule: "0x23b9467334bEb345aAa6fd1545538F3d54436e96",
  feeFollowModule: "0x80ae0e6048d6e295Ee6520b07Eb6EC4485193FD6",
  profileFollowModule: "0x057ccDf5153bE1081830a6C3D507C9dfE1ac8e4E",
  revertFollowModule: "0x6640e4Fb3fd56a6d7DfF3C351dFd9Ab7E57fb769",
  followerOnlyReferenceModule: "0x17317F96f0C7a845FFe78c60B10aB15789b57Aaa",
  followNFT: "0xb0298c5540f4cfb3840c25d290be3ef3fe09fa8c",
  collectNFT: "0x2172758ebb894c43e0be01e37d065118317d7eec",
  lensPeriphery: "0xeff187b4190E551FC25a7fA4dFC6cf7fDeF7194f",
  moduleGlobals: "0x3Df697FF746a60CBe9ee8D47555c88CB66f03BB9",
  mockProfileCreationProxy: "0x1eeC6ecCaA4625da3Fa6Cd6339DBcc2418710E8a",
  uiDataProvider: "0x8b0A28a8DE1de77668260A876c6DCF0330183742",
};

/* Gitcoin test constants */

export const projectApplications = [
  {
    project: "0x5cdb35fADB8262A3f88863254c870c2e6A848CcA",
    metaPtr: {
      protocol: 1,
      pointer: "bafybeiekytxwrrfzxvuq3ge5glfzlhkuxjgvx2qb4swodhqd3c3mtc5jay",
    },
  },

  {
    project: "0x1bCD46B724fD4C08995CEC46ffd51bD45feDE200",
    metaPtr: {
      protocol: 1,
      pointer: "bafybeih2pise44gkkzj7fdws3knwotppnh4x2gifnbxjtttuv7okw4mjzu",
    },
  },

  {
    project: "0x500Df079BEBE24A9f6FFa2c70fb58000A4722784",
    metaPtr: {
      protocol: 1,
      pointer: "bafybeiceggy6uzfxsn3z6b2rraptp3g2kx2nrwailkjnx522yah43g5tyu",
    },
  },
];

/* lens test constants */
export const CURRENCY_MINT_AMOUNT = ethers.utils.parseEther("100");
export const BPS_MAX = 10000;
export const TREASURY_FEE_BPS = 50;
export const REFERRAL_FEE_BPS = 250;
export const MAX_PROFILE_IMAGE_URI_LENGTH = 6000;
export const LENS_HUB_NFT_NAME = "Lens Protocol Profiles";
export const LENS_HUB_NFT_SYMBOL = "LPP";
export const MOCK_PROFILE_HANDLE = "plant1ghost.eth";
export const LENS_PERIPHERY_NAME = "LensPeriphery";
export const FIRST_PROFILE_ID = 1;
export const MOCK_URI = "https://ipfs.io/ipfs/QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR";
export const OTHER_MOCK_URI = "https://ipfs.io/ipfs/QmSfyMcnh1wnJHrAWCBjZHapTS859oNSsuDFiAPPdAHgHP";
export const MOCK_PROFILE_URI = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
export const MOCK_FOLLOW_NFT_URI =
  "https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan";
export const FAKE_PRIVATEKEY = "0xa2e0097c961c67ec197b6865d7ecea6caffc68ebeb00e6050368c8f67fc9c588";
export const testWallet = new ethers.Wallet(FAKE_PRIVATEKEY).connect(ethers.provider);
