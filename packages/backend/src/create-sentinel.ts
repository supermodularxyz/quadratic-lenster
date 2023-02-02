import {
  ADMIN_API_KEY,
  ADMIN_API_SECRET,
  DEFAULT_ROUND_IMPLEMENTATION,
  DEFAULT_NOTIFICATION_CHANNEL,
  ROUND_IMPLEMENTATION_ABI,
  DEFAULT_AUTOTASK,
  AUTOTASK_WEBHOOK
} from "./constants.js";
import { SentinelClient } from "defender-sentinel-client";
import inquirer, { Question } from "inquirer";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new SentinelClient(creds);

const autotaskQuestion: Question = {
  type: "input",
  name: "autotaskID",
  message: "What is the ID of the AutoTask?",
  default: DEFAULT_AUTOTASK,
};

const contractQuestion: Question = {
  type: "input",
  name: "address",
  message: "What is the address of the RoundImplementation?",
  default: DEFAULT_ROUND_IMPLEMENTATION,
};

const nameQuestion: Question = {
  type: "input",
  name: "name",
  message: "What is the name for this Sentinel?",
};

const notificationQuestion: Question = {
  type: "input",
  name: "notificationID",
  message: "Provide the ID for the notification channel",
  default: DEFAULT_NOTIFICATION_CHANNEL,
};

const prompt = async () => {
  inquirer
    .prompt([nameQuestion, contractQuestion, notificationQuestion, autotaskQuestion])
    .then((answers) => {
      sendCreateSentinelRequest(
        answers["name"],
        answers["address"],
        answers["notificationID"].
        answers["autotaskID"]
      );
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
};

const sendCreateSentinelRequest = async (
  name: string,
  address: string,
  notificationID: string,
  autotaskID: string
) => {
  await client
    .create({
      type: "BLOCK",
      network: "mumbai",
      confirmLevel: 1, // if not set, we pick the blockwatcher for the chosen network with the lowest offset
      name,
      addresses: [address],
      abi: JSON.stringify(ROUND_IMPLEMENTATION_ABI),
      paused: false,
      eventConditions: [],
      functionConditions: [{ functionSignature: "vote(bytes[])" }],
      txCondition: "success",
      alertTimeoutMs: 0,
      notificationChannels: [notificationID],
    })
    .then((res) => {
      console.log(`Created sentinel: `);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
};

const create = async () => {
  await prompt();
};

create();
