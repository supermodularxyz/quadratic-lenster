import * as dotenv from "dotenv";

dotenv.config();

export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
export const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || "";
