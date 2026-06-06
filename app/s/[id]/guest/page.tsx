/**
 * Sprint 19 — Public guest join landing page.
 *
 * Visitor enter name → join session sebagai guest tanpa signup.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/guest-join.html
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getGuestSessionFor } from "@/lib/auth/guest-session";
import { GuestJoinForm } from "@/components/sessions/GuestJoinForm";
import { formatDate, formatTimeRange } from "@/lib/utils";

export const metadata = { title: "Join as Guest" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function GuestJoinPage({ params }: PageProps) {
  const { id } = await params;

  const [session] = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      venueName: sessions.venueName,
      scheduledAt: sessions.scheduledAt,
      scheduledEndAt: sessions.scheduledEndAt,
      status: sessions.status,
      hostName: users.displayName,
    })
    .from(sessions)
    .leftJoin(users, eq(users.id, sessions.hostId))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session) notFound();

  const isTerminal =
    session.status === "completed" || session.status === "cancelled";
  const authSession = await getSession();
  const existingGuest = await getGuestSessionFor(id);

  return (
    <div className="app-shell">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--s-3) var(--s-4)",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Carsel Club</span>
        </div>
        <Link
          href={`/s/${id}`}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--r-full)",
            background: "var(--bg-soft)",
            color: "var(--text-700)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 11,
            textDecoration: "none",
          }}
        >
          Lihat Session
        </Link>
      </header>

      <main className="app-content" style={{ paddingBottom: "var(--s-6)" }}>
        {/* Session hero */}
        <section
          style={{
            padding: "var(--s-5)",
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            boxShadow: "var(--shadow-md)",
            marginBottom: "var(--s-4)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              opacity: 0.85,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            🎾 Diundang ke session padel
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 8,
            }}
          >
            {session.title}
          </h1>
          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            📅 {formatDate(session.scheduledAt)} ·{" "}
            {formatTimeRange(session.scheduledAt, session.scheduledEndAt)}
          </div>
          {session.venueName && (
            <div
              style={{
                fontSize: 13,
                opacity: 0.9,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              📍 {session.venueName}
            </div>
          )}
          {session.hostName && (
            <div
              style={{
                fontSize: 12,
                opacity: 0.85,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              Host: {session.hostName}
            </div>
          )}
        </section>

        {isTerminal ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚫</div>
            <div className="empty-state-title">Session sudah selesai</div>
            <div className="empty-state-text">
              Session ini sudah {session.status === "completed" ? "selesai" : "dibatalkan"}, tidak bisa join.
            </div>
          </div>
        ) : existingGuest ? (
          <section
            style={{
              padding: "var(--s-4)",
              background: "var(--primary-50)",
              border: "1px solid var(--primary-100)",
              borderRadius: "var(--r-md)",
              marginBottom: "var(--s-3)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 14,
                color: "var(--primary-700)",
                marginBottom: 4,
              }}
            >
              ✓ Kamu sudah join sebagai {existingGuest.name}
            </div>
            <Link
              href={`/s/${id}`}
              style={{
                display: "inline-block",
                marginTop: 8,
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
              Lihat Live View →
            </Link>
          </section>
        ) : (
          <>
            <GuestJoinForm sessionId={id} />

            {/* Member alternative */}
            <div
              style={{
                marginTop: "var(--s-4)",
                padding: "var(--s-4)",
                background: "var(--bg-soft)",
                border: "1px dashed var(--border)",
                borderRadius: "var(--r-lg)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 13,
                  color: "var(--text-900)",
                  marginBottom: 4,
                }}
              >
                Sudah punya akun?
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-500)",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Akun member dapat tier, leaderboard global, match history,
                dan profile share.
              </div>
              <Link
                href={
                  authSession
                    ? `/sessions/${id}`
                    : `/login?next=${encodeURIComponent(`/sessions/${id}`)}`
                }
                style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  borderRadius: "var(--r-full)",
                  background: "var(--bg)",
                  color: "var(--text-900)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {authSession ? "Buka di App" : "Login / Daftar"}
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
