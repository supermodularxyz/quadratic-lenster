import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { QuadraticFundingCurator } from "../../types/contracts/QuadraticFundingCurator";
import { RoundImplementation } from "../../types/contracts/mocks/RoundImplementation";
import { MetaPtr } from "../utils/constants";
import { deployCuratorFixture } from "./curator.fixture";
import { getDefaultSigners } from "../utils/utils";

export const shouldBehaveLikeCurator = () => {
  let _roundImplementation: RoundImplementation;
  let _curator: QuadraticFundingCurator;

  let _currentBlockTimestamp: number;
  let _signers: { [key: string]: SignerWithAddress };
  let _defaultMetaPtr: MetaPtr;

  beforeEach(async () => {
    const signers = await getDefaultSigners();
    _signers = signers;

    const { curator, roundImplementation, currentBlockTimestamp, defaultMetaPtr } = await loadFixture(
      deployCuratorFixture,
    );
    _curator = curator;
    _roundImplementation = roundImplementation;
    _currentBlockTimestamp = currentBlockTimestamp;
    _defaultMetaPtr = defaultMetaPtr;
  });

  describe("Round interactions", () => {
    it("Should only allow operators to call updateMetaPtr", async () => {
      const { admin, user: operator, user2 } = _signers;
      const ROUND_OPERATOR_ROLE = "ROUND_OPERATOR";
      const parsedRole = ethers.utils.id(ROUND_OPERATOR_ROLE);
      await expect(_curator.connect(user2).updateMetaPtr(_defaultMetaPtr)).to.be.reverted;
      await expect(_curator.connect(operator).updateMetaPtr(_defaultMetaPtr)).to.be.reverted;

      await _roundImplementation.connect(admin).grantRole(parsedRole, _curator.address);

      await expect(_curator.connect(operator).updateMetaPtr(_defaultMetaPtr)).to.emit(
        _roundImplementation,
        "ProjectsMetaPtrUpdated",
      );
    });

    it("Should only allow admin to call updateGrantRoundAddress", async () => {
      const { admin, user } = _signers;
      const newAddress = ethers.Wallet.createRandom().address;
      await expect(_curator.connect(user).updateGrantRoundAddress(newAddress)).to.be.reverted;
      await expect(_curator.connect(admin).updateGrantRoundAddress(newAddress))
        .to.emit(_curator, "GrantsRoundUpdated")
        .withArgs(newAddress);
    });

    it("Pausable state is managed by admin", async () => {
      const { admin, user } = _signers;
      await expect(_curator.connect(user).pause()).to.be.reverted;
      await expect(_curator.connect(admin).pause()).to.emit(_curator, "Paused");

      await expect(_curator.connect(user).unpause()).to.be.reverted;
      await expect(_curator.connect(admin).unpause()).to.emit(_curator, "Unpaused");
    });

    it("Cannot operate the round when paused", async () => {
      const { admin, user: operator } = _signers;
      const ROUND_OPERATOR_ROLE = "ROUND_OPERATOR";
      const parsedRole = ethers.utils.id(ROUND_OPERATOR_ROLE);
      await _roundImplementation.connect(admin).grantRole(parsedRole, _curator.address);

      await expect(_curator.connect(admin).pause()).to.emit(_curator, "Paused");

      await expect(_curator.connect(operator).updateMetaPtr(_defaultMetaPtr)).to.be.revertedWith("Pausable: paused");
    });
  });
};
