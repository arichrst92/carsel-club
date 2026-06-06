/**
 * Backup status query (Sprint 36).
 *
 * Reads from app_logs to find latest backup_completed event.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appLogs } from "@/lib/db/schema";

export async function getLatestBackupAt(): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: appLogs.createdAt })
    .from(appLogs)
    .where(
      and(
        eq(appLogs.type, "event"),
        eq(appLogs.name, "backup_completed")
      )
    )
    .orderBy(desc(appLogs.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}
