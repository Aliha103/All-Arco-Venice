import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Only configure WebSocket for production Neon connections
if (process.env.DATABASE_URL?.includes('neon.tech')) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for Neon connections
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? {
    rejectUnauthorized: false
  } : false
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });
