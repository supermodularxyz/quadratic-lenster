import { BigNumberish, utils } from "ethers";

import LENS_POLYGON from "../../deployments/lens-polygon.json";
import LENS_SANDBOX from "../../deployments/lens-sandbox-polygon-mumbai.json";

export type MetaPtr = {
  protocol: BigNumberish;
  pointer: string;
};

export const DEFAULT_VOTE = utils.parseEther("1");

/*objects that contain all the deployed contract addresses for lens */
export const lensSandboxAddresses = LENS_SANDBOX;
export const lensPolygonAddresses = LENS_POLYGON;

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
export const CURRENCY_MINT_AMOUNT = utils.parseEther("100");
export const BPS_MAX = 10000;
export const TREASURY_FEE_BPS = 50;
export const REFERRAL_FEE_BPS = 250;
export const MAX_PROFILE_IMAGE_URI_LENGTH = 6000;
export const LENS_HUB_NFT_NAME = "Lens Protocol Profiles";
export const LENS_HUB_NFT_SYMBOL = "LPP";
export const MOCK_PROFILE_HANDLE = "plant1ghost.eth";
export const LENS_PERIPHERY_NAME = "LensPeriphery";
export const MOCK_URI = "https://ipfs.io/ipfs/QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR";
export const OTHER_MOCK_URI = "https://ipfs.io/ipfs/QmSfyMcnh1wnJHrAWCBjZHapTS859oNSsuDFiAPPdAHgHP";
export const MOCK_PROFILE_URI = "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu";
export const MOCK_FOLLOW_NFT_URI =
  "https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan";
export const FAKE_PRIVATEKEY = "0xa2e0097c961c67ec197b6865d7ecea6caffc68ebeb00e6050368c8f67fc9c588";
//export const testWallet = new Wallet(FAKE_PRIVATEKEY).connect(ethers.provider);
