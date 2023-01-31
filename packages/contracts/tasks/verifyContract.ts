import { task } from "hardhat/config";

import * as addresses from "../deployments/deployments-polygon-mumbai.json";
import { lensMumbaiAddresses, lensPolygonAddresses } from "../test/utils/constants";

type Contracts = "QuadraticFundingCurator" | "QuadraticVoteCollectModule";

task("verifyContract", "verify")
  .addOptionalParam("grantsRound", "The address of the active Grants Round")
  .addOptionalParam("lensHub", "The address of the LensHub")
  .addOptionalParam("moduleGlobals", "The address of ModuleGlobals")
  .setAction(async ({ grantsRound, lensHub, moduleGlobals }, { ethers }) => {
    const [admin] = await ethers.getSigners();

    const contracts: Record<Contracts, string> = {
      QuadraticFundingCurator: addresses.QuadraticFundingCurator,
      QuadraticVoteCollectModule: addresses.QuadraticVoteCollectModule,
    };

    let constructorAddresses;

    if (hre.network.name == "polygon-mainnet") {
      constructorAddresses = lensPolygonAddresses;
    } else if (hre.network.name == "polygon-mumbai") {
      constructorAddresses = lensMumbaiAddresses;
    } else {
      constructorAddresses = lensPolygonAddresses;
    }

    const constructorArguments: Record<Contracts, string[]> = {
      QuadraticFundingCurator: [
        grantsRound ? grantsRound : "0xCb964E66dD4868e7C71191D3A1353529Ad1ED2F5",
        admin.address,
      ],
      QuadraticVoteCollectModule: [
        lensHub ? lensHub : constructorAddresses.lensHubImplementation,
        moduleGlobals ? moduleGlobals : constructorAddresses.moduleGlobals,
      ],
    };

    for (const [name, address] of Object.entries(contracts)) {
      console.log(`Starting verification of ${name}`);
      console.log(name, address);

      const constructorArgs = Object.entries(constructorArguments).find((entry) => entry[0] === name)?.[1];
      console.log(`Constructor arguments: ${constructorArgs}`);

      if (hre.network.config.chainId !== 31337) {
        try {
          const code = await ethers.provider.getCode(address);
          if (code === "0x") {
            console.log(`${name} contract deployment has not completed. waiting to verify...`);
          }
          await hre.run("verify:verify", {
            address: address,
            contract: `contracts/${name}.sol:${name}`,
            constructorArguments: constructorArgs,
          });
        } catch ({ message }) {
          if ((message as string).includes("Reason: Already Verified")) {
            console.log("Reason: Already Verified");
          }
          console.error(message);
        }
      }
    }
  });
