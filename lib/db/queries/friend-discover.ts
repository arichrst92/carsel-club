/**
 * Friends Discover query (Sprint 40).
 *
 * Returns suggestion candidates for /friends?tab=discover:
 * 1. Friends-of-friends — users your friends are friends with (not you, not blocked)
 * 2. Recent co-players — users who appeared in same session as you in last 30 days
 *
 * Excludes:
 * - Yourself
 * - Existing friends
 * - Users with pending request from/to you
 * - Users you've blocked OR who blocked you
 * - Users with friend_request_policy = "off"
 *
 * Ordered: highest mutualFriendCount first, then most recent co-player encounter.
 *
 * Refs:
 * - DB: friendships, friend_requests, user_blocks, session_participants,
 *   match_round_sets, sessions
 */

import { and, eq, gte, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  friendships,
  friendRequests,
  sessions,
  sessionParticipants,
  userBlocks,
  users,
} from "@/lib/db/schema";

export type DiscoverSuggestion = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  tierName: string | null;
  mutualFriendCount: number;
  coPlayerSessionCount: number;
};

export async function listDiscoverSuggestions(
  userId: string,
  limit = 20
): Promise<DiscoverSuggestion[]> {
  try {
    return await _listDiscoverSuggestionsImpl(userId, limit);
  } catch (e) {
    console.error("[listDiscoverSuggestions] error:", e);
    return []; // resilient: kalau query gagal, return empty bukan crash page
  }
}

async function _listDiscoverSuggestionsImpl(
  userId: string,
  limit: number
): Promise<DiscoverSuggestion[]> {
  // Build exclusion set: self + friends + pending reqs + blocks
  const excluded = new Set<string>([userId]);

  const friends = await db
    .select({ lo: friendships.userIdLo, hi: friendships.userIdHi })
    .from(friendships)
    .where(
      or(eq(friendships.userIdLo, userId), eq(friendships.userIdHi, userId))
    );
  const myFriendIds = friends.map((f) =>
    f.lo === userId ? f.hi : f.lo
  );
  for (const f of myFriendIds) excluded.add(f);

  const pending = await db
    .select({
      from: friendRequests.fromUserId,
      to: friendRequests.toUserId,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.status, "pending"),
        or(
          eq(friendRequests.fromUserId, userId),
          eq(friendRequests.toUserId, userId)
        )
      )
    );
  for (const p of pending) {
    excluded.add(p.from === userId ? p.to : p.from);
  }

  const blocks = await db
    .select({
      a: userBlocks.blockerId,
      b: userBlocks.blockedId,
    })
    .from(userBlocks)
    .where(
      or(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, userId))
    );
  for (const b of blocks) {
    excluded.add(b.a === userId ? b.b : b.a);
  }

  // 1. Friends-of-friends: count via friendships join from each of my friends
  const mutualCounts = new Map<string, number>();
  if (myFriendIds.length > 0) {
    const fofRows = await db
      .select({
        lo: friendships.userIdLo,
        hi: friendships.userIdHi,
      })
      .from(friendships)
      .where(
        or(
          inArray(friendships.userIdLo, myFriendIds),
          inArray(friendships.userIdHi, myFriendIds)
        )
      );
    for (const f of fofRows) {
      // The "other side" relative to my friend
      const candidates = [f.lo, f.hi];
      for (const c of candidates) {
        if (excluded.has(c)) continue;
        // Only count once per (my-friend, candidate) edge — both endpoints can be a friend
        mutualCounts.set(c, (mutualCounts.get(c) ?? 0) + 1);
      }
    }
  }

  // 2. Recent co-players (last 30 days completed/upcoming sessions)
  const sinceDays = 30;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const myParticipations = await db
    .select({ sessionId: sessionParticipants.sessionId })
    .from(sessionParticipants)
    .innerJoin(sessions, eq(sessions.id, sessionParticipants.sessionId))
    .where(
      and(
        eq(sessionParticipants.userId, userId),
        gte(sessions.scheduledAt, since)
      )
    );
  const mySessionIds = [
    ...new Set(myParticipations.map((p) => p.sessionId)),
  ];
  const coPlayerCounts = new Map<string, number>();
  if (mySessionIds.length > 0) {
    const coRows = await db
      .select({
        userId: sessionParticipants.userId,
        sessionId: sessionParticipants.sessionId,
      })
      .from(sessionParticipants)
      .where(
        and(
          inArray(sessionParticipants.sessionId, mySessionIds),
          ne(sessionParticipants.userId, userId),
          sql`${sessionParticipants.userId} IS NOT NULL`
        )
      );
    const seen = new Set<string>();
    for (const r of coRows) {
      if (!r.userId) continue;
      if (excluded.has(r.userId)) continue;
      const key = `${r.userId}:${r.sessionId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      coPlayerCounts.set(
        r.userId,
        (coPlayerCounts.get(r.userId) ?? 0) + 1
      );
    }
  }

  // Combine candidate set
  const candidateIds = new Set<string>([
    ...mutualCounts.keys(),
    ...coPlayerCounts.keys(),
  ]);
  if (candidateIds.size === 0) return [];

  // Fetch user details + tier name
  const idList = [...candidateIds];
  const detailRows = await db.execute<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    city: string | null;
    tier_name: string | null;
    friend_request_policy: "anyone" | "friends_of_friends" | "off";
    deleted_at: Date | null;
  }>(
    sql`
      SELECT u.id, u.display_name, u.avatar_url, u.city,
             td.name AS tier_name,
             u.friend_request_policy,
             u.deleted_at
      FROM users u
      LEFT JOIN tier_definitions td ON td.id = u.current_tier_id
      WHERE u.id = ANY(${idList})
    `
  );

  const candidates: DiscoverSuggestion[] = [];
  for (const r of detailRows) {
    if (r.deleted_at !== null) continue;
    if (r.friend_request_policy === "off") continue;
    candidates.push({
      id: r.id,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      city: r.city,
      tierName: r.tier_name,
      mutualFriendCount: mutualCounts.get(r.id) ?? 0,
      coPlayerSessionCount: coPlayerCounts.get(r.id) ?? 0,
    });
  }

  // Order: more mutual first, then more co-play
  candidates.sort((a, b) => {
    if (b.mutualFriendCount !== a.mutualFriendCount) {
      return b.mutualFriendCount - a.mutualFriendCount;
    }
    if (b.coPlayerSessionCount !== a.coPlayerSessionCount) {
      return b.coPlayerSessionCount - a.coPlayerSessionCount;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return candidates.slice(0, limit);
}

// Suppress unused
void notInArray;
