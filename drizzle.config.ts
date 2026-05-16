import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local for drizzle-kit CLI usage
config({ path: ".env.local" });

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
