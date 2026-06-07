import Link from "next/link";
import { ParticipantActions } from "./ParticipantActions";

type ParticipantData = {
  id: string;
  userId: string | null;
  guestName: string | null;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  userDisplayName: string | null;
  userAvatarUrl?: string | null;
};

const ROLE_LABELS: Record<ParticipantData["role"], string> = {
  host: "Host",
  co_host: "Co-host",
  player: "",
  guest: "Guest",
};

const ROLE_AVATAR_CLASS: Record<ParticipantData["role"], string> = {
  host: "host",
  co_host: "cohost",
  player: "member-1",
  guest: "guest",
};

const ROLE_BADGE_CLASS: Record<ParticipantData["role"], string> = {
  host: "host",
  co_host: "cohost",
  player: "",
  guest: "guest",
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
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const isMember = participant.userId !== null;
  const roleLabel = ROLE_LABELS[participant.role];
  const avatarCls = ROLE_AVATAR_CLASS[participant.role];
  const badgeCls = ROLE_BADGE_CLASS[participant.role];

  return (
    <div className="player-list-item">
      <div
        className={`player-avatar-lg ${avatarCls}`}
        style={
          participant.userAvatarUrl
            ? {
                background: `url(${participant.userAvatarUrl}) center/cover no-repeat`,
                color: "transparent",
              }
            : undefined
        }
      >
        {!participant.userAvatarUrl && initial}
      </div>
      <div className="player-info">
        <div className="player-name">
          {participant.userId ? (
            <Link
              href={`/u/${participant.userId}`}
              style={{
                color: "inherit",
                textDecoration: "none",
              }}
            >
              {name}
            </Link>
          ) : (
            <span>{name}</span>
          )}
          {roleLabel && (
            <span className={`role-badge ${badgeCls}`}>{roleLabel}</span>
          )}
        </div>
        <div className="player-meta-row">
          <span style={{ fontSize: 12, color: "var(--text-500)" }}>
            {!participant.isPlaying && "🚫 not playing"}
            {participant.role === "player" && participant.isPlaying && "Player"}
            {participant.role === "guest" && participant.isPlaying && "Guest player"}
          </span>
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
    </div>
  );
}
