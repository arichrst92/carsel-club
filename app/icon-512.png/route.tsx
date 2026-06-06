/**
 * Generated 512×512 PNG icon via next/og (Sprint 33).
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
          background: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
          color: "#fff",
          fontFamily: "system-ui",
          fontWeight: 900,
          fontSize: 240,
        }}
      >
        CC
      </div>
    ),
    { width: 512, height: 512 }
  );
}
