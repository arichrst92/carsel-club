import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  canUserViewSession,
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { getRoundsWithMatches } from "@/lib/db/queries/matches";
import { getBracketForSession } from "@/lib/db/queries/bracket";
import { BracketView } from "@/components/tournament/BracketView";
import { GenerateBracketButton } from "@/components/tournament/GenerateBracketButton";
import { formatDate, formatTimeRange } from "@/lib/utils";
import { ParticipantRow } from "@/components/sessions/ParticipantRow";
import { CancelSessionButton } from "@/components/sessions/CancelSessionButton";
import { GenerateRoundButton } from "@/components/sessions/GenerateRoundButton";
import { SessionShareActions } from "@/components/sessions/SessionShareActions";
import { JoinPublicSessionButton } from "@/components/sessions/JoinPublicSessionButton";
import { StartSessionButton } from "@/components/sessions/StartSessionButton";
import { EndSessionButton } from "@/components/sessions/EndSessionButton";
import { ReopenSessionButton } from "@/components/sessions/ReopenSessionButton";
import { SessionStatusTimeline } from "@/components/sessions/SessionStatusTimeline";
import { CoverPhotoUploader } from "@/components/sessions/CoverPhotoUploader";
import { GroupPhotoGallery } from "@/components/sessions/GroupPhotoGallery";
import { listGroupPhotos } from "@/lib/db/queries/session-photos";
import { JoinRequestInbox } from "@/components/sessions/JoinRequestInbox";
import {
  listPendingJoinRequests,
  getRequestStatusForUser,
} from "@/lib/db/queries/join-requests";

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

const STATUS_LABEL: Record<
  "upcoming" | "live" | "completed" | "cancelled",
  { label: string; icon: string }
> = {
  upcoming: { label: "Upcoming", icon: "📅" },
  live: { label: "Live", icon: "🔴" },
  completed: { label: "Selesai", icon: "✅" },
  cancelled: { label: "Dibatalkan", icon: "❌" },
};

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const allowed = await canUserViewSession(id, user.id);
  if (!allowed) notFound();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  const { session, participants } = result;
  const staff = await isSessionStaff(id, user.id);
  const rounds = await getRoundsWithMatches(id);
  // Sprint 31: tournament bracket data
  const bracketData =
    result.session.format === "tournament"
      ? await getBracketForSession(id)
      : null;
  const groupPhotos = await listGroupPhotos(id);
  const isParticipant = participants.some((p) => p.userId === user.id);
  const pendingRequests = staff ? await listPendingJoinRequests(id) : [];
  const myRequestStatus = !isParticipant
    ? await getRequestStatusForUser(id, user.id)
    : null;
  const canJoinPublic =
    !isParticipant &&
    session.visibility === "public" &&
    (session.status === "upcoming" || session.status === "live");

  const isTerminal =
    session.status === "completed" || session.status === "cancelled";
  const statusInfo = STATUS_LABEL[session.status];
  const cohostCount = participants.filter((p) => p.role === "co_host").length;
  const activeCount = participants.filter((p) => p.isPlaying).length;
  const completedMatches = rounds.reduce(
    (acc, r) => acc + r.matches.filter((m) => m.status === "completed").length,
    0
  );
  const totalMatches = rounds.reduce((acc, r) => acc + r.matches.length, 0);
  const pendingMatches = totalMatches - completedMatches;
  const nextRoundNumber = (rounds.at(-1)?.roundNumber ?? 0) + 1;
  const hasRounds = rounds.length > 0;

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/sessions" className="back-btn" aria-label="Back">
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
        <h2 className="subscreen-title">Session Detail</h2>
        {staff && !isTerminal ? (
          <Link
            href={`/sessions/${session.id}/edit`}
            className="subscreen-action"
            aria-label="Edit Session"
            title="Edit Session"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--primary-700)",
              textDecoration: "none",
              padding: "6px 10px",
            }}
          >
            Edit
          </Link>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </header>

      <main className="app-content subscreen with-footer">
        {/* COVER PHOTO — staff bisa upload/replace/hapus, viewer cuma lihat */}
        {staff && !isTerminal ? (
          <CoverPhotoUploader
            sessionId={session.id}
            currentCoverUrl={session.coverPhotoUrl}
          />
        ) : (
          session.coverPhotoUrl && (
            <div
              style={{
                width: "100%",
                height: 160,
                background: `url(${session.coverPhotoUrl}) center/cover no-repeat`,
                borderRadius: "var(--r-xl)",
                marginBottom: "var(--s-2)",
                boxShadow: "var(--shadow-card)",
              }}
              aria-label="Session cover photo"
            />
          )
        )}

        {/* HERO */}
        <section className="hero-session">
          <div
            className={`status-pill ${session.status === "live" ? "live" : ""}`}
          >
            <span className="status-dot"></span>
            <span>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
          <div className="hero-title">{session.title}</div>
          <div className="hero-meta">
            <div className="hero-meta-row">
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
            {session.venueName && (
              <div className="hero-meta-row">
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
                  {session.mapsUrl && (
                    <>
                      {" · "}
                      <a
                        href={session.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Maps
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}
            <div className="hero-meta-row">
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
                Host:{" "}
                {participants.find((p) => p.role === "host")?.userDisplayName ??
                  "—"}
              </span>
            </div>
          </div>
          <div className="hero-format-chips">
            <span className="format-chip" style={{ textTransform: "capitalize" }}>
              {session.format}
            </span>
            <span className="format-chip">
              {session.numCourts} Court{session.numCourts > 1 ? "s" : ""}
            </span>
            {session.fixPartners && (
              <span className="format-chip">Fix Partners</span>
            )}
            <span className="format-chip">
              {session.visibility === "public" ? "🌍 Public" : "🔒 Private"}
            </span>
          </div>
        </section>

        {/* JOIN PUBLIC SESSION (non-participants) */}
        {canJoinPublic && (
          <section>
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-50), var(--bg))",
                border: "1px solid var(--primary-200)",
                borderRadius: "var(--r-xl)",
                padding: "var(--s-4)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--text-900)",
                  marginBottom: 4,
                }}
              >
                🌍 Session ini Public
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-600)",
                  fontWeight: 600,
                  marginBottom: 12,
                  lineHeight: 1.4,
                }}
              >
                Kamu belum join session ini. Tap di bawah untuk langsung join
                sebagai pemain.
              </p>
              <JoinPublicSessionButton
              sessionId={session.id}
              joinPolicy={session.joinPolicy}
              existingRequestStatus={myRequestStatus}
            />
            </div>
          </section>
        )}

        {/* SHARE ACTIONS */}
        {!isTerminal && isParticipant && (
          <section>
            <SessionShareActions
              sessionId={session.id}
              sessionTitle={session.title}
              venueName={session.venueName}
              scheduledAt={session.scheduledAt}
              scheduledEndAt={session.scheduledEndAt}
              hostName={
                participants.find((p) => p.role === "host")?.userDisplayName ??
                null
              }
              status={session.status}
              format={session.format}
              coverPhotoUrl={session.coverPhotoUrl ?? null}
              playerCount={participants.length}
              completedMatches={completedMatches}
              topPlayers={[...participants]
                .filter((p) => p.sessionMatches > 0)
                .sort((a, b) => b.sessionPoints - a.sessionPoints)
                .slice(0, 5)
                .map((p) => ({
                  name:
                    p.userDisplayName ?? p.guestName ?? "Pemain",
                  wins: p.sessionWins,
                  draws: p.sessionDraws,
                  losses: p.sessionLosses,
                  points: p.sessionPoints,
                }))}
            />
          </section>
        )}

        {/* PLAYERS */}
        <section>
          <div className="section-head">
            <h3>Pemain ({participants.length})</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Leaderboard link disini hanya muncul kalau quick-actions
                  Share tidak di-render (terminal session / bukan peserta) */}
              {(isTerminal || !isParticipant) && (
                <Link
                  href={`/sessions/${session.id}/leaderboard`}
                  className="section-link"
                >
                  🏆 Leaderboard
                </Link>
              )}
              {staff && !isTerminal && (
                <Link
                  href={`/sessions/${session.id}/participants`}
                  className="section-link"
                >
                  + Tambah
                </Link>
              )}
            </div>
          </div>
          <div className="player-list">
            {participants.length === 0 && (
              <div className="empty-state" style={{ padding: "var(--s-5)" }}>
                <div className="empty-state-icon">🎾</div>
                <div className="empty-state-title">Belum ada pemain</div>
                <div className="empty-state-text">
                  {staff
                    ? "Tambah pemain via WhatsApp atau invite link untuk mulai session."
                    : "Host belum invite pemain. Tunggu invitation atau hubungi host."}
                </div>
                {staff && !isTerminal && (
                  <Link
                    href={`/sessions/${session.id}/participants`}
                    style={{
                      marginTop: "var(--s-3)",
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
                    + Tambah Pemain
                  </Link>
                )}
              </div>
            )}
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                sessionId={session.id}
                canManage={staff && !isTerminal}
              />
            ))}

            {participants.length > 0 && staff && !isTerminal && (
              <Link
                href={`/sessions/${session.id}/participants`}
                className="add-player-btn"
                style={{ textDecoration: "none" }}
              >
                <div className="plus-circle">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div className="plus-text">
                  <div>Tambah Pemain</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-500)",
                      fontWeight: 600,
                    }}
                  >
                    Member atau Guest · tanpa batas
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* MATCH SETTINGS RECAP */}
        <section>
          <div className="section-head">
            <h3>Pengaturan Match</h3>
          </div>
          <div className="info-row-list">
            <div className="info-row">
              <div className="ir-icon teal">
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 12h18M12 3v18" />
                </svg>
              </div>
              <div className="ir-info">
                <div className="ir-label">Court</div>
                <div className="ir-value">
                  {session.numCourts} Court{session.numCourts > 1 ? "s" : ""}{" "}
                  {session.numCourts > 1 && "(paralel)"}
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="ir-icon coral">
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
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="ir-info">
                <div className="ir-label">Match End</div>
                <div className="ir-value">Manual oleh host/co-host</div>
              </div>
            </div>
            <div className="info-row">
              <div className="ir-icon yellow">
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
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </div>
              <div className="ir-info">
                <div className="ir-label">Round</div>
                <div className="ir-value">
                  {session.maxRounds
                    ? `${session.maxRounds} round (manual)`
                    : "Auto count"}
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="ir-icon purple">
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
                  <circle cx="17" cy="7" r="3" />
                </svg>
              </div>
              <div className="ir-info">
                <div className="ir-label">Co-Host</div>
                <div className="ir-value">
                  {cohostCount === 0
                    ? "Belum ada co-host"
                    : `${cohostCount} co-host`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SPRINT 31: TOURNAMENT BRACKET */}
        {session.format === "tournament" && bracketData && (
          <BracketView data={bracketData} />
        )}
        {session.format === "tournament" &&
          !bracketData &&
          staff &&
          !isTerminal && <GenerateBracketButton sessionId={session.id} />}

        {/* MATCH STATUS */}
        <section>
          <div className="section-head">
            <h3>Match Round Set</h3>
            {rounds.length > 0 && (
              <Link
                href={`/sessions/${session.id}/matches`}
                className="section-link"
              >
                View All
              </Link>
            )}
          </div>
          {rounds.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="empty-state-title">
                Belum ada match yang dibuat
              </div>
              <div className="empty-state-text">
                Klik &quot;Generate Match&quot; di bawah saat semua pemain
                sudah datang. Kamu bisa buat extra match kapan saja saat session
                berjalan.
              </div>
            </div>
          ) : (
            <Link
              href={`/sessions/${session.id}/matches`}
              style={{
                display: "block",
                padding: "var(--s-4)",
                background: "var(--bg)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--r-xl)",
                boxShadow: "var(--shadow-card)",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 15,
                    color: "var(--text-900)",
                  }}
                >
                  {rounds.length} round{rounds.length > 1 ? "s" : ""} ·{" "}
                  {completedMatches}/{totalMatches} match selesai
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary-700)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                Tap untuk lihat detail match + scoring
              </div>
            </Link>
          )}
        </section>

        {/* JOIN REQUESTS INBOX — staff only */}
        {staff && pendingRequests.length > 0 && (
          <JoinRequestInbox requests={pendingRequests} />
        )}

        {/* GROUP PHOTOS — visible to anyone who can view session */}
        <GroupPhotoGallery
          sessionId={session.id}
          photos={groupPhotos}
          canManage={staff}
        />

        {/* LIFECYCLE ACTIONS — host/co-host only */}
        {staff && (
          <section className="form-section" style={{ marginTop: "var(--s-2)" }}>
            <div className="form-section-head">
              <div className="sec-icon" aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Status Sesi</h3>
            </div>

            <SessionStatusTimeline current={session.status} />

            {/* Primary action + Batal di grid 2 kolom — lebih hemat ruang */}
            {session.status === "upcoming" && (
              <div className="lifecycle-actions">
                <StartSessionButton sessionId={session.id} />
                <CancelSessionButton sessionId={session.id} />
              </div>
            )}

            {session.status === "live" && (
              <div className="lifecycle-actions">
                <EndSessionButton
                  sessionId={session.id}
                  completedMatches={completedMatches}
                  pendingMatches={pendingMatches}
                />
                <CancelSessionButton sessionId={session.id} />
              </div>
            )}

            {isTerminal && (
              <ReopenSessionButton
                sessionId={session.id}
                hasRounds={hasRounds}
              />
            )}
          </section>
        )}
      </main>

      {/* STICKY FOOTER */}
      {staff && !isTerminal && rounds.length === 0 && (
        <GenerateRoundButton
          sessionId={session.id}
          nextRoundNumber={1}
          activePlayerCount={activeCount}
          redirectAfter={`/sessions/${session.id}/matches`}
          variant="footer"
        />
      )}
      {!isTerminal && rounds.length > 0 && (
        <div className="sticky-footer">
          <Link
            href={`/sessions/${session.id}/matches`}
            className="btn-primary-lg"
            style={{ textDecoration: "none" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11H4l3-3M9 13H4l3 3M14 11h5l-3-3M14 13h5l-3 3" />
            </svg>
            <span>Lihat Match & Skor</span>
          </Link>
        </div>
      )}
    </div>
  );
}
