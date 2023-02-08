import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { ethers } from "hardhat";

import ERC721Abi from "../../artifacts/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json";
import LensHubAbi from "../../importedABI/LensHub.json";
import ModuleGlobalsAbi from "../../importedABI/ModuleGlobals.json";
import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { getDefaultSigners } from "../utils/utils";

export async function deployLensMumbaiFixture() {
  const { admin, user2 } = await getDefaultSigners();

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
    await QFCollectModule.connect(admin).deploy(_mockLenshub.address, _mockModuleGlobals.address)
  );
  await qVoteCollectModule.deployed();

  //set mocked contracts to return data needed for tests
  await _mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
  await _mockModuleGlobals.mock.getTreasuryData.returns(qVoteCollectModule.address, 1);
  await _mockLenshub.mock.ownerOf.returns(user2.address);
  await _mockLenshub.mock.getFollowModule.returns(ethers.constants.AddressZero);
  await _mockLenshub.mock.getFollowNFT.returns(_mockERC721.address);
  await _mockERC721.mock.balanceOf.returns(1);

  return { qVoteCollectModule, lensHub: _mockLenshub, moduleGlobals: _mockModuleGlobals };
}
