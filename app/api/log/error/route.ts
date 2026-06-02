/**
 * Client-side error reporter.
 *
 * Dipanggil oleh app/error.tsx untuk forward client error ke app_logs.
 * No auth gate — accept errors dari client manapun. Rate-limit via
 * reasonable body size cap.
 */

import { NextResponse } from "next/server";
import { error as logError } from "@/lib/log";

const MAX_BODY = 32 * 1024; // 32 KB

export async function POST(req: Request) {
  try {
    // Read with size guard
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    const body = JSON.parse(text) as {
      message?: string;
      stack?: string;
      digest?: string;
      path?: string;
    };

    const userAgent = req.headers.get("user-agent");

    logError(body.message ?? "Client error", {
      stack: body.stack,
      digest: body.digest,
      path: body.path,
      userAgent,
      source: "client_boundary",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
