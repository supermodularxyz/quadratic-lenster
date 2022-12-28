
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
//import { lensMumbaiAddresses } from "../utils/constants";
import { ethers, network } from "hardhat";

import { lensMumbaiAddresses } from "../utils/constants";
import LensHub from "../../importedABI/LensHub.json"
import { expect } from "chai";


export async function deployLensMumbaiFixture() {
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
            blockNumber: 30259508 /* Sep 3rd, 2022 */,
          },
        },
      ],
    });

  
  const lensMumbai = new ethers.Contract(lensMumbaiAddresses.LensHubProxy, LensHub.abi, admin)
  const tx = await lensMumbai.getFollowNFTImpl();

  expect(tx).to.equal("0x1A2BB1bc90AA5716f5Eb85FD1823338BD1b6f772")

  return { lensMumbai };
}
