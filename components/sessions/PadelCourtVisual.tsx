/**
 * Padel court visual — denah lapangan dengan posisi pemain (Sprint 46).
 *
 * Match prototype match-detail.html "COURT VISUAL" section.
 * Server component — purely visual, props-only.
 *
 * Layout: top half = Team 1, bottom half = Team 2, net horizontal di tengah.
 * Score overlay floating di antara players + net.
 */

import type { MatchDetailPlayer } from "@/lib/db/queries/match-detail";

const TIER_SHORT: Record<string, string> = {
  Rookie: "RKE",
  Bronze: "BRZ",
  Silver: "SLV",
  Gold: "GLD",
  Platinum: "PLT",
  Master: "MST",
};

type CourtPlayer = {
  participantId: string;
  name: string;
  avatarUrl: string | null;
  tierName: string | null;
};

export type PadelCourtVisualProps = {
  team1: MatchDetailPlayer[]; // 2 entries — top
  team2: MatchDetailPlayer[]; // 2 entries — bottom
  team1Score: number;
  team2Score: number;
  showScore: boolean; // only for live/completed
};

export function PadelCourtVisual({
  team1,
  team2,
  team1Score,
  team2Score,
  showScore,
}: PadelCourtVisualProps) {
  return (
    <div className="padel-court">
      {showScore && (
        <div className="court-score-overlay top">{team1Score}</div>
      )}

      <div className="court-team top">
        <div className="court-team-positions">
          {team1.map((p) => (
            <CourtPlayer key={p.participantId} player={p} side="team-1" />
          ))}
        </div>
      </div>

      <div className="court-net">
        <span className="court-net-label">NET</span>
      </div>

      <div className="court-team bottom">
        <div className="court-team-positions">
          {team2.map((p) => (
            <CourtPlayer key={p.participantId} player={p} side="team-2" />
          ))}
        </div>
      </div>

      {showScore && (
        <div className="court-score-overlay bottom">{team2Score}</div>
      )}
    </div>
  );
}

function CourtPlayer({
  player,
  side,
}: {
  player: CourtPlayer;
  side: "team-1" | "team-2";
}) {
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();
  return (
    <div className={`court-player ${side}`}>
      <div
        className="cp-avatar"
        style={
          player.avatarUrl
            ? { backgroundImage: `url(${player.avatarUrl})`, color: "transparent" }
            : undefined
        }
      >
        {!player.avatarUrl && initial}
      </div>
      <div className="cp-name">{player.name}</div>
      <div className="cp-tier">
        {TIER_SHORT[player.tierName ?? ""] ?? (player.tierName ?? "RKE")}
      </div>
    </div>
  );
}
