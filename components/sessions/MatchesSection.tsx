import { getRoundsWithMatches } from "@/lib/db/queries/matches";
import { MatchCard } from "./MatchCard";
import { GenerateRoundButton } from "./GenerateRoundButton";

type Participant = {
  id: string;
  userId: string | null;
  guestName: string | null;
  isPlaying: boolean;
  userDisplayName: string | null;
};

type Props = {
  sessionId: string;
  participants: Participant[];
  staff: boolean;
  isTerminal: boolean;
};

export async function MatchesSection({
  sessionId,
  participants,
  staff,
  isTerminal,
}: Props) {
  const rounds = await getRoundsWithMatches(sessionId);
  const nextRoundNumber = (rounds.at(-1)?.roundNumber ?? 0) + 1;
  const activeCount = participants.filter((p) => p.isPlaying).length;

  // Build name lookup for fast Match render
  const lookup = participants.reduce<
    Record<string, { name: string; isMember: boolean }>
  >((acc, p) => {
    const name = p.guestName ?? p.userDisplayName ?? "?";
    acc[p.id] = { name, isMember: p.userId !== null };
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-display font-bold text-text-900 uppercase tracking-wide">
          Matches
        </h2>
        <span className="text-xs text-text-500 font-semibold">
          {rounds.length} round{rounds.length !== 1 ? "s" : ""}
        </span>
      </div>

      {rounds.length === 0 ? (
        <EmptyState
          staff={staff}
          isTerminal={isTerminal}
          activeCount={activeCount}
          sessionId={sessionId}
        />
      ) : (
        <div className="space-y-5">
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

            return (
              <RoundBlock
                key={round.id}
                roundNumber={round.roundNumber}
                matches={round.matches.map((m) => (
                  <MatchCard key={m.id} match={m} lookup={lookup} />
                ))}
                sitOuts={sitOuts}
              />
            );
          })}

          {staff && !isTerminal && (
            <div className="pt-2">
              <GenerateRoundButton
                sessionId={sessionId}
                nextRoundNumber={nextRoundNumber}
                activePlayerCount={activeCount}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoundBlock({
  roundNumber,
  matches,
  sitOuts,
}: {
  roundNumber: number;
  matches: React.ReactNode[];
  sitOuts: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display font-bold text-base">
          Round {roundNumber}
        </h3>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      <div className="space-y-3">{matches}</div>

      {sitOuts.length > 0 && (
        <div className="rounded-xl bg-bg-soft border border-dashed border-border p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-text-500 mb-1">
            🪑 Sit Out
          </div>
          <div className="text-xs text-text-700 font-semibold">
            {sitOuts.join(" · ")}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  staff,
  isTerminal,
  activeCount,
  sessionId,
}: {
  staff: boolean;
  isTerminal: boolean;
  activeCount: number;
  sessionId: string;
}) {
  if (isTerminal) {
    return (
      <div className="rounded-2xl bg-bg-soft border border-border-light p-5 text-center">
        <p className="text-sm text-text-500 font-semibold">
          Session sudah selesai/dibatalkan. Tidak ada match.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-bg-soft border border-border-light p-6 text-center space-y-3">
      <div className="text-4xl">🎾</div>
      <div>
        <p className="text-sm font-display font-bold text-text-900">
          Belum ada match
        </p>
        <p className="text-xs text-text-500 mt-1">
          {staff
            ? "Klik tombol di bawah untuk generate round pertama."
            : "Host belum generate round."}
        </p>
      </div>
      {staff && (
        <GenerateRoundButton
          sessionId={sessionId}
          nextRoundNumber={1}
          activePlayerCount={activeCount}
        />
      )}
    </div>
  );
}
