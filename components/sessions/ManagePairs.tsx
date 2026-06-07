"use client";

/**
 * ManagePairs — Sprint 52 drag-drop UI for assigning fixed pairs.
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │  Unpaired players (draggable)  │
 *   └────────────────────────────────┘
 *   ┌─────────┐ ┌─────────┐
 *   │ Pair 1  │ │ Pair 2  │   ← slots accept drops
 *   │ [empty] │ │ [P1]    │
 *   │ [empty] │ │ [P2]    │
 *   └─────────┘ └─────────┘
 *
 * When 2 players land in an empty pair → fires assignPairAction.
 * Tap on a paired player's chip → break the pair.
 */

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  assignPairAction,
  breakPairAction,
  clearAllPairsAction,
} from "@/app/actions/session-pairs";
import { Toast } from "@/components/ui/Toast";

type Participant = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: "host" | "co_host" | "player" | "guest";
  pairKey: string | null;
};

type Props = {
  sessionId: string;
  participants: Participant[];
};

type PairSlot = {
  pairKey: string | null; // null = empty new-pair slot
  members: Participant[];
};

const NEW_SLOT_ID = "__new_pair_slot__";

export function ManagePairs({ sessionId, participants }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  // Group participants into pair slots + unpaired pool
  const { pairs, unpaired } = useMemo(() => {
    const byKey = new Map<string, Participant[]>();
    const free: Participant[] = [];
    for (const p of participants) {
      if (p.pairKey) {
        const arr = byKey.get(p.pairKey);
        if (arr) arr.push(p);
        else byKey.set(p.pairKey, [p]);
      } else {
        free.push(p);
      }
    }
    const pairList: PairSlot[] = Array.from(byKey.entries()).map(
      ([pairKey, members]) => ({ pairKey, members })
    );
    // Sort: full pairs first (alphabetical), partial pairs second
    pairList.sort((a, b) => {
      const aFull = a.members.length === 2 ? 0 : 1;
      const bFull = b.members.length === 2 ? 0 : 1;
      if (aFull !== bFull) return aFull - bFull;
      return (a.members[0]?.name ?? "").localeCompare(b.members[0]?.name ?? "");
    });
    return { pairs: pairList, unpaired: free };
  }, [participants]);

  const activeParticipant = activeId
    ? participants.find((p) => p.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const dragged = participants.find((p) => p.id === active.id);
    if (!dragged) return;
    if (dragged.pairKey) return; // can't drag already-paired players (must break first)

    const overId = String(over.id);

    // Drop onto "new pair" placeholder → wait for next drop into the same slot
    if (overId === NEW_SLOT_ID) {
      // No partner yet — first drop creates a half-pair. We model this by
      // doing nothing until the user drops a second player onto an existing
      // partial slot (handled below).
      return;
    }

    // Drop onto an existing partial pair slot (1 member) → close the pair
    if (overId.startsWith("pair_")) {
      const targetPairKey = overId.slice("pair_".length);
      const targetPair = pairs.find((p) => p.pairKey === targetPairKey);
      if (!targetPair || targetPair.members.length !== 1) return;
      const partner = targetPair.members[0];

      setError(null);
      startTransition(async () => {
        // Break the half-pair first (the existing solo player), then re-pair
        // both via assignPairAction. Simpler than tracking half-pair state.
        const breakResult = await breakPairAction(sessionId, partner.id);
        if (breakResult?.error) {
          setError(breakResult.error);
          return;
        }
        const assignResult = await assignPairAction(
          sessionId,
          partner.id,
          dragged.id
        );
        if (assignResult?.error) {
          setError(assignResult.error);
        } else {
          setSuccess(assignResult?.success ?? "Pair created");
          router.refresh();
        }
      });
      return;
    }

    // Drop onto another unpaired player chip → pair them directly
    if (overId.startsWith("free_")) {
      const targetId = overId.slice("free_".length);
      if (targetId === dragged.id) return;
      const partner = participants.find((p) => p.id === targetId);
      if (!partner || partner.pairKey) return;
      setError(null);
      startTransition(async () => {
        const result = await assignPairAction(
          sessionId,
          dragged.id,
          partner.id
        );
        if (result?.error) setError(result.error);
        else {
          setSuccess(result?.success ?? "Pair created");
          router.refresh();
        }
      });
    }
  }

  function handleBreak(participantId: string) {
    if (!confirm("Break this pair?")) return;
    setError(null);
    startTransition(async () => {
      const result = await breakPairAction(sessionId, participantId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Pair removed");
        router.refresh();
      }
    });
  }

  function handleClearAll() {
    if (!confirm("Clear all pairs and start over?")) return;
    setError(null);
    startTransition(async () => {
      const result = await clearAllPairsAction(sessionId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "All pairs cleared");
        router.refresh();
      }
    });
  }

  const totalCount = participants.length;
  const pairedCount = participants.filter((p) => p.pairKey).length;
  const allPaired = pairedCount === totalCount && totalCount > 0;
  const fullPairCount = pairs.filter((p) => p.members.length === 2).length;

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      <main className="app-content subscreen">
        <div
          style={{
            padding: "var(--s-3)",
            background: allPaired ? "var(--primary-50)" : "var(--bg-soft)",
            border: `1px solid ${allPaired ? "var(--primary-100)" : "var(--border-light)"}`,
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--s-2)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
                color: allPaired ? "var(--primary-700)" : "var(--text-900)",
              }}
            >
              {pairedCount} / {totalCount} players paired ·{" "}
              {fullPairCount} pair{fullPairCount !== 1 ? "s" : ""}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {allPaired
                ? "Ready to generate Round 1"
                : "Drag a player onto a partner to pair them"}
            </div>
          </div>
          {pairedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={pending}
              style={{
                padding: "6px 10px",
                background: "transparent",
                color: "var(--accent-600)",
                border: "1px solid var(--accent-100)",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Clear all
            </button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Unpaired pool */}
          {unpaired.length > 0 && (
            <section style={{ marginBottom: "var(--s-4)" }}>
              <div className="section-head">
                <h3>Unpaired ({unpaired.length})</h3>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--s-2)",
                  padding: "var(--s-3)",
                  background: "var(--bg-soft)",
                  borderRadius: "var(--r-md)",
                  minHeight: 80,
                }}
              >
                {unpaired.map((p) => (
                  <FreePlayerChip key={p.id} player={p} />
                ))}
              </div>
            </section>
          )}

          {/* Pair slots */}
          <section>
            <div className="section-head">
              <h3>Pairs</h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--s-3)",
              }}
            >
              {pairs.map((pair) => (
                <PairSlotCard
                  key={pair.pairKey ?? "new"}
                  pair={pair}
                  onBreak={handleBreak}
                />
              ))}
              {pairs.length === 0 && unpaired.length >= 2 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "var(--s-4)",
                    background: "var(--bg-soft)",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--r-md)",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--text-500)",
                    fontWeight: 600,
                  }}
                >
                  Drag one player onto another to create your first pair
                </div>
              )}
            </div>
          </section>

          <DragOverlay>
            {activeParticipant ? (
              <PlayerChipPresentational
                player={activeParticipant}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <Link
          href={`/sessions/${sessionId}`}
          className="btn-primary-lg"
          style={{
            textDecoration: "none",
            opacity: allPaired ? 1 : 0.55,
            pointerEvents: allPaired ? "auto" : "none",
          }}
          aria-disabled={!allPaired}
        >
          <span>
            {allPaired ? "Done — back to session" : "Pair everyone first"}
          </span>
          {allPaired && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </Link>
      </div>
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FreePlayerChip({ player }: { player: Participant }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `free_${player.id}`,
  });

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        setDropRef(el);
      }}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.3 : 1,
        outline: isOver ? "2px dashed var(--primary)" : "none",
        borderRadius: "var(--r-full)",
        touchAction: "none",
      }}
    >
      <PlayerChipPresentational player={player} />
    </div>
  );
}

function PairSlotCard({
  pair,
  onBreak,
}: {
  pair: PairSlot;
  onBreak: (participantId: string) => void;
}) {
  const isPartial = pair.members.length === 1;
  const { setNodeRef, isOver } = useDroppable({
    id: pair.pairKey ? `pair_${pair.pairKey}` : NEW_SLOT_ID,
    disabled: pair.members.length === 2,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: "var(--bg)",
        border: `1.5px ${isPartial ? "dashed" : "solid"} ${
          isOver
            ? "var(--primary)"
            : isPartial
              ? "var(--primary-200)"
              : "var(--border-light)"
        }`,
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        minHeight: 120,
        position: "relative",
      }}
    >
      {pair.members.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onBreak(p.id)}
          title="Tap to break pair"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            borderRadius: "var(--r-full)",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--primary-700)",
            textAlign: "left",
          }}
        >
          <Avatar player={p} size={28} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {p.name}
          </span>
        </button>
      ))}
      {pair.members.length < 2 && (
        <div
          style={{
            border: "1.5px dashed var(--border)",
            borderRadius: "var(--r-md)",
            padding: "var(--s-3)",
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
          }}
        >
          Drag partner here
        </div>
      )}
    </div>
  );
}

function PlayerChipPresentational({
  player,
  dragging = false,
}: {
  player: Participant;
  dragging?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px 6px 4px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-full)",
        cursor: "grab",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 13,
        color: "var(--text-900)",
        boxShadow: dragging ? "var(--shadow-md)" : "var(--shadow-sm)",
        userSelect: "none",
      }}
    >
      <Avatar player={player} size={28} />
      <span>{player.name}</span>
    </div>
  );
}

function Avatar({
  player,
  size,
}: {
  player: Participant;
  size: number;
}) {
  const initial = (player.name.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: player.avatarUrl
          ? `url(${player.avatarUrl}) center/cover no-repeat`
          : "linear-gradient(135deg, #FB7185, #F43F5E)",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {!player.avatarUrl && initial}
    </div>
  );
}
