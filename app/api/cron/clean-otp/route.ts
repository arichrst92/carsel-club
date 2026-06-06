/**
 * OTP cleanup cron (Sprint 37).
 *
 * Deletes expired/verified OTP records older than 24h. Reduces table bloat
 * + minimizes window untuk replay of historical codeHashes.
 *
 * Auth: Bearer CRON_SECRET.
 *
 * Refs:
 * - DB: otp_verifications
 * - State machine: STATE_MACHINES.md §5.7 (mentioned cleanup as TODO)
 */

import { NextResponse } from "next/server";
import { lt, or, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { otpVerifications } from "@/lib/db/schema";
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

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const deleted = await db
      .delete(otpVerifications)
      .where(
        or(
          lt(otpVerifications.expiresAt, cutoff),
          isNotNull(otpVerifications.verifiedAt)
        )
      )
      .returning({ id: otpVerifications.id });

    event("otp_cleanup_completed", {
      deleted: deleted.length,
      cutoff: cutoff.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.length,
      cutoff,
    });
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
