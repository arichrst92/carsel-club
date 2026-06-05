/**
 * OG image untuk tier-up celebration (Sprint 12).
 *
 * Layout: big tier name + emoji center stage, "You've reached X tier!"
 * vibe, user name + avatar di footer.
 */

import { ImageResponse } from "next/og";
import {
  getPublicProfile,
  getTierById,
} from "@/lib/db/queries/public-profile";
import { toAbsoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string; tierId: string }> };

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

export async function GET(_req: Request, { params }: Props) {
  const { userId, tierId: tierIdStr } = await params;
  const tierId = parseInt(tierIdStr, 10);
  if (!Number.isFinite(tierId)) {
    return new Response("Invalid tier", { status: 400 });
  }

  const [profile, tier] = await Promise.all([
    getPublicProfile(userId),
    getTierById(tierId),
  ]);
  if (!profile || !tier) {
    return new Response("Not found", { status: 404 });
  }

  const avatarUrl = toAbsoluteUrl(profile.avatarUrl);
  const initial = (profile.displayName.trim()[0] ?? "?").toUpperCase();
  const tierColor = tier.color ?? "#9333ea";
  const emoji = TIER_EMOJI[tier.name] ?? "🎉";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 40%, ${tierColor}33, #0F172A 70%)`,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Decorative ring */}
        <div
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: "translateX(-50%)",
            width: 480,
            height: 480,
            borderRadius: "50%",
            border: `4px solid ${tierColor}`,
            opacity: 0.25,
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              CC
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, display: "flex" }}>
              Carsel Club
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            🎉 TIER UP
          </div>
        </div>

        {/* Center: emoji + tier name */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 180,
              lineHeight: 1,
              display: "flex",
              filter: `drop-shadow(0 8px 24px ${tierColor})`,
            }}
          >
            {emoji}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              opacity: 0.85,
              display: "flex",
            }}
          >
            You&apos;ve reached
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: tierColor,
              textShadow: `0 4px 12px ${tierColor}80`,
              display: "flex",
            }}
          >
            {tier.name}
          </div>
        </div>

        {/* Footer: avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 20px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: avatarUrl
                ? `url(${avatarUrl})`
                : "linear-gradient(135deg, #FB7185, #F43F5E)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: `3px solid ${tierColor}`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 26,
              flexShrink: 0,
            }}
          >
            {!avatarUrl && initial}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 4,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, display: "flex" }}>
              {profile.displayName}
            </div>
            <div
              style={{
                fontSize: 15,
                opacity: 0.85,
                fontWeight: 600,
                display: "flex",
              }}
            >
              {profile.totalPoints} pts · {profile.totalMatches} matches
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              opacity: 0.85,
              display: "flex",
            }}
          >
            carsel.club
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
