import { expect } from "chai";

export function shouldBehaveLikeLensHubMumbai(): void {
  it("should return the correct follow NFT implementation", async function () {
    expect(await this.lensMumbai.connect(this.signers.admin).getFollowNFTImpl()).to.equal("0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772");
  });
}
