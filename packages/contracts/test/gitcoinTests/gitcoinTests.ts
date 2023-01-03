import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { isAddress } from "ethers/lib/utils";
import { ethers, network, upgrades } from "hardhat";

import type { Signers } from "../types";
import { projectApplications } from "../utils/constants";
import { encodeProgramParameters, encodeRoundParameters, getTimestamp } from "../utils/utils";
import { MerklePayoutStrategy } from "./../../types/contracts/gitcoin/payoutStrategy/MerklePayoutStrategy";
import { ProgramCreatedEvent, ProgramFactory } from "./../../types/contracts/gitcoin/program/ProgramFactory";
import { ProgramImplementation } from "./../../types/contracts/gitcoin/program/ProgramImplementation";
import { RoundFactory } from "./../../types/contracts/gitcoin/round/RoundFactory";
import { RoundImplementation } from "./../../types/contracts/gitcoin/round/RoundImplementation";
import { shouldBehaveLikeGitCoinMumbai } from "./gitcoin.behavior";
import { deployGitcoinMumbaiFixture } from "./gitcoin.fixture";

describe("gitcoin Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();

    this.signers.admin = signers[0];
    this.signers.roundOperator = signers[1];
    this.signers.user = signers[2];
    this.loadFixture = loadFixture;
  });

  beforeEach(async function () {
    const {
      programFactory,
      programImplementation,
      quadraticFundingVotingStrategyFactory,
      quadraticFundingVotingStrategyImplementation,
      merklePayoutStrategy,
      roundFactory,
      roundImplementation,
    } = await this.loadFixture(deployGitcoinMumbaiFixture);
    this.programFactory = <ProgramFactory>programFactory;
    this.programImplementation = <ProgramImplementation>programImplementation;
    this.quadraticFundingVotingStrategyFactory = quadraticFundingVotingStrategyFactory;
    this.quadraticFundingVotingStrategyImplementation = quadraticFundingVotingStrategyImplementation;
    this.merklePayoutStrategy = <MerklePayoutStrategy>merklePayoutStrategy;
    this.roundFactory = <RoundFactory>roundFactory;
    this.roundImplementation = <RoundImplementation>roundImplementation;
  });

  describe("gitcoin deployment", function () {
    shouldBehaveLikeGitCoinMumbai();
  });

  describe("Program Manager", function () {
    it("should successfully link the deployed implementation to the factory", async function () {
      const updateTx = await this.programFactory.updateProgramContract(this.programImplementation.address);
      await updateTx.wait();
      expect(await this.programFactory.connect(this.signers.admin).programContract()).to.be.equal(
        this.programImplementation.address,
      );
    });
    it("invoking create SHOULD have a successful transaction", async function () {
      const params = [
        { protocol: 1, pointer: "bafybeif43xtcb7zfd6lx7rfq42wjvpkbqgoo7qxrczbj4j4iwfl5aaqv2q" }, // _metaPtr
        [this.signers.admin.address], // _adminRoles
        [this.signers.roundOperator.address], // _programOperators
      ];

      const txn = await this.programFactory.create(encodeProgramParameters(params));
      const receipt = await txn.wait();

      expect(txn.hash).to.not.be.empty;
      expect(receipt.status).equals(1);
    });

    it("should emit ProgramCreated event after invoking create", async function () {
      const params = [
        { protocol: 1, pointer: "bafybeif43xtcb7zfd6lx7rfq42wjvpkbqgoo7qxrczbj4j4iwfl5aaqv2q" }, // _metaPtr
        [this.signers.admin.address], // _adminRoles
        [this.signers.roundOperator.address], // _programOperators
      ];

      const txn = await this.programFactory.create(encodeProgramParameters(params));

      let programAddress;
      let programImplementation;

      const receipt = await txn.wait();
      if (receipt.events) {
        const event = receipt.events.find((e: ProgramCreatedEvent) => e.event === "ProgramCreated");
        if (event && event.args) {
          programAddress = event.args.programContractAddress;
          programImplementation = event.args.programImplementation;
        }
      }

      void expect(txn).to.emit(this.programFactory, "ProgramCreated").withArgs(programAddress, programImplementation);

      expect(isAddress(programAddress)).to.be.true;
      expect(isAddress(programImplementation)).to.be.true;
    });
  });

  describe("Round interactions", function () {
    beforeEach(async function () {
   
      /* deploy new merkle payout strategy (must re-deploy every time a round is created) */
      const NewMerklePayoutStrategy = await ethers.getContractFactory("MerklePayoutStrategy");
      const newMerklePayoutStrategy = await upgrades.deployProxy(NewMerklePayoutStrategy);
      await newMerklePayoutStrategy.deployed();

      this.merklePayoutStrategy = newMerklePayoutStrategy;
      /* deploy new voting strategy */

      const NewQuadraticFundingVotingStrategyImplementation = await ethers.getContractFactory("QuadraticFundingVotingStrategyImplementation", this.signers.admin);
      const newQuadraticFundingVotingStrategyImplementation = await NewQuadraticFundingVotingStrategyImplementation.deploy();
      await newQuadraticFundingVotingStrategyImplementation.deployed();

      /* Set times for round factory tests */
      const timeStamp = parseInt(await getTimestamp());
      const applicationsStartTime = Math.round(timeStamp + 100); // now
      const applicationsEndTime = Math.round(timeStamp + 250); // 2 hours later
      const roundStartTime = Math.round(timeStamp + 500); // 3 hours later
      const roundEndTime = Math.round(timeStamp + 1000); // 4 hours later

      const roundParams = [
        newQuadraticFundingVotingStrategyImplementation.address, // _votingStrategyAddress
        newMerklePayoutStrategy.address, // _payoutStrategyAddress
        applicationsStartTime, // _applicationsStartTime
        applicationsEndTime, // _applicationsEndTime
        roundStartTime, // _roundStartTime
        roundEndTime, // _roundEndTime
        "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", // _token WETH on mumbai
        { protocol: 1, pointer: "bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi" }, // _roundMetaPtr
        { protocol: 1, pointer: "bafybeiaoakfoxjwi2kwh43djbmomroiryvhv5cetg74fbtzwef7hzzvrnq" }, // _applicationMetaPtr
        [this.signers.admin.address], // _adminRoles
        [this.signers.roundOperator.address], // _roundOperators
      ];

      const tx = await this.roundImplementation.initialize(
        encodeRoundParameters(roundParams),
      );

      await tx.wait();

    });

    it("invoking create SHOULD have a successful transaction", async function () {
      /* Set times for round factory tests */
      const timeStamp = await getTimestamp();
      const applicationsStartTime = Math.round(timeStamp + 3600); // 1 hour later
      const applicationsEndTime = Math.round(timeStamp + 7200); // 2 hours later
      const roundStartTime = Math.round(timeStamp + 10800); // 3 hours later
      const roundEndTime = Math.round(timeStamp + 14400); // 4 hours later

      const roundContract = await this.roundFactory.connect(this.signers.admin).roundContract();
      expect(roundContract).to.be.equal(this.roundImplementation.address, "incorrect round contract address.");

      /* deploy new merkle payout strategy (must re-deploy every time a round is created) */
      const NewMerklePayoutStrategy = await ethers.getContractFactory("MerklePayoutStrategy");
      const newMerklePayoutStrategy = await upgrades.deployProxy(NewMerklePayoutStrategy);
      await newMerklePayoutStrategy.deployed();

      const NewQuadraticFundingVotingStrategyImplementation = await ethers.getContractFactory("QuadraticFundingVotingStrategyImplementation", this.signers.admin);
      const newQuadraticFundingVotingStrategyImplementation = await NewQuadraticFundingVotingStrategyImplementation.deploy();
      await newQuadraticFundingVotingStrategyImplementation.deployed();

      const params = [
       newQuadraticFundingVotingStrategyImplementation.address, // _votingStrategyAddress
        newMerklePayoutStrategy.address, // _payoutStrategyAddress
        applicationsStartTime, // _applicationsStartTime
        applicationsEndTime, // _applicationsEndTime
        roundStartTime, // _roundStartTime
        roundEndTime, // _roundEndTime
        "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", // _token WETH on mumbai
        { protocol: 1, pointer: "bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi" }, // _roundMetaPtr
        { protocol: 1, pointer: "bafybeiaoakfoxjwi2kwh43djbmomroiryvhv5cetg74fbtzwef7hzzvrnq" }, // _applicationMetaPtr
        [this.signers.admin.address], // _adminRoles
        [this.signers.roundOperator.address], // _roundOperators
      ];

      const txn = await this.roundFactory.create(
        encodeRoundParameters(params),
        this.signers.admin.address, // _ownedBy (Program)
      );

      const receipt = await txn.wait();

      expect(txn.hash).to.not.be.empty;
      expect(receipt.status).equals(1);
    });

    it("Should apply to a round", async function () {
      /* advance to a time when the round is accepting applications */      
      await network.provider.send("evm_increaseTime", [100])
      await network.provider.send("evm_mine")
      /* apply to a round */
      const tx = await this.roundImplementation.applyToRound(
        ethers.utils.hexZeroPad(projectApplications[0].project, 32),
        projectApplications[0].metaPtr,
      );
      const promise = await tx.wait();
      expect(promise.events[0].args.project).to.equal(ethers.utils.hexZeroPad(projectApplications[0].project, 32).toLowerCase());
    });
  });
});
