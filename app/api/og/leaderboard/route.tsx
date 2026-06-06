/**
 * OG share card untuk leaderboard top 10 (Sprint 32).
 *
 * Query params:
 * - scope=global|regional
 * - period=all_time|monthly|weekly
 * - city (optional)
 */

import { ImageResponse } from "next/og";
import { getLeaderboardV2 } from "@/lib/db/queries/leaderboard-v2";
import { periodLabel } from "@/lib/leaderboard/period";
import type {
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardSort,
} from "@/lib/leaderboard/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope =
    (url.searchParams.get("scope") as LeaderboardScope) ?? "global";
  const period =
    (url.searchParams.get("period") as LeaderboardPeriod) ?? "all_time";
  const sort = (url.searchParams.get("sort") as LeaderboardSort) ?? "point";
  const city = url.searchParams.get("city");

  const rows = await getLeaderboardV2({
    sort,
    period,
    city: scope === "regional" ? city : null,
  });
  const top = rows.slice(0, 10);

  const title =
    scope === "regional" && city
      ? `Top 10 ${city}`
      : "Top 10 Indonesia";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
          color: "#fff",
          padding: "48px 56px",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, opacity: 0.95 }}>
            🏆 Carsel Club Leaderboard
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              opacity: 0.9,
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 999,
            }}
          >
            {periodLabel(period)}
          </div>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 28,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >
          {top.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.10)",
                borderRadius: 12,
                padding: "10px 18px",
              }}
            >
              <div
                style={{
                  width: 36,
                  fontSize: 24,
                  fontWeight: 800,
                  opacity: 0.85,
                }}
              >
                #{r.rank}
              </div>
              <div style={{ flex: 1, fontSize: 22, fontWeight: 700 }}>
                {r.displayName}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {r.totalPoints.toLocaleString()} pts
              </div>
            </div>
          ))}
          {top.length === 0 && (
            <div style={{ fontSize: 24, opacity: 0.85 }}>
              Belum ada pemain.
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 1200 }
  );
}
