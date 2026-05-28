import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listPublicSessions } from "@/lib/db/queries/find-sessions";
import { BottomNav } from "@/components/nav/BottomNav";
import { formatDate, formatTimeRange } from "@/lib/utils";

export const metadata = {
  title: "Find Session",
};

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function FindSessionPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const cityFilter = params.city ?? user.city ?? null;

  const sessions = await listPublicSessions({
    city: cityFilter,
    excludeUserId: user.id,
  });

  // Also get all-Indonesia count for stats
  const allSessions = await listPublicSessions({
    excludeUserId: user.id,
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Find Session</span>
        </div>
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* Hero */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "var(--s-5)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 4 }}>🔍</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 2,
            }}
          >
            Find Public Sessions
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
            {allSessions.length} session aktif di Indonesia
          </div>
        </section>

        {/* Filter */}
        <section
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            margin: "var(--s-2) 0",
          }}
        >
          <FilterPill
            label={cityFilter ? `📍 ${cityFilter}` : "🇮🇩 Semua kota"}
            active={!!cityFilter}
            href="/find"
            altLabel="Reset"
          />
          {user.city && (
            <FilterPill
              label={`📍 ${user.city} (kotamu)`}
              active={cityFilter === user.city}
              href={`/find?city=${encodeURIComponent(user.city)}`}
            />
          )}
        </section>

        {/* List */}
        <section>
          <div className="section-head">
            <h3>
              {cityFilter ? `Di ${cityFilter}` : "Semua Kota"} ({sessions.length})
            </h3>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">
                Tidak ada public session aktif
              </div>
              <div className="empty-state-text">
                {cityFilter
                  ? "Coba reset filter atau create session sendiri di kota kamu."
                  : "Be the first — create public session untuk komunitas padel!"}
              </div>
              <Link
                href="/sessions/new"
                style={{
                  marginTop: "var(--s-4)",
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "var(--r-full)",
                  background: "var(--primary)",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                + Create Public Session
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-3)",
              }}
            >
              {sessions.map((s) => (
                <PublicSessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function FilterPill({
  label,
  active,
  href,
  altLabel,
}: {
  label: string;
  active: boolean;
  href: string;
  altLabel?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--r-full)",
        background: active ? "var(--primary)" : "var(--bg)",
        color: active ? "#fff" : "var(--text-700)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 12,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {active && altLabel ? altLabel : label}
    </Link>
  );
}

function PublicSessionCard({
  session,
}: {
  session: {
    id: string;
    title: string;
    venueName: string | null;
    coverPhotoUrl: string | null;
    scheduledAt: Date | string;
    scheduledEndAt: Date | string | null;
    format: string;
    numCourts: number;
    status: string;
    hostName: string | null;
    hostCity: string | null;
    participantCount: number;
    isAlreadyMember: boolean;
  };
}) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="session-card"
      style={{ display: "block", textDecoration: "none" }}
    >
      <div className="session-banner">
        <div className="session-banner-text">
          <div className="session-banner-tag">
            🌍 {session.status === "live" ? "LIVE NOW" : "Public"}
          </div>
          <div className="session-banner-title">{session.title}</div>
        </div>
      </div>
      <div className="session-body">
        <div className="session-meta">
          {session.venueName && (
            <div className="session-meta-row">
              <svg
                width="16"
                height="16"
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
                {session.venueName}
                {session.hostCity && ` · ${session.hostCity}`}
              </span>
            </div>
          )}
          <div className="session-meta-row">
            <svg
              width="16"
              height="16"
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
          <div className="session-meta-row">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            </svg>
            <span>
              Host: {session.hostName ?? "—"} · {session.participantCount}{" "}
              pemain
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: "var(--s-3)",
            paddingTop: "var(--s-3)",
            borderTop: "1px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ textTransform: "capitalize" }}>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "var(--r-full)",
                background: "var(--primary-50)",
                color: "var(--primary-700)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {session.format} · {session.numCourts} court
              {session.numCourts > 1 ? "s" : ""}
            </span>
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: session.isAlreadyMember
                ? "var(--text-500)"
                : "var(--primary-700)",
            }}
          >
            {session.isAlreadyMember ? "✓ Joined" : "Tap to view →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
