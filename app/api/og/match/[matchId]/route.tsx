import { ImageResponse } from "next/og";
import { getPublicMatchView } from "@/lib/db/queries/public-share";
import { team1Won, team2Won } from "@/lib/match/detail-helpers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ matchId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { matchId } = await params;
  const data = await getPublicMatchView(matchId);
  if (!data) return new Response("Not found", { status: 404 });

  const { match, round, session, players } = data;
  const team1 = players.filter((p) => p.side === "team1");
  const team2 = players.filter((p) => p.side === "team2");
  const t1Names = team1.map((p) => p.name).join(" & ") || "?";
  const t2Names = team2.map((p) => p.name).join(" & ") || "?";
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const t1W = team1Won(match.team1Score, match.team2Score);
  const t2W = team2Won(match.team1Score, match.team2Score);

  const statusLabel = isLive
    ? "🔴 LIVE"
    : isCompleted
      ? "✅ Final"
      : "⏳ Pending";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: isCompleted
            ? "linear-gradient(135deg, #14B8A6 0%, #0F766E 50%, #134E4A 100%)"
            : "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "rgba(255,255,255,0.22)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 26,
              }}
            >
              CC
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: 28 }}>Carsel Club</div>
              <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 600 }}>
                Court {match.courtNumber} · Round {round.number}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              background: "rgba(255,255,255,0.22)",
              borderRadius: 999,
              fontSize: 20,
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
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 60,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <TeamSide
              names={t1Names}
              score={match.team1Score}
              winner={t1W}
              completed={isCompleted}
              align="right"
            />
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                opacity: 0.4,
              }}
            >
              –
            </div>
            <TeamSide
              names={t2Names}
              score={match.team2Score}
              winner={t2W}
              completed={isCompleted}
              align="left"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.2)",
            fontSize: 18,
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

function TeamSide({
  names,
  score,
  winner,
  completed,
  align,
}: {
  names: string;
  score: number;
  winner: boolean;
  completed: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: 12,
        flex: 1,
        maxWidth: 380,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 24,
          opacity: 0.95,
          maxWidth: "100%",
          textAlign: align,
          display: "flex",
        }}
      >
        {names}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 140,
          lineHeight: 1,
          color: completed && winner ? "#FACC15" : "#fff",
          opacity: completed && !winner ? 0.7 : 1,
        }}
      >
        {score}
      </div>
    </div>
  );
}
