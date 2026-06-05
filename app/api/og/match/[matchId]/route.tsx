/**
 * OG image untuk per-match share (Sprint 6 + enhanced Sprint 11).
 *
 * Layout v2:
 * - Background: foto group pertama (kalau ada) dgn dark overlay, atau gradient
 * - Header: logo + status pill
 * - Center: 2x team blocks dgn avatars, names, tier dots, points earned
 * - Footer: session title + share URL
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-detail.html (final score visual)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 11
 */

import { ImageResponse } from "next/og";
import { getPublicMatchView } from "@/lib/db/queries/public-share";
import { listGroupPhotos } from "@/lib/db/queries/session-photos";
import {
  computePlayerStats,
  team1Won,
  team2Won,
} from "@/lib/match/detail-helpers";
import { toAbsoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ matchId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { matchId } = await params;
  const data = await getPublicMatchView(matchId);
  if (!data) return new Response("Not found", { status: 404 });

  const { match, round, session, players } = data;
  const team1 = players.filter((p) => p.side === "team1");
  const team2 = players.filter((p) => p.side === "team2");
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const t1W = team1Won(match.team1Score, match.team2Score);
  const t2W = team2Won(match.team1Score, match.team2Score);

  // Sprint 11: foto group sebagai bg kalau ada
  const groupPhotos = await listGroupPhotos(session.id);
  const bgPhotoUrl = groupPhotos[0]?.url
    ? toAbsoluteUrl(groupPhotos[0].url)
    : null;

  const statusLabel = isLive
    ? "🔴 LIVE"
    : isCompleted
      ? "🏆 Final"
      : "⏳ Pending";

  const t1Stats = computePlayerStats(
    match.team1Score,
    match.team2Score,
    "team1"
  );
  const t2Stats = computePlayerStats(
    match.team1Score,
    match.team2Score,
    "team2"
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: bgPhotoUrl
            ? `linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(20,184,166,0.92) 100%), url(${bgPhotoUrl})`
            : isCompleted
              ? "linear-gradient(135deg, #14B8A6 0%, #0F766E 50%, #134E4A 100%)"
              : "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: "rgba(255,255,255,0.22)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              CC
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: 26 }}>Carsel Club</div>
              <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
                Court {match.courtNumber} · Round {round.number}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              background: "rgba(255,255,255,0.22)",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Scoreboard center */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 40,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <TeamCard
              players={team1}
              score={match.team1Score}
              winner={t1W}
              completed={isCompleted}
              pointsEarned={isCompleted ? t1Stats.pointsEarned : null}
              align="right"
            />
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                opacity: 0.4,
              }}
            >
              –
            </div>
            <TeamCard
              players={team2}
              score={match.team2Score}
              winner={t2W}
              completed={isCompleted}
              pointsEarned={isCompleted ? t2Stats.pointsEarned : null}
              align="left"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.25)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex" }}>🎾 {session.title}</div>
          <div style={{ display: "flex", opacity: 0.85 }}>
            carsel.club/s/match/{matchId.slice(0, 8)}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function TeamCard({
  players,
  score,
  winner,
  completed,
  pointsEarned,
  align,
}: {
  players: Array<{
    name: string;
    avatarUrl: string | null;
    tierName: string | null;
    tierColor: string | null;
  }>;
  score: number;
  winner: boolean;
  completed: boolean;
  pointsEarned: number | null;
  align: "left" | "right";
}) {
  const alignItems = align === "right" ? "flex-end" : "flex-start";
  const textAlign = align;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems,
        gap: 14,
        flex: 1,
        maxWidth: 400,
      }}
    >
      {/* Player avatars + names */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems,
          width: "100%",
        }}
      >
        {players.map((p, i) => (
          <PlayerChip key={i} player={p} align={align} />
        ))}
      </div>

      {/* Score */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 130,
          lineHeight: 1,
          color: completed && winner ? "#FACC15" : "#fff",
          opacity: completed && !winner ? 0.7 : 1,
          textAlign,
          display: "flex",
        }}
      >
        {score}
      </div>

      {/* Points earned label */}
      {pointsEarned !== null && (
        <div
          style={{
            display: "flex",
            padding: "6px 14px",
            background: winner ? "#FACC15" : "rgba(255,255,255,0.18)",
            color: winner ? "#0F172A" : "#fff",
            borderRadius: 999,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          +{pointsEarned} pts
        </div>
      )}
    </div>
  );
}

function PlayerChip({
  player,
  align,
}: {
  player: {
    name: string;
    avatarUrl: string | null;
    tierName: string | null;
    tierColor: string | null;
  };
  align: "left" | "right";
}) {
  const avatarUrl = toAbsoluteUrl(player.avatarUrl);
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();
  const ringColor = player.tierColor ?? "rgba(255,255,255,0.4)";

  const avatar = (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: avatarUrl
          ? `url(${avatarUrl})`
          : "linear-gradient(135deg, #FB7185, #F43F5E)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: `2px solid ${ringColor}`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {!avatarUrl && initial}
    </div>
  );

  const text = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        textAlign: align,
        alignItems: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
        {player.name}
      </div>
      {player.tierName && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: player.tierColor ?? "#fff",
              display: "flex",
            }}
          />
          {player.tierName}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: align === "right" ? "row-reverse" : "row",
      }}
    >
      {avatar}
      {text}
    </div>
  );
}
