/**
 * Admin session search (Sprint 35).
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { searchSessions } from "@/lib/db/queries/admin";

export const metadata = {
  title: "Admin · Sessions",
};

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  upcoming: "var(--text-500)",
  live: "var(--danger-700, #b91c1c)",
  completed: "var(--success-700, #15803d)",
  cancelled: "var(--text-500)",
};

export default async function AdminSessions({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const rows = await searchSessions(q);

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/admin" className="back-btn" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">Sessions</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{ padding: "var(--s-4)" }}
      >
        <form method="get" action="/admin/sessions">
          <label htmlFor="q" className="sr-only">
            Search sessions
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search title / venue…"
            style={{
              width: "100%",
              padding: "var(--s-3) var(--s-4)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontSize: 14,
              background: "var(--bg-card)",
            }}
          />
        </form>

        <div
          style={{
            marginTop: "var(--s-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {rows.length === 0 ? (
            <div
              style={{
                padding: "var(--s-6)",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-500)",
                fontWeight: 600,
              }}
            >
              {q ? "No matches." : "Start typing to search."}
            </div>
          ) : (
            rows.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "var(--s-3) var(--s-4)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "var(--text-900)",
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: STATUS_COLOR[s.status],
                    }}
                  >
                    {s.status}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 600,
                  }}
                >
                  Host: {s.hostName ?? "—"} · {s.venueName ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 600,
                  }}
                >
                  {s.scheduledAt.toISOString().slice(0, 16).replace("T", " ")}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
