/**
 * Sprint 13 — Generate Match wizard page.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/generate-match.html
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 13
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { getNextRoundNumber } from "@/lib/db/queries/matches";
import { GenerateMatchConfig } from "@/components/sessions/GenerateMatchConfig";

export const metadata = { title: "Generate Match" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GenerateMatchPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  if (!(await isSessionStaff(id, user.id))) {
    redirect(`/sessions/${id}`);
  }

  const { session, participants } = result;

  // Soft-terminal block
  if (session.status === "completed" || session.status === "cancelled") {
    redirect(`/sessions/${id}`);
  }

  const nextRoundNumber = await getNextRoundNumber(id);

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href={`/sessions/${id}/matches`}
          className="back-btn"
          aria-label="Back"
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
        <h2 className="subscreen-title">Generate Round {nextRoundNumber}</h2>
        <div style={{ width: 40 }} />
      </header>

      <GenerateMatchConfig
        sessionId={session.id}
        sessionTitle={session.title}
        sessionFormat={session.format}
        sessionFixPartners={session.fixPartners}
        numCourts={session.numCourts}
        nextRoundNumber={nextRoundNumber}
        participants={participants}
      />
    </div>
  );
}
