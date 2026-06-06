/**
 * Queries untuk session_join_requests (Sprint 20).
 */

import { and, eq, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessionJoinRequests,
  tierDefinitions,
  users,
} from "@/lib/db/schema";

export type PendingJoinRequest = {
  id: string;
  userId: string;
  requestedAt: Date;
  message: string | null;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  totalPoints: number;
  totalMatches: number;
  tierName: string | null;
  tierColor: string | null;
};

export async function listPendingJoinRequests(
  sessionId: string
): Promise<PendingJoinRequest[]> {
  const rows = await db
    .select({
      id: sessionJoinRequests.id,
      userId: sessionJoinRequests.userId,
      requestedAt: sessionJoinRequests.requestedAt,
      message: sessionJoinRequests.message,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
    })
    .from(sessionJoinRequests)
    .innerJoin(users, eq(users.id, sessionJoinRequests.userId))
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(
      and(
        eq(sessionJoinRequests.sessionId, sessionId),
        eq(sessionJoinRequests.status, "pending")
      )
    );
  return rows;
}

export async function countPendingJoinRequests(
  sessionId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(sessionJoinRequests)
    .where(
      and(
        eq(sessionJoinRequests.sessionId, sessionId),
        eq(sessionJoinRequests.status, "pending")
      )
    );
  return row?.value ?? 0;
}

export async function getRequestStatusForUser(
  sessionId: string,
  userId: string
): Promise<"pending" | "accepted" | "rejected" | null> {
  const [row] = await db
    .select({ status: sessionJoinRequests.status })
    .from(sessionJoinRequests)
    .where(
      and(
        eq(sessionJoinRequests.sessionId, sessionId),
        eq(sessionJoinRequests.userId, userId)
      )
    )
    .limit(1);
  return row?.status ?? null;
}
