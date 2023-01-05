
import { expect } from "chai";
import { ethers } from "hardhat";

import { FIRST_PROFILE_ID } from "../utils/constants";
import CollectNFT from '../../importedABI/CollectNFT.json';
import { getTimestamp } from '../utils/utils';

export function shouldBehaveLikeLensHubMumbai(): void {
  it("should return the correct follow NFT implementation", async function () {
    expect(await this.lensMumbai.connect(this.signers.admin).getFollowNFTImpl()).to.equal(
      "0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772",
    );
  });

  it("should collect a user post", async function () {
    /* follow and collect */
    await expect(this.lensMumbai.connect(this.signers.admin).follow([FIRST_PROFILE_ID], [[]])).to.not.be.reverted;
    await expect(this.lensMumbai.connect(this.signers.admin).collect(FIRST_PROFILE_ID, 1, [])).to.not.be.reverted;
  });

  it("User should follow, then collect, receive a collect NFT with the expected properties", async function () {
    await expect(this.lensMumbai.connect(this.signers.user).follow([FIRST_PROFILE_ID], [[]])).to.not.be.reverted;
    const tx = await this.lensMumbai.connect(this.signers.user).collect(FIRST_PROFILE_ID, 1, [])
    const promise = await tx.wait();
    const event = promise.events.filter((e:any)=> e.event == "Transfer");
    const tokenId = event[0].args.tokenId;
    
    await expect(tx).to.not.be.reverted;

    const timestamp = await getTimestamp();

    const collectNFTAddr = await this.lensMumbai.getCollectNFT(FIRST_PROFILE_ID, 1);

    expect(collectNFTAddr).to.not.eq(ethers.constants.AddressZero);
    /* get collect nft contract for first profile and first post of that profile on mumbai */
    const collectNFT = new ethers.Contract(collectNFTAddr, CollectNFT.abi, this.signers.admin );

    const id = await collectNFT.connect(this.signers.user).tokenOfOwnerByIndex(this.signers.user.address, 0);
    const name = await collectNFT.name();
    const symbol = await collectNFT.connect(this.signers.user).symbol();
    const pointer = await collectNFT.connect(this.signers.user).getSourcePublicationPointer();
    const owner = await collectNFT.connect(this.signers.user).ownerOf(id);
    const mintTimestamp = await collectNFT.connect(this.signers.user).mintTimestampOf(id);
    const tokenData = await collectNFT.connect(this.signers.user).tokenDataOf(id);

    expect(id).to.eq(tokenId);
    expect(name).to.eq('lensprotocol.test-Collect-1');
    expect(symbol).to.eq('lens-Cl-1');
    expect(pointer[0]).to.eq(FIRST_PROFILE_ID);
    expect(pointer[1]).to.eq(1);
    expect(owner).to.eq(this.signers.user.address);
    expect(tokenData.owner).to.eq(this.signers.user.address);
    expect(tokenData.mintTimestamp).to.eq(timestamp);
    expect(mintTimestamp).to.eq(timestamp);
  });
}
