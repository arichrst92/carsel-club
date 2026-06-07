import { getRoundsWithMatches } from "@/lib/db/queries/matches";
import { MatchCard } from "./MatchCard";
import { GenerateRoundButton } from "./GenerateRoundButton";
import { RegenerateRoundButton } from "./RegenerateRoundButton";
import { MatchSwapProvider } from "./MatchSwapProvider";

type Participant = {
  id: string;
  userId: string | null;
  guestName: string | null;
  isPlaying: boolean;
  userDisplayName: string | null;
};

type Props = {
  sessionId: string;
  sessionTitle: string;
  participants: Participant[];
  staff: boolean;
  isTerminal: boolean;
  /** Sprint 53: disable per-player replace UX in Fix Partners sessions */
  fixPartners?: boolean;
};

export async function MatchesSection({
  sessionId,
  sessionTitle,
  participants,
  staff,
  isTerminal,
  fixPartners = false,
}: Props) {
  const rounds = await getRoundsWithMatches(sessionId);
  const nextRoundNumber = (rounds.at(-1)?.roundNumber ?? 0) + 1;
  const activeCount = participants.filter((p) => p.isPlaying).length;

  const lookup = participants.reduce<
    Record<string, { name: string; isMember: boolean }>
  >((acc, p) => {
    const name = p.guestName ?? p.userDisplayName ?? "?";
    acc[p.id] = { name, isMember: p.userId !== null };
    return acc;
  }, {});

  if (rounds.length === 0) {
    return (
      <section>
        <div className="section-head">
          <h3>Match Round Set</h3>
        </div>
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
          <div className="empty-state-title">No matches yet</div>
          <div className="empty-state-text">
            {staff && !isTerminal
              ? 'Click "Generate Round 1" below once all players have arrived. You can create extra matches anytime while the session is running.'
              : "The host hasn't generated the first round yet."}
          </div>
        </div>
        {staff && !isTerminal && (
          <GenerateRoundButton
            sessionId={sessionId}
            nextRoundNumber={1}
            activePlayerCount={activeCount}
            variant="footer"
          />
        )}
      </section>
    );
  }

  return (
    <MatchSwapProvider enabled={staff && !isTerminal}>
      {rounds.map((round) => {
        const playingIds = new Set(
          round.matches.flatMap((m) => [
            m.team1P1Id,
            m.team1P2Id,
            m.team2P1Id,
            m.team2P2Id,
          ])
        );
        const sitOuts = participants
          .filter((p) => p.isPlaying && !playingIds.has(p.id))
          .map((p) => lookup[p.id].name);

        const allPending =
          round.matches.length > 0 &&
          round.matches.every((m) => m.status === "pending");
        const canRegenerate =
          staff && !isTerminal && round.status === "pending" && allPending;

        return (
          <section key={round.id} style={{ marginBottom: "var(--s-5)" }}>
            <div
              className="section-head"
              style={{ alignItems: "center", gap: 8 }}
            >
              <h3>Round {round.roundNumber}</h3>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {canRegenerate && (
                  <RegenerateRoundButton
                    roundSetId={round.id}
                    roundNumber={round.roundNumber}
                  />
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {round.status === "completed"
                    ? "Completed"
                    : round.status === "in_progress"
                      ? "Live"
                      : "Pending"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-3)",
              }}
            >
              {round.matches.map((m) => {
                // Sprint 53: per-match replace-player context. Other-match
                // players this round become "swap" candidates; benched
                // active participants become "replace" (sit-out) candidates.
                // Only useful when match is pending and Fix Partners is off.
                const enableReplace =
                  staff && !isTerminal && !fixPartners && m.status === "pending";
                let replaceContext:
                  | {
                      candidates: {
                        participantId: string;
                        name: string;
                        currentMatchId: string | null;
                        currentMatchLabel: string | null;
                      }[];
                    }
                  | undefined;
                if (enableReplace) {
                  // Build matchId → label map ("Court N") for this round so
                  // candidates show which match they're currently playing in.
                  const matchLabelByMatchId = new Map<string, string>();
                  round.matches.forEach((rm) =>
                    matchLabelByMatchId.set(rm.id, `Court ${rm.courtNumber}`)
                  );
                  // participantId → matchId (current placement this round)
                  const participantPlacement = new Map<string, string>();
                  for (const rm of round.matches) {
                    for (const pid of [
                      rm.team1P1Id,
                      rm.team1P2Id,
                      rm.team2P1Id,
                      rm.team2P2Id,
                    ]) {
                      if (pid) participantPlacement.set(pid, rm.id);
                    }
                  }
                  const inThisMatch = new Set([
                    m.team1P1Id,
                    m.team1P2Id,
                    m.team2P1Id,
                    m.team2P2Id,
                  ]);
                  const candidates = participants
                    .filter((p) => p.isPlaying && !inThisMatch.has(p.id))
                    .map((p) => {
                      const placementMatchId =
                        participantPlacement.get(p.id) ?? null;
                      return {
                        participantId: p.id,
                        name: lookup[p.id]?.name ?? "Player",
                        currentMatchId: placementMatchId,
                        currentMatchLabel: placementMatchId
                          ? (matchLabelByMatchId.get(placementMatchId) ?? null)
                          : null,
                      };
                    });
                  replaceContext = { candidates };
                }
                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    lookup={lookup}
                    canManage={staff && !isTerminal}
                    sessionId={sessionId}
                    sessionTitle={sessionTitle}
                    replaceContext={replaceContext}
                  />
                );
              })}
            </div>

            {sitOuts.length > 0 && (
              <div
                style={{
                  marginTop: "var(--s-3)",
                  padding: "10px 14px",
                  background: "var(--bg-soft)",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--text-500)",
                    marginBottom: 4,
                  }}
                >
                  🪑 Sit Out
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-700)",
                    fontWeight: 600,
                  }}
                >
                  {sitOuts.join(" · ")}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {staff && !isTerminal && (
        <GenerateRoundButton
          sessionId={sessionId}
          nextRoundNumber={nextRoundNumber}
          activePlayerCount={activeCount}
          variant="footer"
        />
      )}
    </MatchSwapProvider>
  );
}
