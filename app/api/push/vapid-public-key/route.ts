/**
 * Returns VAPID public key for client subscription (Sprint 27).
 *
 * Public — no auth needed (key is meant to be exposed to browsers).
 */

import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/send";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { error: "Push not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: key });
}
