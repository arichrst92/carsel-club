import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, tierDefinitions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { acceptInviteAction } from "@/app/actions/invite";

export const metadata = {
  title: "Kamu diundang ke Carsel Club!",
};

type PageProps = {
  params: Promise<{ code: string }>;
};

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

export default async function InviteLandingPage({ params }: PageProps) {
  const { code } = await params;

  // If already logged in → home
  const session = await getSession();
  if (session) redirect("/home");

  // Lookup referrer
  const [referrer] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      tierName: tierDefinitions.name,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(eq(users.id, code))
    .limit(1);

  if (!referrer) notFound();

  const initial = (referrer.displayName.trim()[0] ?? "?").toUpperCase();
  const accept = acceptInviteAction.bind(null, code);

  return (
    <div className="app-shell">
      <main
        className="app-content"
        style={{
          paddingTop: "var(--s-6)",
          paddingBottom: "var(--s-6)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: "var(--s-5)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, var(--primary), var(--primary-600))",
              color: "#fff",
              borderRadius: "var(--r-md)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            CC
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-900)",
            }}
          >
            Carsel Club
          </div>
        </div>

        {/* Hero */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            padding: "var(--s-5)",
            borderRadius: "var(--r-2xl)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            marginBottom: "var(--s-4)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎾</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              lineHeight: 1.15,
              marginBottom: 6,
            }}
          >
            Kamu diundang oleh
            <br />
            {referrer.displayName}
          </div>
          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              fontWeight: 600,
              maxWidth: 320,
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            Join Carsel Club — Indonesia padel community
          </div>
        </section>

        {/* Referrer card */}
        <section
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--r-xl)",
            padding: "var(--s-4)",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s-3)",
            marginBottom: "var(--s-5)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #FB7185, #F43F5E)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              flexShrink: 0,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                color: "var(--text-900)",
              }}
            >
              {referrer.displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {TIER_EMOJI[referrer.tierName ?? "Rookie"]}{" "}
              {referrer.tierName ?? "Rookie"}
              {referrer.city && ` · ${referrer.city}`}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {referrer.totalPoints} pts · {referrer.totalMatches} match
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
            marginBottom: "var(--s-5)",
          }}
        >
          <Feature icon="🎯" title="Atur Session Padel" sub="Multi-court, auto match generator" />
          <Feature icon="🏆" title="Live Score + Leaderboard" sub="Tier system, ranking realtime" />
          <Feature icon="📱" title="Share Match Result" sub="WhatsApp invite + image card" />
        </section>

        {/* CTA */}
        <form action={accept} style={{ marginTop: "auto" }}>
          <button
            type="submit"
            className="btn-primary-lg"
            style={{ width: "100%" }}
          >
            <span>🎾 Daftar & Lihat Profil</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--s-3)",
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
          }}
        >
          Verifikasi cepat via WhatsApp · Gratis untuk circle padel kamu
        </p>

        <Link
          href="/login"
          style={{
            marginTop: "var(--s-3)",
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          Sudah punya akun? Login
        </Link>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "10px 14px",
        background: "var(--bg-soft)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-900)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
