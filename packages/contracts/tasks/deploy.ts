import { lensMumbaiAddresses, lensPolygonAddresses } from './../test/utils/constants';
import { ContractFactory } from 'ethers';
import { task } from 'hardhat/config';
import * as fs from 'fs';

type Contracts = 'QuadraticFundingCurator' | 'QuadraticVoteCollectModule';

task('deploy', 'Deploy contracts and verify')
  .addOptionalParam('grantsRound', 'The address of the active Grants Round')
  .addOptionalParam('lensHub', 'The address of the LensHub')
  .addOptionalParam('moduleGlobals', 'The address of ModuleGlobals')
  .setAction(async ({ grantsRound, lensHub, moduleGlobals }, { ethers }) => {
    const [admin] = await ethers.getSigners();

    const contracts: Record<Contracts, ContractFactory> = {
      QuadraticFundingCurator: await ethers.getContractFactory('QuadraticFundingCurator'),
      QuadraticVoteCollectModule: await ethers.getContractFactory('QuadraticVoteCollectModule'),
    };

    const deployments: Record<Contracts, string> = {
      QuadraticFundingCurator: '',
      QuadraticVoteCollectModule: '',
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

   const toFile = (path: string, deployment: Record<Contracts, string>) => {
      fs.writeFileSync(path, JSON.stringify(deployment), { encoding: 'utf-8' });
    }

    for (const [name, contract] of Object.entries(contracts)) {
      console.log(`Starting deployment of ${name}`);
      const factory = contract;
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

      const instance = constructorArgs ? await factory.deploy(...constructorArgs) : await factory.deploy();
      
      await instance.deployed();

      console.log(`${name} is deployed to address: ${instance.address}`);
      
      deployments[name as Contracts] = instance.address;
    
      toFile(`deployments/deployments-${hre.network.name}.json`, deployments);
  
      if (hre.network.config.chainId !== 31337) {
        try {
          const code = await instance.instance?.provider.getCode(instance.address);
          if (code === '0x') {
            console.log(`${instance.name} contract deployment has not completed. waiting to verify...`);
            await instance.instance?.deployed();
          }

          await hre.run('verify:verify', {
            address: instance.address,
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
