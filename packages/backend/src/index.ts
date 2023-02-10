import {SentinelClient} from "defender-sentinel-client";
import {AutotaskClient} from "defender-autotask-client";
import {ADMIN_API_KEY, ADMIN_API_SECRET, ROUND_IMPLEMENTATION_ADDRESS} from "./constants.js";
import {createTask} from "./create/create-autotask.js";
import {createSentinel} from "./create/create-sentinel.js";

const credentials = {
  apiKey: ADMIN_API_KEY,
  apiSecret: ADMIN_API_SECRET,
};

const name = 'ql - on vote received';

const autotaskClient = new AutotaskClient(credentials);
export const sentinelClient = new SentinelClient(credentials);
const setup = async () => {
  // Remove all old auto tasks and sentinels
  const oldAutoTasks = await autotaskClient.list();
  const oldSentinels = await sentinelClient.list();

  const tasksToDelete = oldAutoTasks.items.filter(x => x.name === name);
  const sentinelsToDelete = oldSentinels.items.filter(x => x.name === name);
  await Promise.all([
    ...tasksToDelete.map((x) =>
      autotaskClient.delete(x.autotaskId).then((res) => {
        console.log(res.message);
      }),
    ),
    ...sentinelsToDelete.map((x) =>
      sentinelClient.delete(x.subscriberId).then((res) => {
        console.log(res.message);
      }),
    ),
  ]);

  // On allowlist created
  const autoTaskOnAllowlistCreated = await createTask(
    name,
    "vote-received",
    "8e42d8c4-1cf0-4cac-863b-fce50420997e"
  );
  if (!autoTaskOnAllowlistCreated) {
    console.log(autoTaskOnAllowlistCreated);
    throw new Error("Could not create autoTask for vote received");
  }
  await createSentinel({
    name,
    address: ROUND_IMPLEMENTATION_ADDRESS,
    functionConditions: [{functionSignature: 'vote(bytes[])'}],
    autotaskID: autoTaskOnAllowlistCreated.autotaskId,
  });
}

setup();