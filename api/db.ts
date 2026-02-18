import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

declare global {
  var __db_pool: pg.Pool | undefined;
}

if (!global.__db_pool) {
  global.__db_pool = new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export const db = drizzle(global.__db_pool, { schema });
