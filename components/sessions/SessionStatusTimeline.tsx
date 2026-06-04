import {
  STATUS_EMOJI,
  STATUS_LABEL,
  isStatusReached,
  type SessionStatus,
} from "@/lib/sessions/lifecycle";

/**
 * Visual timeline untuk session lifecycle.
 *
 * - Linear: upcoming → live → completed
 * - Cancelled: dropdown ke side path (upcoming → cancelled)
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/session-detail.html (status pill)
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §1
 */

export function SessionStatusTimeline({
  current,
}: {
  current: SessionStatus;
}) {
  const isCancelled = current === "cancelled";
  const linearStages: SessionStatus[] = ["upcoming", "live", "completed"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "var(--s-3)",
        background: "var(--bg-soft)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Status Session
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {linearStages.map((stage, idx) => {
          const reached = isStatusReached(stage, current);
          const isCurrent = stage === current;
          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flex: 1,
              }}
            >
              <StageDot stage={stage} reached={reached} active={isCurrent} />
              {idx < linearStages.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: isStatusReached(linearStages[idx + 1], current)
                      ? "var(--primary)"
                      : "var(--border)",
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
        {isCancelled && (
          <>
            <div
              style={{
                width: 16,
                height: 2,
                background: "var(--accent)",
                borderRadius: 1,
              }}
            />
            <StageDot stage="cancelled" reached active />
          </>
        )}
      </div>
    </div>
  );
}

function StageDot({
  stage,
  reached,
  active,
}: {
  stage: SessionStatus;
  reached: boolean;
  active?: boolean;
}) {
  const bg = active
    ? stage === "cancelled"
      ? "var(--accent)"
      : "var(--primary)"
    : reached
      ? "var(--primary-200)"
      : "var(--bg)";
  const color = active || reached ? "#fff" : "var(--text-500)";
  const border = active
    ? "transparent"
    : reached
      ? "var(--primary-200)"
      : "var(--border)";

  return (
    <div
      title={STATUS_LABEL[stage]}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 48,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--r-full)",
          background: bg,
          color,
          border: `1.5px solid ${border}`,
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          boxShadow: active ? "var(--shadow-sm)" : "none",
        }}
      >
        {STATUS_EMOJI[stage]}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: active ? "var(--text-900)" : "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {STATUS_LABEL[stage]}
      </div>
    </div>
  );
}
