"use client";

import { useState, useTransition } from "react";
import type { Match } from "@/lib/db/types";
import {
  updateMatchScoreAction,
  endMatchAction,
  editCompletedMatchScoreAction,
} from "@/app/actions/matches";

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
    label: "Selesai",
    color: "var(--primary-700)",
    bg: "var(--primary-50)",
  },
};

export function MatchCard({
  match,
  lookup,
  canManage,
}: {
  match: Match;
  lookup: ParticipantLookup;
  canManage: boolean;
}) {
  const [t1, setT1] = useState(match.team1Score);
  const [t2, setT2] = useState(match.team2Score);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCompleted = match.status === "completed";
  const status = STATUS_STYLES[match.status];

  const showLiveControls = canManage && !isCompleted;
  const showEditControls = canManage && isCompleted;
  const canAdjust = showLiveControls || editing;

  const showWinner = isCompleted && !editing;
  const t1Won = showWinner && match.team1Score > match.team2Score;
  const t2Won = showWinner && match.team2Score > match.team1Score;

  const team1Names = [
    lookup[match.team1P1Id]?.name ?? "?",
    lookup[match.team1P2Id]?.name ?? "?",
  ];
  const team2Names = [
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

    startTransition(async () => {
      const result = await updateMatchScoreAction(match.id, newT1, newT2);
      if (result?.error) {
        alert(result.error);
        setT1(match.team1Score);
        setT2(match.team2Score);
      }
    });
  }

  function handleEnd() {
    if (!confirm(`End match dengan score ${t1} - ${t2}?`)) return;
    startTransition(async () => {
      const result = await endMatchAction(match.id, t1, t2);
      if (result?.error) alert(result.error);
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await editCompletedMatchScoreAction(match.id, t1, t2);
      if (result?.error) {
        alert(result.error);
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
      />

      {/* Actions */}
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
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            marginTop: "var(--s-3)",
            padding: "8px 14px",
            width: "100%",
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
          ✏️ Edit Score
        </button>
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
    </div>
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
}) {
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
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: won ? "var(--text-900)" : "var(--text-700)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {names[0]}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-500)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {names[1]}
          </div>
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
