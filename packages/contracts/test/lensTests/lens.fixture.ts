import { deployMockContract } from "@ethereum-waffle/mock-contract";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import ERC721Abi from "../../artifacts/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json";
import LensHubAbi from "../../importedABI/LensHub.json";
import ModuleGlobalsAbi from "../../importedABI/ModuleGlobals.json";
import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { LensHub } from "../../types/contracts/lens/LensHub";
import { getDefaultSigners, lensMumbaiAddresses } from "../utils/constants";

export async function deployLensMumbaiFixture() {
  //TODO PRIO Remove dependency from snapshot, unstable testing...
  const { admin, user2 } = await getDefaultSigners();

  const lensMumbai = <LensHub>new ethers.Contract(lensMumbaiAddresses.LensHubProxy, LensHubAbi.abi, admin);
  //impersonate mumbai governance EOA
  const governanceWallet = <SignerWithAddress>await ethers.getImpersonatedSigner(lensMumbaiAddresses.governanceWallet);

  //Mocks
  //deploy mock lenshub
  const _mockLenshub = await deployMockContract(admin, LensHubAbi.abi);
  //deploy mock module globals contract
  const _mockModuleGlobals = await deployMockContract(admin, ModuleGlobalsAbi.abi);
  //deploy mock erc721
  const _mockERC721 = await deployMockContract(admin, ERC721Abi.abi);

  //deploy QF Collection Module.
  const QFCollectModule = await ethers.getContractFactory("QuadraticVoteCollectModule");
  const qVoteCollectModule = <QuadraticVoteCollectModule>(
    await QFCollectModule.connect(governanceWallet).deploy(_mockLenshub.address, _mockModuleGlobals.address)
  );

  //set mocked contracts to return data needed for tests
  await _mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
  await _mockModuleGlobals.mock.getTreasuryData.returns(qVoteCollectModule.address, 1);
  await _mockLenshub.mock.ownerOf.returns(user2.address);
  await _mockLenshub.mock.getFollowModule.returns(ethers.constants.AddressZero);
  await _mockLenshub.mock.getFollowNFT.returns(_mockERC721.address);
  await _mockERC721.mock.balanceOf.returns(1);

  return { qVoteCollectModule, governanceWallet, lensMumbai };
}
