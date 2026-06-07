/**
 * OG image untuk profile share (Sprint 12).
 *
 * Layout:
 * - Hero: avatar (96x96) dengan tier-color ring + name + tier badge
 * - Stats grid: total points · win rate · matches played
 * - Footer: city + carsel.club brand
 */

import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/db/queries/public-profile";
import { winRate } from "@/lib/utils";
import { toAbsoluteUrl } from "@/lib/utils";
import { getFullLogoDataUrl } from "@/lib/og/logo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) return new Response("Not found", { status: 404 });

  const wr = winRate(profile.totalWins, profile.totalMatches);
  const avatarUrl = toAbsoluteUrl(profile.avatarUrl);
  const logoUrl = await getFullLogoDataUrl();
  const initial = (profile.displayName.trim()[0] ?? "?").toUpperCase();
  const tierColor = profile.tierColor ?? "#94a3b8";

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

        {/* Logo strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Carsel Club" width={72} height={72} />
            ) : (
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
            )}
            <div
              style={{
                display: "flex",
                fontSize: 13,
                opacity: 0.85,
                fontWeight: 600,
              }}
            >
              Padel Community Indonesia
            </div>
          </div>
        </div>

        {/* Hero: avatar + name + tier */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 40,
            marginTop: 16,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: avatarUrl
                ? `url(${avatarUrl})`
                : "linear-gradient(135deg, #FB7185, #F43F5E)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: `8px solid ${tierColor}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 72,
              flexShrink: 0,
            }}
          >
            {!avatarUrl && initial}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.05,
              }}
            >
              {profile.displayName}
            </div>

            {profile.tierName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  background: tierColor,
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 800,
                  width: "fit-content",
                  color: "#0F172A",
                }}
              >
                <span style={{ display: "flex" }}>🏅</span>
                {profile.tierName}
              </div>
            )}

            {profile.city && (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  opacity: 0.85,
                  fontWeight: 600,
                }}
              >
                📍 {profile.city}
              </div>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          <StatTile label="Total Points" value={profile.totalPoints} />
          <StatTile label="Win Rate" value={`${wr}%`} />
          <StatTile label="Matches" value={profile.totalMatches} />
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
          <div style={{ display: "flex" }}>
            🎾 {profile.totalWins}W · {profile.totalDraws}D ·{" "}
            {profile.totalLosses}L
          </div>
          <div style={{ display: "flex", opacity: 0.85 }}>
            carsel.club/u/{userId.slice(0, 8)}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 24px",
        background: "rgba(255,255,255,0.14)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          opacity: 0.85,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "flex",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1,
          display: "flex",
        }}
      >
        {value}
      </div>
    </div>
  );
}
