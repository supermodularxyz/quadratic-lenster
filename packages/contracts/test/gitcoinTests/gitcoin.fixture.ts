import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";

import wethAbi from "../../importedABI/WETH.json";
import { RoundImplementation } from "../../types/contracts/gitcoin/round/RoundImplementation";
import { encodeRoundParameters } from "../utils/utils";

/* deploy gitcoin grants implementation on mumbai fork */
export async function deployGitcoinMumbaiFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];
  const user: SignerWithAddress = signers[1];

  const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

  // Voting Strategy
  const votingStrategyFactory = await ethers.getContractFactory("QuadraticFundingVotingStrategyImplementation");
  const votingStrategy = await votingStrategyFactory.deploy();
  await votingStrategy.deployed();

  // Payout Strategy
  const payoutStrategyFactory = await ethers.getContractFactory("MerklePayoutStrategy");
  const payoutStrategy = await payoutStrategyFactory.deploy();
  await payoutStrategy.deployed();

  /* get WETH contract */
  const WETH = new ethers.Contract("0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", wethAbi, admin);
  /* impersonate weth whale account */
  const whale = <SignerWithAddress>await ethers.getImpersonatedSigner("0x9883d5e7dc023a441a01ef95af406c69926a0ab6");

  /* transfer 10 weth to signers */
  for (let i = 0; i < 3; i++) {
    await WETH.connect(whale).transfer(signers[i].address, ethers.utils.parseEther("10"));
    expect(ethers.utils.formatEther(await WETH.balanceOf(signers[i].address))).to.equal("10.0");
  }

  /* deploy round factory implementation */
  const _roundMetaPtr = { protocol: 1, pointer: "bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi" };
  const _applicationMetaPtr = { protocol: 1, pointer: "bafybeiaoakfoxjwi2kwh43djbmomroiryvhv5cetg74fbtzwef7hzzvrnq" };
  const _adminRoles = [user.address];
  const _roundOperators = [user.address, ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address];

  const params = [
    votingStrategy.address, // _votingStrategyAddress
    payoutStrategy.address, // _payoutStrategyAddress
    currentBlockTimestamp + 100, // _applicationsStartTime
    currentBlockTimestamp + 250, // _applicationsEndTime
    currentBlockTimestamp + 500, // _roundStartTime
    currentBlockTimestamp + 1000, // _roundEndTime
    WETH.address, // _token
    _roundMetaPtr, // _roundMetaPtr
    _applicationMetaPtr, // _applicationMetaPtr
    _adminRoles, // _adminRoles
    _roundOperators, // _roundOperators
  ];

  const RoundImplementation = await ethers.getContractFactory("RoundImplementation");
  const roundImplementation = <RoundImplementation>await RoundImplementation.deploy();
  await roundImplementation.deployed();
  await roundImplementation.initialize(encodeRoundParameters(params));

  return {
    payoutStrategy,
    votingStrategy,
    roundImplementation,
    WETH,
    admin,
    user,
    currentBlockTimestamp,
  };
}
