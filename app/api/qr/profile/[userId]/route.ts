/**
 * Sprint 24 — QR code SVG generator untuk profile share.
 *
 * Pure SVG output, no external dependency. Encodes profile URL /u/[userId].
 *
 * Implementasi: light QR encoder pakai library 'qrcode' (pure JS).
 * Pre-flight: npm install qrcode @types/qrcode (lihat package.json).
 */

import QRCode from "qrcode";
import { getPublicProfile } from "@/lib/db/queries/public-profile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

export async function GET(_req: Request, { params }: Props) {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) return new Response("Not found", { status: 404 });

  const url = `${getAppBaseUrl()}/u/${userId}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
    width: 320,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
