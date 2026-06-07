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
          gap: 6,
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {canPromote && (
          <PillBtn
            title="Promote to Co-Host"
            onClick={() =>
              runAction(() => toggleCohostAction(participantId, sessionId))
            }
            disabled={isPending}
            variant="neutral"
          >
            👑 Co-host
          </PillBtn>
        )}
        {canDemote && (
          <PillBtn
            title="Demote from Co-Host"
            onClick={() =>
              runAction(() => toggleCohostAction(participantId, sessionId))
            }
            disabled={isPending}
            variant="neutral"
          >
            ⬇ Demote
          </PillBtn>
        )}

        {/* Sprint 53: Play/Rest as a labeled toggle pill instead of 🎾/💤 emoji.
            Active state = subtle primary fill; inactive = muted neutral. */}
        <PillBtn
          title={isPlaying ? "Mark as resting this session" : "Bring back into play"}
          onClick={() =>
            runAction(() => togglePlayingAction(participantId, sessionId))
          }
          disabled={isPending}
          variant={isPlaying ? "primary" : "muted"}
        >
          {isPlaying ? "Bermain" : "Istirahat"}
        </PillBtn>

        {canRemove && (
          <PillBtn
            title="Remove from session"
            onClick={() => {
              if (!confirm(`Remove ${displayName} from this session?`)) return;
              runAction(() => removeParticipantAction(participantId, sessionId));
            }}
            disabled={isPending}
            variant="danger"
          >
            Delete
          </PillBtn>
        )}
      </div>
    </>
  );
}

type Variant = "primary" | "muted" | "neutral" | "danger";

function PillBtn({
  children,
  title,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  variant: Variant;
}) {
  const styles = variantStyles(variant);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 10px",
        borderRadius: "var(--r-full)",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 11,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s",
        whiteSpace: "nowrap",
        lineHeight: 1.3,
        ...styles,
      }}
    >
      {children}
    </button>
  );
}

function variantStyles(v: Variant): {
  background: string;
  color: string;
  border: string;
} {
  switch (v) {
    case "primary":
      return {
        background: "var(--primary-50)",
        color: "var(--primary-700)",
        border: "1px solid var(--primary-200)",
      };
    case "muted":
      return {
        background: "var(--bg-soft)",
        color: "var(--text-500)",
        border: "1px solid var(--border)",
      };
    case "danger":
      return {
        background: "var(--accent-50)",
        color: "var(--accent-600)",
        border: "1px solid var(--accent-100)",
      };
    case "neutral":
    default:
      return {
        background: "var(--bg)",
        color: "var(--text-700)",
        border: "1px solid var(--border)",
      };
  }
}
