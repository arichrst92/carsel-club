"use client";

import { useState, useTransition } from "react";
import {
  removeParticipantAction,
  toggleCohostAction,
  togglePlayingAction,
} from "@/app/actions/participants";
import { Toast } from "@/components/ui/Toast";

type Props = {
  participantId: string;
  sessionId: string;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  isMember: boolean;
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
  const [error, setError] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ error?: string } | null>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
    });
  }

  const canPromote = isMember && role === "player";
  const canDemote = role === "co_host";
  const canRemove = role !== "host";

  return (
    <>
    <Toast message={error} onDismiss={() => setError(null)} />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {canPromote && (
        <IconBtn
          title="Jadikan Co-Host"
          onClick={() =>
            runAction(() => toggleCohostAction(participantId, sessionId))
          }
          disabled={isPending}
        >
          👑
        </IconBtn>
      )}
      {canDemote && (
        <IconBtn
          title="Demote dari Co-Host"
          onClick={() =>
            runAction(() => toggleCohostAction(participantId, sessionId))
          }
          disabled={isPending}
        >
          ⬇
        </IconBtn>
      )}
      <IconBtn
        title={isPlaying ? "Set tidak main" : "Set ikut main"}
        onClick={() =>
          runAction(() => togglePlayingAction(participantId, sessionId))
        }
        disabled={isPending}
        muted={!isPlaying}
      >
        {isPlaying ? "🎾" : "💤"}
      </IconBtn>
      {canRemove && (
        <IconBtn
          title="Remove dari session"
          onClick={() => {
            if (!confirm(`Remove ${displayName} dari session?`)) return;
            runAction(() => removeParticipantAction(participantId, sessionId));
          }}
          disabled={isPending}
        >
          🗑
        </IconBtn>
      )}
    </div>
    </>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
  muted,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: "grid",
        placeItems: "center",
        borderRadius: "var(--r-full)",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 14,
        opacity: disabled ? 0.4 : muted ? 0.5 : 1,
        transition: "all 0.15s",
        border: "none",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--bg-soft)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
