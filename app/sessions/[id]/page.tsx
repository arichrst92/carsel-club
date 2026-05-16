import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  canUserViewSession,
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { cancelSessionAction } from "@/app/actions/sessions";
import {
  formatDate,
  formatTimeRange,
  formatDuration,
} from "@/lib/utils";
import { ParticipantRow } from "@/components/sessions/ParticipantRow";
import { MatchesSection } from "@/components/sessions/MatchesSection";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await getSessionWithParticipants(id);
  return {
    title: result?.session.title ?? "Session",
  };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const allowed = await canUserViewSession(id, user.id);
  if (!allowed) notFound();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  const { session, participants } = result;
  const staff = await isSessionStaff(id, user.id);

  const STATUS_STYLES = {
    upcoming: { label: "Upcoming", color: "bg-sky-50 text-sky" },
    live: { label: "Live", color: "bg-accent-50 text-accent-600" },
    completed: { label: "Selesai", color: "bg-bg-soft text-text-500" },
    cancelled: { label: "Dibatalkan", color: "bg-bg-soft text-text-400" },
  } as const;

  const status = STATUS_STYLES[session.status];
  const isTerminal =
    session.status === "completed" || session.status === "cancelled";

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-bg sticky top-0 z-10">
        <Link
          href="/sessions"
          className="text-sm font-bold text-text-700 hover:text-primary-600"
        >
          ← Sessions
        </Link>
        <Image
          src="/logo-icon.png"
          alt="Carsel Club"
          width={1024}
          height={1024}
          className="w-7 h-auto"
        />
        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 py-5 space-y-5">
        {/* Header card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-display font-bold text-2xl leading-tight">
              {session.title}
            </h1>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white text-primary-700`}
            >
              {status.label}
            </span>
          </div>

          {session.venueName && (
            <p className="text-sm opacity-90 font-semibold mb-2">
              📍 {session.venueName}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold opacity-95">
            <span>📅 {formatDate(session.scheduledAt)}</span>
            <span>
              ⏰ {formatTimeRange(session.scheduledAt, session.scheduledEndAt)}
            </span>
            {session.scheduledEndAt && (
              <span>
                ·{" "}
                {formatDuration(
                  Math.round(
                    (new Date(session.scheduledEndAt).getTime() -
                      new Date(session.scheduledAt).getTime()) /
                      60000
                  )
                )}
              </span>
            )}
            <span>
              🏟️ {session.numCourts} court{session.numCourts > 1 ? "s" : ""}
            </span>
            <span className="uppercase tracking-wide">{session.format}</span>
            {session.fixPartners && <span>· Fix Partners</span>}
          </div>
        </div>

        {/* Description */}
        {session.description && (
          <div className="rounded-xl bg-bg-soft border border-border-light p-4">
            <p className="text-sm text-text-700 whitespace-pre-wrap">
              {session.description}
            </p>
          </div>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-bold text-text-900 uppercase tracking-wide">
              Pemain ({participants.length})
            </h2>
            {staff && !isTerminal && (
              <Link
                href={`/sessions/${session.id}/participants`}
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                + Tambah
              </Link>
            )}
          </div>
          <ul className="space-y-2">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                sessionId={session.id}
                canManage={staff && !isTerminal}
              />
            ))}
          </ul>
        </div>

        {/* Matches */}
        <MatchesSection
          sessionId={session.id}
          participants={participants}
          staff={staff}
          isTerminal={isTerminal}
        />

        {/* Staff actions */}
        {staff && !isTerminal && (
          <div className="pt-4 border-t border-border-light">
            <form action={cancelSessionFormAction.bind(null, session.id)}>
              <button
                type="submit"
                className="w-full py-3 rounded-xl border border-accent-100 text-accent-600 text-sm font-bold hover:bg-accent-50 transition"
              >
                Cancel Session
              </button>
            </form>
          </div>
        )}

        {/* Debug */}
        <details className="rounded-xl bg-bg-soft border border-border-light p-4 text-xs">
          <summary className="font-bold text-text-700 cursor-pointer">
            Debug: Session data
          </summary>
          <pre className="mt-2 text-text-500 overflow-auto">
            {JSON.stringify({ session, participants }, null, 2)}
          </pre>
        </details>
      </main>
    </div>
  );
}

// Server Action wrapper that accepts sessionId (for form bind)
async function cancelSessionFormAction(sessionId: string, _formData: FormData) {
  "use server";
  await cancelSessionAction(sessionId);
}
