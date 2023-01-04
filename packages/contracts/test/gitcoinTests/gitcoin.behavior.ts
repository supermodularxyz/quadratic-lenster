import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { RoundImplementation } from "../../types/contracts/gitcoin/round/RoundImplementation";
import { deployGitcoinMumbaiFixture } from "./gitcoin.fixture";

export const shouldBehaveLikeGrantsRound = () => {
  let _WETH: Contract;
  let _roundImplementation: RoundImplementation;
  let _payoutStrategy: Contract;
  let _votingStrategy: Contract;
  let _admin: SignerWithAddress;
  let _user: SignerWithAddress;
  let _currentBlockTimestamp: number;

  beforeEach(async () => {
    // TODO users, signers in fixture
    const { roundImplementation, WETH, payoutStrategy, votingStrategy, admin, user, currentBlockTimestamp } =
      await loadFixture(deployGitcoinMumbaiFixture);
    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _payoutStrategy = payoutStrategy;
    _votingStrategy = votingStrategy;
    _admin = admin;
    _user = user;
    _currentBlockTimestamp = currentBlockTimestamp;
  });

  describe("Round interactions", () => {
    it("Should allow voting in an active round", async () => {
      expect(ethers.utils.formatEther(await _WETH.balanceOf(_user.address))).to.equal("10.0");
      await _WETH.approve(_votingStrategy.address, 100);

      const encodedVotes = [];
      // Prepare Votes
      const votes = [[_WETH.address, 5, _user.address]];

      for (let i = 0; i < votes.length; i++) {
        encodedVotes.push(ethers.utils.defaultAbiCoder.encode(["address", "uint256", "address"], votes[i]));
      }

      // const mockTime = await _roundImplementation.applicationsStartTime();

      await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */
      await expect(_roundImplementation.vote(encodedVotes)).to.not.be.reverted;
    });
  });
};
