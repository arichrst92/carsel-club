/**
 * Portrait share card untuk session (Sprint 48).
 *
 * Format 1080×1920 (IG Story / WA Status friendly).
 * Berisi: cover photo (atau gradient fallback) + detail session +
 * top 5 leaderboard.
 *
 * Berbeda dari `/api/og/session/[id]` yang 1200×630 untuk WA link preview.
 *
 * Catatan teknis next/og (Satori):
 * - `backdrop-filter` TIDAK didukung → jangan dipakai (crash 500).
 * - `<img src>` butuh URL yang fully-qualified & dapat di-fetch oleh
 *   Satori. Lebih aman: fetch sendiri jadi data URL.
 *
 * Refs:
 * - DB: getPublicSessionView + listSessionLeaderboard
 */

import { ImageResponse } from "next/og";
import { getPublicSessionView } from "@/lib/db/queries/public-share";
import { listSessionLeaderboard } from "@/lib/db/queries/session-leaderboard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateID(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeID(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Resolve cover URL ke absolute URL berdasarkan request host
 * (lebih reliable daripada env var di dev).
 */
function resolveCoverAbsolute(
  rawUrl: string | null,
  req: Request
): string | null {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
    return rawUrl;
  const reqUrl = new URL(req.url);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? `${reqUrl.protocol}//${reqUrl.host}`;
  return `${origin.replace(/\/+$/, "")}${
    rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`
  }`;
}

/**
 * Fetch cover image as data URL — Satori-safe.
 * Returns null kalau gagal (fallback ke gradient).
 */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      // 5s safety timeout via AbortSignal
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    const ct = r.headers.get("content-type") ?? "image/jpeg";
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

const STATUS_BG: Record<string, string> = {
  upcoming: "#F59E0B",
  live: "#EF4444",
  completed: "#15803D",
  cancelled: "#6B7280",
};

const STATUS_LABEL: Record<string, string> = {
  upcoming: "📅 Upcoming",
  live: "🔴 LIVE",
  completed: "✅ Selesai",
  cancelled: "❌ Dibatalkan",
};

export async function GET(req: Request, { params }: Props) {
  const { id } = await params;
  const data = await getPublicSessionView(id);
  if (!data) return new Response("Not found", { status: 404 });

  const { session } = data;
  const lb = await listSessionLeaderboard(id);
  const top = lb
    .filter((r) => r.isPlaying)
    .sort((a, b) => b.sessionPoints - a.sessionPoints)
    .slice(0, 5);

  const absoluteCover = resolveCoverAbsolute(
    session.coverPhotoUrl ?? null,
    req
  );
  const coverDataUrl = absoluteCover
    ? await fetchAsDataUrl(absoluteCover)
    : null;
  const completedMatches = data.currentMatches.filter(
    (m) => m.status === "completed"
  ).length;
  const status = session.status ?? "upcoming";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #14B8A6 0%, #0F766E 60%, #134E4A 100%)",
          color: "#fff",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Cover image (top 35%) */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: "100%",
            height: "35%",
            overflow: "hidden",
          }}
        >
          {coverDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverDataUrl}
              alt="cover"
              width="1080"
              height="672"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(135deg, #FB7185 0%, #F43F5E 50%, #BE123C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 200,
              }}
            >
              🎾
            </div>
          )}
          {/* Gradient overlay bawah cover */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 200,
              background:
                "linear-gradient(180deg, rgba(15,118,110,0) 0%, rgba(15,118,110,0.95) 100%)",
              display: "flex",
            }}
          />

          {/* Status badge atas-kanan */}
          <div
            style={{
              position: "absolute",
              top: 36,
              right: 36,
              padding: "12px 24px",
              borderRadius: 999,
              background: STATUS_BG[status] ?? STATUS_BG.upcoming,
              color: "#fff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.04em",
              display: "flex",
              boxShadow: "0 4px 18px rgba(0,0,0,0.25)",
            }}
          >
            {STATUS_LABEL[status] ?? STATUS_LABEL.upcoming}
          </div>

          {/* Logo brand atas-kiri */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 36,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 20px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.28)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: "#fff",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 26,
                color: "#0F766E",
              }}
            >
              CC
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 28,
                color: "#fff",
                display: "flex",
              }}
            >
              Carsel Club
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px 56px 56px",
            flex: 1,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontWeight: 900,
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginBottom: 18,
              display: "flex",
            }}
          >
            {session.title}
          </div>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 30,
              opacity: 0.92,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            <span style={{ display: "flex" }}>
              {formatDateID(session.scheduledAt)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 26,
              opacity: 0.85,
              fontWeight: 600,
              marginBottom: 36,
            }}
          >
            <span style={{ display: "flex" }}>
              {formatTimeID(session.scheduledAt)} WIB
            </span>
            {session.venueName && (
              <span style={{ display: "flex" }}>· {session.venueName}</span>
            )}
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 36,
            }}
          >
            <StatTile
              label="Pemain"
              value={String(top.length || lb.length)}
            />
            <StatTile label="Match" value={String(completedMatches)} />
            <StatTile label="Format" value={session.format} text />
          </div>

          {/* Leaderboard */}
          {top.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 32,
                  opacity: 0.9,
                  marginBottom: 6,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                Leaderboard
              </div>
              {top.map((p, i) => {
                const medals = ["1.", "2.", "3."];
                return (
                  <div
                    key={p.participantId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: "16px 24px",
                      background:
                        i === 0
                          ? "rgba(255,255,255,0.22)"
                          : "rgba(255,255,255,0.12)",
                      borderRadius: 16,
                      border:
                        i === 0
                          ? "2px solid rgba(255,255,255,0.5)"
                          : "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        fontSize: i < 3 ? 36 : 30,
                        fontWeight: 900,
                        display: "flex",
                        justifyContent: "center",
                        color: i === 0 ? "#FACC15" : "#fff",
                      }}
                    >
                      {i < 3 ? medals[i] : `${i + 1}.`}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 32,
                          display: "flex",
                        }}
                      >
                        {p.displayName}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          opacity: 0.85,
                          fontWeight: 600,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        {p.sessionWins}W · {p.sessionDraws}D · {p.sessionLosses}L
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 44,
                        fontWeight: 900,
                        color: i === 0 ? "#FACC15" : "#fff",
                        display: "flex",
                      }}
                    >
                      {p.sessionPoints}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: "32px",
                background: "rgba(255,255,255,0.14)",
                borderRadius: 20,
                fontSize: 28,
                fontWeight: 700,
                opacity: 0.85,
                display: "flex",
                justifyContent: "center",
              }}
            >
              Match belum dimulai
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                opacity: 0.85,
                display: "flex",
              }}
            >
              Live score & info
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                display: "flex",
              }}
            >
              carsel.club/s/{id.slice(0, 8)}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );
}

function StatTile({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.18)",
        borderRadius: 18,
        padding: "20px 16px",
        border: "1px solid rgba(255,255,255,0.22)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize: text ? 30 : 48,
          fontWeight: 900,
          lineHeight: 1,
          textTransform: text ? "capitalize" : undefined,
          display: "flex",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 18,
          opacity: 0.85,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 8,
          display: "flex",
        }}
      >
        {label}
      </div>
    </div>
  );
}
