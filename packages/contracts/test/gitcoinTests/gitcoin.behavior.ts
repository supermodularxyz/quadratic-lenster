import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { getDefaultSigners } from "../utils/utils";
import { deployGitcoinMumbaiFixture } from "./gitcoin.fixture";

export const shouldBehaveLikeGrantsRound = () => {
  let _WETH: Contract;
  let _roundImplementation: RoundImplementation;
  let _payoutStrategy: Contract;
  let _votingStrategy: Contract;
  let _currentBlockTimestamp: number;
  let _signers: { [key: string]: SignerWithAddress };

  beforeEach(async () => {
    const signers = await getDefaultSigners();
    _signers = signers;

    const { roundImplementation, WETH, payoutStrategy, votingStrategy, currentBlockTimestamp } = await loadFixture(
      deployGitcoinMumbaiFixture,
    );
    _WETH = WETH;
    _roundImplementation = roundImplementation;
    _payoutStrategy = payoutStrategy;
    _votingStrategy = votingStrategy;
    _currentBlockTimestamp = currentBlockTimestamp;
  });

  describe("Round interactions", () => {
    it("Should allow voting in an active round", async () => {
      const { user } = _signers;

      expect(ethers.utils.formatEther(await _WETH.balanceOf(user.address))).to.equal("10.0");
      await _WETH.connect(user).approve(_votingStrategy.address, 100);

      const encodedVotes = [];
      // Prepare Votes
      const votes = [[user.address, _WETH.address, 5, user.address, ethers.utils.formatBytes32String("1")]];

      for (let i = 0; i < votes.length; i++) {
        encodedVotes.push(
          ethers.utils.defaultAbiCoder.encode(["address", "address", "uint256", "address", "bytes32"], votes[i]),
        );
      }

      await ethers.provider.send("evm_mine", [_currentBlockTimestamp + 750]); /* wait for round to start */
      await expect(_roundImplementation.connect(user).vote(encodedVotes)).to.emit(_votingStrategy, "Voted");
    });
  });
};
