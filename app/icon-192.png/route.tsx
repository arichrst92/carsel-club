/**
 * Generated 192×192 PNG icon via next/og (Sprint 33).
 *
 * Returns brand orange gradient + "CC" mark — same visual as logo-mark.
 */

import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<IconCanvas size={192} mark fontSize={92} />, {
    width: 192,
    height: 192,
  });
}

function IconCanvas({
  size,
  mark,
  fontSize,
}: {
  size: number;
  mark: boolean;
  fontSize: number;
}) {
  return (
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
        fontSize,
      }}
    >
      {mark ? "CC" : `${size}`}
    </div>
  );
}
