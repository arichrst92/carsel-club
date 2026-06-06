/**
 * Session reminder cron (Sprint 28).
 *
 * Auth: Bearer CRON_SECRET (same pattern as /api/cron/clean-logs).
 *
 * Algorithm:
 * 1. Find sessions with status='upcoming', reminder_sent_at IS NULL,
 *    scheduled in default window (50-75 min ahead = ~H-1)
 * 2. Per session:
 *    a. Atomically claim slot via markReminderSent (only one runner wins)
 *    b. Look up participants (skip guests)
 *    c. Fire notifySessionReminder per participant
 *       → createNotification persists row + dispatches push + WA via prefs
 *
 * Cron infra: systemd timer di VPS (decision D3 — Sprint 28).
 * Crontab example: `* /5 * * * * curl -X POST -H "Authorization: Bearer $SECRET" ...`
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 28
 * - Pure: lib/notifications/reminder-window.ts
 */

import { NextResponse } from "next/server";
import {
  listSessionsDueForReminder,
  markReminderSent,
  listSessionParticipantUserIds,
} from "@/lib/db/queries/reminders";
import {
  DEFAULT_REMINDER_WINDOW,
  displayMinutes,
  minutesBetween,
} from "@/lib/notifications/reminder-window";
import { notifySessionReminder } from "@/lib/notifications/generate";
import { event } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const authHeader = req.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sessions = await listSessionsDueForReminder(
    now,
    DEFAULT_REMINDER_WINDOW.minMinutes,
    DEFAULT_REMINDER_WINDOW.maxMinutes
  );

  let processed = 0;
  let claimed = 0;
  let notified = 0;

  for (const s of sessions) {
    processed++;
    const won = await markReminderSent(s.id, now);
    if (!won) continue;
    claimed++;

    const userIds = await listSessionParticipantUserIds(s.id);
    const inMinutes = displayMinutes(minutesBetween(now, s.scheduledAt));
    for (const userId of userIds) {
      notifySessionReminder(userId, {
        sessionId: s.id,
        sessionTitle: s.title,
        venueName: s.venueName,
        scheduledAt: s.scheduledAt.toISOString(),
        inMinutes,
      });
      notified++;
    }
    event("session_reminder_sent", {
      sessionId: s.id,
      participantCount: userIds.length,
      inMinutes,
    });
  }

  return NextResponse.json({
    ok: true,
    processed,
    claimed,
    notified,
    window: DEFAULT_REMINDER_WINDOW,
  });
}
