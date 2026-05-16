"use client";

import { useTransition } from "react";
import {
  removeParticipantAction,
  toggleCohostAction,
  togglePlayingAction,
} from "@/app/actions/participants";

type Props = {
  participantId: string;
  sessionId: string;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  isMember: boolean; // false = guest (user_id null)
  displayName: string;
};

export function ParticipantActions({
  participantId,
  sessionId,
  role,
  isPlaying,
  isMember,
  displayName,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function runAction(fn: () => Promise<{ error?: string } | null>) {
    startTransition(async () => {
      const result = await fn();
      if (result?.error) alert(result.error);
    });
  }

  const canPromote = isMember && role === "player";
  const canDemote = role === "co_host";
  const canRemove = role !== "host";

  return (
    <div className="flex items-center gap-1 shrink-0">
      {canPromote && (
        <IconButton
          title="Jadikan Co-Host"
          onClick={() => runAction(() => toggleCohostAction(participantId, sessionId))}
          disabled={isPending}
        >
          👑
        </IconButton>
      )}
      {canDemote && (
        <IconButton
          title="Demote dari Co-Host"
          onClick={() => runAction(() => toggleCohostAction(participantId, sessionId))}
          disabled={isPending}
        >
          ⬇
        </IconButton>
      )}
      <IconButton
        title={isPlaying ? "Set tidak main" : "Set ikut main"}
        onClick={() => runAction(() => togglePlayingAction(participantId, sessionId))}
        disabled={isPending}
        muted={!isPlaying}
      >
        {isPlaying ? "🎾" : "💤"}
      </IconButton>
      {canRemove && (
        <IconButton
          title="Remove dari session"
          onClick={() => {
            if (!confirm(`Remove ${displayName} dari session?`)) return;
            runAction(() => removeParticipantAction(participantId, sessionId));
          }}
          disabled={isPending}
          danger
        >
          🗑
        </IconButton>
      )}
    </div>
  );
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
  danger,
  muted,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`size-9 rounded-lg flex items-center justify-center text-base transition disabled:opacity-40 ${
        danger
          ? "hover:bg-accent-50"
          : muted
            ? "opacity-50 hover:opacity-100 hover:bg-bg-soft"
            : "hover:bg-bg-soft"
      }`}
    >
      {children}
    </button>
  );
}
