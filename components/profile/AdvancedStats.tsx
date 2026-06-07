/**
 * Advanced stats section — best partner + nemesis + best streak (Sprint 30).
 *
 * Server component — receives pre-aggregated data from page (already joined
 * with display names).
 */

import Link from "next/link";
import type { PartnerAggregate } from "@/lib/stats/advanced";

export type AdvancedStatsRow = PartnerAggregate & {
  displayName: string;
  avatarUrl: string | null;
};

export type AdvancedStatsProps = {
  bestPartners: AdvancedStatsRow[];
  nemesis: AdvancedStatsRow[];
  bestWinStreak: number;
  totalCompletedMatches: number;
};

export function AdvancedStats(props: AdvancedStatsProps) {
  const hasData =
    props.bestPartners.length > 0 ||
    props.nemesis.length > 0 ||
    props.bestWinStreak > 0;

  if (!hasData && props.totalCompletedMatches === 0) {
    return null;
  }

  return (
    <section>
      <div className="section-head">
        <h3>📊 Deep Stats</h3>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
        <StreakCard streak={props.bestWinStreak} />
        <ListCard
          title="Partner terbaik"
          subtitle="Highest win rate (min 3 match)"
          empty="Not enough partner data"
          rows={props.bestPartners}
          metricLabel={(r) =>
            `${Math.round(r.winRate * 100)}% (${r.won}W / ${r.played})`
          }
          metricColor="var(--success-700, #15803d)"
        />
        <ListCard
          title="Nemesis"
          subtitle="Opponents who beat you most (min 3 match)"
          empty="No nemesis yet"
          rows={props.nemesis}
          metricLabel={(r) =>
            `${Math.round((r.lost / r.played) * 100)}% (${r.lost}L / ${r.played})`
          }
          metricColor="var(--danger-700, #b91c1c)"
        />
      </div>
    </section>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <div
      style={{
        background:
          streak >= 3
            ? "linear-gradient(135deg, #FF8C00 0%, #FF4500 100%)"
            : "var(--bg-card)",
        color: streak >= 3 ? "#fff" : "var(--text-900)",
        border:
          streak >= 3 ? "none" : "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3) var(--s-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: streak >= 3 ? "var(--shadow-card)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
        <div style={{ fontSize: 28 }}>🔥</div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.85,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Best win streak
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {streak} {streak === 1 ? "menang" : "menang berturut"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  empty,
  rows,
  metricLabel,
  metricColor,
}: {
  title: string;
  subtitle: string;
  empty: string;
  rows: AdvancedStatsRow[];
  metricLabel: (r: AdvancedStatsRow) => string;
  metricColor: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3) var(--s-4)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 14,
          color: "var(--text-900)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-500)",
          fontWeight: 600,
          marginTop: 2,
          marginBottom: "var(--s-3)",
        }}
      >
        {subtitle}
      </div>
      {rows.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            padding: "var(--s-2) 0",
          }}
        >
          {empty}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {rows.map((r, i) => (
            <Link
              key={r.userId}
              href={`/u/${r.userId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-3)",
                textDecoration: "none",
                color: "inherit",
                padding: "var(--s-2) 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border-light)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: r.avatarUrl
                    ? `url(${r.avatarUrl}) center/cover no-repeat`
                    : "var(--primary-100)",
                  color: "var(--primary-700)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {!r.avatarUrl &&
                  (r.displayName.trim()[0] ?? "?").toUpperCase()}
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-900)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.displayName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: metricColor,
                  whiteSpace: "nowrap",
                }}
              >
                {metricLabel(r)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
