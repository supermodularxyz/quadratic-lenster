import { ProgramCreatedEvent } from './../../types/contracts/gitcoin/program/ProgramFactory';
import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, upgrades } from "hardhat";
import { isAddress } from "ethers/lib/utils";
import { encodeProgramParameters, encodeRoundParameters } from "../utils/utils";


export function shouldBehaveLikeGitCoinMumbai(): void {
    it("ProgramContract: SHOULD have program address after invoking updateProgramContract", async function () {
          expect(await this.programFactory.connect(this.signers.admin).programContract()).to.be.equal(this.programImplementation.address);
      });

    it("ProgramContract: invoking create SHOULD have a successful transaction", async function () {
        const params = [
            { protocol: 1, pointer: "bafybeif43xtcb7zfd6lx7rfq42wjvpkbqgoo7qxrczbj4j4iwfl5aaqv2q" }, // _metaPtr
            [ Wallet.createRandom().address ], // _adminRoles
            [ Wallet.createRandom().address, Wallet.createRandom().address ] // _programOperators
        ];
    
        const txn = await this.programFactory.create(
            encodeProgramParameters(params),
        );
    
            const receipt = await txn.wait();
    
            expect(txn.hash).to.not.be.empty;
            expect(receipt.status).equals(1);
          });
    
          
    it("ProgramContract: SHOULD emit ProgramCreated event after invoking create", async function () {
    
            const params = [
              { protocol: 1, pointer: "bafybeif43xtcb7zfd6lx7rfq42wjvpkbqgoo7qxrczbj4j4iwfl5aaqv2q" }, // _metaPtr
              [ Wallet.createRandom().address ], // _adminRoles
              [ Wallet.createRandom().address, Wallet.createRandom().address ] // _programOperators
            ];
    
            const txn = await this.programFactory.create(
              encodeProgramParameters(params)
            );
    
            let programAddress;
            let programImplementation;
    
            const receipt = await txn.wait();
            if (receipt.events) {
              const event = receipt.events.find((e:ProgramCreatedEvent) => e.event === 'ProgramCreated');
              if (event && event.args) {
                programAddress = event.args.programContractAddress;
                programImplementation = event.args.programImplementation;
              }
            }
    
            void expect(txn)
              .to.emit(this.programFactory, 'ProgramCreated')
              .withArgs(programAddress, programImplementation);
    
            expect(isAddress(programAddress)).to.be.true;
            expect(isAddress(programImplementation)).to.be.true;
    });
    it('MerklePayout: invoking init once SHOULD set the round address', async function () {
    
      expect(await this.merklePayoutStrategy.connect(this.signers.admin).roundAddress()).to.equal(this.signers.admin.address);
    });

    it('MerklePayout: invoking init more than once SHOULD revert the transaction ', async function (){
     await expect(this.merklePayoutStrategy.connect(this.signers.admin).init()).to.revertedWith('init: roundAddress already set')
    });


    it("QFcontract: SHOULD have voting contract address after invoking updateVotingContract", async function () {
        const votingContract = await this.quadraticFundingVotingStrategyFactory.connect(this.signers.admin).votingContract();
        expect(votingContract).to.be.equal(this.quadraticFundingVotingStrategyImplementation.address);
      });
      it("QFCopntract: invoking create SHOULD have a successful transaction", async function () {

        const txn = await this.quadraticFundingVotingStrategyFactory.connect(this.signers.admin).create();

        expect(await this.quadraticFundingVotingStrategyFactory.connect(this.signers.admin).updateVotingContract(this.quadraticFundingVotingStrategyImplementation.address))

        const receipt = await txn.wait();

        expect(txn.hash).to.not.be.empty;
        expect(receipt.status).equals(1);
      });

      it("RoundFactory: SHOULD have round address after invoking updateRoundContract", async function () {
        const roundContract = await this.roundFactory.connect(this.signers.admin).roundContract();
        expect(roundContract).to.be.equal(this.roundImplementation.address);
    }); 

      const applicationsStartTime = Math.round(new Date().getTime() / 1000 + 3600); // 1 hour later
      const applicationsEndTime = Math.round(new Date().getTime() / 1000 + 7200); // 2 hours later
      const roundStartTime = Math.round(new Date().getTime() / 1000 + 10800); // 3 hours later
      const roundEndTime = Math.round(new Date().getTime() / 1000 + 14400); // 4 hours later

        
    it("RoundFactory: invoking create SHOULD have a successful transaction", async function () {
      const roundContract = await this.roundFactory.connect(this.signers.admin).roundContract();
        expect(roundContract).to.be.equal(this.roundImplementation.address, "incorrect round contract address.");
       
        /* deploy new merkle payout strategy (must re-deploy every time a round is created) */
        const NewMerklePayoutStrategy = await ethers.getContractFactory("MerklePayoutStrategy");
        const newMerklePayoutStrategy = await upgrades.deployProxy(NewMerklePayoutStrategy);
        await newMerklePayoutStrategy.deployed();

        const params = [
          this.quadraticFundingVotingStrategyImplementation.address, // _votingStrategyAddress
          newMerklePayoutStrategy.address, // _payoutStrategyAddress
          applicationsStartTime, // _applicationsStartTime
          applicationsEndTime, // _applicationsEndTime
          roundStartTime, // _roundStartTime
          roundEndTime, // _roundEndTime
          Wallet.createRandom().address, // _token
          { protocol: 1, pointer: "bafybeia4khbew3r2mkflyn7nzlvfzcb3qpfeftz5ivpzfwn77ollj47gqi" }, // _roundMetaPtr
          { protocol: 1, pointer: "bafybeiaoakfoxjwi2kwh43djbmomroiryvhv5cetg74fbtzwef7hzzvrnq" }, // _applicationMetaPtr
          [ Wallet.createRandom().address ], // _adminRoles
          [ Wallet.createRandom().address, Wallet.createRandom().address ] // _roundOperators
        ];

        const txn = await this.roundFactory.create(
          encodeRoundParameters(params),
          this.signers.admin.address, // _ownedBy (Program)
        );

        const receipt = await txn.wait();

     expect(txn.hash).to.not.be.empty;
     expect(receipt.status).equals(1);
    });

}

