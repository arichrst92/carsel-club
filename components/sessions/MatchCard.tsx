import type { Match } from "@/lib/db/types";

type ParticipantLookup = Record<
  string,
  { name: string; isMember: boolean }
>;

const STATUS_STYLES: Record<
  Match["status"],
  { label: string; classes: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-bg-soft text-text-500",
  },
  live: {
    label: "Live",
    classes: "bg-accent-50 text-accent-600",
  },
  completed: {
    label: "Selesai",
    classes: "bg-primary-50 text-primary-700",
  },
};

export function MatchCard({
  match,
  lookup,
}: {
  match: Match;
  lookup: ParticipantLookup;
}) {
  const status = STATUS_STYLES[match.status];
  const isDone = match.status === "completed";

  return (
    <div className="rounded-2xl bg-bg-card border border-border-light p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-display font-bold text-text-700 uppercase tracking-wide">
          Court {match.courtNumber}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.classes}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Team 1 */}
        <Team
          p1Id={match.team1P1Id}
          p2Id={match.team1P2Id}
          score={match.team1Score}
          isWinner={isDone && match.team1Score > match.team2Score}
          lookup={lookup}
        />

        <div className="text-text-300 font-display font-bold text-xs">vs</div>

        {/* Team 2 */}
        <Team
          p1Id={match.team2P1Id}
          p2Id={match.team2P2Id}
          score={match.team2Score}
          isWinner={isDone && match.team2Score > match.team1Score}
          lookup={lookup}
          alignRight
        />
      </div>
    </div>
  );
}

function Team({
  p1Id,
  p2Id,
  score,
  isWinner,
  lookup,
  alignRight,
}: {
  p1Id: string;
  p2Id: string;
  score: number;
  isWinner: boolean;
  lookup: ParticipantLookup;
  alignRight?: boolean;
}) {
  const p1 = lookup[p1Id]?.name ?? "?";
  const p2 = lookup[p2Id]?.name ?? "?";

  return (
    <div
      className={`flex flex-col gap-1 ${alignRight ? "items-end text-right" : "items-start"}`}
    >
      <div className="flex items-center gap-2">
        {alignRight && (
          <span
            className={`font-display font-bold text-2xl ${isWinner ? "text-primary-600" : "text-text-400"}`}
          >
            {score}
          </span>
        )}
        <div className={alignRight ? "text-right" : ""}>
          <PlayerName name={p1} winner={isWinner} />
          <PlayerName name={p2} winner={isWinner} />
        </div>
        {!alignRight && (
          <span
            className={`font-display font-bold text-2xl ${isWinner ? "text-primary-600" : "text-text-400"}`}
          >
            {score}
          </span>
        )}
      </div>
    </div>
  );
}

function PlayerName({ name, winner }: { name: string; winner: boolean }) {
  return (
    <div
      className={`text-sm font-bold leading-tight truncate ${winner ? "text-text-900" : "text-text-700"}`}
    >
      {name}
    </div>
  );
}
