

import { expect } from "chai";
import { ethers } from "hardhat";

import {
  FIRST_PROFILE_ID,
  MOCK_FOLLOW_NFT_URI,
  MOCK_PROFILE_HANDLE,
  MOCK_PROFILE_URI,
  MOCK_URI,
  REFERRAL_FEE_BPS,
} from "../utils/constants";

export function shouldBeAUnitTestQFCM() {

    it("Should initialize the qfFundingModule", async function() {

        const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

        const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "address", "address", "uint16", "bool"],
            [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
          );
        await expect(this.mockedQfModule.initializePublicationCollectModule(1,1,collectModuleInitData)).to.not.be.reverted;
    });
    it("Should execute processCollect with a vote", async function(){
      const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

      const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "address", "address", "uint16", "bool"],
          [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
        );
      await expect(this.mockedQfModule.initializePublicationCollectModule(1,1,collectModuleInitData)).to.not.be.reverted;
      //start a round
      const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
      
      await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

        //encode collect call data
        const collectData = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "address", "uint256", "uint256"],
          [this.WETH.address, DEFAULT_COLLECT_PRICE , this.roundImplementation.address, currentBlockTimestamp + 500, currentBlockTimestamp + 1000])


          console.log("qfmock: ", this.mockedQfModule.address, "mockLenshub: ", this.mockLenshub.address)
          
          this.WETH.connect(this.signers.userTwo).approve(this.mockedQfModule.address, DEFAULT_COLLECT_PRICE)
      const tx = await this.mockedQfModule.connect(this.signers.userTwo).processCollect(1, this.signers.userTwo.address, 1, 1, collectData)
      await expect(tx).to.not.be.reverted;
    })
  }