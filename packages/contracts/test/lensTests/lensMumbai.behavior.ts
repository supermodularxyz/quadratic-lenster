import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import CollectNFT from "../../importedABI/CollectNFT.json";
import { LensHub } from "../../types/contracts/lens/LensHub";
import { FIRST_PROFILE_ID } from "../utils/constants";
import { getTimestamp } from "../utils/utils";
import { deployLensMumbaiFixture } from "./lens.fixture";

export const shouldBehaveLikeLensHubMumbai = () => {
  let _snapshotId: number;
  let _admin: SignerWithAddress;
  let _user: SignerWithAddress;

  let _lensMumbai: LensHub;
  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    _admin = signers[0];
    _user = signers[2];

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
    it("should return the correct follow NFT implementation", async function () {
      expect(await _lensMumbai.connect(_admin).getFollowNFTImpl()).to.equal(
        "0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772",
      );
    });

    it("should collect a user post", async function () {
      /* follow and collect */
      await expect(_lensMumbai.connect(_admin).follow([FIRST_PROFILE_ID], [[]])).to.not.be.reverted;
      await expect(_lensMumbai.connect(_admin).collect(FIRST_PROFILE_ID, 1, [])).to.not.be.reverted;
    });

    it("User should follow, then collect, receive a collect NFT with the expected properties", async function () {
      await expect(_lensMumbai.connect(_user).follow([FIRST_PROFILE_ID], [[]])).to.not.be.reverted;
      const tx = await _lensMumbai.connect(_user).collect(FIRST_PROFILE_ID, 1, []);
      const promise = await tx.wait();
      const event = promise?.events?.filter((e: any) => e.event == "Transfer");
      const tokenId = event?.[0].args?.tokenId;

      await expect(tx).to.not.be.reverted;

      const timestamp = await getTimestamp();

      const collectNFTAddr = await _lensMumbai.getCollectNFT(FIRST_PROFILE_ID, 1);

      expect(collectNFTAddr).to.not.eq(ethers.constants.AddressZero);
      /* get collect nft contract for first profile and first post of that profile on mumbai */
      const collectNFT = new ethers.Contract(collectNFTAddr, CollectNFT.abi, _admin);

      const id = await collectNFT.connect(_user).tokenOfOwnerByIndex(_user.address, 0);
      const name = await collectNFT.name();
      const symbol = await collectNFT.connect(_user).symbol();
      const pointer = await collectNFT.connect(_user).getSourcePublicationPointer();
      const owner = await collectNFT.connect(_user).ownerOf(id);
      const mintTimestamp = await collectNFT.connect(_user).mintTimestampOf(id);
      const tokenData = await collectNFT.connect(_user).tokenDataOf(id);

      expect(id).to.eq(tokenId);
      expect(name).to.eq("lensprotocol.test-Collect-1");
      expect(symbol).to.eq("lens-Cl-1");
      expect(pointer[0]).to.eq(FIRST_PROFILE_ID);
      expect(pointer[1]).to.eq(1);
      expect(owner).to.eq(_user.address);
      expect(tokenData.owner).to.eq(_user.address);
      expect(tokenData.mintTimestamp).to.eq(timestamp);
      expect(mintTimestamp).to.eq(timestamp);
    });
  });
};
