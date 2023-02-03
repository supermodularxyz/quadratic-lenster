import { ADMIN_API_KEY, ADMIN_API_SECRET } from "./constants.js";
import { AutotaskClient } from "defender-autotask-client";

const creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
const client = new AutotaskClient(creds);

const listAutotasks = async () => {
  await client.list().then((res) => console.log(res));
};

listAutotasks();
