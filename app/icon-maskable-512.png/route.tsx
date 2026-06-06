/**
 * Maskable 512×512 icon (Sprint 33). Center safe area = 80% canvas;
 * outer padding ensures Android round/squircle masking doesn't crop "CC".
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
          background: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "system-ui",
            fontWeight: 900,
            fontSize: 180,
            lineHeight: 1,
          }}
        >
          CC
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
