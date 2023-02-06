import { ContractFactory } from "ethers";
import * as fs from "fs";
import { task } from "hardhat/config";

import GRANTS_MUMBAI from "../deployments/grants-polygon-mumbai.json";
import LENS_MUMBAI from "../deployments/lens-polygon-mumbai.json";
import LENS_POLYGON from "../deployments/lens-polygon.json";

type Contracts = "QuadraticFundingCurator" | "QuadraticVoteCollectModule";

task("deploy", "Deploy contracts and verify").setAction(async (_, { ethers }) => {
  const [admin] = await ethers.getSigners();
  let addresses;

  if (hre.network.name == "polygon-mainnet") {
    addresses = LENS_POLYGON;
  } else if (hre.network.name == "polygon-mumbai") {
    addresses = LENS_MUMBAI;
  } else {
    addresses = LENS_POLYGON;
  }

  const contracts: Record<Contracts, ContractFactory> = {
    QuadraticFundingCurator: await ethers.getContractFactory("QuadraticFundingCurator"),
    QuadraticVoteCollectModule: await ethers.getContractFactory("QuadraticVoteCollectModule"),
  };

  const deployments: Record<Contracts, string> = {
    QuadraticFundingCurator: "",
    QuadraticVoteCollectModule: "",
  };

  const constructorArguments: Record<Contracts, string[]> = {
    QuadraticFundingCurator: [GRANTS_MUMBAI.GrantsRound, admin.address],
    QuadraticVoteCollectModule: [addresses.LensHubProxy, addresses.moduleGlobals],
  };

  const toFile = (path: string, deployment: Record<Contracts, string>) => {
    fs.writeFileSync(path, JSON.stringify(deployment), { encoding: "utf-8" });
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

    if (hre.network.name !== ("localhost" || "hardhat")) {
      try {
        const code = await instance.instance?.provider.getCode(instance.address);
        if (code === "0x") {
          console.log(`${instance.name} contract deployment has not completed. waiting to verify...`);
          await instance.instance?.deployed();
        }

        await hre.run("verify:verify", {
          address: instance.address,
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
