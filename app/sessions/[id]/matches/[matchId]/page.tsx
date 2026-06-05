/**
 * Match Detail page.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-detail.html
 * - Flow: scoring W3/D2/L1 (docs/PADEL_APP_KONSEP.md §4.1)
 * - DB:  matches + matchRoundSets + sessions + sessionParticipants + users + tierDefinitions
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { canUserViewSession } from "@/lib/db/queries/sessions";
import { getMatchDetail } from "@/lib/db/queries/match-detail";
import { MatchDetailHero } from "@/components/sessions/MatchDetailHero";
import { MatchPlayerCard } from "@/components/sessions/MatchPlayerCard";
import { MatchTimer } from "@/components/sessions/MatchTimer";
import { ShareMatchButton } from "@/components/sessions/ShareMatchButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; matchId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { matchId } = await params;
  const detail = await getMatchDetail(matchId);
  if (!detail) return { title: "Match" };
  return {
    title: `Court ${detail.match.courtNumber} · ${detail.session.title}`,
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id, matchId } = await params;
  const user = await requireUser();

  const allowed = await canUserViewSession(id, user.id);
  if (!allowed) notFound();

  const detail = await getMatchDetail(matchId);
  if (!detail || detail.session.id !== id) notFound();

  const { match, round, session, players } = detail;

  const team1 = players.filter((p) => p.side === "team1");
  const team2 = players.filter((p) => p.side === "team2");
  const team1Names: [string, string] = [team1[0]?.name ?? "?", team1[1]?.name ?? "?"];
  const team2Names: [string, string] = [team2[0]?.name ?? "?", team2[1]?.name ?? "?"];

  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href={`/sessions/${session.id}/matches`}
          className="back-btn"
          aria-label="Back"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">Match Detail</h2>
        <div style={{ width: 40 }} />
      </header>

      <main className="app-content subscreen">
        <MatchDetailHero
          match={match}
          team1Names={team1Names}
          team2Names={team2Names}
        />

        {/* Meta info */}
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            <MetaCard label="Court" value={`#${match.courtNumber}`} />
            <MetaCard label="Round" value={`#${round.roundNumber}`} />
            <MetaCard
              label={isLive ? "Berjalan" : isCompleted ? "Durasi" : "Status"}
              value={
                match.startedAt ? (
                  <MatchTimer
                    startedAt={match.startedAt}
                    endedAt={match.endedAt}
                    tickMs={isLive ? 1000 : 0}
                  />
                ) : (
                  "—"
                )
              }
            />
          </div>
        </section>

        {/* Session info link */}
        <Link
          href={`/sessions/${session.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "var(--s-3)",
            background: "var(--bg)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--r-md)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-md)",
              background: "var(--primary-50)",
              color: "var(--primary-700)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text-500)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Session
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
                color: "var(--text-900)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 2,
                textTransform: "capitalize",
              }}
            >
              {session.format} · {session.numCourts} court
              {session.numCourts > 1 ? "s" : ""}
            </div>
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-400)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>

        {/* Lineup — Team 1 */}
        <section>
          <div className="section-head">
            <h3>Tim 1</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {team1.map((p) => (
              <MatchPlayerCard
                key={p.participantId}
                player={p}
                team1Score={match.team1Score}
                team2Score={match.team2Score}
                matchCompleted={isCompleted}
              />
            ))}
          </div>
        </section>

        {/* Lineup — Team 2 */}
        <section>
          <div className="section-head">
            <h3>Tim 2</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {team2.map((p) => (
              <MatchPlayerCard
                key={p.participantId}
                player={p}
                team1Score={match.team1Score}
                team2Score={match.team2Score}
                matchCompleted={isCompleted}
              />
            ))}
          </div>
        </section>

        {/* Share — only completed */}
        {isCompleted && (
          <section>
            <ShareMatchButton
              matchId={match.id}
              sessionTitle={session.title}
              team1Names={team1Names}
              team2Names={team2Names}
              team1Score={match.team1Score}
              team2Score={match.team2Score}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function MetaCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "var(--s-3)",
        background: "var(--bg)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--text-900)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
