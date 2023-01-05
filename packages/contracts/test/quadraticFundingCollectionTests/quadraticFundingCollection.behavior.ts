import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldBehaveLikeQFCollectionModule () {
    it("Should collect a post and simultaneously vote in an active round", async function () {
      expect(ethers.utils.formatEther(await this.WETH.balanceOf(this.signers.user.address))).to.equal("10.0");
      await this.WETH.approve(this.votingStrategy.address, 100);

      const encodedVotes = [];
      // Prepare Votes
      const votes = [[this.WETH.address, 5, this.signers.user.address]];

      for (let i = 0; i < votes.length; i++) {
        encodedVotes.push(ethers.utils.defaultAbiCoder.encode(["address", "uint256", "address"], votes[i]));
      }

      // const mockTime = await _roundImplementation.applicationsStartTime();

      await ethers.provider.send("evm_mine", [this.currentBlockTimestamp + 750]); /* wait for round to start */
      
      await expect(this.roundImplementation.vote(encodedVotes)).to.not.be.reverted;
      // whitelist collect module 
      await this.lensMumbai.connect(this.signers.gov).whitelistCollectModule(this.qfCollectionModule.address, true);


    });
    
};
