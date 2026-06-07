import { ImageResponse } from "next/og";
import { getPublicSessionView } from "@/lib/db/queries/public-share";
import { getFullLogoDataUrl } from "@/lib/og/logo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateID(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;
  const data = await getPublicSessionView(id);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const { session, participants, totalRounds, currentMatches } = data;
  const logoUrl = await getFullLogoDataUrl();

  const top3 = [...participants]
    .filter((p) => p.sessionMatches > 0)
    .sort((a, b) => b.sessionPoints - a.sessionPoints)
    .slice(0, 3);

  const completedMatches = currentMatches.filter(
    (m) => m.status === "completed"
  ).length;

  const statusLabel =
    session.status === "live"
      ? "🔴 LIVE"
      : session.status === "completed"
        ? "✅ Selesai"
        : session.status === "cancelled"
          ? "❌ Dibatalkan"
          : "📅 Upcoming";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #14B8A6 0%, #0F766E 50%, #134E4A 100%)",
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
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(251,113,133,0.18)",
            display: "flex",
          }}
        />

        {/* Logo + Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Carsel Club" width={88} height={88} />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(255,255,255,0.22)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 30,
                }}
              >
                CC
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: 16,
                opacity: 0.85,
                fontWeight: 600,
              }}
            >
              Padel Community Indonesia
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

        {/* Title + Meta */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {session.title}
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 22,
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex" }}>
              📅 {formatDateID(session.scheduledAt)}
            </span>
            {session.venueName && (
              <span style={{ display: "flex" }}>📍 {session.venueName}</span>
            )}
          </div>
        </div>

        {/* Top 3 podium / Stats */}
        {top3.length === 3 ? (
          <div
            style={{
              marginTop: 36,
              display: "flex",
              gap: 16,
            }}
          >
            {top3.map((p, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const name = p.guestName ?? p.userDisplayName ?? "?";
              const raised = i === 0;
              return (
                <div
                  key={p.id}
                  style={{
                    flex: 1,
                    background: raised
                      ? "rgba(255,255,255,0.22)"
                      : "rgba(255,255,255,0.14)",
                    borderRadius: 20,
                    padding: "24px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    border: raised
                      ? "2px solid rgba(255,255,255,0.4)"
                      : "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  <div style={{ fontSize: 56, display: "flex" }}>
                    {medals[i]}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      textAlign: "center",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 36,
                      color: raised ? "#FACC15" : "#fff",
                    }}
                  >
                    {p.sessionPoints} pts
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      opacity: 0.85,
                      fontWeight: 600,
                    }}
                  >
                    {p.sessionWins}W · {p.sessionDraws}D · {p.sessionLosses}L
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              marginTop: 36,
              padding: "28px",
              background: "rgba(255,255,255,0.14)",
              borderRadius: 20,
              display: "flex",
              gap: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 18, opacity: 0.85, fontWeight: 700 }}>
                Players
              </div>
              <div style={{ fontSize: 40, fontWeight: 800 }}>
                {participants.length}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 18, opacity: 0.85, fontWeight: 700 }}>
                Round
              </div>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{totalRounds}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 18, opacity: 0.85, fontWeight: 700 }}>
                Court
              </div>
              <div style={{ fontSize: 40, fontWeight: 800 }}>
                {session.numCourts}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 18, opacity: 0.85, fontWeight: 700 }}>
                Match Selesai
              </div>
              <div style={{ fontSize: 40, fontWeight: 800 }}>
                {completedMatches}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              opacity: 0.85,
              display: "flex",
            }}
          >
            🎾 Live score & leaderboard
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              display: "flex",
            }}
          >
            carsel.club/s/{id.slice(0, 8)}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
