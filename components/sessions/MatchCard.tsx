"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Match } from "@/lib/db/types";
import {
  updateMatchScoreAction,
  endMatchAction,
  editCompletedMatchScoreAction,
  startMatchAction,
  revertMatchAction,
} from "@/app/actions/matches";
import { ShareMatchButton } from "./ShareMatchButton";
import { MatchTimer } from "./MatchTimer";
import { useMatchSwap } from "./MatchSwapProvider";
import { ReplacePlayerModal } from "./ReplacePlayerModal";
import { Toast } from "@/components/ui/Toast";
import type { MatchSlotKey } from "@/lib/match/swap";

// Sprint 53: candidate list for replace-player UX
type ReplaceCandidate = {
  participantId: string;
  name: string;
  currentMatchId: string | null;
  currentMatchLabel: string | null;
};
export type ReplaceContext = {
  candidates: ReplaceCandidate[];
};

type ParticipantLookup = Record<
  string,
  { name: string; isMember: boolean }
>;

const STATUS_STYLES: Record<
  Match["status"],
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--text-500)",
    bg: "var(--bg-soft)",
  },
  live: {
    label: "LIVE",
    color: "var(--accent-600)",
    bg: "var(--accent-50)",
  },
  completed: {
    label: "Completed",
    color: "var(--primary-700)",
    bg: "var(--primary-50)",
  },
};

export function MatchCard({
  match,
  lookup,
  canManage,
  sessionId,
  sessionTitle,
  replaceContext,
}: {
  match: Match;
  lookup: ParticipantLookup;
  canManage: boolean;
  sessionId: string;
  sessionTitle: string;
  replaceContext?: ReplaceContext;
}) {
  const [t1, setT1] = useState(match.team1Score);
  const [t2, setT2] = useState(match.team2Score);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Sprint 53: which slot is currently being replaced (modal open)
  const [replaceSlot, setReplaceSlot] = useState<MatchSlotKey | null>(null);

  const isPending_ = match.status === "pending";
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const status = STATUS_STYLES[match.status];

  // Sprint 4: strict — pending matches no score adjust, harus Start dulu.
  const showStartButton = canManage && isPending_;
  const showLiveControls = canManage && isLive;
  const showEditControls = canManage && isCompleted;
  const canAdjust = showLiveControls || editing;

  const showWinner = isCompleted && !editing;
  const t1Won = showWinner && match.team1Score > match.team2Score;
  const t2Won = showWinner && match.team2Score > match.team1Score;

  const team1Names: [string, string] = [
    lookup[match.team1P1Id]?.name ?? "?",
    lookup[match.team1P2Id]?.name ?? "?",
  ];
  const team2Names: [string, string] = [
    lookup[match.team2P1Id]?.name ?? "?",
    lookup[match.team2P2Id]?.name ?? "?",
  ];

  function adjustScore(team: 1 | 2, delta: number) {
    const newT1 =
      team === 1 ? Math.max(0, Math.min(99, t1 + delta)) : t1;
    const newT2 =
      team === 2 ? Math.max(0, Math.min(99, t2 + delta)) : t2;
    setT1(newT1);
    setT2(newT2);

    if (editing) return;
    if (isCompleted) return;
    if (isPending_) return; // strict — should never happen, buttons hidden

    startTransition(async () => {
      const result = await updateMatchScoreAction(match.id, newT1, newT2);
      if (result?.error) {
        setError(result.error);
        setT1(match.team1Score);
        setT2(match.team2Score);
      }
    });
  }

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startMatchAction(match.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleRevert() {
    if (
      !confirm(
        "Batalkan penyelesaian match ini?\n\nSkor tetap, statistik akan diputar mundur. Bisa diedit setelah itu."
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await revertMatchAction(match.id);
      if (result?.error) setError(result.error);
    });
  }

  function handleEnd() {
    if (!confirm(`End match with score ${t1} - ${t2}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await endMatchAction(match.id, t1, t2);
      if (result?.error) setError(result.error);
    });
  }

  function handleSaveEdit() {
    setError(null);
    startTransition(async () => {
      const result = await editCompletedMatchScoreAction(match.id, t1, t2);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleCancelEdit() {
    setT1(match.team1Score);
    setT2(match.team2Score);
    setEditing(false);
  }

  return (
    <>
    <Toast message={error} onDismiss={() => setError(null)} />
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-xl)",
        padding: "var(--s-4)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--s-3)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 12,
            color: "var(--text-700)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Court {match.courtNumber}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(isLive || isCompleted) && (
            <MatchTimer
              startedAt={match.startedAt}
              endedAt={isCompleted ? match.endedAt : null}
            />
          )}
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "var(--r-full)",
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: status.bg,
              color: status.color,
            }}
          >
            {status.label}
          </span>
          <Link
            href={`/sessions/${sessionId}/matches/${match.id}`}
            aria-label="View match details"
            title="View match details"
            style={{
              display: "grid",
              placeItems: "center",
              width: 28,
              height: 28,
              borderRadius: "var(--r-full)",
              background: "var(--bg-soft)",
              color: "var(--text-700)",
              textDecoration: "none",
              border: "1px solid var(--border-light)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Teams */}
      <TeamRow
        names={team1Names}
        score={t1}
        canAdjust={canAdjust}
        onMinus={() => adjustScore(1, -1)}
        onPlus={() => adjustScore(1, 1)}
        onScoreChange={(val) => setT1(val)}
        editing={editing}
        won={t1Won}
        disabled={isPending}
        match={match}
        slotKeys={["team1P1Id", "team1P2Id"]}
        playerNames={team1Names}
        onEditSlot={
          canManage && match.status === "pending" && replaceContext
            ? setReplaceSlot
            : undefined
        }
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-2)",
          margin: "var(--s-1) 0",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--text-400)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-display)",
          }}
        >
          vs
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border-light)" }} />
      </div>

      <TeamRow
        names={team2Names}
        score={t2}
        canAdjust={canAdjust}
        onMinus={() => adjustScore(2, -1)}
        onPlus={() => adjustScore(2, 1)}
        onScoreChange={(val) => setT2(val)}
        editing={editing}
        won={t2Won}
        disabled={isPending}
        match={match}
        slotKeys={["team2P1Id", "team2P2Id"]}
        playerNames={team2Names}
        onEditSlot={
          canManage && match.status === "pending" && replaceContext
            ? setReplaceSlot
            : undefined
        }
      />

      {/* Actions */}
      {showStartButton && (
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="btn-primary-lg"
          style={{
            marginTop: "var(--s-3)",
            padding: "10px 16px",
            fontSize: 13,
            width: "100%",
          }}
        >
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
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
          <span>{isPending ? "Starting..." : "Start Match"}</span>
        </button>
      )}

      {showLiveControls && (
        <button
          type="button"
          onClick={handleEnd}
          disabled={isPending}
          className="btn-primary-lg"
          style={{
            marginTop: "var(--s-3)",
            padding: "10px 16px",
            fontSize: 13,
            width: "100%",
          }}
        >
          {isPending ? "Saving..." : "End Match"}
        </button>
      )}

      {showEditControls && !editing && (
        <div style={{ display: "flex", gap: 8, marginTop: "var(--s-3)" }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--text-700)",
              cursor: "pointer",
            }}
          >
            ✏️ Ubah Skor
          </button>
          <button
            type="button"
            onClick={handleRevert}
            disabled={isPending}
            title="Revert ke LIVE — reverse stats yg sudah accrued"
            style={{
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--text-700)",
              cursor: "pointer",
            }}
          >
            ↺ Revert
          </button>
        </div>
      )}

      {showEditControls && editing && (
        <div style={{ display: "flex", gap: 8, marginTop: "var(--s-3)" }}>
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--text-700)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={isPending}
            className="btn-primary-lg"
            style={{
              flex: 1,
              padding: "8px 14px",
              fontSize: 12,
            }}
          >
            {isPending ? "..." : "Save"}
          </button>
        </div>
      )}

      {/* Share button — only for completed matches */}
      {isCompleted && !editing && (
        <ShareMatchButton
          matchId={match.id}
          sessionTitle={sessionTitle}
          team1Names={team1Names}
          team2Names={team2Names}
          team1Score={match.team1Score}
          team2Score={match.team2Score}
        />
      )}
    </div>

    {/* Sprint 53: replace-player modal */}
    {replaceSlot && replaceContext && (
      <ReplacePlayerModal
        matchId={match.id}
        slot={replaceSlot}
        currentPlayerName={lookup[match[replaceSlot]]?.name ?? "?"}
        candidates={replaceContext.candidates}
        onClose={() => setReplaceSlot(null)}
      />
    )}
    </>
  );
}

function TeamRow({
  names,
  score,
  canAdjust,
  onMinus,
  onPlus,
  onScoreChange,
  editing,
  won,
  disabled,
  match,
  slotKeys,
  playerNames,
  onEditSlot,
}: {
  names: string[];
  score: number;
  canAdjust: boolean;
  onMinus: () => void;
  onPlus: () => void;
  onScoreChange: (val: number) => void;
  editing: boolean;
  won: boolean;
  disabled?: boolean;
  match: Match;
  slotKeys: [MatchSlotKey, MatchSlotKey];
  playerNames: [string, string];
  /** Sprint 53: when set, render an Edit chip on each player */
  onEditSlot?: (slot: MatchSlotKey) => void;
}) {
  const swap = useMatchSwap();
  // Sprint 15: swap-mode tap targets pada nama pemain (kalau match pending)
  const swapEnabled = !!swap && swap.enabled && match.status === "pending";

  const slotIds: [string, string] = [
    match[slotKeys[0]],
    match[slotKeys[1]],
  ];

  function PlayerName({ idx }: { idx: 0 | 1 }) {
    const slot = slotKeys[idx];
    const pid = slotIds[idx];
    const name = playerNames[idx];
    const isSelected =
      swap?.selected?.matchId === match.id && swap?.selected?.slot === slot;

    if (!swapEnabled) {
      // Sprint 53: when caller provides onEditSlot, render the Edit chip
      // next to the name. Clicking opens the replace-player modal.
      const nameNode = (
        <span
          style={{
            fontSize: idx === 0 ? 14 : 12,
            fontWeight: idx === 0 ? 700 : 600,
            color:
              idx === 0
                ? won
                  ? "var(--text-900)"
                  : "var(--text-700)"
                : "var(--text-500)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {name}
        </span>
      );
      if (!onEditSlot) {
        return (
          <div
            style={{
              fontSize: idx === 0 ? 14 : 12,
              fontWeight: idx === 0 ? 700 : 600,
              color:
                idx === 0
                  ? won
                    ? "var(--text-900)"
                    : "var(--text-700)"
                  : "var(--text-500)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
        );
      }
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          {nameNode}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditSlot(slot);
            }}
            aria-label={`Replace ${name}`}
            title={`Replace ${name}`}
            style={{
              flexShrink: 0,
              padding: "2px 8px",
              fontSize: 10,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: "var(--primary-700)",
              background: "var(--primary-50)",
              border: "1px solid var(--primary-200)",
              borderRadius: "var(--r-full)",
              cursor: "pointer",
              lineHeight: 1.4,
            }}
          >
            Edit
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          swap!.handleTap({
            matchId: match.id,
            slot,
            participantId: pid,
            name,
          })
        }
        disabled={swap!.isPending}
        title="Tap to swap players"
        style={{
          background: isSelected
            ? "var(--primary-50)"
            : "transparent",
          border: isSelected
            ? "1.5px dashed var(--primary)"
            : "1.5px dashed transparent",
          padding: "2px 6px",
          borderRadius: "var(--r-sm)",
          fontFamily: "inherit",
          fontSize: idx === 0 ? 14 : 12,
          fontWeight: idx === 0 ? 700 : 600,
          color: isSelected
            ? "var(--primary-700)"
            : idx === 0
              ? won
                ? "var(--text-900)"
                : "var(--text-700)"
              : "var(--text-500)",
          textAlign: "left",
          width: "100%",
          cursor: swap!.isPending ? "wait" : "pointer",
          lineHeight: 1.3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isSelected && "✓ "}
        {name}
      </button>
    );
  }

  return (
    <div style={{ padding: "var(--s-2) 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-3)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <PlayerName idx={0} />
          <PlayerName idx={1} />
          {won && (
            <span
              style={{
                display: "inline-block",
                marginTop: 4,
                padding: "2px 6px",
                borderRadius: "var(--r-sm)",
                fontSize: 9,
                fontWeight: 800,
                background: "var(--primary-100)",
                color: "var(--primary-700)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Win
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {canAdjust && (
            <button
              type="button"
              onClick={onMinus}
              disabled={disabled || score === 0}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--r-full)",
                background: "var(--bg-soft)",
                color: "var(--text-700)",
                fontSize: 18,
                fontWeight: 700,
                border: "none",
                cursor: disabled || score === 0 ? "not-allowed" : "pointer",
                opacity: disabled || score === 0 ? 0.3 : 1,
              }}
            >
              −
            </button>
          )}

          {editing ? (
            <input
              type="number"
              min={0}
              max={99}
              value={score}
              onChange={(e) =>
                onScoreChange(
                  Math.max(
                    0,
                    Math.min(99, parseInt(e.target.value || "0", 10))
                  )
                )
              }
              style={{
                width: 60,
                textAlign: "center",
                fontSize: 24,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                border: "2px solid var(--border)",
                borderRadius: "var(--r-md)",
                padding: "4px 6px",
                outline: "none",
              }}
            />
          ) : (
            <div
              style={{
                minWidth: 36,
                textAlign: "center",
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: won ? "var(--primary-700)" : "var(--text-400)",
              }}
            >
              {score}
            </div>
          )}

          {canAdjust && (
            <button
              type="button"
              onClick={onPlus}
              disabled={disabled || score === 99}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--r-full)",
                background: "var(--primary-50)",
                color: "var(--primary-700)",
                fontSize: 18,
                fontWeight: 700,
                border: "none",
                cursor: disabled || score === 99 ? "not-allowed" : "pointer",
                opacity: disabled || score === 99 ? 0.3 : 1,
              }}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
