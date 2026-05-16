import { ParticipantActions } from "./ParticipantActions";

type ParticipantData = {
  id: string;
  userId: string | null;
  guestName: string | null;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  userDisplayName: string | null;
};

const ROLE_LABELS: Record<ParticipantData["role"], string> = {
  host: "Host",
  co_host: "Co-Host",
  player: "Player",
  guest: "Guest",
};

export function ParticipantRow({
  participant,
  sessionId,
  canManage,
}: {
  participant: ParticipantData;
  sessionId: string;
  canManage: boolean;
}) {
  const name = participant.guestName || participant.userDisplayName || "—";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isStaff =
    participant.role === "host" || participant.role === "co_host";
  const isMember = participant.userId !== null;

  return (
    <li className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-card border border-border-light">
      <div className="size-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white grid place-items-center font-display font-bold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text-900 truncate">{name}</div>
        <div className="text-xs text-text-500 flex items-center gap-2">
          <span className={isStaff ? "text-primary-600 font-bold" : ""}>
            {ROLE_LABELS[participant.role]}
          </span>
          {!participant.isPlaying && (
            <span className="text-text-400">· tidak main</span>
          )}
        </div>
      </div>
      {canManage && (
        <ParticipantActions
          participantId={participant.id}
          sessionId={sessionId}
          role={participant.role}
          isPlaying={participant.isPlaying}
          isMember={isMember}
          displayName={name}
        />
      )}
    </li>
  );
}
