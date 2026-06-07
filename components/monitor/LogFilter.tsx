"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const TYPE_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "log", label: "Log" },
  { value: "event", label: "Event" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "fatal", label: "Fatal" },
  { value: "error", label: "Error" },
  { value: "warn", label: "Warn" },
  { value: "info", label: "Info" },
];

const RANGE_OPTIONS = [
  { value: "5m", label: "5 menit" },
  { value: "1h", label: "1 jam" },
  { value: "24h", label: "24 jam" },
  { value: "7d", label: "7 hari" },
];

export function LogFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("q") ?? "");

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === null) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.push(`/monitor?${next.toString()}`);
    });
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    update({ q: search });
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
      <form
        onSubmit={onSubmitSearch}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search di name/context…"
          className="form-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 16px",
            borderRadius: "var(--r-md)",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          Cari
        </button>
      </form>

      <FilterChips
        label="Type"
        options={TYPE_OPTIONS}
        current={params.get("type") ?? ""}
        onChange={(v) => update({ type: v })}
      />
      <FilterChips
        label="Level"
        options={LEVEL_OPTIONS}
        current={params.get("level") ?? ""}
        onChange={(v) => update({ level: v })}
      />
      <FilterChips
        label="Rentang"
        options={RANGE_OPTIONS}
        current={params.get("range") ?? "1h"}
        onChange={(v) => update({ range: v })}
      />
    </div>
  );
}

function FilterChips({
  label,
  options,
  current,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  current: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--r-full)",
              border: `1px solid ${
                current === opt.value ? "var(--primary)" : "var(--border)"
              }`,
              background:
                current === opt.value
                  ? "var(--primary-50)"
                  : "var(--bg)",
              color:
                current === opt.value
                  ? "var(--primary-700)"
                  : "var(--text-700)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
