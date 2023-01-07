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

export function shouldBehaveLikeQFCollectionModule() {
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
    await expect(this.lensMumbai.connect(this.signers.gov).whitelistCollectModule(this.qfCollectionModule.address, true)).to.not.be.reverted;

    await expect(this.moduleGlobals.connect(this.signers.gov).whitelistCurrency(this.WETH.address, true)).to.not.be.reverted;

    const tx = await this.lensMumbai.connect(this.signers.gov).whitelistProfileCreator(this.signers.user.address, true);
    await tx.wait();
    
    expect(await this.lensMumbai.isProfileCreatorWhitelisted(this.signers.user.address)).to.be.eq(true);
    
    //create profile variables
    const profileVariables = {
      to: this.signers.user.address,
      handle: "testuserrrrr",
      imageURI: "https://ipfs.io/ipfs/QmY9dUwYu67puaWBMxRKW98LPbXCznPwHUbhX5NeWnCJbX",
      followModule: ethers.constants.AddressZero,
      followModuleInitData: [],
      followNFTURI: "https://ipfs.io/ipfs/QmTFLSXdEQ6qsSzaXaCSNtiv6wA56qq87ytXJ182dXDQJS",
    };

    // get profileId
    const profileId = await this.lensMumbai.connect(this.signers.user).callStatic.createProfile(profileVariables);

    //create profile
    const txn = await this.lensMumbai.connect(this.signers.user).createProfile(profileVariables);
    await txn.wait();

    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, this.WETH.address, this.signers.user.address, 100, true],
    );
    expect(await this.lensMumbai.isCollectModuleWhitelisted(this.qfCollectionModule.address)).to.be.eq(true);
    expect(await this.moduleGlobals.isCurrencyWhitelisted(this.WETH.address)).to.be.eq(true);
    
    try {
     const tx = await this.lensMumbai.connect(this.signers.user).post({
        profileId: profileId,
        contentURI: MOCK_URI,
        collectModule: this.qfCollectionModule.address,
        collectModuleInitData: collectModuleInitData,
        referenceModule: ethers.constants.AddressZero,
        referenceModuleInitData: [],
      });
      const recp = await tx.wait();
      console.log(recp)
    } catch (err) {
      console.error("THERE'S BEEN AN ERROR: ", err);
      console.log(
        "lenshub: ",
        this.lensMumbai.address,
        "qf module: ",
        this.qfCollectionModule.address,
        "USER: ",
        this.signers.user.address,
      );
    }
  });
}
