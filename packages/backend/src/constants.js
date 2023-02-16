import * as dotenv from "dotenv";

dotenv.config();

export const DEFENDER_ADMIN_API_KEY = process.env.DEFENDER_ADMIN_API_KEY || "";
export const DEFENDER_ADMIN_API_SECRET = process.env.DEFENDER_ADMIN_API_SECRET || "";


export const ROUND_IMPLEMENTATION_ADDRESS = process.env.ROUND_IMPLEMENTATION_ADDRESS || '';

export const RELAYER_ID = process.env.RELAYER_ID || '';