import {SentinelClient} from "defender-sentinel-client";
import {
  EventCondition,
  FunctionCondition,
} from "defender-sentinel-client/lib/models/subscriber.js";
import {DEFENDER_ADMIN_API_KEY, DEFENDER_ADMIN_API_SECRET} from "../constants.js";


const credentials = {
  apiKey: DEFENDER_ADMIN_API_KEY,
  apiSecret: DEFENDER_ADMIN_API_SECRET,
};

const client = new SentinelClient(credentials);

export const createSentinel = async ({
                                       address,
                                       name,
                                       autotaskID,
                                       functionConditions = [],
                                       eventConditions = [],
                                     }: {
  name: string;
  address: string;
  autotaskID: string;
  eventConditions?: EventCondition[];
  functionConditions?: FunctionCondition[];
}) => {
  await client
    .create({
      type: "BLOCK",
      network: "mumbai",
      confirmLevel: 1, // if not set, we pick the blockwatcher for the chosen network with the lowest offset
      name,
      addresses: [address],
      abi: abi,
      paused: false,
      eventConditions,
      functionConditions,
      alertTimeoutMs: 0,
      notificationChannels: [],
      autotaskTrigger: autotaskID,
    })
    .then((res) => {
      console.log(
        `Created sentinel`,
        res.name,
        "- monitoring address",
        address,
        "- linked to autotask",
        autotaskID,
      );
      return res;
    })
    .catch((error) => {
      console.error(error);
    });
};

const abi = `[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"address","name":"voter","type":"address"},{"indexed":false,"internalType":"address","name":"grantAddress","type":"address"},{"indexed":true,"internalType":"bytes32","name":"projectId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"roundAddress","type":"address"}],"name":"Voted","type":"event"},{"inputs":[],"name":"VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"init","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"roundAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"encodedVotes","type":"bytes[]"},{"internalType":"address","name":"relayerAddress","type":"address"}],"name":"vote","outputs":[],"stateMutability":"payable","type":"function"}]`