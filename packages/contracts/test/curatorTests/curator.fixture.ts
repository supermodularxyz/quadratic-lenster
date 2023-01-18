// import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

import { QuadraticFundingCurator } from "../../types/contracts/QuadraticFundingCurator";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { getDefaultSigners } from "../utils/constants";

/* deploy gitcoin grants implementation on mumbai fork */
export async function deployCuratorFixture() {
  const signers = await getDefaultSigners();
  // deploy lens fixture
  const { roundImplementation, currentBlockTimestamp } = await loadFixture(deployGitcoinMumbaiFixture);

  // Curator contract
  const curatorFactory = await ethers.getContractFactory("QuadraticFundingCurator");
  const curator = <QuadraticFundingCurator>(
    await curatorFactory.deploy(roundImplementation.address, signers.user.address)
  );
  await curator.deployed();

  const defaultMetaPtr = { protocol: 1, pointer: "bafybeiceggy6uzfxsn3z6b2rraptp3g2kx2nrwailkjnx522yah43g5tyu" };

  return {
    curator,
    defaultMetaPtr,
    roundImplementation,
    currentBlockTimestamp,
  };
}
