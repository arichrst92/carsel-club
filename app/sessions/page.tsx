import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listMySessions } from "@/lib/db/queries/sessions";
import { SessionCard } from "@/components/sessions/SessionCard";
import { BottomNav } from "@/components/nav/BottomNav";

export const metadata = {
  title: "My Sessions",
};

export default async function SessionsPage() {
  const user = await requireUser();
  const allSessions = await listMySessions(user.id);

  const active = allSessions.filter(
    (s) => s.status === "upcoming" || s.status === "live"
  );
  const done = allSessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled"
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">My Sessions</span>
        </div>
        <div className="header-actions">
          <Link
            href="/sessions/new"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-full)",
              background: "var(--primary-500, var(--primary))",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "var(--shadow-fab)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Baru
          </Link>
        </div>
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {allSessions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {active.length > 0 && (
              <Section title="Aktif">
                {active.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </Section>
            )}

            {done.length > 0 && (
              <Section title="Selesai">
                {done.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </Section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="section-head">
        <h3>{title}</h3>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🎾</div>
      <div className="empty-state-title">Belum ada session</div>
      <div className="empty-state-text">
        Buat session pertama kamu dan undang teman lewat WhatsApp.
      </div>
      <Link
        href="/sessions/new"
        style={{
          marginTop: "var(--s-4)",
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: "var(--r-full)",
          background: "var(--primary, var(--primary-500))",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 14,
          boxShadow: "var(--shadow-fab)",
          textDecoration: "none",
        }}
      >
        Buat Session Pertama
      </Link>
    </div>
  );
}
