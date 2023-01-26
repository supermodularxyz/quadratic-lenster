import {
  ADMIN_API_KEY,
  ADMIN_API_SECRET,
  AUTOTASK_WEBHOOK,
} from "./constants.js";
import { SentinelClient } from "defender-sentinel-client";
import inquirer, { Question } from "inquirer";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new SentinelClient(creds);

const urlQuestion: Question = {
  type: "input",
  name: "url",
  message: "Please provide webhook to trigger",
  default: AUTOTASK_WEBHOOK,
};

const nameQuestion: Question = {
  type: "input",
  name: "name",
  message: "Which name do you want to use for this notification?",
  default: "test webhook + email",
};

const prompt = async () => {
  inquirer
    .prompt([nameQuestion, urlQuestion])
    .then((answers) => {
      createChannel(answers["name"], answers["url"]);
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
};

const createChannel = async (name: string, url: string) => {
  await client
    .createNotificationChannel({
      type: "webhook",
      name,
      config: { url },
      paused: false,
    })
    .then((res) => {
      console.log(`Created notification webhook channel: `);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
};

const createNotificationChannel = async () => {
  await prompt();
};

createNotificationChannel();
