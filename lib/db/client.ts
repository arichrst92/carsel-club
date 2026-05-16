/**
 * Postgres connection — Drizzle + postgres-js.
 *
 * Single shared connection pool, reused across requests.
 * Use this from Server Actions, Route Handlers, Server Components.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL not set. Format: postgres://user:pass@host:port/dbname"
  );
}

// In dev, Next.js HMR can create multiple instances. Cache in global.
const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._pgClient ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    prepare: false, // recommended for serverless / connection poolers
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgClient = client;
}

export const db = drizzle(client, { schema });

// Re-export schema for convenience
export * as schema from "./schema";
