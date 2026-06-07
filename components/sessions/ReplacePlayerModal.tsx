"use client";

/**
 * ReplacePlayerModal — Sprint 53.
 *
 * Lets host/co-host swap a player IN a pending match with anyone else from
 * the session — including players currently sitting out this round.
 *
 * Two candidate buckets:
 * - SIT_OUTS: active participants not in any match in this round
 * - OTHER_MATCH: active participants playing in OTHER pending matches this round
 *
 * Tapping a candidate calls setMatchPlayerAction(matchId, slot, candidateId).
 * The server figures out whether to swap (if candidate is in another match)
 * or replace (if candidate is sit-out).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMatchPlayerAction } from "@/app/actions/matches";
import { Toast } from "@/components/ui/Toast";
import type { MatchSlotKey } from "@/lib/match/swap";

type Candidate = {
  participantId: string;
  name: string;
  /** null when sitting out this round */
  currentMatchId: string | null;
  /** "Match 1", "Match 2"… or null if sit-out */
  currentMatchLabel: string | null;
};

type Props = {
  matchId: string;
  slot: MatchSlotKey;
  currentPlayerName: string;
  candidates: Candidate[];
  onClose: () => void;
};

export function ReplacePlayerModal({
  matchId,
  slot,
  currentPlayerName,
  candidates,
  onClose,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sitOuts = candidates.filter((c) => c.currentMatchId === null);
  const inOtherMatch = candidates.filter((c) => c.currentMatchId !== null);

  function confirmReplace() {
    if (!pending) return;
    startTransition(async () => {
      const result = await setMatchPlayerAction(
        matchId,
        slot,
        pending.participantId
      );
      if (result?.error) {
        setError(result.error);
        setPending(null);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />

      <div
        role="dialog"
        aria-modal="true"
        onClick={pending ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--bg)",
            borderRadius: "var(--r-2xl)",
            padding: "var(--s-4)",
            maxWidth: 440,
            width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-3)",
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 18,
                color: "var(--text-900)",
                marginBottom: 4,
              }}
            >
              Replace player
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-500)",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "var(--text-700)" }}>
                {currentPlayerName}
              </span>{" "}
              → pick a replacement below
            </div>
          </div>

          {/* Confirm view (one candidate selected) */}
          {pending && (
            <div
              style={{
                background: "var(--primary-50)",
                border: "1px solid var(--primary-200)",
                borderRadius: "var(--r-lg)",
                padding: "var(--s-3)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: "var(--primary-700)",
                }}
              >
                Confirm change
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-900)",
                }}
              >
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "var(--text-500)",
                  }}
                >
                  {currentPlayerName}
                </span>
                <span style={{ color: "var(--primary-700)" }}>→</span>
                <span>{pending.name}</span>
              </div>
              {pending.currentMatchId && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-600)",
                    fontWeight: 600,
                  }}
                >
                  Swap: {pending.name} comes here, {currentPlayerName} takes
                  their spot in {pending.currentMatchLabel}.
                </div>
              )}
              {!pending.currentMatchId && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-600)",
                    fontWeight: 600,
                  }}
                >
                  Replace: {currentPlayerName} will sit out this round.
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-full)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--text-700)",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirmReplace}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--r-full)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: isPending ? "wait" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? "Saving…" : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!pending && candidates.length === 0 && (
            <div
              style={{
                padding: "var(--s-4)",
                background: "var(--bg-soft)",
                borderRadius: "var(--r-lg)",
                textAlign: "center",
                fontSize: 12,
                color: "var(--text-600)",
                fontWeight: 600,
              }}
            >
              No other players available to swap.
            </div>
          )}

          {/* Lists */}
          {!pending && sitOuts.length > 0 && (
            <CandidateList
              title="Sit-out this round"
              icon="🪑"
              candidates={sitOuts}
              onPick={setPending}
            />
          )}
          {!pending && inOtherMatch.length > 0 && (
            <CandidateList
              title="Playing in another match"
              icon="🎾"
              candidates={inOtherMatch}
              onPick={setPending}
            />
          )}

          {!pending && (
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 4,
                padding: "10px 14px",
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--text-700)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function CandidateList({
  title,
  icon,
  candidates,
  onPick,
}: {
  title: string;
  icon: string;
  candidates: Candidate[];
  onPick: (c: Candidate) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--text-500)",
          marginBottom: 6,
          paddingLeft: 4,
        }}
      >
        {icon} {title} ({candidates.length})
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {candidates.map((c) => (
          <button
            key={c.participantId}
            type="button"
            onClick={() => onPick(c)}
            style={{
              padding: "10px 14px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--text-900)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </span>
            {c.currentMatchLabel && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-500)",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {c.currentMatchLabel}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
