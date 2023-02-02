import {
  ADMIN_API_KEY,
  ADMIN_API_SECRET,
  DEFAULT_RELAYER,
} from "./constants.js";
import { AutotaskClient } from "defender-autotask-client";
import {
  SentinelTrigger,
  WebhookTrigger,
} from "defender-autotask-client/lib/models/autotask.js";
import inquirer, { Question } from "inquirer";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new AutotaskClient(creds);

const relayerQuestion: Question = {
  type: "input",
  name: "relayer",
  message: "Provide relayer ID",
  default: DEFAULT_RELAYER,
};

const nameQuestion: Question = {
  type: "input",
  name: "name",
  message: "Which name do you want to use for this autotask?",
  default: "test autotask",
};

const prompt = async () => {
  inquirer
    .prompt([nameQuestion, relayerQuestion])
    .then((answers) => {
      createTask(answers["name"], answers["relayer"]);
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
};

const createTask = async (name: string, relayer: string) => {
  const config = {
    name,
    encodedZippedCode: await client.getEncodedZippedCodeFromFolder(
      "./build/relay/"
    ),
    paused: false,
    trigger: { type: "webhook" } as WebhookTrigger,
    relayerId: relayer,
  };

  await client
    .create(config)
    .then((res) => {
      console.log(`Created autotask: `);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
};

const createAutotask = async () => {
  await prompt();
};

createAutotask();
