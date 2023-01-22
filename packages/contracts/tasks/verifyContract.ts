import * as addresses from '../deployments/deployments-polygon-mumbai.json'
import { lensMumbaiAddresses, lensPolygonAddresses } from '../test/utils/constants';
import { task } from 'hardhat/config';

type Contracts = 'QuadraticFundingCurator' | 'QuadraticVoteCollectModule';

task('verifyContract', 'verify')
  .addOptionalParam('grantsRound', 'The address of the active Grants Round')
  .addOptionalParam('lensHub', 'The address of the LensHub')
  .addOptionalParam('moduleGlobals', 'The address of ModuleGlobals')
  .setAction(async ({ grantsRound, lensHub, moduleGlobals }, { ethers }) => {
    const [admin] = await ethers.getSigners();

    const contracts: Record<Contracts, string> = {
      QuadraticFundingCurator: addresses.QuadraticFundingCurator,
      QuadraticVoteCollectModule: addresses.QuadraticVoteCollectModule,
    };


    //TODO Correct arguments for Mumbai/Polygon
    const constructorArguments: Record<Contracts, string[]> = {
      QuadraticFundingCurator: ['0x45cf9Ba12b43F6c8B7148E06A6f84c5B9ad3Dd44', admin.address],
      QuadraticVoteCollectModule: [
        lensPolygonAddresses.lensHubImplementation,
        lensPolygonAddresses.moduleGlobals,
      ],
    };

    const constructorArgumentsMumbai: Record<Contracts, string[]> = {
      QuadraticFundingCurator: ['0x45cf9Ba12b43F6c8B7148E06A6f84c5B9ad3Dd44', admin.address],
      QuadraticVoteCollectModule: [
        lensMumbaiAddresses.lensHubImplementation,
        lensMumbaiAddresses.moduleGlobals,
      ],
    };

    for (const [name, address] of Object.entries(contracts)) {
      console.log(`Starting verification of ${name}`);
      console.log(name, address)
      let constructorArgs;

      if (hre.network.name == 'polygon-mainnet') {
        constructorArgs = Object.entries(constructorArguments).find((entry) => entry[0] === name)?.[1];
        console.log(`Constructor arguments: ${constructorArgs}`);
      } else if (hre.network.name == 'polygon-mumbai') {
        constructorArgs = Object.entries(constructorArgumentsMumbai).find((entry) => entry[0] === name)?.[1];
        console.log(`Constructor arguments: ${constructorArgs}`);
      } else if (hre.network.name == 'hardhat') {
       constructorArgs = Object.entries(constructorArgumentsMumbai).find((entry) => entry[0] === name)?.[1];
       console.log(`Constructor arguments: ${constructorArgs}`);
      } else {
          throw new Error('Not a supported network');
      }

    
  
      if (hre.network.config.chainId !== 31337) {
        try {
          const code = await ethers.provider.getCode(address);
          if (code === '0x') {
            console.log(`${name} contract deployment has not completed. waiting to verify...`);

          }
          await hre.run('verify:verify', {
            address: address,
            contract: `contracts/${name}.sol:${name}`,
            constructorArguments: constructorArgs,
          });

        } catch ({ message }) {
          if ((message as string).includes('Reason: Already Verified')) {
            console.log('Reason: Already Verified');
          }
          console.error(message);
        }
      }
    }
  });
