"use client";

/**
 * MatchSwapProvider — Sprint 15.
 *
 * Cross-MatchCard state untuk swap mode. Tap player pertama → select,
 * tap kedua → open confirm modal → submit action.
 *
 * Children render normally; MatchCard children consume via useMatchSwap().
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { swapPlayersAction } from "@/app/actions/matches";
import type { MatchSlotKey } from "@/lib/match/swap";
import { slotLabel } from "@/lib/match/swap";
import { Toast } from "@/components/ui/Toast";

export type SwapSelection = {
  matchId: string;
  slot: MatchSlotKey;
  participantId: string;
  name: string;
};

type Ctx = {
  enabled: boolean;
  selected: SwapSelection | null;
  /** Returns 'selected' kalau jadi current selection; 'reset' kalau toggle off;
   *  'attempt' kalau memicu swap modal */
  handleTap: (sel: SwapSelection) => void;
  cancel: () => void;
  isPending: boolean;
};

const SwapContext = createContext<Ctx | null>(null);

export function useMatchSwap(): Ctx | null {
  return useContext(SwapContext);
}

export function MatchSwapProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<SwapSelection | null>(null);
  const [pending, setPending] = useState<SwapSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTap = useCallback(
    (sel: SwapSelection) => {
      if (!enabled) return;
      setError(null);
      if (!selected) {
        // First tap
        setSelected(sel);
        return;
      }
      // Toggle off
      if (selected.matchId === sel.matchId && selected.slot === sel.slot) {
        setSelected(null);
        return;
      }
      // Second tap → open confirm modal
      setPending(sel);
    },
    [enabled, selected]
  );

  function cancel() {
    setSelected(null);
    setPending(null);
  }

  function confirmSwap() {
    if (!selected || !pending) return;
    startTransition(async () => {
      const result = await swapPlayersAction(
        selected.matchId,
        selected.slot,
        pending.matchId,
        pending.slot
      );
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Pemain ditukar");
        router.refresh();
      }
      setSelected(null);
      setPending(null);
    });
  }

  return (
    <SwapContext.Provider
      value={{ enabled, selected, handleTap, cancel, isPending }}
    >
      {children}

      {pending && selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={cancel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              borderRadius: "var(--r-2xl)",
              padding: "var(--s-5)",
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "var(--s-4)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔄</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "var(--text-900)",
                }}
              >
                Tukar Pemain?
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 12,
                alignItems: "center",
                padding: "var(--s-3)",
                background: "var(--bg-soft)",
                borderRadius: "var(--r-md)",
                marginBottom: "var(--s-4)",
              }}
            >
              <PlayerPanel
                name={selected.name}
                slotLabel={slotLabel(selected.slot)}
              />
              <div style={{ fontSize: 22 }}>↔</div>
              <PlayerPanel
                name={pending.name}
                slotLabel={slotLabel(pending.slot)}
                align="right"
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: "12px 20px",
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
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSwap}
                disabled={isPending}
                className="btn-primary-lg"
                style={{ flex: 1 }}
              >
                {isPending ? "Menukar..." : "Tukar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />
    </SwapContext.Provider>
  );
}

function PlayerPanel({
  name,
  slotLabel,
  align = "left",
}: {
  name: string;
  slotLabel: string;
  align?: "left" | "right";
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div style={{ textAlign: align, display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--primary-700))",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          margin: align === "right" ? "0 0 0 auto" : "0",
        }}
      >
        {initial}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--text-900)",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {slotLabel}
      </div>
    </div>
  );
}
