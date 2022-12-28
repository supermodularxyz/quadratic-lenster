import { expect } from "chai";
import { Wallet } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { encodeProgramParameters } from "../utils/utils";


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
              const event = receipt.events.find((e:any) => e.event === 'ProgramCreated');
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
      expect(await this.merklePayoutStrategyFactory.connect(this.signers.admin).roundAddress()).to.equal(this.signers.admin.address);
    });

    it('MerklePayout: invoking init more than once SHOULD revert the transaction ', async function (){
     await expect(this.merklePayoutStrategyFactory.connect(this.signers.admin).init()).to.revertedWith('init: roundAddress already set')
    });

    it("RoundContract: SHOULD have round address after invoking updateRoundContract", async function () {
        const roundContract = await this.roundFactory.connect(this.signers.admin).roundContract();
        expect(roundContract).to.be.equal(this.roundImplementation.address);
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
}

