// import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

// import wethAbi from "../../importedABI/WETH.json";
import { ERC20 } from "../../types/contracts/mocks/ERC20";
import { MerklePayoutStrategy } from "../../types/contracts/mocks/MerklePayoutStrategy";
import { QuadraticFundingRelayStrategyImplementation } from "../../types/contracts/mocks/QuadraticFundingRelayStrategyImplementation";
import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { deployLensMumbaiFixture } from "../lensTests/lens.fixture";
import { encodeRoundParameters, getDefaultSigners } from "../utils/utils";

/* deploy gitcoin grants implementation on mumbai fork */
export async function deployGitcoinMumbaiFixture() {
  const signers = await getDefaultSigners();
  // deploy lens fixture
  const { qVoteCollectModule, lensHub, moduleGlobals, _mockERC721 } = await loadFixture(deployLensMumbaiFixture);

  const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

  // Voting Strategy
  const votingStrategyFactory = await ethers.getContractFactory("QuadraticFundingRelayStrategyImplementation");
  const votingStrategy = <QuadraticFundingRelayStrategyImplementation>await votingStrategyFactory.deploy();
  await votingStrategy.deployed();

  // Payout Strategy
  const payoutStrategyFactory = await ethers.getContractFactory("MerklePayoutStrategy");
  const payoutStrategy = <MerklePayoutStrategy>await payoutStrategyFactory.deploy();
  await payoutStrategy.deployed();

  /* get WETH contract */
  const erc20Factory = await ethers.getContractFactory("ERC20");
  const WETH = <ERC20>await erc20Factory.deploy("MockERC20", "MCK");
  await WETH.deployed();

  /* transfer 10 weth to signers */
  Object.values(signers).forEach(async (signer) => {
    await WETH.mint(signer.address, ethers.utils.parseEther("10"));
  });

  /* deploy round factory implementation */
  const RoundImplementation = await ethers.getContractFactory("RoundImplementation");
  const roundImplementation = <RoundImplementation>await RoundImplementation.deploy();
  await roundImplementation.deployed();

  const _roundMetaPtr = { protocol: 1, pointer: "bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi" };
  const _applicationMetaPtr = { protocol: 1, pointer: "bafybeiaoakfoxjwi2kwh43djbmomroiryvhv5cetg74fbtzwef7hzzvrnq" };
  const _adminRoles = [signers.admin.address];
  const _roundOperators = [
    signers.admin.address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
  ];

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

  await roundImplementation.initialize(encodeRoundParameters(params));

  return {
    qVoteCollectModule,
    payoutStrategy,
    votingStrategy,
    roundImplementation,
    WETH,
    currentBlockTimestamp,
    lensHub,
    moduleGlobals,
    _mockERC721,
  };
}
