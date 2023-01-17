import { LensHub } from './../../types/contracts/lens/LensHub';
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
//import CollectNFT from "../../importedABI/CollectNFT.json"
import { expect } from "chai";
import { ethers } from "hardhat";

import FreeCollectModuleABI from "../../importedABI/FreeCollectModule.json";
import FeeCollectModuleABI from "../../importedABI/FeeCollectModule.json";
import LensHubABI from "../../importedABI/LensHub.json";
import ModuleGlobals from "../../importedABI/ModuleGlobals.json";
import { lensMumbaiAddresses } from "../utils/constants";
import { FreeCollectModule } from "./../../types/contracts/lens/modules/FreeCollectModule";

export async function deployLensMumbaiFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];

  // /* Reset mumbai Fork */
  // await network.provider.request({
  //   method: "hardhat_reset",
  //   params: [{
  //     forking: { jsonRpcUrl: "https://rpc.ankr.com/polygon_mumbai" },
  //   }]
  // });

  const lensMumbai = <LensHub>new ethers.Contract(lensMumbaiAddresses.LensHubProxy, LensHubABI.abi, admin);
  const tx = await lensMumbai.getFollowNFTImpl();
  expect(tx).to.equal("0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772");

  const moduleGlobals = new ethers.Contract(lensMumbaiAddresses.moduleGlobals, ModuleGlobals.abi, admin);

  /* get free collect module */
  const freeCollectModule: FreeCollectModule = <FreeCollectModule>(
    new ethers.Contract(lensMumbaiAddresses.freeCollectModule, FreeCollectModuleABI.abi, admin)
  );
  
  const feeCollectModule: any = (
    new ethers.Contract(lensMumbaiAddresses.feeCollectModule, FeeCollectModuleABI.abi, admin)
  );
    //impersonate mumbai governance EOA
    const governanceWallet = <SignerWithAddress>await ethers.getImpersonatedSigner(lensMumbaiAddresses.governanceWallet);

  //deploy QF Collection Module.
  const QFCollectModule = await ethers.getContractFactory("QuadraticVoteCollectModule");
  const qfCollectModule = await QFCollectModule.connect(governanceWallet).deploy(lensMumbaiAddresses.feeFollowModule, lensMumbaiAddresses.lensHubImplementation);

  
  //deploy test collection Module.
  const TestCollect = await ethers.getContractFactory("TestCollectModule");
  const testCollect = await TestCollect.connect(governanceWallet).deploy(lensMumbaiAddresses.feeFollowModule, lensMumbaiAddresses.lensHubImplementation);
  return { lensMumbai, freeCollectModule, qfCollectModule, feeCollectModule, governanceWallet, moduleGlobals, testCollect };
}
