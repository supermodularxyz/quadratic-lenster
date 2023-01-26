import { ADMIN_API_KEY, ADMIN_API_SECRET } from "./constants.js";
import RoundImplementationAbi from "../abi/RoundImplementation.json" assert { type: "json" };
import { CreateSentinelRequest, SentinelClient } from "defender-sentinel-client";
import inquirer, { Question } from "inquirer";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new SentinelClient(creds);

const contractQuestion: Question = {
    type: "input",
    name: "address",
    message: "What is the address of the RoundImplementation?",
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
  };

  const prompt = async () => {
    inquirer
      .prompt([nameQuestion, contractQuestion, notificationQuestion])
      .then((answers) => {
        sendCreateSentinelRequest(answers["name"], answers["address"], answers["notificationID"]);
      })
      .catch((error) => {
        if (error.isTtyError) {
          console.error(error.isTtyError);
        } else {
          console.error(error);
        }
      });
  };

  const sendCreateSentinelRequest = async (name: string, address: string, notificationID: string) => {
    await client
      .create({
        type: "BLOCK",
        network: 'mumbai',
        confirmLevel: 1, // if not set, we pick the blockwatcher for the chosen network with the lowest offset
        name,
        addresses: [address],
        abi: JSON.stringify(RoundImplementationAbi),
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