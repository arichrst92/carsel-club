/**
 * Admin user search (Sprint 35).
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { searchUsers } from "@/lib/db/queries/admin";

export const metadata = {
  title: "Admin · Users",
};

export const dynamic = "force-dynamic";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const rows = await searchUsers(q);

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
        <h2 className="subscreen-title">Users</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{ padding: "var(--s-4)" }}
      >
        <form method="get" action="/admin/users">
          <label htmlFor="q" className="sr-only">
            Search users
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search name / WA number / city…"
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
            rows.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-3)",
                  padding: "var(--s-3) var(--s-4)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "var(--text-900)",
                    }}
                  >
                    {u.displayName}
                    {u.isAdmin && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          fontWeight: 800,
                          color: "var(--primary-700)",
                          background: "var(--primary-50)",
                          borderRadius: "var(--r-sm)",
                          padding: "2px 5px",
                          letterSpacing: 0.5,
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-500)",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {u.whatsappNumber} · {u.city ?? "—"}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 700,
                  }}
                >
                  {u.totalMatches} matches
                  <div style={{ fontWeight: 800, color: "var(--text-900)" }}>
                    {u.totalPoints} pts
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
