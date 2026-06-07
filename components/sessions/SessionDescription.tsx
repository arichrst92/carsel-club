"use client";

/**
 * SessionDescription — Sprint 52 — render session.description as a quiet
 * note card outside the hero.
 *
 * Why a client component: long descriptions (paragraph-style) deserve a
 * collapsible "Show more" affordance. Default to 4 lines visible.
 */

import { useState } from "react";

type Props = {
  description: string;
};

const COLLAPSED_MAX_LINES = 4;

export function SessionDescription({ description }: Props) {
  const [expanded, setExpanded] = useState(false);
  // Rough heuristic: ~80 chars per line on mobile. Skip toggle for short notes.
  const isLong =
    description.length > COLLAPSED_MAX_LINES * 80 ||
    description.split("\n").length > COLLAPSED_MAX_LINES;

  return (
    <section>
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--r-lg)",
          padding: "var(--s-3) var(--s-4)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "var(--primary-50)",
            color: "var(--primary-700)",
            display: "grid",
            placeItems: "center",
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="14" y2="17" />
          </svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              color: "var(--text-500)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            About this session
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-700)",
              fontWeight: 500,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              // overflowWrap:anywhere handles long unbroken strings (e.g. URLs
              // or test-typed gibberish) WITHOUT splitting normal words.
              overflowWrap: "anywhere",
              wordBreak: "normal",
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : COLLAPSED_MAX_LINES,
              WebkitBoxOrient: "vertical",
              overflow: expanded ? "visible" : "hidden",
            }}
          >
            {description}
          </div>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{
                marginTop: 6,
                background: "transparent",
                border: "none",
                color: "var(--primary-700)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
