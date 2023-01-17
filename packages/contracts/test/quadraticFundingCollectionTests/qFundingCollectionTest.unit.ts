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
  it("Should initialize the qfFundingModule with WETH", async function () {
    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
    );
    await expect(this.mockedQfModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
      .reverted;
  });

  it.only("Should execute processCollect and vote", async function () {
    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");
    expect(await this.WETH.balanceOf(this.signers.userTwo.address)).to.be.eq(ethers.utils.parseEther("10"));
    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
    );
    await expect(this.mockedQfModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
      .reverted;
    //start a round
    const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

    await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */
    const votingData = {
      grantsAddress: this.roundImplementation.address,
      votingStrategyAddress: this.votingStrategy.address,
      roundStartTime: currentBlockTimestamp + 500,
      roundEndTime: currentBlockTimestamp + 1000,
    };
    //encode collect call data
    const collectData = ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "tuple(address grantsAddress, address votingStrategyAddress, uint256 roundStartTime, uint256 roundEndTime) votingData",
      ],
      [this.WETH.address, DEFAULT_COLLECT_PRICE, votingData],
    );

    await this.WETH.connect(this.signers.userTwo).approve(this.mockedQfModule.address, DEFAULT_COLLECT_PRICE);

    const tx = await this.mockedQfModule
      .connect(this.signers.userTwo)
      .processCollect(1, this.signers.userTwo.address, 1, 1, collectData);
    const receipt = await tx.wait();

    await expect(tx).to.not.be.reverted;
  });

  it.only("Should execute processCollect with referall and vote", async function () {
    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");
    expect(await this.WETH.balanceOf(this.signers.userTwo.address)).to.be.eq(ethers.utils.parseEther("10"));
    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
    );
    await expect(this.mockedQfModule.initializePublicationCollectModule(1, 1, collectModuleInitData)).to.not.be
      .reverted;
    //start a round
    const currentBlockTimestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;

    await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */
    const votingData = {
      grantsAddress: this.roundImplementation.address,
      votingStrategyAddress: this.votingStrategy.address,
      roundStartTime: currentBlockTimestamp + 500,
      roundEndTime: currentBlockTimestamp + 1000,
    };
    //encode collect call data
    const collectData = ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "tuple(address grantsAddress, address votingStrategyAddress, uint256 roundStartTime, uint256 roundEndTime) votingData",
      ],
      [this.WETH.address, DEFAULT_COLLECT_PRICE, votingData],
    );

    await this.WETH.connect(this.signers.userTwo).approve(this.mockedQfModule.address, DEFAULT_COLLECT_PRICE);

    const tx = await this.mockedQfModule
      .connect(this.signers.userTwo)
      .processCollect(22, this.signers.userTwo.address, 1, 1, collectData);
    const receipt = await tx.wait();

    await expect(tx).to.not.be.reverted;
  });
}
