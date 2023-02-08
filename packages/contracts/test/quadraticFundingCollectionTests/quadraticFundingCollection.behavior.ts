import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { deployGitcoinMumbaiFixture } from "../gitcoinTests/gitcoin.fixture";
import {
  FIRST_PROFILE_ID,
  MOCK_FOLLOW_NFT_URI,
  MOCK_PROFILE_HANDLE,
  MOCK_PROFILE_URI,
  MOCK_URI,
  REFERRAL_FEE_BPS,
} from "../utils/constants";
import { getDefaultSigners } from "../utils/utils";

export function shouldBehaveLikeQFCollectionModule() {
  it("Should collect a post and simultaneously vote in an active round", async function () {
    const signers = await getDefaultSigners();
    // deploy gitcoin fixture
    const {
      qVoteCollectModule,
      roundImplementation,
      WETH,
      votingStrategy,
      currentBlockTimestamp,
      lensHub,
      moduleGlobals,
    } = await loadFixture(deployGitcoinMumbaiFixture);
    expect(ethers.utils.formatEther(await WETH.balanceOf(signers.user.address))).to.equal("10.0");
    await WETH.approve(votingStrategy.address, 100);

    // Prepare Votes
    const votes = [[WETH.address, 5, signers.user.address]];

    const encodedVotes = votes.map((vote) =>
      ethers.utils.defaultAbiCoder.encode(["address", "uint256", "address"], vote),
    );

    await ethers.provider.send("evm_mine", [currentBlockTimestamp + 750]); /* wait for round to start */

    await expect(roundImplementation.vote(encodedVotes)).to.not.be.reverted;
    // whitelist collect module
    // TODO Gov signer
    await expect(lensHub.connect(signers.gov).whitelistCollectModule(qVoteCollectModule.address, true)).to.not.be
      .reverted;

    await expect(moduleGlobals.connect(signers.gov).whitelistCurrency(WETH.address, true)).to.not.be.reverted;

    const tx = await lensHub.connect(signers.gov).whitelistProfileCreator(signers.user.address, true);
    await tx.wait();

    expect(await lensHub.isProfileCreatorWhitelisted(signers.user.address)).to.be.eq(true);

    //create profile variables
    const profileVariables = {
      to: signers.user.address,
      handle: "testuserrrrr",
      imageURI: "https://ipfs.io/ipfs/QmY9dUwYu67puaWBMxRKW98LPbXCznPwHUbhX5NeWnCJbX",
      followModule: ethers.constants.AddressZero,
      followModuleInitData: [],
      followNFTURI: "https://ipfs.io/ipfs/QmTFLSXdEQ6qsSzaXaCSNtiv6wA56qq87ytXJ182dXDQJS",
    };

    // get profileId
    const profileId = await lensHub.connect(signers.user).callStatic.createProfile(profileVariables);

    //create profile
    const txn = await lensHub.connect(signers.user).createProfile(profileVariables);
    await txn.wait();

    const DEFAULT_COLLECT_PRICE = ethers.utils.parseEther("1");

    const collectModuleInitData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "address", "uint16", "bool"],
      [DEFAULT_COLLECT_PRICE, WETH.address, signers.user.address, 100, true],
    );
    expect(await lensHub.isCollectModuleWhitelisted(qVoteCollectModule.address)).to.be.eq(true);
    expect(await moduleGlobals.isCurrencyWhitelisted(WETH.address)).to.be.eq(true);

    const wethAmount = ethers.utils.parseEther("10");

    //approve module to spend weth
    await expect(WETH.connect(signers.user).approve(qVoteCollectModule.address, wethAmount)).to.not.be.reverted;
    await expect(WETH.connect(signers.user).approve(lensHub.address, wethAmount)).to.not.be.reverted;
    await expect(WETH.connect(signers.user).approve(moduleGlobals.address, wethAmount)).to.not.be.reverted;

    try {
      const tx = await lensHub.connect(this.signers.user).post({
        profileId: profileId,
        contentURI: MOCK_URI,
        collectModule: qVoteCollectModule.address,
        collectModuleInitData: collectModuleInitData,
        referenceModule: ethers.constants.AddressZero,
        referenceModuleInitData: [],
      });

      const recp = await tx.wait();

      console.log(recp);
    } catch (err) {
      console.error("THERE'S BEEN AN ERROR: ", err);
      console.log(
        "lenshub: ",
        lensHub.address,
        "qf module: ",
        qVoteCollectModule.address,
        "USER: ",
        signers.user.address,
      );
    }
  });
}
