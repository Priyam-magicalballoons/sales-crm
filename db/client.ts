import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

export const sqlClient = neon(process.env.DATABASE_URL!);

export const db = drizzle(sqlClient);
