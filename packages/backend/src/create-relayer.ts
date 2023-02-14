import {
  DEFENDER_ADMIN_API_KEY,
  DEFENDER_ADMIN_API_SECRET,
  DEFAULT_ROUND_IMPLEMENTATION,
} from "./constants.js";
import {RelayClient} from "defender-relay-client";
import inquirer, {Question} from "inquirer";

const creds = {apiKey: DEFENDER_ADMIN_API_KEY, apiSecret: DEFENDER_ADMIN_API_SECRET};
const client = new RelayClient(creds);

const nameQuestion: Question = {
  type: "input",
  name: "name",
  message: "Which name do you want to use for this autotask?",
};

const allowlistQuestion: Question = {
  type: "input",
  name: "allowlist",
  message: "What is the address of the RoundImplementation?",
  default: DEFAULT_ROUND_IMPLEMENTATION,
};

const prompt = async () => {
  inquirer
    .prompt([nameQuestion, allowlistQuestion])
    .then((answers) => {
      createRelayer(answers["name"], answers["allowlist"]);
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
};

const createRelayer = async (name: string, roundAddress: string) => {
  await client
    .create({
      name,
      network: "mumbai",
      minBalance: BigInt(1e17).toString(),
      policies: {
        whitelistReceivers: [roundAddress],
      },
    })
    .then((res) => {
      console.log(`Created relayer: `);
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
