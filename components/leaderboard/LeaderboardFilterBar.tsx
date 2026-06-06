"use client";

/**
 * Filter bar — scope (Global/Regional) + period + city selector (Sprint 32).
 *
 * Updates URL query string via router.replace.
 */

import { useRouter, useSearchParams } from "next/navigation";
import type {
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardSort,
} from "@/lib/leaderboard/types";

export type LeaderboardFilterBarProps = {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  city: string | null;
  cities: string[];
  myCity: string | null;
};

export function LeaderboardFilterBar(props: LeaderboardFilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value === "") sp.delete(key);
    else sp.set(key, value);
    router.replace(`/leaderboard?${sp.toString()}`);
  }

  function setScope(scope: LeaderboardScope) {
    const sp = new URLSearchParams(params.toString());
    sp.set("scope", scope);
    if (scope === "global") {
      sp.delete("city");
    } else if (props.myCity) {
      sp.set("city", props.myCity);
    }
    router.replace(`/leaderboard?${sp.toString()}`);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      <div className="segmented" role="tablist">
        <button
          type="button"
          className={`segmented-option ${props.scope === "global" ? "active" : ""}`}
          onClick={() => setScope("global")}
        >
          🌏 Global
        </button>
        <button
          type="button"
          className={`segmented-option ${props.scope === "regional" ? "active" : ""}`}
          onClick={() => setScope("regional")}
          disabled={!props.myCity && props.cities.length === 0}
        >
          📍 Regional
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: props.scope === "regional" ? "1fr 1fr" : "1fr",
          gap: "var(--s-2)",
        }}
      >
        <SmallSelect
          label="Periode"
          value={props.period}
          onChange={(v) => setParam("period", v === "all_time" ? null : v)}
          options={[
            { value: "all_time", label: "Sepanjang masa" },
            { value: "monthly", label: "30 hari" },
            { value: "weekly", label: "7 hari" },
          ]}
        />
        {props.scope === "regional" && (
          <SmallSelect
            label="Kota"
            value={props.city ?? ""}
            onChange={(v) => setParam("city", v || null)}
            options={[
              { value: "", label: "Semua kota" },
              ...props.cities.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}
      </div>
    </div>
  );
}

function SmallSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-500)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "var(--s-2) var(--s-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          fontSize: 13,
          fontWeight: 700,
          background: "var(--bg-card)",
          color: "var(--text-900)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
