import { SnapshotRestorer, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers } from "hardhat";

import CollectNFT from "../../importedABI/CollectNFT.json";
import LensHubAbi from "../../importedABI/LensHub.json";
import { LensHub } from "../../types/contracts/mocks/LensHub";
import { lensSandboxAddresses as lens } from "../utils/constants";
import { getDefaultSigners, getTimestamp } from "../utils/utils";

export const shouldBehaveLikeLensHub = () => {
  let _snapshot: SnapshotRestorer;
  let _lensHub: LensHub;
  let _signers: { [key: string]: SignerWithAddress };

  before(async function () {
    _signers = await getDefaultSigners();

    _lensHub = <LensHub>new ethers.Contract(lens.LensHubProxy, LensHubAbi.abi, _signers.admin);
  });

  describe("Lens deployment", function () {
    beforeEach("snapshot blockchain", async () => {
      _snapshot = await takeSnapshot();
    });

    afterEach("restore blockchain snapshot", async () => {
      await _snapshot.restore();
    });

    it("should have our test user", async () => {
      expect(await _lensHub.getProfileIdByHandle("darude.test")).to.eq(381);
    });

    it("should return the correct follow NFT implementation", async () => {
      expect(await _lensHub.getFollowNFTImpl()).to.equal("0xF51b134cA8f54fDf19eB49001fE337B1E93cf707");
    });

    it("should collect a user post", async () => {
      expect(await _lensHub.follow([lens.defaultProfile], [[]])).to.emit(_lensHub, "Follow");
      expect(await _lensHub.collect(lens.defaultProfile, 1, [])).to.emit(_lensHub, "Collect");
    });

    it("User should follow, then collect, receive a collect NFT with the expected properties", async () => {
      const { admin } = _signers;
      const tx = await _lensHub.collect(lens.defaultProfile, 1, []).then((tx) => tx.wait());
      const event = tx.events?.filter((e) => e.event == "Transfer");
      const tokenId = event?.[0].args?.tokenId;

      expect(tokenId).to.not.be.undefined;

      const timestamp = await getTimestamp();

      const collectNFTAddr = await _lensHub.getCollectNFT(lens.defaultProfile, 1);
      const collectNFT = new ethers.Contract(collectNFTAddr, CollectNFT.abi, admin);

      const pointer = await collectNFT.getSourcePublicationPointer();
      expect(pointer[0]).to.eq(lens.defaultProfile);
      expect(pointer[1]).to.eq(1);

      const tokenData = await collectNFT.tokenDataOf(tokenId);
      expect(tokenData.owner).to.eq(admin.address);
      expect(tokenData.mintTimestamp).to.eq(timestamp);

      //TODO equals check values defined in deployment JSONs for multi-env support
      expect(await collectNFT.tokenOfOwnerByIndex(admin.address, 0)).to.eq(tokenId);
      expect(await collectNFT.ownerOf(tokenId)).to.eq(admin.address);
      expect(await collectNFT.name()).to.eq("yoginth.test-Collect-1");
      expect(await collectNFT.symbol()).to.eq("yogi-Cl-1");
      expect(await collectNFT.mintTimestampOf(tokenId)).to.eq(timestamp);
    });
  });
};
