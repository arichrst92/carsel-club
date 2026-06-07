"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export type SessionTab = "upcoming" | "live" | "past";
export type FormatFilter = "all" | "americano" | "mexicano" | "tournament";

const TAB_OPTIONS: Array<{ value: SessionTab; label: string; emoji: string }> = [
  { value: "upcoming", label: "Upcoming", emoji: "📅" },
  { value: "live", label: "Live", emoji: "🔴" },
  { value: "past", label: "Past", emoji: "✅" },
];

const FORMAT_OPTIONS: Array<{ value: FormatFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "americano", label: "Americano" },
  { value: "mexicano", label: "Mexicano" },
];

type Props = {
  counts: { upcoming: number; live: number; past: number };
  currentTab: SessionTab;
  currentFormat: FormatFilter;
  currentQuery: string;
  currentSort: "asc" | "desc";
};

export function SessionsFilterBar({
  counts,
  currentTab,
  currentFormat,
  currentQuery,
  currentSort,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentQuery);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "default") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.push(`/sessions?${next.toString()}`);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: search.trim() });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        marginBottom: "var(--s-3)",
      }}
    >
      {/* Search */}
      <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name session / venue..."
          className="form-input"
          style={{ flex: 1, fontSize: 13 }}
        />
        {(search !== currentQuery || currentQuery) && (
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "10px 14px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            Cari
          </button>
        )}
        {currentQuery && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              update({ q: "" });
            }}
            disabled={isPending}
            style={{
              padding: "10px 14px",
              background: "var(--bg)",
              color: "var(--text-700)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </form>

      {/* Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {TAB_OPTIONS.map((tab) => {
          const isActive = currentTab === tab.value;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => update({ tab: tab.value })}
              disabled={isPending}
              style={{
                padding: "10px 8px",
                background: isActive ? "var(--primary)" : "var(--bg)",
                color: isActive ? "#fff" : "var(--text-700)",
                border: `1px solid ${isActive ? "var(--primary)" : "var(--border-light)"}`,
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span>
                {tab.emoji} {tab.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.8,
                  fontWeight: 600,
                }}
              >
                {count} session
              </span>
            </button>
          );
        })}
      </div>

      {/* Format chips + sort */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {FORMAT_OPTIONS.map((opt) => {
          const isActive = currentFormat === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ format: opt.value })}
              disabled={isPending}
              style={{
                padding: "5px 10px",
                background: isActive ? "var(--primary-50)" : "var(--bg)",
                color: isActive ? "var(--primary-700)" : "var(--text-700)",
                border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => update({ sort: currentSort === "desc" ? "asc" : "desc" })}
            disabled={isPending}
            title={`Sort: ${currentSort === "desc" ? "Newest first" : "Oldest first"}`}
            style={{
              padding: "5px 10px",
              background: "var(--bg)",
              color: "var(--text-700)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-full)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {currentSort === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </div>
    </div>
  );
}
