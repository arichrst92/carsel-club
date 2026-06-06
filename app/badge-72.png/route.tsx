/**
 * Push notification badge 72×72 (Sprint 27/33).
 * White silhouette on transparent (Android shows tinted).
 */

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          color: "#fff",
          fontFamily: "system-ui",
          fontWeight: 900,
          fontSize: 44,
        }}
      >
        🎾
      </div>
    ),
    { width: 72, height: 72 }
  );
}
