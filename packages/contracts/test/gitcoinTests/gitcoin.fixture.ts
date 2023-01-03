import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { isAddress } from "ethers/lib/utils";
import { ethers, network, upgrades } from "hardhat";

import wethAbi from '../../importedABI/WETH.json'

/* deploy gitcoin grants implementation on mumbai fork */
export async function deployGitcoinMumbaiFixture() {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const admin: SignerWithAddress = signers[0];
  /* check that api key has been set*/
  if (!process.env.INFURA_API_KEY)
  throw new Error("This test requires a mainnet provider set in the INFURA_API_KEY environment variable");

    /* Fork mumbai */
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
            blockNumber: 30259508 /* Dec 28, 2022 */,
          },
        },
      ],
    });

    /* get WETH contract */
    const WETH = new ethers.Contract("0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", wethAbi, admin);
    /* impersonate weth whale account */
    const whale = <SignerWithAddress>await ethers.getImpersonatedSigner("0x9883d5e7dc023a441a01ef95af406c69926a0ab6");

    /* transfer 10 weth to signers */
    for(let i = 0; i<3 ; i++){
      await WETH.connect(whale).transfer(signers[i].address, ethers.utils.parseEther("10"));
      expect(ethers.utils.formatEther(await WETH.balanceOf(signers[i].address))).to.equal("10.0")
    }
    
    /* deploy gitcoin program factory */
    const ProgramFactory = await ethers.getContractFactory("ProgramFactory", admin)
    const programFactory = await upgrades.deployProxy(ProgramFactory);
    await programFactory.deployed();

    expect(isAddress(programFactory.address), 'Failed to deploy ProgramFactory').to.be.true;
    expect(await programFactory.programContract()).to.be.equal(ethers.constants.AddressZero);

    /* deploy gitcoin program implementation */
    const ProgramImplementation = await ethers.getContractFactory("ProgramImplementation", admin);
    const programImplementation = await ProgramImplementation.deploy([]);
    await programImplementation.deployed();

    expect(isAddress(programImplementation.address), 'Failed to deploy ProgramImplementation').to.be.true;

 

    /* deploy quadratic funding voting strategy factory */
    const QuadraticFundingVotingStrategyFactory = await ethers.getContractFactory("QuadraticFundingVotingStrategyFactory", admin);
    const quadraticFundingVotingStrategyFactory  = await upgrades.deployProxy(QuadraticFundingVotingStrategyFactory);
    await quadraticFundingVotingStrategyFactory.deployed();
    
    expect(isAddress(quadraticFundingVotingStrategyFactory.address), 'Failed to deploy quadraticFundingVotingStrategyFactory').to.be.true;

    /* deploy quadratic funding voting strategy implementation*/
    const QuadraticFundingVotingStrategyImplementation = await ethers.getContractFactory("QuadraticFundingVotingStrategyImplementation", admin);
    const quadraticFundingVotingStrategyImplementation = await QuadraticFundingVotingStrategyImplementation.deploy();
    await quadraticFundingVotingStrategyImplementation.deployed();

    expect(isAddress(quadraticFundingVotingStrategyImplementation.address), 'Failed to deploy quadraticFundingVotingStrategyImplementation').to.be.true;

    /* Update QuadraticFundingVotingStrategyImplementation */

    await expect(quadraticFundingVotingStrategyFactory.updateVotingContract(quadraticFundingVotingStrategyImplementation.address))
    .to.emit(quadraticFundingVotingStrategyFactory, 'VotingContractUpdated')
    .withArgs(quadraticFundingVotingStrategyImplementation.address);

    /* deploy payout strategy */
    const MerklePayoutStrategy = await ethers.getContractFactory("MerklePayoutStrategy");
    const merklePayoutStrategy = await upgrades.deployProxy(MerklePayoutStrategy);
    await merklePayoutStrategy.deployed();
    await merklePayoutStrategy.init();
    expect(isAddress(merklePayoutStrategy.address), 'Failed to deploy merklePayoutStrategyFactory').to.be.true;

    /* deploy round factory */
    const RoundFactory = await ethers.getContractFactory("RoundFactory");
    const roundFactory = await upgrades.deployProxy(RoundFactory);
    await roundFactory.deployed();

    expect(isAddress(roundFactory.address), 'Failed to deploy roundFactory').to.be.true;
    
    /* deploy round factory implementation */
    const RoundImplementation = await ethers.getContractFactory("RoundImplementation");
    const roundImplementation = await RoundImplementation.deploy();
    await roundImplementation.deployed();

    expect(isAddress(roundImplementation.address), 'Failed to deploy roundImplementation').to.be.true;

    /* update round factory with round implementation */

    await expect(roundFactory.updateRoundContract(roundImplementation.address))
    .to.emit(roundFactory, 'RoundContractUpdated')
    .withArgs(roundImplementation.address);



  return { 
    programFactory,
    programImplementation,
    quadraticFundingVotingStrategyFactory,
    quadraticFundingVotingStrategyImplementation,
    merklePayoutStrategy,
    roundFactory,
    roundImplementation,
    WETH
    };
}
