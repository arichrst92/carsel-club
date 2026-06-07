/**
 * Public per-match share view.
 *
 * No auth required — share-able link untuk WA/IG.
 * Auto-refresh saat status=live (poll 5s via AutoRefresh component).
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/live-view.html (court visual + scores)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 6
 */

import { AppLogoMark } from "@/components/ui/AppLogoMark";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicMatchView } from "@/lib/db/queries/public-share";
import { AutoRefresh } from "@/components/share/AutoRefresh";
import { formatDate, formatTime } from "@/lib/utils";
import {
  computePlayerStats,
  OUTCOME_LABEL,
  team1Won,
  team2Won,
} from "@/lib/match/detail-helpers";
import { MATCH_STATUS_LABEL } from "@/lib/match/lifecycle";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { matchId } = await params;
  const data = await getPublicMatchView(matchId);
  if (!data) return { title: "Match — Carsel Club" };

  const ogImage = `/api/og/match/${matchId}`;
  const team1 = data.players
    .filter((p) => p.side === "team1")
    .map((p) => p.name)
    .join(" & ");
  const team2 = data.players
    .filter((p) => p.side === "team2")
    .map((p) => p.name)
    .join(" & ");
  const description = `${team1} vs ${team2} · ${data.session.venueName ?? data.session.title}`;
  const title =
    data.match.status === "completed"
      ? `${team1} ${data.match.team1Score} - ${data.match.team2Score} ${team2}`
      : `LIVE — ${data.session.title}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicMatchView({ params }: PageProps) {
  const { matchId } = await params;
  const data = await getPublicMatchView(matchId);
  if (!data) notFound();

  const { match, round, session, players } = data;
  const team1 = players.filter((p) => p.side === "team1");
  const team2 = players.filter((p) => p.side === "team2");
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const t1W = team1Won(match.team1Score, match.team2Score);
  const t2W = team2Won(match.team1Score, match.team2Score);

  return (
    <div className="app-shell">
      {isLive && <AutoRefresh intervalMs={5000} />}

      {/* Public header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--s-3) var(--s-4)",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border-light)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="logo">
          <AppLogoMark />
          <span className="logo-text">Carsel Club</span>
        </div>
        <Link
          href={`/s/${session.id}`}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--r-full)",
            background: "var(--bg-soft)",
            color: "var(--text-700)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 11,
            textDecoration: "none",
          }}
        >
          See Session →
        </Link>
      </header>

      <main className="app-content" style={{ paddingBottom: "var(--s-6)" }}>
        {/* Hero */}
        <section
          style={{
            background: isCompleted
              ? "linear-gradient(135deg, var(--primary), var(--primary-700))"
              : "linear-gradient(135deg, #1E293B, #0F172A)",
            color: "#fff",
            padding: "var(--s-5)",
            borderRadius: "var(--r-2xl)",
            boxShadow: "var(--shadow-md)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              background: "rgba(255,255,255,0.22)",
              borderRadius: "var(--r-full)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              marginBottom: 12,
            }}
          >
            {isLive && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: "#FACC15",
                  borderRadius: "50%",
                  animation: "pulse 1.2s ease-in-out infinite",
                }}
              />
            )}
            <span>
              {isLive ? "🔴 LIVE" : MATCH_STATUS_LABEL[match.status]}
            </span>
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              opacity: 0.85,
              marginBottom: 12,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Court {match.courtNumber} · Round {round.number}
          </div>

          {/* Scoreboard */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "var(--s-3)",
            }}
          >
            <TeamBlock
              names={[team1[0]?.name ?? "?", team1[1]?.name ?? "?"]}
              score={match.team1Score}
              winner={t1W}
              completed={isCompleted}
            />
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 20,
                opacity: 0.6,
              }}
            >
              –
            </div>
            <TeamBlock
              names={[team2[0]?.name ?? "?", team2[1]?.name ?? "?"]}
              score={match.team2Score}
              winner={t2W}
              completed={isCompleted}
              align="right"
            />
          </div>

          {/* Session label */}
          <div
            style={{
              marginTop: 16,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.12)",
              borderRadius: "var(--r-md)",
              fontSize: 11,
              fontWeight: 600,
              opacity: 0.95,
            }}
          >
            🎾 {session.title}
            {session.venueName && ` · 📍 ${session.venueName}`}
          </div>
        </section>

        {/* Players breakdown */}
        <section>
          <div className="section-head">
            <h3>Lineup</h3>
            {isLive && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--accent-600)",
                  letterSpacing: "0.04em",
                }}
              >
                Auto refresh 5s
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {players.map((p) => (
              <PublicPlayerRow
                key={p.participantId}
                player={p}
                t1Score={match.team1Score}
                t2Score={match.team2Score}
                completed={isCompleted}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            marginTop: "var(--s-4)",
            padding: "var(--s-4)",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-xl)",
            border: "1px dashed var(--border)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎾</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
              color: "var(--text-900)",
              marginBottom: 4,
            }}
          >
            Powered by Carsel Club
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 600,
              marginBottom: "var(--s-3)",
            }}
          >
            Padel community
          </div>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: "var(--r-full)",
              background: "var(--primary)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Sign Up Now
          </Link>
        </section>
      </main>
    </div>
  );
}

function TeamBlock({
  names,
  score,
  winner,
  completed,
  align = "left",
}: {
  names: [string, string];
  score: number;
  winner: boolean;
  completed: boolean;
  align?: "left" | "right";
}) {
  return (
    <div style={{ minWidth: 0, textAlign: align }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          opacity: 0.85,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 2,
        }}
      >
        {names[0]}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          opacity: 0.7,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 6,
        }}
      >
        {names[1]}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1,
          color: completed && winner ? "#FACC15" : "currentColor",
          opacity: completed && !winner ? 0.7 : 1,
        }}
      >
        {score}
      </div>
    </div>
  );
}

function PublicPlayerRow({
  player,
  t1Score,
  t2Score,
  completed,
}: {
  player: {
    participantId: string;
    side: "team1" | "team2";
    slot: 1 | 2;
    name: string;
    isMember: boolean;
    avatarUrl: string | null;
    tierName: string | null;
    tierColor: string | null;
    totalMatches: number;
    totalWins: number;
  };
  t1Score: number;
  t2Score: number;
  completed: boolean;
}) {
  const stats = computePlayerStats(t1Score, t2Score, player.side);
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();
  const winRate =
    player.totalMatches >= 5
      ? Math.round((player.totalWins / player.totalMatches) * 100)
      : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "var(--s-3)",
        background: "var(--bg)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-full)",
          background: player.avatarUrl
            ? `url(${player.avatarUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${player.tierColor ?? "var(--primary)"}, ${player.tierColor ?? "var(--primary-700)"})`,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {!player.avatarUrl && initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-900)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </div>
        <div
          style={{
            fontSize: 10,
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
                  width: 6,
                  height: 6,
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
          <span>{player.side === "team1" ? "Team 1" : "Team 2"}</span>
          {winRate !== null && (
            <>
              <span>·</span>
              <span>{winRate}% WR</span>
            </>
          )}
        </div>
      </div>
      {completed && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color:
              stats.outcome === "win"
                ? "var(--primary-700)"
                : stats.outcome === "draw"
                  ? "var(--text-700)"
                  : "var(--accent-600)",
            textAlign: "right",
          }}
        >
          +{stats.pointsEarned}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              opacity: 0.8,
              marginTop: 2,
            }}
          >
            {OUTCOME_LABEL[stats.outcome]}
          </div>
        </div>
      )}
    </div>
  );
}
