import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
//import CollectNFT from "../../importedABI/CollectNFT.json"
import { expect } from "chai";
import { ethers, network } from "hardhat";

import FreeCollectModuleABI from "../../importedABI/FreeCollectModule.json";
import LensHubABI from "../../importedABI/LensHub.json";
import { lensMumbaiAddresses } from "../utils/constants";
import { FreeCollectModule } from "./../../types/contracts/lens/modules/FreeCollectModule";

export async function deployLensMumbaiFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];

  /* Fork mumbai */
  await network.provider.request({
    method: "hardhat_reset",
  });

  const lensMumbai = new ethers.Contract(lensMumbaiAddresses.LensHubProxy, LensHubABI.abi, admin);
  const tx = await lensMumbai.getFollowNFTImpl();
  expect(tx).to.equal("0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772");
  /* get free collect module */
  const freeCollectModule: FreeCollectModule = <FreeCollectModule>(
    new ethers.Contract(lensMumbaiAddresses.freeCollectModule, FreeCollectModuleABI.abi, admin)
  );

  return { lensMumbai, freeCollectModule };
}
