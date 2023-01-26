import { ADMIN_API_KEY, ADMIN_API_SECRET } from "./constants.js";
import { SentinelClient } from "defender-sentinel-client";
import inquirer, { Question } from "inquirer";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new SentinelClient(creds);

const emailQuestion: Question = {
  type: "input",
  name: "email",
  message: "Which email do you want to receive notifications on?",
};

const labelQuestion: Question = {
  type: "input",
  name: "label",
  message: "Which label do you want to use for this email?",
};

const prompt = async () => {
  inquirer
    .prompt([emailQuestion, labelQuestion])
    .then((answers) => {
      createChannel(answers["label"], answers["email"]);
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
};

const createChannel = async (label: string, email: string) => {
  await client
    .createNotificationChannel({
      type: "email",
      name: label,
      config: {
        emails: [email],
      },
      paused: false,
    })
    .then((res) => {
      console.log(`Created email channel: `);
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
