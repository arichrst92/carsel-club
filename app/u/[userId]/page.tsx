/**
 * Public profile landing page (Sprint 12 minimal — Sprint 24 expand).
 *
 * Goal Sprint 12: og:image meta untuk profile share preview di WA/IG.
 * Sprint 24 nanti: full public profile dgn privacy controls.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/db/queries/public-profile";
import { winRate, toAbsoluteUrl } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import {
  isFollowing,
  isUserBlocked,
  countFollowers,
  countFollowing,
} from "@/lib/db/queries/social";
import { areFriends } from "@/lib/db/queries/friends";
import { FollowBlockActions } from "@/components/social/FollowBlockActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) return { title: "Profile" };

  const ogImage = `/api/og/profile/${userId}`;
  const title = `${profile.displayName} · Carsel Club`;
  const description = profile.tierName
    ? `${profile.tierName} · ${profile.totalPoints} pts · ${profile.totalMatches} matches`
    : `${profile.totalPoints} pts · ${profile.totalMatches} matches`;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  const profile = await getPublicProfile(userId);
  if (!profile) notFound();

  const session = await getSession();
  const isOwnProfile = session?.userId === userId;

  // Sprint 24: privacy enforcement
  const isFriend =
    session && !isOwnProfile
      ? await areFriends(session.userId, userId)
      : false;
  const canViewProfile =
    isOwnProfile ||
    profile.profileVisibility === "public" ||
    (profile.profileVisibility === "friends" && isFriend);

  if (!canViewProfile) {
    return <PrivateProfileView displayName={profile.displayName} />;
  }

  const wr = winRate(profile.totalWins, profile.totalMatches);
  const avatarUrl = toAbsoluteUrl(profile.avatarUrl);
  const initial = (profile.displayName.trim()[0] ?? "?").toUpperCase();

  // Sprint 23: social state
  const [followers, following, viewerFollowing, viewerBlocked] =
    await Promise.all([
      countFollowers(userId),
      countFollowing(userId),
      session ? isFollowing(session.userId, userId) : Promise.resolve(false),
      session ? isUserBlocked(session.userId, userId) : Promise.resolve(false),
    ]);

  return (
    <div className="app-shell">
      <main
        className="app-content"
        style={{ paddingBottom: "var(--s-6)" }}
      >
        {/* Hero */}
        <section
          style={{
            textAlign: "center",
            padding: "var(--s-6) var(--s-4)",
            background:
              "linear-gradient(180deg, var(--primary-50) 0%, transparent 100%)",
            borderRadius: "var(--r-2xl)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              margin: "0 auto var(--s-3)",
              borderRadius: "50%",
              background: profile.avatarUrl
                ? `url(${profile.avatarUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #FB7185, #F43F5E)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 48,
              boxShadow: "var(--shadow-md)",
              border: `5px solid ${profile.tierColor ?? "var(--bg)"}`,
            }}
          >
            {!avatarUrl && initial}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              color: "var(--text-900)",
              marginBottom: 8,
            }}
          >
            {profile.displayName}
          </h1>

          {profile.tierName && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: profile.tierColor ?? "var(--bg-soft)",
                color: "#0F172A",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              🏅 {profile.tierName}
            </div>
          )}

          {profile.city && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              📍 {profile.city}
            </div>
          )}

          {/* Follower / Following counts */}
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "var(--text-900)",
                }}
              >
                {followers}
              </span>{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                Followers
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "var(--text-900)",
                }}
              >
                {following}
              </span>{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                Following
              </span>
            </div>
          </div>
        </section>

        {/* Follow / Block — kalau auth + bukan profile sendiri */}
        {session && !isOwnProfile && (
          <section style={{ marginBottom: "var(--s-3)" }}>
            <FollowBlockActions
              targetUserId={userId}
              isFollowing={viewerFollowing}
              isBlocked={viewerBlocked}
            />
          </section>
        )}

        {/* Stats grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: "var(--s-4)",
          }}
        >
          <Stat label="Total Pts" value={profile.totalPoints} />
          <Stat label="Win Rate" value={`${wr}%`} />
          <Stat label="Matches" value={profile.totalMatches} />
        </section>

        {/* CTA */}
        <section
          style={{
            padding: "var(--s-4)",
            background: "var(--bg-soft)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--r-xl)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎾</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
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
            href={session ? "/home" : "/login"}
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
            {session ? "Open App" : "Sign Up Now"}
          </Link>
        </section>
      </main>
    </div>
  );
}

function PrivateProfileView({ displayName }: { displayName: string }) {
  return (
    <div className="app-shell">
      <main className="app-content">
        <div className="empty-state" style={{ marginTop: "var(--s-6)" }}>
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-title">Private Profile</div>
          <div className="empty-state-text">
            {displayName} chose not to display their profile publicly.
          </div>
          <Link
            href="/"
            style={{
              marginTop: "var(--s-3)",
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
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
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
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--text-900)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
