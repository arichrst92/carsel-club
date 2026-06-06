/**
 * Backup ping endpoint (Sprint 36).
 *
 * Called by scripts/backup.sh after successful backup completes.
 * Logs event 'backup_completed' to app_logs so /admin dashboard
 * dapat surface backup health via evaluateBackupHealth.
 *
 * Auth: Bearer CRON_SECRET (same pattern as other cron endpoints).
 */

import { NextResponse } from "next/server";
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

  let body: { dump?: string; stamp?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // Body is optional — backup script always sends but tolerate empty
  }

  event("backup_completed", {
    dump: body.dump ?? null,
    stamp: body.stamp ?? new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
