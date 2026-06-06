/**
 * Queries untuk user_blocks + follows (Sprint 23).
 */

import { and, count, eq, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userBlocks, follows } from "@/lib/db/schema";

export async function isUserBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const [row] = await db
    .select({ blockerId: userBlocks.blockerId })
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId)
      )
    )
    .limit(1);
  return !!row;
}

/**
 * Returns true kalau salah satu user block yang lain (either direction).
 * Useful untuk hide content kalau ada block relation di mana pun.
 */
export async function hasBlockRelation(
  userA: string,
  userB: string
): Promise<boolean> {
  const [row] = await db
    .select({ blockerId: userBlocks.blockerId })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerId, userA),
          eq(userBlocks.blockedId, userB)
        ),
        and(
          eq(userBlocks.blockerId, userB),
          eq(userBlocks.blockedId, userA)
        )
      )
    )
    .limit(1);
  return !!row;
}

export async function listBlockedUserIds(
  blockerId: string
): Promise<string[]> {
  const rows = await db
    .select({ blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, blockerId));
  return rows.map((r) => r.blockedId);
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const [row] = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    )
    .limit(1);
  return !!row;
}

export async function countFollowers(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.followingId, userId));
  return row?.value ?? 0;
}

export async function countFollowing(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return row?.value ?? 0;
}
