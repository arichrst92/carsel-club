/**
 * Admin search queries (Sprint 35).
 */

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

export type UserSearchRow = {
  id: string;
  displayName: string;
  whatsappNumber: string;
  city: string | null;
  totalPoints: number;
  totalMatches: number;
  isAdmin: boolean;
  createdAt: Date;
};

export async function searchUsers(
  q: string,
  limit = 30
): Promise<UserSearchRow[]> {
  const trimmed = q.trim();
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      trimmed.length === 0
        ? undefined
        : or(
            ilike(users.displayName, `%${trimmed}%`),
            ilike(users.whatsappNumber, `%${trimmed}%`),
            ilike(users.city, `%${trimmed}%`)
          )
    )
    .orderBy(desc(users.createdAt))
    .limit(Math.min(limit, 100));
  return rows;
}

export type AdminUserDetail = UserSearchRow & {
  currentTierId: number | null;
  currentWinStreak: number;
  bestWinStreak: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
};

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  const [row] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      currentTierId: users.currentTierId,
      currentWinStreak: users.currentWinStreak,
      bestWinStreak: users.bestWinStreak,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export type SessionSearchRow = {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  venueName: string | null;
  scheduledAt: Date;
  status: "upcoming" | "live" | "completed" | "cancelled";
  createdAt: Date;
};

export async function searchSessions(
  q: string,
  limit = 30
): Promise<SessionSearchRow[]> {
  const trimmed = q.trim();
  const host = sql<string>`(SELECT display_name FROM users WHERE id = ${sessions.hostId})`;
  const rows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      hostId: sessions.hostId,
      hostName: host,
      venueName: sessions.venueName,
      scheduledAt: sessions.scheduledAt,
      status: sessions.status,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(
      trimmed.length === 0
        ? undefined
        : or(
            ilike(sessions.title, `%${trimmed}%`),
            ilike(sessions.venueName, `%${trimmed}%`)
          )
    )
    .orderBy(desc(sessions.createdAt))
    .limit(Math.min(limit, 100));
  return rows;
}

export type AdminCounts = {
  totalUsers: number;
  totalSessions: number;
  liveSessions: number;
  totalMatches: number;
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [u] = await db.select({ c: count() }).from(users);
  const [s] = await db.select({ c: count() }).from(sessions);
  const [live] = await db
    .select({ c: count() })
    .from(sessions)
    .where(eq(sessions.status, "live"));
  const [m] = await db.execute<{ c: number }>(
    sql`SELECT COUNT(*)::int AS c FROM matches WHERE status = 'completed'`
  );
  return {
    totalUsers: Number(u?.c ?? 0),
    totalSessions: Number(s?.c ?? 0),
    liveSessions: Number(live?.c ?? 0),
    totalMatches: Number(m?.c ?? 0),
  };
}

void and;
