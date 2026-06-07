/**
 * Manage Pairs page (Sprint 52 — Fix Partners).
 *
 * Lets the host/co-host assign fixed pairs before generating Round 1.
 * Only accessible when:
 *   - session.fixPartners = true
 *   - No rounds have been generated yet
 *   - Viewer is host/co-host
 *
 * Drag-and-drop: drag a player onto a "slot" inside a pair card; once both
 * slots are filled, the assignPairAction fires server-side.
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import {
  matchRoundSets,
  sessionParticipants,
  sessions,
  users,
} from "@/lib/db/schema";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { ManagePairs } from "@/components/sessions/ManagePairs";

export const metadata = { title: "Manage Pairs" };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ManagePairsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  // Load session
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  if (!session) notFound();

  if (!(await isSessionStaff(id, user.id))) {
    redirect(`/sessions/${id}`);
  }
  if (!session.fixPartners) {
    redirect(`/sessions/${id}`);
  }

  // Block when rounds exist
  const [{ value: roundCount }] = await db
    .select({ value: count() })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, id));
  if (roundCount > 0) {
    redirect(`/sessions/${id}`);
  }

  // Load all participants with display info
  const rows = await db
    .select({
      id: sessionParticipants.id,
      userId: sessionParticipants.userId,
      userDisplayName: users.displayName,
      guestName: sessionParticipants.guestName,
      role: sessionParticipants.role,
      isPlaying: sessionParticipants.isPlaying,
      avatarUrl: users.avatarUrl,
      pairKey: sessionParticipants.pairKey,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .where(
      and(
        eq(sessionParticipants.sessionId, id),
        eq(sessionParticipants.isPlaying, true)
      )
    );

  const participants = rows.map((r) => ({
    id: r.id,
    name: r.userDisplayName ?? r.guestName ?? "Player",
    avatarUrl: r.avatarUrl,
    role: r.role,
    pairKey: r.pairKey,
  }));

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
        <h2 className="subscreen-title">Manage Pairs</h2>
        <div style={{ width: 40 }} />
      </header>

      <ManagePairs sessionId={id} participants={participants} />
    </div>
  );
}
