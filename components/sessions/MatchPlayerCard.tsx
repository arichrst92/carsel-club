/**
 * Per-player breakdown card untuk Match Detail.
 *
 * Show: avatar, name, tier badge, W/L badge, points earned.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-detail.html (lineup section)
 */

import type { MatchDetailPlayer } from "@/lib/db/queries/match-detail";
import {
  computePlayerStats,
  OUTCOME_BG,
  OUTCOME_COLOR,
  OUTCOME_LABEL,
} from "@/lib/match/detail-helpers";

type Props = {
  player: MatchDetailPlayer;
  team1Score: number;
  team2Score: number;
  matchCompleted: boolean;
};

export function MatchPlayerCard({
  player,
  team1Score,
  team2Score,
  matchCompleted,
}: Props) {
  const stats = computePlayerStats(team1Score, team2Score, player.side);
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3)",
        background: "var(--bg)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-full)",
          background: player.avatarUrl
            ? `url(${player.avatarUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${player.tierColor ?? "var(--primary)"}, ${player.tierColor ?? "var(--primary-700)"})`,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {!player.avatarUrl && initial}
      </div>

      {/* Name + tier */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-900)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
          {!player.isMember && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: "var(--r-full)",
                background: "var(--bg-soft)",
                color: "var(--text-500)",
                letterSpacing: "0.04em",
              }}
            >
              GUEST
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {player.tierName ? (
            <>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: player.tierColor ?? "var(--text-400)",
                  display: "inline-block",
                }}
              />
              {player.tierName}
            </>
          ) : (
            <span>—</span>
          )}
          <span>·</span>
          <span>
            {player.side === "team1" ? "Team 1" : "Team 2"} · P{player.slot}
          </span>
        </div>
      </div>

      {/* Outcome + Points */}
      {matchCompleted && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: OUTCOME_COLOR[stats.outcome],
            }}
          >
            +{stats.pointsEarned}
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "var(--r-sm)",
              background: OUTCOME_BG[stats.outcome],
              color: OUTCOME_COLOR[stats.outcome],
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginTop: 2,
              display: "inline-block",
            }}
          >
            {OUTCOME_LABEL[stats.outcome]}
          </div>
        </div>
      )}
    </div>
  );
}
