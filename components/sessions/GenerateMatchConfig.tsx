"use client";

/**
 * Sprint 13: Generate Match wizard — per-round override siapa ikut main.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/generate-match.html
 * - Flow: lib/match/generator (sit-out fairness + anti-repeat partner)
 */

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { generateRoundAction } from "@/app/actions/matches";
import { suggestRoundCount } from "@/lib/match/round-count";
import { Toast } from "@/components/ui/Toast";

type Participant = {
  id: string;
  userId: string | null;
  guestName: string | null;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  userDisplayName: string | null;
  userAvatarUrl?: string | null;
};

type Props = {
  sessionId: string;
  sessionTitle: string;
  sessionFormat: "americano" | "mexicano" | "tournament";
  sessionFixPartners: boolean;
  numCourts: number;
  nextRoundNumber: number;
  participants: Participant[];
};

export function GenerateMatchConfig({
  sessionId,
  sessionTitle,
  sessionFormat,
  sessionFixPartners,
  numCourts,
  nextRoundNumber,
  participants,
}: Props) {
  const router = useRouter();
  const [active, setActive] = useState<Set<string>>(
    () => new Set(participants.filter((p) => p.isPlaying).map((p) => p.id))
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCount = active.size;
  const courtsThisRound = Math.min(numCourts, Math.floor(activeCount / 4));
  const playingThisRound = courtsThisRound * 4;
  const sitOuts = activeCount - playingThisRound;
  const canGenerate = activeCount >= 4;

  // Sprint 14: smart default round count suggestion
  const roundSuggestion = useMemo(
    () =>
      suggestRoundCount({
        format: sessionFormat,
        fixPartners: sessionFixPartners,
        playerCount: activeCount,
      }),
    [sessionFormat, sessionFixPartners, activeCount]
  );

  // Grouping
  const hostsAndCohosts = useMemo(
    () =>
      participants.filter(
        (p) => p.role === "host" || p.role === "co_host"
      ),
    [participants]
  );
  const membersAndGuests = useMemo(
    () =>
      participants.filter((p) => p.role === "player" || p.role === "guest"),
    [participants]
  );

  function toggle(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function allOn() {
    setActive(new Set(participants.map((p) => p.id)));
  }

  function hostAndCohostOff() {
    setActive((prev) => {
      const next = new Set(prev);
      hostsAndCohosts.forEach((p) => next.delete(p.id));
      return next;
    });
  }

  function handleSubmit() {
    if (!canGenerate) {
      setError("Need at least 4 active players");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateRoundAction(sessionId, {
        playingParticipantIds: Array.from(active),
      });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push(`/sessions/${sessionId}/matches`);
      }
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />

      <main
        className="app-content subscreen with-footer"
        style={{ paddingBottom: "calc(72px + var(--s-4))" }}
      >
        {/* Session banner */}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--primary-50)",
            border: "1px solid var(--primary-100)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--primary-700)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Round {nextRoundNumber}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--text-900)",
              marginTop: 2,
            }}
          >
            {sessionTitle}
          </div>
        </div>

        {/* Sprint 14: Smart default round count hint */}
        {canGenerate && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "var(--bg-soft)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-md)",
              marginBottom: "var(--s-3)",
              fontSize: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--text-900)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Suggested: ~{roundSuggestion.suggested} round total
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-500)",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {roundSuggestion.reason}
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "var(--s-3)",
          }}
        >
          <button
            type="button"
            onClick={allOn}
            style={{
              flex: 1,
              padding: 10,
              background: "var(--bg-soft)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--text-700)",
              cursor: "pointer",
            }}
          >
            Semua ON
          </button>
          <button
            type="button"
            onClick={hostAndCohostOff}
            style={{
              flex: 1,
              padding: 10,
              background: "var(--bg-soft)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--text-700)",
              cursor: "pointer",
            }}
          >
            Host & Co-host OFF
          </button>
        </div>

        {/* Section: Host & Co-host */}
        {hostsAndCohosts.length > 0 && (
          <Section title="Host & Co-host">
            {hostsAndCohosts.map((p) => (
              <ToggleRow
                key={p.id}
                participant={p}
                on={active.has(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </Section>
        )}

        {/* Section: Members & Guests */}
        {membersAndGuests.length > 0 && (
          <Section title="Players & Guests">
            {membersAndGuests.map((p) => (
              <ToggleRow
                key={p.id}
                participant={p}
                on={active.has(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </Section>
        )}

        {/* Summary card */}
        <section
          style={{
            marginTop: "var(--s-4)",
            padding: "var(--s-4)",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#fff",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              opacity: 0.7,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            🎾 Preview
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <SumStat label="Aktif" value={activeCount} />
            <SumStat label="Court terpakai" value={courtsThisRound} />
            <SumStat label="Main round ini" value={playingThisRound} />
            <SumStat label="Sit out" value={sitOuts} />
          </div>
          {!canGenerate && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                background: "rgba(248,113,133,0.18)",
                color: "#FCA5A5",
                borderRadius: "var(--r-md)",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              ⚠ Need at least 4 active players to generate a round
            </div>
          )}
        </section>
      </main>

      <div className="sticky-footer">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canGenerate}
          className="btn-primary-lg"
          style={{ width: "100%" }}
        >
          {isPending
            ? "Generating..."
            : `Generate Round ${nextRoundNumber}`}
        </button>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "var(--s-3)" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
          padding: "0 4px",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </section>
  );
}

function ToggleRow({
  participant,
  on,
  onToggle,
}: {
  participant: Participant;
  on: boolean;
  onToggle: () => void;
}) {
  const name =
    participant.guestName ??
    participant.userDisplayName ??
    "?";
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const roleLabel =
    participant.role === "host"
      ? "Host"
      : participant.role === "co_host"
        ? "Co-host"
        : participant.role === "guest"
          ? "Guest"
          : null;

  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        background: on ? "var(--bg)" : "var(--bg-soft)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        opacity: on ? 1 : 0.55,
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: participant.userAvatarUrl
            ? `url(${participant.userAvatarUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, var(--primary), var(--primary-700))",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {!participant.userAvatarUrl && initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-900)",
          }}
        >
          {name}
          {roleLabel && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: "var(--r-full)",
                background: "var(--bg-soft)",
                color: "var(--text-500)",
                letterSpacing: "0.04em",
              }}
            >
              {roleLabel.toUpperCase()}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
          }}
        >
          {on ? "✓ Ikut main" : "Tidak main round ini"}
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: on ? "var(--primary)" : "var(--border)",
          position: "relative",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: on ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.15s",
          }}
        />
      </div>
    </div>
  );
}

function SumStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          opacity: 0.7,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 28,
          lineHeight: 1.1,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
