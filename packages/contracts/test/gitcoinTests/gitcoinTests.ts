import { RoundImplementation } from './../../types/contracts/gitcoin/round/RoundImplementation';
import { RoundFactory } from './../../types/contracts/gitcoin/round/RoundFactory';
import { MerklePayoutStrategy } from './../../types/contracts/gitcoin/payoutStrategy/MerklePayoutStrategy';
import { ProgramImplementation } from './../../types/contracts/gitcoin/program/ProgramImplementation';
import { ProgramFactory } from './../../types/contracts/gitcoin/program/ProgramFactory';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { shouldBehaveLikeGitCoinMumbai } from "./gitcoin.behavior";
import { deployGitcoinMumbaiFixture } from "./gitcoin.fixture";

describe("gitcoin Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("gitcoin deployment", function () {
    beforeEach(async function () {
      const {    programFactory,
        programImplementation,
        quadraticFundingVotingStrategyFactory,
        quadraticFundingVotingStrategyImplementation,
        merklePayoutStrategyFactory,
        roundFactory,
        roundImplementation } = await this.loadFixture(deployGitcoinMumbaiFixture);
      this.programFactory = <ProgramFactory> programFactory;
      this.programImplementation = <ProgramImplementation>programImplementation;
      this.quadraticFundingVotingStrategyFactory = quadraticFundingVotingStrategyFactory;
      this.quadraticFundingVotingStrategyImplementation = quadraticFundingVotingStrategyImplementation;
      this.merklePayoutStrategyFactory = <MerklePayoutStrategy>merklePayoutStrategyFactory;
      this.roundFactory = <RoundFactory>roundFactory;
      this.roundImplementation = <RoundImplementation>roundImplementation;

    });
    shouldBehaveLikeGitCoinMumbai();
  });
});
