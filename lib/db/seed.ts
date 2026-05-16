/**
 * Seed script — initial tier_definitions data.
 *
 * Run: npx tsx lib/db/seed.ts
 * (atau buat script di package.json)
 */

import { db } from "./client";
import { tierDefinitions } from "./schema";

async function seed() {
  console.log("Seeding tier_definitions...");

  // Upsert pattern: insert, ignore on conflict
  await db
    .insert(tierDefinitions)
    .values([
      { id: 1, name: "Rookie",    minPoints: 0,    minMatches: 0,   icon: "rookie",    color: "#94a3b8", displayOrder: 1 },
      { id: 2, name: "Bronze",    minPoints: 50,   minMatches: 10,  icon: "bronze",    color: "#cd7f32", displayOrder: 2 },
      { id: 3, name: "Silver",    minPoints: 150,  minMatches: 25,  icon: "silver",    color: "#c0c0c0", displayOrder: 3 },
      { id: 4, name: "Gold",      minPoints: 300,  minMatches: 50,  icon: "gold",      color: "#ffd700", displayOrder: 4 },
      { id: 5, name: "Platinum",  minPoints: 600,  minMatches: 100, icon: "platinum",  color: "#e5e4e2", displayOrder: 5 },
      { id: 6, name: "Master",    minPoints: 1000, minMatches: 200, icon: "master",    color: "#9333ea", displayOrder: 6 },
    ])
    .onConflictDoNothing();

  console.log("Seed done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
