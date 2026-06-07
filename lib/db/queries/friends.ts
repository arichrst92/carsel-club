/**
 * Friendship queries.
 * Friendships stored canonically (userIdLo < userIdHi alphabetically).
 */

import { and, eq, or, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  friendRequests,
  friendships,
  tierDefinitions,
  users,
} from "@/lib/db/schema";
import type { RelationshipState } from "@/components/friends/FriendRequestButton";

function canonical(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function listFriendsForUser(userId: string) {
  const rows = await db
    .select({
      friendshipId: friendships.id,
      userIdLo: friendships.userIdLo,
      userIdHi: friendships.userIdHi,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .where(or(eq(friendships.userIdLo, userId), eq(friendships.userIdHi, userId)));

  const friendIds = rows.map((r) =>
    r.userIdLo === userId ? r.userIdHi : r.userIdLo
  );

  if (friendIds.length === 0) return [];

  const friendUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      avatarUrl: users.avatarUrl,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      tierName: tierDefinitions.name,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(
      or(...friendIds.map((id) => eq(users.id, id)))
    );

  // Sort by total points desc
  return friendUsers.sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  const [lo, hi] = canonical(userIdA, userIdB);
  const [row] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(eq(friendships.userIdLo, lo), eq(friendships.userIdHi, hi)))
    .limit(1);
  return !!row;
}

export async function countFriends(userId: string): Promise<number> {
  const rows = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(or(eq(friendships.userIdLo, userId), eq(friendships.userIdHi, userId)));
  return rows.length;
}

export { canonical as canonicalPair };

/**
 * Resolve the friendship relationship between `viewerId` and `targetId`
 * for use by the public profile FriendRequestButton.
 *
 * Priority order:
 *   1. self                        → viewing own profile
 *   2. friends                     → already in friendships table
 *   3. incoming  (target → viewer) → there's a pending request that the
 *                                    viewer can accept
 *   4. outgoing  (viewer → target) → viewer has sent a pending request
 *   5. none                        → no relationship yet
 */
export async function getRelationshipState(
  viewerId: string,
  targetId: string
): Promise<RelationshipState> {
  if (viewerId === targetId) return { kind: "self" };

  if (await areFriends(viewerId, targetId)) {
    return { kind: "friends" };
  }

  const [req] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "pending"),
        or(
          and(
            eq(friendRequests.fromUserId, viewerId),
            eq(friendRequests.toUserId, targetId)
          ),
          and(
            eq(friendRequests.fromUserId, targetId),
            eq(friendRequests.toUserId, viewerId)
          )
        )
      )
    )
    .limit(1);

  if (!req) return { kind: "none" };
  if (req.fromUserId === viewerId) {
    return { kind: "outgoing", requestId: req.id };
  }
  return { kind: "incoming", requestId: req.id };
}
