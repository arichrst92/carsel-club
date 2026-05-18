/**
 * Profile-related queries.
 */

import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  tierDefinitions,
  users,
} from "@/lib/db/schema";

export async function getProfileData(userId: string) {
  const [profile] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      currentTierId: users.currentTierId,
      createdAt: users.createdAt,
      tierName: tierDefinitions.name,
      tierMinPoints: tierDefinitions.minPoints,
      tierMinMatches: tierDefinitions.minMatches,
      tierColor: tierDefinitions.color,
      tierOrder: tierDefinitions.displayOrder,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) return null;

  // Count sessions hosted
  const [{ value: hostedCount }] = await db
    .select({ value: count() })
    .from(sessions)
    .where(eq(sessions.hostId, userId));

  // All tier definitions for journey
  const allTiers = await db.select().from(tierDefinitions).orderBy(tierDefinitions.displayOrder);

  return { ...profile, hostedCount, allTiers };
}
