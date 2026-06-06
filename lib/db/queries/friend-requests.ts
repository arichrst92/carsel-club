/**
 * Queries untuk friend_requests (Sprint 22).
 */

import { and, eq, count, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  friendRequests,
  tierDefinitions,
  users,
} from "@/lib/db/schema";

export type FriendRequestRow = {
  id: string;
  otherUserId: string;
  message: string | null;
  createdAt: Date;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  totalPoints: number;
  totalMatches: number;
  tierName: string | null;
  tierColor: string | null;
};

/**
 * Incoming pending requests untuk userId (toUserId = userId).
 */
export async function listIncomingFriendRequests(
  userId: string
): Promise<FriendRequestRow[]> {
  const rows = await db
    .select({
      id: friendRequests.id,
      otherUserId: friendRequests.fromUserId,
      message: friendRequests.message,
      createdAt: friendRequests.createdAt,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
    })
    .from(friendRequests)
    .innerJoin(users, eq(users.id, friendRequests.fromUserId))
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(
      and(
        eq(friendRequests.toUserId, userId),
        eq(friendRequests.status, "pending")
      )
    )
    .orderBy(desc(friendRequests.createdAt));
  return rows;
}

/**
 * Outgoing pending requests untuk userId (fromUserId = userId).
 */
export async function listOutgoingFriendRequests(
  userId: string
): Promise<FriendRequestRow[]> {
  const rows = await db
    .select({
      id: friendRequests.id,
      otherUserId: friendRequests.toUserId,
      message: friendRequests.message,
      createdAt: friendRequests.createdAt,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
    })
    .from(friendRequests)
    .innerJoin(users, eq(users.id, friendRequests.toUserId))
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(
      and(
        eq(friendRequests.fromUserId, userId),
        eq(friendRequests.status, "pending")
      )
    )
    .orderBy(desc(friendRequests.createdAt));
  return rows;
}

export async function countIncomingPending(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.toUserId, userId),
        eq(friendRequests.status, "pending")
      )
    );
  return row?.value ?? 0;
}

/**
 * Bidirectional check — apakah ada pending request antara 2 user (either direction).
 */
export async function findPendingBetween(
  aId: string,
  bId: string
): Promise<{ id: string; fromUserId: string; toUserId: string } | null> {
  const [row] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
    })
    .from(friendRequests)
    .where(eq(friendRequests.status, "pending"))
    .limit(50); // soft limit
  return (
    row && rowMatches(row, aId, bId)
      ? row
      : (await listAllPendingBetween(aId, bId)) ?? null
  );
}

function rowMatches(
  r: { fromUserId: string; toUserId: string },
  aId: string,
  bId: string
): boolean {
  return (
    (r.fromUserId === aId && r.toUserId === bId) ||
    (r.fromUserId === bId && r.toUserId === aId)
  );
}

async function listAllPendingBetween(
  aId: string,
  bId: string
): Promise<{ id: string; fromUserId: string; toUserId: string } | null> {
  // Fallback explicit OR query
  const rows = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
    })
    .from(friendRequests)
    .where(eq(friendRequests.status, "pending"));
  return rows.find((r) => rowMatches(r, aId, bId)) ?? null;
}
