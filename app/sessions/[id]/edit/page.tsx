/**
 * Sprint 18 — Edit session page.
 *
 * Lock rules enforced server-side (editSessionAction). Form di-render
 * dgn hasRounds untuk UI lock UX.
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, count } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import { sessions, matchRoundSets } from "@/lib/db/schema";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { EditSessionForm } from "@/components/sessions/EditSessionForm";

export const metadata = { title: "Edit Session" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  if (!(await isSessionStaff(id, user.id))) {
    redirect(`/sessions/${id}`);
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  if (!session) notFound();

  if (session.status === "cancelled" || session.status === "completed") {
    redirect(`/sessions/${id}`);
  }

  const [{ value: roundCount }] = await db
    .select({ value: count() })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, id));
  const hasRounds = roundCount > 0;

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href={`/sessions/${id}`}
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
        <h2 className="subscreen-title">Edit Session</h2>
        <div style={{ width: 40 }} />
      </header>

      <EditSessionForm
        sessionId={id}
        hasRounds={hasRounds}
        initial={{
          title: session.title,
          venueName: session.venueName ?? "",
          mapsUrl: session.mapsUrl,
          scheduledAt: session.scheduledAt,
          scheduledEndAt: session.scheduledEndAt,
          description: session.description,
          visibility: session.visibility,
          joinPolicy: session.joinPolicy,
          maxRounds: session.maxRounds,
          format: session.format,
          playType: session.playType,
          numCourts: session.numCourts,
          fixPartners: session.fixPartners,
        }}
      />
    </div>
  );
}
