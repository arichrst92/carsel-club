/**
 * Cleanup cron — delete app_logs older than LOG_RETENTION_DAYS.
 *
 * Auth: Bearer token = process.env.CRON_SECRET (set di .env.local).
 * Sprint 2: manual trigger via curl, Sprint 28 wire ke real cron infra.
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2, Sprint 28 (cron infra)
 */

import { NextResponse } from "next/server";
import { deleteOldLogs } from "@/lib/db/queries/logs";
import { info } from "@/lib/log";

const DEFAULT_RETENTION_DAYS = 30;

function parseRetentionDays(): number {
  const raw = process.env.LOG_RETENTION_DAYS;
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RETENTION_DAYS;
}

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

  const retentionDays = parseRetentionDays();
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000
  );

  try {
    const deleted = await deleteOldLogs(cutoff);
    info("log_cleanup_completed", {
      retentionDays,
      cutoff: cutoff.toISOString(),
      deleted,
    });
    return NextResponse.json({ ok: true, deleted, cutoff });
  } catch (err) {
    return NextResponse.json(
      {
        error: "cleanup failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
