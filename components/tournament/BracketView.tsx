/**
 * Tournament bracket visualizer (Sprint 31).
 *
 * Mobile-friendly: horizontal scroll columns per round.
 * Server component — data passed in.
 */

import Link from "next/link";
import type { BracketView as BracketViewData } from "@/lib/db/queries/bracket";

const ROUND_LABELS: Record<number, string> = {
  1: "Round 1",
  2: "Round 2",
  3: "Round 3",
  4: "Round 4",
  5: "Round 5",
  6: "Round 6",
};

export function BracketView({ data }: { data: BracketViewData }) {
  const rounds = Array.from(
    { length: data.totalRounds },
    (_, i) => i + 1
  );

  return (
    <section>
      <div className="section-head">
        <h3>🏆 Bracket</h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 700,
          }}
        >
          Round {data.currentRound} / {data.totalRounds}
        </span>
      </div>

      <div
        style={{
          overflowX: "auto",
          paddingBottom: "var(--s-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "var(--s-3)",
            minWidth: "max-content",
            alignItems: "stretch",
          }}
        >
          {rounds.map((roundNum) => {
            const isFinal = roundNum === data.totalRounds;
            const label = isFinal
              ? "Final"
              : roundNum === data.totalRounds - 1
                ? "Semi-Final"
                : (ROUND_LABELS[roundNum] ?? `Round ${roundNum}`);
            const matchesInThisRound =
              data.matchesByRound[roundNum] ?? [];
            return (
              <div
                key={roundNum}
                style={{
                  minWidth: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-3)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--text-700)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-3)",
                    flex: 1,
                  }}
                >
                  {matchesInThisRound.length === 0 ? (
                    <div
                      style={{
                        padding: "var(--s-4)",
                        background: "var(--bg-soft)",
                        border: "1px dashed var(--border)",
                        borderRadius: "var(--r-lg)",
                        fontSize: 11,
                        color: "var(--text-500)",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      Menunggu winner
                    </div>
                  ) : (
                    matchesInThisRound.map((m) => (
                      <Link
                        key={m.id}
                        href={`/matches/${m.id}`}
                        style={{
                          display: "block",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-lg)",
                          padding: "var(--s-3)",
                          textDecoration: "none",
                          color: "inherit",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        <TeamRow
                          players={m.team1Players}
                          score={m.team1Score}
                          isWinner={
                            m.status === "completed" &&
                            m.team1Score > m.team2Score
                          }
                          isMatchDone={m.status === "completed"}
                        />
                        <div
                          style={{
                            height: 1,
                            background: "var(--border-light)",
                            margin: "var(--s-2) 0",
                          }}
                        />
                        <TeamRow
                          players={m.team2Players}
                          score={m.team2Score}
                          isWinner={
                            m.status === "completed" &&
                            m.team2Score > m.team1Score
                          }
                          isMatchDone={m.status === "completed"}
                        />
                        <div
                          style={{
                            marginTop: "var(--s-2)",
                            fontSize: 10,
                            fontWeight: 700,
                            color:
                              m.status === "live"
                                ? "var(--danger-700, #b91c1c)"
                                : m.status === "completed"
                                  ? "var(--success-700, #15803d)"
                                  : "var(--text-500)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {m.status === "live"
                            ? "● Live"
                            : m.status === "completed"
                              ? "✓ Selesai"
                              : "Pending"}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TeamRow({
  players,
  score,
  isWinner,
  isMatchDone,
}: {
  players: { id: string; displayName: string }[];
  score: number;
  isWinner: boolean;
  isMatchDone: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--s-2)",
        opacity: isMatchDone && !isWinner ? 0.55 : 1,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {players.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            style={{
              fontWeight: isWinner ? 800 : 600,
              fontSize: 12,
              color: "var(--text-900)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.displayName}
          </div>
        ))}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          color: isWinner ? "var(--success-700, #15803d)" : "var(--text-900)",
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {isMatchDone ? score : "–"}
      </div>
    </div>
  );
}
