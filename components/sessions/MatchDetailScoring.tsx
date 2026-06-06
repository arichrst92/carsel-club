"use client";

/**
 * Scoring controls untuk Match Detail page.
 *
 * Dipakai di /sessions/[id]/matches/[matchId]. Mirip MatchCard inline
 * controls tapi lebih roomy, fokus ke action satu match.
 *
 * Permissions: hanya staff (host/co-host) yang bisa interact. Bukan-staff
 * lihat read-only score display.
 */

import { useState, useTransition } from "react";
import {
  endMatchAction,
  editCompletedMatchScoreAction,
  revertMatchAction,
  startMatchAction,
  updateMatchScoreAction,
} from "@/app/actions/matches";
import { Toast } from "@/components/ui/Toast";

type MatchStatus = "pending" | "live" | "completed";

export type MatchDetailScoringProps = {
  matchId: string;
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  canManage: boolean;
  team1Label: string;
  team2Label: string;
};

export function MatchDetailScoring(props: MatchDetailScoringProps) {
  const [t1, setT1] = useState(props.team1Score);
  const [t2, setT2] = useState(props.team2Score);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPendingStatus = props.status === "pending";
  const isLive = props.status === "live";
  const isCompleted = props.status === "completed";

  // Show +/- adjusters when: staff + (live OR editing completed)
  const canAdjust = props.canManage && (isLive || (isCompleted && editing));

  function bump(side: 1 | 2, delta: number) {
    const cur = side === 1 ? t1 : t2;
    const next = Math.max(0, Math.min(99, cur + delta));
    if (next === cur) return;
    if (side === 1) setT1(next);
    else setT2(next);

    if (isLive && !editing) {
      // Auto-save during live play
      startTransition(async () => {
        const r = await updateMatchScoreAction(
          props.matchId,
          side === 1 ? next : t1,
          side === 2 ? next : t2
        );
        if (r?.error) {
          setError(r.error);
          if (side === 1) setT1(t1);
          else setT2(t2);
        }
      });
    }
  }

  function handleStart() {
    startTransition(async () => {
      const r = await startMatchAction(props.matchId);
      if (r?.error) setError(r.error);
    });
  }

  function handleEnd() {
    startTransition(async () => {
      const r = await endMatchAction(props.matchId, t1, t2);
      if (r?.error) setError(r.error);
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      const r = await editCompletedMatchScoreAction(props.matchId, t1, t2);
      if (r?.error) {
        setError(r.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleCancelEdit() {
    setT1(props.team1Score);
    setT2(props.team2Score);
    setEditing(false);
  }

  function handleRevert() {
    if (!confirm("Revert match ke status Live? Stats akan dibatalkan.")) return;
    startTransition(async () => {
      const r = await revertMatchAction(props.matchId);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />

      <section
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--r-xl)",
          padding: "var(--s-4)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "var(--s-2)",
          }}
        >
          <TeamColumn
            label={props.team1Label}
            score={t1}
            canAdjust={canAdjust}
            disabled={isPending}
            onMinus={() => bump(1, -1)}
            onPlus={() => bump(1, +1)}
            winning={isCompleted && t1 > t2}
          />
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-400)",
            }}
          >
            VS
          </div>
          <TeamColumn
            label={props.team2Label}
            score={t2}
            canAdjust={canAdjust}
            disabled={isPending}
            onMinus={() => bump(2, -1)}
            onPlus={() => bump(2, +1)}
            winning={isCompleted && t2 > t1}
          />
        </div>

        {/* Action area */}
        {props.canManage && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: "var(--s-3)",
            }}
          >
            {isPendingStatus && (
              <button
                type="button"
                onClick={handleStart}
                disabled={isPending}
                className="btn-primary-lg"
                style={{ width: "100%" }}
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
                <span>{isPending ? "Memulai..." : "Start Match"}</span>
              </button>
            )}

            {isLive && (
              <button
                type="button"
                onClick={handleEnd}
                disabled={isPending}
                className="btn-primary-lg"
                style={{ width: "100%" }}
              >
                {isPending ? "Saving..." : "End Match"}
              </button>
            )}

            {isCompleted && !editing && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={isPending}
                  style={btnSecondary}
                >
                  ✎ Edit Score
                </button>
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={isPending}
                  style={btnDanger}
                >
                  ↶ Revert
                </button>
              </div>
            )}

            {isCompleted && editing && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  style={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isPending}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {isPending ? "Saving..." : "Save Edit"}
                </button>
              </div>
            )}
          </div>
        )}

        {!props.canManage && (
          <div
            style={{
              marginTop: "var(--s-3)",
              fontSize: 11,
              color: "var(--text-500)",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Hanya host/co-host yang bisa input score
          </div>
        )}
      </section>
    </>
  );
}

function TeamColumn({
  label,
  score,
  canAdjust,
  disabled,
  onMinus,
  onPlus,
  winning,
}: {
  label: string;
  score: number;
  canAdjust: boolean;
  disabled: boolean;
  onMinus: () => void;
  onPlus: () => void;
  winning: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 48,
          lineHeight: 1,
          color: winning ? "var(--success-700, #15803d)" : "var(--text-900)",
        }}
      >
        {score}
      </div>
      {canAdjust && (
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button
            type="button"
            onClick={onMinus}
            disabled={disabled}
            aria-label="Minus"
            style={adjustBtn}
          >
            −
          </button>
          <button
            type="button"
            onClick={onPlus}
            disabled={disabled}
            aria-label="Plus"
            style={{ ...adjustBtn, background: "var(--primary)" , color: "#fff", borderColor: "var(--primary)" }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

const adjustBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "var(--r-full)",
  fontSize: 22,
  fontWeight: 800,
  background: "var(--bg-soft)",
  color: "var(--text-900)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  fontFamily: "var(--font-display)",
};

const btnSecondary: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  background: "var(--bg-soft)",
  color: "var(--text-900)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  background: "var(--bg-soft)",
  color: "var(--danger-700, #b91c1c)",
  border: "1px solid var(--danger-200, #fecaca)",
  borderRadius: "var(--r-md)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
