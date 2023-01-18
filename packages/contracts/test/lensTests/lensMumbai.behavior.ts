import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import CollectNFT from "../../importedABI/CollectNFT.json";
import { LensHub } from "../../types/contracts/lens/LensHub";
import { FIRST_PROFILE_ID, getDefaultSigners } from "../utils/constants";
import { getTimestamp } from "../utils/utils";
import { deployLensMumbaiFixture } from "./lens.fixture";

export const shouldBehaveLikeLensHubMumbai = () => {
  let _snapshotId: number;
  let _lensMumbai: LensHub;
  let _signers: { [key: string]: SignerWithAddress };

  before(async function () {
    const signers = await getDefaultSigners();
    _signers = signers;

    const { lensMumbai } = await loadFixture(deployLensMumbaiFixture);
    _lensMumbai = lensMumbai;
  });

  describe("Lens deployment", function () {
    beforeEach("snapshot blockchain", async () => {
      _snapshotId = await network.provider.send("evm_snapshot", []);
    });

    afterEach("restore blockchain snapshot", async () => {
      await network.provider.send("evm_revert", [_snapshotId]);
    });

    it("should return the correct follow NFT implementation", async () => {
      expect(await _lensMumbai.getFollowNFTImpl()).to.equal(
        "0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772",
      );
    });

    it("should collect a user post", async () => {
      const { admin } = _signers;
      /* follow and collect */
      // TODO cannot check event: https://github.com/ethereum/solidity/issues/13086
      await expect(_lensMumbai.connect(admin).follow([FIRST_PROFILE_ID], [[]])).to.not.be.reverted;
      await expect(_lensMumbai.connect(admin).collect(FIRST_PROFILE_ID, 1, [])).to.not.be.reverted;
    });

    it("User should follow, then collect, receive a collect NFT with the expected properties", async () => {
      const { user, admin } = _signers;
      await _lensMumbai.connect(user).follow([FIRST_PROFILE_ID], [[]]);
      const tx = await _lensMumbai.connect(user).collect(FIRST_PROFILE_ID, 1, []);
      const promise = await tx.wait();
      const event = promise?.events?.filter((e: any) => e.event == "Transfer");
      const tokenId = event?.[0].args?.tokenId;

      await expect(tx).to.not.be.reverted;

      const timestamp = await getTimestamp();

      const collectNFTAddr = await _lensMumbai.getCollectNFT(FIRST_PROFILE_ID, 1);

      expect(collectNFTAddr).to.not.eq(ethers.constants.AddressZero);
      const collectNFT = new ethers.Contract(collectNFTAddr, CollectNFT.abi, admin);

      const pointer = await collectNFT.connect(user).getSourcePublicationPointer();
      const tokenData = await collectNFT.connect(user).tokenDataOf(tokenId);

      expect(await collectNFT.connect(user).tokenOfOwnerByIndex(user.address, 0)).to.eq(tokenId);
      expect(await collectNFT.name()).to.eq("lensprotocol.test-Collect-1");
      expect(await collectNFT.connect(user).symbol()).to.eq("lens-Cl-1");
      expect(pointer[0]).to.eq(FIRST_PROFILE_ID);
      expect(pointer[1]).to.eq(1);
      expect(await collectNFT.connect(user).ownerOf(tokenId)).to.eq(user.address);
      expect(tokenData.owner).to.eq(user.address);
      expect(tokenData.mintTimestamp).to.eq(timestamp);
      expect(await collectNFT.connect(user).mintTimestampOf(tokenId)).to.eq(timestamp);
    });
  });
};
