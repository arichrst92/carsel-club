/**
 * Sprint 13: GenerateRoundButton sekarang navigasi ke wizard
 * /sessions/[id]/generate (bukan langsung action). Wizard handle override
 * + summary preview + actual generate.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/generate-match.html
 */

import Link from "next/link";

type Props = {
  sessionId: string;
  nextRoundNumber: number;
  activePlayerCount: number;
  redirectAfter?: string; // unused after Sprint 13 (wizard handles)
  variant?: "primary" | "footer";
};

export function GenerateRoundButton({
  sessionId,
  nextRoundNumber,
  activePlayerCount,
  variant = "primary",
}: Props) {
  const insufficient = activePlayerCount < 4;
  const href = insufficient
    ? "#"
    : `/sessions/${sessionId}/generate`;

  const label =
    nextRoundNumber === 1
      ? "Generate Round 1"
      : `Generate Round ${nextRoundNumber}`;

  const buttonContent = (
    <>
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
        <path d="M12 2v6M12 18v4M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M18 12h4" />
      </svg>
      <span>{label}</span>
    </>
  );

  if (variant === "footer") {
    return (
      <div className="sticky-footer">
        <Link
          href={href}
          aria-disabled={insufficient}
          className="btn-primary-lg"
          style={
            insufficient
              ? { pointerEvents: "none", opacity: 0.5 }
              : undefined
          }
        >
          {buttonContent}
        </Link>
        {insufficient && (
          <p
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              textAlign: "center",
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            Butuh minimal 4 pemain aktif (sekarang {activePlayerCount}).
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Link
        href={href}
        aria-disabled={insufficient}
        className="btn-primary-lg"
        style={{
          width: "100%",
          ...(insufficient
            ? { pointerEvents: "none", opacity: 0.5 }
            : {}),
        }}
      >
        {buttonContent}
      </Link>
      {insufficient && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            textAlign: "center",
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          Butuh minimal 4 pemain aktif (sekarang {activePlayerCount}).
        </p>
      )}
    </div>
  );
}
