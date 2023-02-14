import roundImplementationAbi from "../abi/RoundImplementation.json" assert {type: "json"};

import * as dotenv from "dotenv";

dotenv.config();

export const DEFENDER_ADMIN_API_KEY = process.env.DEFENDER_ADMIN_API_KEY || "";
export const DEFENDER_ADMIN_API_SECRET = process.env.DEFENDER_ADMIN_API_SECRET || "";


export const DEFAULT_AUTOTASK = deployments.AutotaskID;
export const DEFAULT_NOTIFICATION_CHANNEL = deployments.NotificationChannelID;
export const DEFAULT_ROUND_IMPLEMENTATION = deployments.RoundImplementation;


export const ROUND_IMPLEMENTATION_ABI = roundImplementationAbi;

export const ROUND_IMPLEMENTATION_ADDRESS = process.env.ROUND_IMPLEMENTATION_ADDRESS || '';

export const RELAYER_ID = process.env.RELAYER_ID || '';