import { ContractFactory } from 'ethers';
import * as fs from 'fs';
import { task } from 'hardhat/config';

import { lensMumbaiAddresses, lensPolygonAddresses } from './../test/utils/constants';

type Contracts = 'QuadraticFundingCurator' | 'QuadraticVoteCollectModule';

task('deploy', 'Deploy contracts and verify')
  .addOptionalParam('grantsRound', 'The address of the active Grants Round')
  .addOptionalParam('lensHub', 'The address of the LensHub')
  .addOptionalParam('moduleGlobals', 'The address of ModuleGlobals')
  .setAction(async ({ grantsRound, lensHub, moduleGlobals }, { ethers }) => {
    const [admin] = await ethers.getSigners();
    let addresses;

    if (hre.network.name == 'polygon-mainnet') {
      addresses = lensPolygonAddresses;
    } else if (hre.network.name == 'polygon-mumbai') {
      addresses = lensMumbaiAddresses;
    } else {
      addresses = lensPolygonAddresses;
    }

    const contracts: Record<Contracts, ContractFactory> = {
      QuadraticFundingCurator: await ethers.getContractFactory('QuadraticFundingCurator'),
      QuadraticVoteCollectModule: await ethers.getContractFactory('QuadraticVoteCollectModule'),
    };

    const deployments: Record<Contracts, string> = {
      QuadraticFundingCurator: '',
      QuadraticVoteCollectModule: '',
    };

    const constructorArguments: Record<Contracts, string[]> = {
      QuadraticFundingCurator: [
        grantsRound ? grantsRound : '0xCb964E66dD4868e7C71191D3A1353529Ad1ED2F5',
        admin.address,
      ],
      QuadraticVoteCollectModule: [
        lensHub ? lensHub : addresses.lensHubImplementation,
        moduleGlobals ? moduleGlobals : addresses.moduleGlobals,
      ],
    };

    const toFile = (path: string, deployment: Record<Contracts, string>) => {
      fs.writeFileSync(path, JSON.stringify(deployment), { encoding: 'utf-8' });
    };

    for (const [name, contract] of Object.entries(contracts)) {
      console.log(`Starting deployment of ${name}`);
      const factory = contract;

      const constructorArgs = Object.entries(constructorArguments).find((entry) => entry[0] === name)?.[1];
      console.log(`Constructor arguments: ${constructorArgs}`);

      const instance = constructorArgs ? await factory.deploy(...constructorArgs) : await factory.deploy();

      await instance.deployed();

      console.log(`${name} is deployed to address: ${instance.address}`);

      deployments[name as Contracts] = instance.address;

      toFile(`deployments/deployments-${hre.network.name}.json`, deployments);

      if (hre.network.name !== ('localhost' || 'hardhat')) {
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
