/**
 * Hero block untuk Match Detail page.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-detail.html (hero with score + outcome)
 */

import type { Match } from "@/lib/db/types";
import {
  OUTCOME_BG,
  OUTCOME_COLOR,
  OUTCOME_EMOJI,
  OUTCOME_LABEL,
  team1Won,
  isDraw,
} from "@/lib/match/detail-helpers";
import { MATCH_STATUS_LABEL } from "@/lib/match/lifecycle";

type Props = {
  match: Pick<Match, "team1Score" | "team2Score" | "status">;
  team1Names: [string, string];
  team2Names: [string, string];
};

export function MatchDetailHero({ match, team1Names, team2Names }: Props) {
  const isCompleted = match.status === "completed";
  const t1W = team1Won(match.team1Score, match.team2Score);
  const draw = isDraw(match.team1Score, match.team2Score);

  return (
    <section
      style={{
        padding: "var(--s-5) var(--s-4)",
        background: isCompleted
          ? "linear-gradient(135deg, var(--primary), var(--primary-700))"
          : "linear-gradient(135deg, var(--bg-soft), var(--bg))",
        color: isCompleted ? "#fff" : "var(--text-900)",
        borderRadius: "var(--r-2xl)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Status pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: "var(--r-full)",
          background: isCompleted
            ? "rgba(255,255,255,0.22)"
            : "var(--bg)",
          color: isCompleted ? "#fff" : "var(--text-700)",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "var(--s-4)",
        }}
      >
        {MATCH_STATUS_LABEL[match.status]}
      </div>

      {/* Outcome banner (kalau completed). Sprint 46: score sudah di court — hero tinggal status + outcome pill saja */}
      {isCompleted && (
        <div>
          {draw ? (
            <OutcomePill outcome="draw" />
          ) : t1W ? (
            <OutcomePill
              outcome="win"
              subtitle={`${team1Names[0]} · ${team1Names[1]}`}
            />
          ) : (
            <OutcomePill
              outcome="win"
              subtitle={`${team2Names[0]} · ${team2Names[1]}`}
            />
          )}
        </div>
      )}
    </section>
  );
}

function OutcomePill({
  outcome,
  subtitle,
}: {
  outcome: "win" | "loss" | "draw";
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: "var(--r-full)",
        background: OUTCOME_BG[outcome],
        color: OUTCOME_COLOR[outcome],
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ fontSize: 16 }}>{OUTCOME_EMOJI[outcome]}</span>
      <span>
        {OUTCOME_LABEL[outcome]}
        {subtitle && (
          <span style={{ opacity: 0.7, marginLeft: 6, fontWeight: 700 }}>
            · {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}

