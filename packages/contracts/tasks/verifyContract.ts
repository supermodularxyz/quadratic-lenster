import { task } from "hardhat/config";

import * as addresses from "../deployments/deployments-polygon-mumbai.json";
import { lensPolygonAddresses, lensSandboxAddresses } from "../test/utils/constants";

type Contracts = "QuadraticVoteCollectModule";

task("verifyContract", "verify")
  .addOptionalParam("lensHub", "The address of the LensHub")
  .addOptionalParam("moduleGlobals", "The address of ModuleGlobals")
  .setAction(async ({ lensHub, moduleGlobals }, { ethers }) => {
    const contracts: Record<Contracts, string> = {
      QuadraticVoteCollectModule: addresses.QuadraticVoteCollectModule,
    };

    let constructorAddresses;

    if (hre.network.name == "polygon-mainnet") {
      constructorAddresses = lensPolygonAddresses;
    } else if (hre.network.name == "sandbox-mumbai") {
      constructorAddresses = lensSandboxAddresses;
    } else {
      console.error("Unsupported network");
      throw Error("Unsupported network");
    }

    const constructorArguments: Record<Contracts, string[]> = {
      QuadraticVoteCollectModule: [
        lensHub ? lensHub : constructorAddresses.LensHubProxy,
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
