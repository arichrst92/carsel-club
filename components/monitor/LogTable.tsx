"use client";

import { useState } from "react";
import type { LogRow } from "@/lib/db/queries/logs";
import {
  LEVEL_BG,
  LEVEL_COLORS,
  LEVEL_LABEL,
  formatTimeOnly,
  formatRelative,
} from "@/lib/log/format";

export function LogTable({ rows }: { rows: LogRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "var(--s-6)",
          textAlign: "center",
          color: "var(--text-500)",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        📭 No log entries in this range.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {rows.map((row) => {
        const isOpen = expanded === row.id;
        const isEvent = row.type === "event";
        const accentColor = row.level
          ? LEVEL_COLORS[row.level]
          : "var(--primary)";
        const accentBg = row.level
          ? LEVEL_BG[row.level]
          : "var(--primary-50)";

        return (
          <div
            key={row.id}
            style={{
              border: "1px solid var(--border-light)",
              borderLeft: `3px solid ${accentColor}`,
              borderRadius: "var(--r-md)",
              background: "var(--bg)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : row.id)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "var(--r-full)",
                    background: accentBg,
                    color: accentColor,
                    letterSpacing: "0.04em",
                  }}
                >
                  {isEvent ? "EVENT" : LEVEL_LABEL[row.level!]}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-400)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {formatTimeOnly(row.createdAt)} ·{" "}
                  {formatRelative(row.createdAt)}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-900)",
                  fontFamily: "var(--font-display)",
                  wordBreak: "break-word",
                }}
              >
                {row.name}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 4,
                  fontSize: 11,
                  color: "var(--text-500)",
                  fontWeight: 600,
                  flexWrap: "wrap",
                }}
              >
                {row.userDisplayName && (
                  <span>
                    👤 {row.userDisplayName}
                    {row.userWhatsappTail && ` (***${row.userWhatsappTail})`}
                  </span>
                )}
                {!row.userDisplayName && row.userId && (
                  <span>👤 {row.userId.slice(0, 8)}…</span>
                )}
                {row.route && <span>🔗 {row.route}</span>}
              </div>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--bg-soft)",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--text-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 4,
                  }}
                >
                  Context
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "8px 10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--r-sm)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono, monospace)",
                    overflow: "auto",
                    maxHeight: 320,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "var(--text-700)",
                  }}
                >
                  {JSON.stringify(row.context, null, 2)}
                </pre>
                {row.userAgent && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 10,
                      color: "var(--text-500)",
                      fontWeight: 600,
                    }}
                  >
                    UA: {row.userAgent}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
