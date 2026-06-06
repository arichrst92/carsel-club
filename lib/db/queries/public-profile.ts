/**
 * Public profile queries (Sprint 12).
 *
 * No-auth lightweight read untuk OG image + public profile landing page.
 */

import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  tierDefinitions,
  sessions,
} from "@/lib/db/schema";

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  tierName: string | null;
  tierColor: string | null;
  tierOrder: number | null;
  hostedCount: number;
  profileVisibility: "public" | "friends" | "private";
};

export async function getPublicProfile(
  userId: string
): Promise<PublicProfile | null> {
  const [row] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
      tierOrder: tierDefinitions.displayOrder,
      profileVisibility: users.profileVisibility,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  const [{ value: hostedCount }] = await db
    .select({ value: count() })
    .from(sessions)
    .where(eq(sessions.hostId, userId));

  return { ...row, hostedCount };
}

export async function getTierByOrder(
  order: number
): Promise<{ id: number; name: string; color: string | null } | null> {
  const [row] = await db
    .select({
      id: tierDefinitions.id,
      name: tierDefinitions.name,
      color: tierDefinitions.color,
    })
    .from(tierDefinitions)
    .where(eq(tierDefinitions.displayOrder, order))
    .limit(1);
  return row ?? null;
}

export async function getTierById(
  id: number
): Promise<{ id: number; name: string; color: string | null; displayOrder: number } | null> {
  const [row] = await db
    .select({
      id: tierDefinitions.id,
      name: tierDefinitions.name,
      color: tierDefinitions.color,
      displayOrder: tierDefinitions.displayOrder,
    })
    .from(tierDefinitions)
    .where(eq(tierDefinitions.id, id))
    .limit(1);
  return row ?? null;
}
