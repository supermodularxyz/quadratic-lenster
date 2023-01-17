import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import ERC721Abi from "../../artifacts/contracts/mocks/MockERC721.sol/MockERC721.json";
import LensHubAbi from "../../importedABI/LensHub.json";
import ModuleGlobalsAbi from "../../importedABI/ModuleGlobals.json";
import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { deployLensMumbaiFixture } from "../lensTests/lens.fixture";
import { getCollectModulePubInitData } from "../utils/utils";
import { ERC20 } from "./../../types/@openzeppelin/contracts/token/ERC20/ERC20";
import { RoundImplementation } from "./../../types/contracts/gitcoin/round/RoundImplementation";
import { QuadraticFundingVotingStrategyImplementation } from "./../../types/contracts/gitcoin/votingStrategy/QuadraticFundingStrategy/QuadraticFundingVotingStrategyImplementation";

export const shouldBehaveLikeQuadraticVoteModule = () => {
  let _snapshotId: number;
  let _admin: SignerWithAddress;
  let _user: SignerWithAddress;
  let _userTwo: SignerWithAddress;
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _WETH: ERC20;
  let _roundImplementation: RoundImplementation;
  let _votingStrategy: QuadraticFundingVotingStrategyImplementation;

  beforeEach(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    _admin = signers[0];
    _user = signers[2];
    _userTwo = signers[3];

    // deploy lens fixture
    const { qVoteCollectModule } = await loadFixture(deployLensMumbaiFixture);
    _qVoteCollectModule = qVoteCollectModule;

    // deploy gitcoin fixture
    const { roundImplementation, WETH, votingStrategy } = await loadFixture(deployGitcoinMumbaiFixture);

    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _votingStrategy = votingStrategy;

    _snapshotId = await network.provider.send("evm_snapshot", []);
    //mock contracts
  });

  afterEach("restore blockchain snapshot", async () => {
    await network.provider.send("evm_revert", [_snapshotId]);
  });

  describe("QuadraticVoteCollectModule unit tests", () => {
    let _mockLenshub;
    let _mockModuleGlobals;
    let _mockERC721;

    beforeEach(async () => {
      //deploy mock lenshub
      _mockLenshub = await deployMockContract(_admin, LensHubAbi.abi);
      //deploy mock module globals contract
      _mockModuleGlobals = await deployMockContract(_admin, ModuleGlobalsAbi.abi);
      //deploy mock erc721
      _mockERC721 = await deployMockContract(_admin, ERC721Abi.abi);
      //deploy qfCollectionModule using mocked lenshub and moduleGlobals contact
      const MockedQFCollectionModule = await ethers.getContractFactory("QuadraticVoteCollectModule");
      _qVoteCollectModule = <QuadraticVoteCollectModule>(
        await MockedQFCollectionModule.deploy(_mockLenshub.address, _mockModuleGlobals.address)
      );

      //set mocked contracts to return data needed for tests
      await _mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
      await _mockModuleGlobals.mock.getTreasuryData.returns(_qVoteCollectModule.address, 1);
      await _mockLenshub.mock.ownerOf.returns(_userTwo.address);
      await _mockLenshub.mock.getFollowModule.returns(ethers.constants.AddressZero);
      await _mockLenshub.mock.getFollowNFT.returns(_mockERC721.address);
      await _mockERC721.mock.balanceOf.returns(1);
    });

    afterEach("restore blockchain snapshot", async () => {
      await network.provider.send("evm_revert", [_snapshotId]);
    });
    it("Should initialize the QVCM with WETH", async function () {
      const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");
      const collectModuleInitData = getCollectModulePubInitData([
        DEFAULT_COLLECT_PRICE,
        _WETH.address,
        _qVoteCollectModule.address,
        100,
        true,
        _roundImplementation.address,
        _votingStrategy.address,
      ]);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;
    });

    it("Should execute processCollect and vote", async function () {
      const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");
      const collectModuleInitData = getCollectModulePubInitData([
        DEFAULT_COLLECT_PRICE,
        _WETH.address,
        _user.address,
        100,
        true,
        _roundImplementation.address,
        _votingStrategy.address,
      ]);

      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      //start a round
      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [_WETH.address, DEFAULT_COLLECT_PRICE],
      );

      await _WETH.connect(_userTwo).approve(_qVoteCollectModule.address, DEFAULT_COLLECT_PRICE);

      await expect(
        _qVoteCollectModule.connect(_userTwo).processCollect(1, _userTwo.address, 1, 1, collectData),
      ).to.emit(_votingStrategy, "Voted");
    });

    it("Should execute processCollect with referral and vote", async function () {
      const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");
      const collectModuleInitData = getCollectModulePubInitData([
        DEFAULT_COLLECT_PRICE,
        _WETH.address,
        _user.address,
        100,
        true,
        _roundImplementation.address,
        _votingStrategy.address,
      ]);
      await expect(_qVoteCollectModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
        .reverted;

      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

      //encode collect call data
      const collectData = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [_WETH.address, DEFAULT_COLLECT_PRICE],
      );

      await _WETH.connect(_userTwo).approve(_qVoteCollectModule.address, DEFAULT_COLLECT_PRICE);

      await expect(
        _qVoteCollectModule.connect(_userTwo).processCollect(22, _userTwo.address, 1, 1, collectData),
      ).to.emit(_votingStrategy, "Voted");
    });
  });
};
