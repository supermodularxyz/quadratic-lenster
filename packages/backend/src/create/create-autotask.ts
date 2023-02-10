import { AutotaskClient } from "defender-autotask-client";
import { ADMIN_API_SECRET, ADMIN_API_KEY, } from "../constants.js";
import { SentinelTrigger } from "defender-autotask-client/lib/models/autotask.js";

const credentials = {
  apiKey: ADMIN_API_KEY,
  apiSecret: ADMIN_API_SECRET,
};

export const createTask = async (name: string, file: string, relayerId: string) => {
  const client = new AutotaskClient(credentials);

  return await client
    .create({
      name,
      encodedZippedCode: await client.getEncodedZippedCodeFromFolder(
        `./build/relay/${file}`,
      ),
      relayerId,
      paused: false,
      trigger: { type: "sentinel" } as SentinelTrigger,

    })
    .then((res) => {
      console.log("Created autotask", name, "with id", res.autotaskId);
      return res;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
};
