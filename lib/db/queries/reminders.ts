/**
 * Session reminder queries (Sprint 28).
 *
 * Refs:
 * - DB: sessions.scheduled_at + sessions.reminder_sent_at + session_participants
 * - Cron: /api/cron/session-reminder
 */

import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  sessionParticipants,
} from "@/lib/db/schema";

export type SessionReminderRow = {
  id: string;
  title: string;
  venueName: string | null;
  scheduledAt: Date;
};

/**
 * Sessions yang harus dapat reminder:
 * - status upcoming (not cancelled/completed)
 * - reminder belum dikirim
 * - scheduledAt antara now+minMinutes dan now+maxMinutes
 */
export async function listSessionsDueForReminder(
  now: Date,
  minMinutes: number,
  maxMinutes: number
): Promise<SessionReminderRow[]> {
  const min = new Date(now.getTime() + minMinutes * 60_000);
  const max = new Date(now.getTime() + maxMinutes * 60_000);
  const rows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      venueName: sessions.venueName,
      scheduledAt: sessions.scheduledAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, "upcoming"),
        isNull(sessions.reminderSentAt),
        gt(sessions.scheduledAt, min),
        lte(sessions.scheduledAt, max)
      )
    );
  return rows;
}

/**
 * Marks session as reminded — idempotent (only succeeds if column was null).
 * Returns true if it transitioned (we own the slot).
 */
export async function markReminderSent(
  sessionId: string,
  at: Date
): Promise<boolean> {
  const updated = await db
    .update(sessions)
    .set({ reminderSentAt: at })
    .where(
      and(eq(sessions.id, sessionId), isNull(sessions.reminderSentAt))
    )
    .returning({ id: sessions.id });
  return updated.length > 0;
}

/**
 * UserIds untuk participant yang punya akun (skip guests).
 */
export async function listSessionParticipantUserIds(
  sessionId: string
): Promise<string[]> {
  const rows = await db
    .select({ userId: sessionParticipants.userId })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));
  return rows
    .map((r) => r.userId)
    .filter((id): id is string => !!id);
}
