import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre, { ethers, network } from "hardhat";
import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import { deployLensMumbaiFixture } from "../lensTests/lens.fixture";
import { Signers } from "../types";
import { shouldBehaveLikeQFCollectionModule } from "./quadraticFundingCollection.behavior";
import { deployMockContract } from '@ethereum-waffle/mock-contract';

import { shouldBeAUnitTestQFCM } from "./qFundingCollectionTest.unit";

import LensHubAbi from "../../importedABI/LensHub.json"
import ModuleGlobalsAbi from "../../importedABI/ModuleGlobals.json"


  describe("Quadratic Funding Collection Module", () => {
    let snapshotId: number;
    before(async function () {
      this.signers = {} as Signers;
  
      const signers: SignerWithAddress[] = await ethers.getSigners();
      this.signers.admin = signers[0];
      this.signers.user = signers[2];
      this.signers.userTwo = signers[3];
      this.loadFixture = loadFixture;

          // deploy lens fixture 
          const { lensMumbai, freeCollectModule, qfCollectModule, feeCollectModule ,governanceWallet, moduleGlobals, testCollect } = await loadFixture(deployLensMumbaiFixture);
          this.lensMumbai = lensMumbai;
          this.qfCollectModule = qfCollectModule;
          this.freeCollectModule = freeCollectModule;
          this.feeCollectModule = feeCollectModule;
          this.signers.gov = governanceWallet;
          this.moduleGlobals = moduleGlobals;
    
          this.testCollect = testCollect;
    
          // deploy gitcoin fixture
          const { roundImplementation, WETH, payoutStrategy, votingStrategy, currentBlockTimestamp } =
        await loadFixture(deployGitcoinMumbaiFixture);
    
        this.WETH = WETH;
        this.roundImplementation = roundImplementation;
        this.payoutStrategy = payoutStrategy;
        this.votingStrategy = votingStrategy;
        this.currentBlockTimestamp = currentBlockTimestamp;
    
        snapshotId = await network.provider.send("evm_snapshot", []);
          //mock contracts
    });
    
    beforeEach(async function () {
  

    const mockLenshub = await deployMockContract(this.signers.admin, LensHubAbi.abi);
    const mockModuleGlobals = await deployMockContract(this.signers.admin, ModuleGlobalsAbi.abi);
    await mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
    await mockModuleGlobals.mock.getTreasuryData.returns(mockModuleGlobals.address, 1);
    this.mockLenshub = mockLenshub;
    this.mockModuleGlobals = mockModuleGlobals;

    const MockQFCollectionModule = await ethers.getContractFactory("QuadraticVoteCollectModule");
    const mockQfCollectionModule = await MockQFCollectionModule.deploy(mockLenshub.address, mockModuleGlobals.address);

    this.mockedQfModule = mockQfCollectionModule;

    await mockModuleGlobals.mock.isCurrencyWhitelisted.returns(true);
    await mockModuleGlobals.mock.getTreasuryData.returns(this.mockedQfModule.address, 1);
    });

    afterEach("restore blockchain snapshot", async () => {
      await network.provider.send("evm_revert", [snapshotId]);
    });

    shouldBehaveLikeQFCollectionModule();

    shouldBeAUnitTestQFCM();
  });





