import { ADMIN_API_KEY, ADMIN_API_SECRET } from "./constants.js";
import { SentinelClient } from "defender-sentinel-client";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new SentinelClient(creds);

const listNotificationChannels = async () => {
  await client.listNotificationChannels().then((res) => console.log(res));
};

listNotificationChannels();
