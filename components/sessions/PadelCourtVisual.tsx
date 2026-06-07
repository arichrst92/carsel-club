"use client";

/**
 * Padel court visual + interactive scoring (Sprint 46 refactor).
 *
 * Single source of truth untuk score di Match Detail page.
 * Score overlay floating di court + +/- buttons inline (staff only during
 * live atau edit mode) + action button (Start/End/Edit/Revert) below court.
 *
 * Refs:
 * - Prototype: docs/CarselClubPrototype/match-detail.html
 * - CSS: app/globals.css .padel-court + related
 */

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  endMatchAction,
  editCompletedMatchScoreAction,
  revertMatchAction,
  startMatchAction,
  updateMatchScoreAction,
} from "@/app/actions/matches";
import { Toast } from "@/components/ui/Toast";
import type { MatchDetailPlayer } from "@/lib/db/queries/match-detail";

type MatchStatus = "pending" | "live" | "completed";

const TIER_SHORT: Record<string, string> = {
  Rookie: "RKE",
  Bronze: "BRZ",
  Silver: "SLV",
  Gold: "GLD",
  Platinum: "PLT",
  Master: "MST",
};

export type PadelCourtVisualProps = {
  matchId: string;
  team1: MatchDetailPlayer[]; // 2 entries — top
  team2: MatchDetailPlayer[]; // 2 entries — bottom
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  canManage: boolean;
};

export function PadelCourtVisual(props: PadelCourtVisualProps) {
  const [t1, setT1] = useState(props.team1Score);
  const [t2, setT2] = useState(props.team2Score);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPendingStatus = props.status === "pending";
  const isLive = props.status === "live";
  const isCompleted = props.status === "completed";
  const showScore = isLive || isCompleted;
  const canAdjust = props.canManage && (isLive || (isCompleted && editing));

  function bump(side: 1 | 2, delta: number) {
    const cur = side === 1 ? t1 : t2;
    const next = Math.max(0, Math.min(99, cur + delta));
    if (next === cur) return;
    if (side === 1) setT1(next);
    else setT2(next);

    if (isLive && !editing) {
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
      if (r?.error) setError(r.error);
      else setEditing(false);
    });
  }

  function handleCancelEdit() {
    setT1(props.team1Score);
    setT2(props.team2Score);
    setEditing(false);
  }

  function handleRevert() {
    if (!confirm("Revert match ke status Live? Stats akan dibatalkan."))
      return;
    startTransition(async () => {
      const r = await revertMatchAction(props.matchId);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />

      <div className="padel-court">
        {showScore && (
          <ScoreOverlay
            position="top"
            score={t1}
            canAdjust={canAdjust}
            disabled={isPending}
            onMinus={() => bump(1, -1)}
            onPlus={() => bump(1, +1)}
          />
        )}

        <div className="court-team top">
          <div className="court-team-positions">
            {props.team1.map((p) => (
              <CourtPlayer key={p.participantId} player={p} side="team-1" />
            ))}
          </div>
        </div>

        <div className="court-net">
          <span className="court-net-label">NET</span>
        </div>

        <div className="court-team bottom">
          <div className="court-team-positions">
            {props.team2.map((p) => (
              <CourtPlayer key={p.participantId} player={p} side="team-2" />
            ))}
          </div>
        </div>

        {showScore && (
          <ScoreOverlay
            position="bottom"
            score={t2}
            canAdjust={canAdjust}
            disabled={isPending}
            onMinus={() => bump(2, -1)}
            onPlus={() => bump(2, +1)}
          />
        )}
      </div>

      {/* Action button area */}
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
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}

      {!props.canManage && (
        <div
          style={{
            marginTop: "var(--s-2)",
            fontSize: 11,
            color: "var(--text-500)",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Hanya host/co-host yang bisa input score
        </div>
      )}
    </>
  );
}

function ScoreOverlay({
  position,
  score,
  canAdjust,
  disabled,
  onMinus,
  onPlus,
}: {
  position: "top" | "bottom";
  score: number;
  canAdjust: boolean;
  disabled: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div
      className={`court-score-overlay ${position}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {canAdjust && (
        <button
          type="button"
          onClick={onMinus}
          disabled={disabled}
          aria-label="Minus score"
          style={inlineAdjustBtn}
        >
          −
        </button>
      )}
      <span>{score}</span>
      {canAdjust && (
        <button
          type="button"
          onClick={onPlus}
          disabled={disabled}
          aria-label="Plus score"
          style={{
            ...inlineAdjustBtn,
            background: "var(--primary, #14b8a6)",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.4)",
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

function CourtPlayer({
  player,
  side,
}: {
  player: MatchDetailPlayer;
  side: "team-1" | "team-2";
}) {
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();
  const inner = (
    <>
      <div
        className="cp-avatar"
        style={
          player.avatarUrl
            ? {
                backgroundImage: `url(${player.avatarUrl})`,
                color: "transparent",
              }
            : undefined
        }
      >
        {!player.avatarUrl && initial}
      </div>
      <div className="cp-name">{player.name}</div>
      <div className="cp-tier">
        {TIER_SHORT[player.tierName ?? ""] ?? (player.tierName ?? "RKE")}
      </div>
    </>
  );

  return player.userId ? (
    <Link
      href={`/u/${player.userId}`}
      className={`court-player ${side}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {inner}
    </Link>
  ) : (
    <div className={`court-player ${side}`}>{inner}</div>
  );
}

const inlineAdjustBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  fontSize: 18,
  fontWeight: 800,
  background: "rgba(255,255,255,0.85)",
  color: "var(--text-900, #0f172a)",
  border: "1.5px solid rgba(255,255,255,0.4)",
  cursor: "pointer",
  fontFamily: "var(--font-display)",
  display: "grid",
  placeItems: "center",
  lineHeight: 1,
  padding: 0,
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
