/**
 * Queries untuk app_logs (Sprint 2 monitor page).
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import { and, desc, eq, gte, ilike, or, count, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appLogs, users } from "@/lib/db/schema";
import type { NormalizedLogFilter } from "@/lib/log/filter";
import type { LogLevel, LogType } from "@/lib/log/types";

export type LogRow = {
  id: string;
  type: LogType;
  level: LogLevel | null;
  name: string;
  context: Record<string, unknown>;
  userId: string | null;
  route: string | null;
  userAgent: string | null;
  createdAt: Date;
  userDisplayName: string | null;
  userWhatsappTail: string | null; // 4 digit terakhir
};

export type LogStats = {
  totalInfo: number;
  totalWarn: number;
  totalError: number;
  totalFatal: number;
  totalEvents: number;
};

export async function listLogs(
  filter: NormalizedLogFilter
): Promise<LogRow[]> {
  const conditions = [gte(appLogs.createdAt, new Date(filter.sinceMs))];

  if (filter.type) conditions.push(eq(appLogs.type, filter.type));
  if (filter.level) conditions.push(eq(appLogs.level, filter.level));
  if (filter.userId) conditions.push(eq(appLogs.userId, filter.userId));
  if (filter.searchQuery) {
    const q = `%${filter.searchQuery}%`;
    const searchCondition = or(
      ilike(appLogs.name, q),
      sql`${appLogs.context}::text ILIKE ${q}`
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const rows = await db
    .select({
      id: appLogs.id,
      type: appLogs.type,
      level: appLogs.level,
      name: appLogs.name,
      context: appLogs.context,
      userId: appLogs.userId,
      route: appLogs.route,
      userAgent: appLogs.userAgent,
      createdAt: appLogs.createdAt,
      userDisplayName: users.displayName,
      userWhatsappNumber: users.whatsappNumber,
    })
    .from(appLogs)
    .leftJoin(users, eq(users.id, appLogs.userId))
    .where(and(...conditions))
    .orderBy(desc(appLogs.createdAt))
    .limit(filter.limit)
    .offset(filter.offset);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    level: r.level,
    name: r.name,
    context: (r.context ?? {}) as Record<string, unknown>,
    userId: r.userId,
    route: r.route,
    userAgent: r.userAgent,
    createdAt: r.createdAt,
    userDisplayName: r.userDisplayName,
    userWhatsappTail: r.userWhatsappNumber
      ? r.userWhatsappNumber.slice(-4)
      : null,
  }));
}

export async function getLogStats(
  sinceMs: number
): Promise<LogStats> {
  const rows = await db
    .select({
      type: appLogs.type,
      level: appLogs.level,
      count: count(),
    })
    .from(appLogs)
    .where(gte(appLogs.createdAt, new Date(sinceMs)))
    .groupBy(appLogs.type, appLogs.level);

  const stats: LogStats = {
    totalInfo: 0,
    totalWarn: 0,
    totalError: 0,
    totalFatal: 0,
    totalEvents: 0,
  };

  for (const r of rows) {
    if (r.type === "event") {
      stats.totalEvents += r.count;
    } else if (r.level === "info") {
      stats.totalInfo += r.count;
    } else if (r.level === "warn") {
      stats.totalWarn += r.count;
    } else if (r.level === "error") {
      stats.totalError += r.count;
    } else if (r.level === "fatal") {
      stats.totalFatal += r.count;
    }
  }

  return stats;
}

export async function deleteOldLogs(beforeDate: Date): Promise<number> {
  const result = await db
    .delete(appLogs)
    .where(sql`${appLogs.createdAt} < ${beforeDate.toISOString()}`)
    .returning({ id: appLogs.id });
  return result.length;
}
