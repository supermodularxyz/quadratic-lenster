import { MockContract } from "@ethereum-waffle/mock-contract";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { QuadraticVoteCollectModule } from "../../types/contracts/QuadraticVoteCollectModule";
import { CollectNFT } from "../../types/contracts/mocks/CollectNFT";
import { FollowNFT } from "../../types/contracts/mocks/FollowNFT";
import { FreeCollectModule } from "../../types/contracts/mocks/FreeCollectModule";
import { LensHub } from "../../types/contracts/mocks/LensHub";
import { ProfileCreationProxy } from "../../types/contracts/mocks/ProfileCreationProxy";
import { buildPostData, getDefaultSigners, getTimestamp } from "../utils/utils";
import { LensUser, deployLensFixture } from "./lens.fixture";

export const shouldBehaveLikeLensHub = () => {
  let _signers: { [key: string]: SignerWithAddress };
  let _qVoteCollectModule: QuadraticVoteCollectModule;
  let _lensHub: LensHub;
  let _moduleGlobals: Contract;
  let _collectNFT: CollectNFT;
  let _followNFT: FollowNFT;
  let _profileCreation: ProfileCreationProxy;
  let _freeCollectModule: FreeCollectModule;
  let _profiles: { [key: string]: LensUser };

  before(async function () {
    _signers = await getDefaultSigners();
  });

  describe("Lens deployment", function () {
    beforeEach("deploy fixture", async () => {
      const {
        qVoteCollectModule,
        lensHub,
        moduleGlobals,
        collectNFT,
        followNFT,
        profileCreation,
        profiles,
        freeCollectModule,
      } = await loadFixture(deployLensFixture);

      _qVoteCollectModule = qVoteCollectModule;
      _lensHub = lensHub;
      _moduleGlobals = moduleGlobals;
      _collectNFT = collectNFT;
      _followNFT = followNFT;
      _profileCreation = profileCreation;
      _freeCollectModule = freeCollectModule;
      _profiles = profiles;
    });

    it("should have our test user", async () => {
      expect(await _lensHub.getProfileIdByHandle("creator.test")).to.eq(1);
      expect(await _lensHub.getProfileIdByHandle("collector.test")).to.eq(2);
    });

    it("should return the correct follow NFT implementation", async () => {
      expect(await _lensHub.getFollowNFTImpl()).to.equal(_followNFT.address);
    });

    it("should collect a user post", async () => {
      const { creator, collector } = _profiles;

      const initFreeCollect = ethers.utils.defaultAbiCoder.encode(["bool"], [true]);
      const postData = buildPostData(1, _freeCollectModule.address, initFreeCollect);

      await expect(_lensHub.connect(creator.account).post(postData)).to.not.be.reverted;

      expect(await _lensHub.connect(collector.account).follow([1], [[]])).to.emit(_lensHub, "Follow");
      expect(await _lensHub.connect(collector.account).collect(1, 1, [])).to.emit(_lensHub, "Collect");
    });

    it("User should follow, then collect, receive a collect NFT with the expected properties", async () => {
      const { admin } = _signers;
      const { creator, collector } = _profiles;

      const initFreeCollect = ethers.utils.defaultAbiCoder.encode(["bool"], [true]);
      const postData = buildPostData(1, _freeCollectModule.address, initFreeCollect);

      await expect(_lensHub.connect(creator.account).post(postData)).to.not.be.reverted;

      await _lensHub.connect(collector.account).follow([1], [[]]);
      const tx = await _lensHub.connect(collector.account).collect(1, 1, []);

      const receipt = await tx.wait();
      const event = receipt.events?.filter((e) => e.event == "Transfer");
      const tokenId = event?.[0].args?.tokenId;

      expect(tokenId).to.not.be.undefined;

      const timestamp = await getTimestamp();

      const collectNFTAddr = await _lensHub.getCollectNFT(1, 1);
      const collectNFT = new ethers.Contract(collectNFTAddr, _collectNFT.interface, admin);

      const pointer = await collectNFT.getSourcePublicationPointer();
      expect(pointer[0]).to.eq(1);
      expect(pointer[1]).to.eq(1);

      const tokenData = await collectNFT.tokenDataOf(tokenId);
      expect(tokenData.owner).to.eq(collector.account.address);
      expect(tokenData.mintTimestamp).to.eq(timestamp);

      expect(await collectNFT.tokenOfOwnerByIndex(collector.account.address, 0)).to.eq(tokenId);
      expect(await collectNFT.ownerOf(tokenId)).to.eq(collector.account.address);
      expect(await collectNFT.name()).to.eq(`${creator.profile.handle}.test-Collect-1`);
      expect(await collectNFT.symbol()).to.eq(`${creator.profile.handle.slice(0, 4)}-Cl-1`);
      expect(await collectNFT.mintTimestampOf(tokenId)).to.eq(timestamp);
    });
  });
};
