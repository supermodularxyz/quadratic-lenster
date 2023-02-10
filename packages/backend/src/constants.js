import deployments from "../deploys.json" assert { type: "json" };
import curatorAbi from "../abi/Curator.json" assert { type: "json" };
import roundImplementationAbi from "../abi/RoundImplementation.json" assert { type: "json" };

import * as dotenv from "dotenv";

dotenv.config();

export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
export const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || "";
export const AUTOTASK_WEBHOOK = process.env.AUTOTASK_WEBHOOK || "";


export const DEFAULT_AUTOTASK = deployments.AutotaskID;
export const DEFAULT_CURATOR = deployments.Curator;
export const DEFAULT_NOTIFICATION_CHANNEL = deployments.NotificationChannelID;
export const DEFAULT_RELAYER = deployments.RelayerID;
export const DEFAULT_ROUND_IMPLEMENTATION = deployments.RoundImplementation;


export const CURATOR_ABI = curatorAbi;
export const ROUND_IMPLEMENTATION_ABI = roundImplementationAbi;

export const ROUND_IMPLEMENTATION_ADDRESS = process.env.ROUND_IMPLEMENTATION_ADDRESS || '';