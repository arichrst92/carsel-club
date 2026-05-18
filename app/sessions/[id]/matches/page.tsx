import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  canUserViewSession,
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { MatchesSection } from "@/components/sessions/MatchesSection";

export const metadata = {
  title: "Matches",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionMatchesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const allowed = await canUserViewSession(id, user.id);
  if (!allowed) notFound();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  const { session, participants } = result;
  const staff = await isSessionStaff(id, user.id);
  const isTerminal =
    session.status === "completed" || session.status === "cancelled";

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href={`/sessions/${id}`}
          className="back-btn"
          aria-label="Back to detail"
        >
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
        <h2 className="subscreen-title">Matches</h2>
        <div style={{ width: 40 }} />
      </header>

      <main className="app-content subscreen">
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Session
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text-900)",
              marginTop: 2,
            }}
          >
            {session.title}
          </div>
        </div>

        <MatchesSection
          sessionId={session.id}
          sessionTitle={session.title}
          participants={participants}
          staff={staff}
          isTerminal={isTerminal}
        />
      </main>
    </div>
  );
}
