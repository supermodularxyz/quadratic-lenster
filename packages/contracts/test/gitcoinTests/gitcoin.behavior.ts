import { expect } from "chai";

export function shouldBehaveLikeGitCoinMumbai(): void {

  it("ProgramContract: SHOULD have program address after invoking updateProgramContract", async function () {
       /* Update ProgramImplementation  */
       await expect(this.programFactory.updateProgramContract(this.programImplementation.address))
       .to.emit(this.programFactory, 'ProgramContractUpdated')
       .withArgs(this.programImplementation.address);
    expect(await this.programFactory.connect(this.signers.admin).programContract()).to.be.equal(
      this.programImplementation.address,
    );
  });


  it("MerklePayout: invoking init once SHOULD set the round address", async function () {
    expect(await this.merklePayoutStrategy.connect(this.signers.admin).roundAddress()).to.equal(
      this.signers.admin.address,
    );
  });

  it("MerklePayout: invoking init more than once SHOULD revert the transaction ", async function () {
    await expect(this.merklePayoutStrategy.connect(this.signers.admin).init()).to.revertedWith(
      "init: roundAddress already set",
    );
  });

  it("QFVotingContract: SHOULD have voting contract address after invoking updateVotingContract", async function () {
    const votingContract = await this.quadraticFundingVotingStrategyFactory
      .connect(this.signers.admin)
      .votingContract();
    expect(votingContract).to.be.equal(this.quadraticFundingVotingStrategyImplementation.address);
  });

  it("QFVotingContract: invoking create SHOULD have a successful transaction", async function () {
    const txn = await this.quadraticFundingVotingStrategyFactory.connect(this.signers.admin).create();

    expect(
      await this.quadraticFundingVotingStrategyFactory
        .connect(this.signers.admin)
        .updateVotingContract(this.quadraticFundingVotingStrategyImplementation.address),
    );

    const receipt = await txn.wait();

    expect(txn.hash).to.not.be.empty;
    expect(receipt.status).equals(1);
  });

  it("RoundFactory: SHOULD have round address after invoking updateRoundContract", async function () {
    const roundContract = await this.roundFactory.connect(this.signers.admin).roundContract();
    expect(roundContract).to.be.equal(this.roundImplementation.address);
  });


}
