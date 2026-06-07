import { notFound } from "next/navigation";
import { AppLogoMark } from "@/components/ui/AppLogoMark";
import Link from "next/link";
import { getPublicSessionView } from "@/lib/db/queries/public-share";
import { AutoRefresh } from "@/components/share/AutoRefresh";
import { formatDate, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await getPublicSessionView(id);
  if (!data) return { title: "Session — Carsel Club" };

  const ogImage = `/api/og/session/${id}`;
  const description = data.session.venueName
    ? `Live padel session · ${data.session.venueName}`
    : "Live padel session on Carsel Club";

  return {
    title: `LIVE — ${data.session.title} · Carsel Club`,
    description,
    openGraph: {
      type: "website",
      title: data.session.title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: data.session.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.session.title,
      description,
      images: [ogImage],
    },
  };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  upcoming: { label: "📅 Upcoming", color: "#FACC15" },
  live: { label: "🔴 LIVE", color: "#EF4444" },
  completed: { label: "✅ Completed", color: "#10B981" },
  cancelled: { label: "❌ Cancelled", color: "#94A3B8" },
};

export default async function PublicLiveView({ params }: PageProps) {
  const { id } = await params;
  const data = await getPublicSessionView(id);
  if (!data) notFound();

  const { session, participants, currentRound, currentMatches, totalRounds } =
    data;

  // Sprint 7: lookup carry tier + avatar + winRate per participant
  const lookup = participants.reduce<
    Record<
      string,
      {
        name: string;
        userId: string | null;
        isMember: boolean;
        avatarUrl: string | null;
        tierName: string | null;
        tierColor: string | null;
        winRate: number;
        totalMatches: number;
      }
    >
  >((acc, p) => {
    const wr =
      p.userTotalMatches && p.userTotalMatches > 0
        ? Math.round(((p.userTotalWins ?? 0) / p.userTotalMatches) * 100)
        : 0;
    acc[p.id] = {
      name: p.guestName ?? p.userDisplayName ?? "?",
      userId: p.userId ?? null,
      isMember: p.userId !== null,
      avatarUrl: p.userAvatarUrl ?? null,
      tierName: p.tierName ?? null,
      tierColor: p.tierColor ?? null,
      winRate: wr,
      totalMatches: p.userTotalMatches ?? 0,
    };
    return acc;
  }, {});

  // Session leaderboard (top 5 by points)
  const leaderboard = [...participants]
    .sort((a, b) => b.sessionPoints - a.sessionPoints)
    .slice(0, 5);

  const isLive = session.status === "live";
  const isTerminal =
    session.status === "completed" || session.status === "cancelled";
  const statusInfo = STATUS_LABEL[session.status] ?? STATUS_LABEL.upcoming;

  return (
    <div className="app-shell">
      {/* Auto-refresh when live */}
      {isLive && <AutoRefresh intervalMs={5000} />}

      {/* Public Header (no app navigation) */}
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
          href="/"
          style={{
            padding: "6px 12px",
            borderRadius: "var(--r-full)",
            background: "var(--primary)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 11,
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Open in App →
        </Link>
      </header>

      <main className="app-content" style={{ paddingBottom: "var(--s-6)" }}>
        {/* LIVE HERO */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            padding: "var(--s-5)",
            borderRadius: "var(--r-2xl)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                background: "rgba(255,255,255,0.22)",
                color: "#fff",
                borderRadius: "var(--r-full)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
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
              <span>{statusInfo.label}</span>
            </span>
            {isLive && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  opacity: 0.85,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Auto-refresh every 5 seconds
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 8,
            }}
          >
            {session.title}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.95,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg
                width="14"
                height="14"
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
              <span>
                {formatDate(session.scheduledAt)} ·{" "}
                {formatTimeRange(session.scheduledAt, session.scheduledEndAt)}
              </span>
            </div>
            {currentRound && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>
                  Round {currentRound.roundNumber} of {totalRounds}
                </span>
              </div>
            )}
            {session.venueName && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  {session.venueName} · {session.numCourts} court
                  {session.numCourts > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {session.hostName && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                <span>
                  Hosted by {session.hostName} · {participants.length} players
                </span>
              </div>
            )}
          </div>
        </section>

        {/* CURRENT ROUND MATCHES */}
        {currentRound && currentMatches.length > 0 && (
          <section>
            <div className="section-head">
              <h3>Round {currentRound.roundNumber}</h3>
              <span
                style={{
                  color: "var(--text-500)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {currentRound.status === "completed"
                  ? "Completed"
                  : currentRound.status === "in_progress"
                    ? "Live"
                    : "Pending"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-3)",
              }}
            >
              {currentMatches.map((m) => (
                <CourtMatchCard key={m.id} match={m} lookup={lookup} />
              ))}
            </div>
          </section>
        )}

        {/* SESSION LEADERBOARD */}
        {leaderboard.length > 0 && (
          <section>
            <div className="section-head">
              <h3>🏆 Top {Math.min(5, leaderboard.length)} Leaders</h3>
              <span
                style={{
                  color: "var(--text-500)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Session leaderboard
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {leaderboard.map((p, idx) => (
                <PublicLeaderboardRow
                  key={p.id}
                  rank={idx + 1}
                  name={lookup[p.id]?.name ?? "?"}
                  userId={lookup[p.id]?.userId ?? null}
                  points={p.sessionPoints}
                  wins={p.sessionWins}
                  losses={p.sessionLosses}
                  draws={p.sessionDraws}
                  matches={p.sessionMatches}
                />
              ))}
            </div>
          </section>
        )}

        {/* No matches yet */}
        {!currentRound && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">Matches haven't started yet</div>
            <div className="empty-state-text">
              The host hasn't generated the first round yet. Refresh the page
              when matches start.
            </div>
          </div>
        )}

        {/* CTA: Join as Guest (Sprint 19) — visible kalau session non-terminal */}
        {!isTerminal && (
          <section
            style={{
              marginTop: "var(--s-4)",
              padding: "var(--s-4)",
              background: "var(--bg)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--primary-100)",
              textAlign: "center",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎾</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 15,
                color: "var(--text-900)",
                marginBottom: 4,
              }}
            >
              Want to play?
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-500)",
                fontWeight: 600,
                marginBottom: "var(--s-3)",
              }}
            >
              Join as a guest without signing up — your name goes straight into the lineup.
            </div>
            <Link
              href={`/s/${session.id}/guest`}
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
                boxShadow: "var(--shadow-sm)",
              }}
            >
              Join as Guest →
            </Link>
          </section>
        )}

        {/* CTA: Powered by */}
        <section
          style={{
            marginTop: "var(--s-3)",
            padding: "var(--s-4)",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-xl)",
            border: "1px dashed var(--border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
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
              background: "var(--bg)",
              color: "var(--text-900)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Sign Up
          </Link>
        </section>
      </main>
    </div>
  );
}

function elapsedMin(startedAt: Date | string | null): string | null {
  if (!startedAt) return null;
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const mins = Math.floor((Date.now() - start.getTime()) / 60000);
  if (mins < 1) return "Just started";
  return `${mins} min`;
}

type LiveLookup = Record<
  string,
  {
    name: string;
    userId: string | null;
    isMember: boolean;
    avatarUrl: string | null;
    tierName: string | null;
    tierColor: string | null;
    winRate: number;
    totalMatches: number;
  }
>;

function CourtMatchCard({
  match,
  lookup,
}: {
  match: {
    id: string;
    courtNumber: number;
    team1P1Id: string;
    team1P2Id: string;
    team2P1Id: string;
    team2P2Id: string;
    team1Score: number;
    team2Score: number;
    status: "pending" | "live" | "completed";
    startedAt: Date | string | null;
    endedAt: Date | string | null;
  };
  lookup: LiveLookup;
}) {
  const p1 = lookup[match.team1P1Id];
  const p2 = lookup[match.team1P2Id];
  const p3 = lookup[match.team2P1Id];
  const p4 = lookup[match.team2P2Id];

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const elapsed = isLive ? elapsedMin(match.startedAt) : null;

  return (
    <div className="live-court-card">
      <div className="live-court-head">
        <div className="live-court-head-left">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {isLive && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  background: "var(--accent)",
                  borderRadius: "50%",
                  animation: "pulse 1.2s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
            )}
            <span>
              Court {match.courtNumber} ·{" "}
              {isCompleted ? "Completed" : isLive ? "LIVE" : "Pending"}
            </span>
          </span>
        </div>
        {elapsed && <div className="live-court-head-time">{elapsed}</div>}
      </div>
      <div className="live-court-body">
        <div className="padel-court mini">
          {/* Top score */}
          <div className="court-score-overlay top">{match.team1Score}</div>

          {/* Top team */}
          <div className="court-team top">
            <div className="court-team-positions">
              <CourtPlayer entry={p1} team="team-1" />
              <CourtPlayer entry={p2} team="team-1" />
            </div>
          </div>

          {/* Net */}
          <div className="court-net">
            <span className="court-net-label">NET</span>
          </div>

          {/* Bottom team */}
          <div className="court-team bottom">
            <div className="court-team-positions">
              <CourtPlayer entry={p3} team="team-2" />
              <CourtPlayer entry={p4} team="team-2" />
            </div>
          </div>

          {/* Bottom score */}
          <div className="court-score-overlay bottom">{match.team2Score}</div>
        </div>

        {/* Team strip below court */}
        <div className="live-team-strip">
          <div className="lts-team">
            <span className="lts-name">
              {p1?.name ?? "?"} · {p2?.name ?? "?"}
            </span>
          </div>
          <div className="lts-vs">vs</div>
          <div className="lts-team right">
            <span className="lts-name">
              {p3?.name ?? "?"} · {p4?.name ?? "?"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourtPlayer({
  entry,
  team,
}: {
  entry?: LiveLookup[string];
  team: "team-1" | "team-2";
}) {
  const name = entry?.name ?? "?";
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const tierName = entry?.tierName ?? null;
  const tierColor = entry?.tierColor ?? null;
  const winRate = entry?.winRate ?? 0;
  const hasStats = (entry?.totalMatches ?? 0) >= 5; // min 5 match utk credibility
  const avatarUrl = entry?.avatarUrl ?? null;
  const userId = entry?.userId ?? null;

  const inner = (
    <>
      <div
        className="cp-avatar"
        style={
          avatarUrl
            ? {
                background: `url(${avatarUrl}) center/cover no-repeat`,
                color: "transparent",
              }
            : tierColor
              ? {
                  background: `linear-gradient(135deg, ${tierColor}, ${tierColor})`,
                }
              : undefined
        }
      >
        {!avatarUrl && initial}
      </div>
      <div className="cp-name">{name}</div>
      {tierName && (
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: tierColor ?? "var(--text-500)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: tierColor ?? "var(--text-400)",
              display: "inline-block",
            }}
          />
          {tierName}
          {hasStats && <span style={{ opacity: 0.7 }}>· {winRate}% WR</span>}
        </div>
      )}
    </>
  );

  return userId ? (
    <Link
      href={`/u/${userId}`}
      className={`court-player ${team}`}
      style={{ position: "relative", textDecoration: "none", color: "inherit" }}
    >
      {inner}
    </Link>
  ) : (
    <div className={`court-player ${team}`} style={{ position: "relative" }}>
      {inner}
    </div>
  );
}

function PublicLeaderboardRow({
  rank,
  name,
  userId,
  points,
  wins,
  losses,
  draws,
  matches,
}: {
  rank: number;
  name: string;
  userId: string | null;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
}) {
  const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--s-3)",
    padding: "var(--s-3)",
    background: "var(--bg)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--r-lg)",
    textDecoration: "none",
    color: "inherit",
  };
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    userId ? (
      <Link href={`/u/${userId}`} style={containerStyle}>
        {children}
      </Link>
    ) : (
      <div style={containerStyle}>{children}</div>
    );
  return (
    <Wrapper>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          width: 36,
          textAlign: "center",
        }}
      >
        {MEDAL[rank] ?? `#${rank}`}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-900)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {wins}W · {draws}D · {losses}L · {matches} matches
        </div>
      </div>
      <div
        style={{
          textAlign: "right",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--primary-700)",
        }}
      >
        {points}
        <span
          style={{
            fontSize: 10,
            color: "var(--text-500)",
            marginLeft: 2,
            fontWeight: 700,
          }}
        >
          pts
        </span>
      </div>
    </Wrapper>
  );
}
