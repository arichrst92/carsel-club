"use client";

import { useState, useTransition } from "react";
import { createSessionAction } from "@/app/actions/sessions";

/**
 * Default scheduled_at = today + 2 hours (rounded to nearest 30min).
 * Used as initial value for datetime-local input.
 */
function defaultDateTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
  // datetime-local format: YYYY-MM-DDTHH:mm (local time, no Z)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateSessionForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    // Convert datetime-local (local time, no TZ) → ISO UTC string for server
    const localStr = String(formData.get("scheduled_at_local") ?? "");
    if (localStr) {
      const date = new Date(localStr); // parsed as user's local TZ
      formData.set("scheduled_at", date.toISOString());
    }

    startTransition(async () => {
      const result = await createSessionAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Title */}
      <Field label="Judul Session" required>
        <input
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={60}
          placeholder="Misal: Padel Minggu Pagi"
          className="input"
        />
      </Field>

      {/* Venue */}
      <Field label="Lokasi / Venue" hint="Optional">
        <input
          name="venue_name"
          type="text"
          maxLength={80}
          placeholder="Misal: Padel Hub Senayan"
          className="input"
        />
      </Field>

      {/* Date & Time */}
      <Field label="Tanggal & Waktu" required>
        <input
          name="scheduled_at_local"
          type="datetime-local"
          required
          defaultValue={defaultDateTime()}
          className="input"
        />
      </Field>

      {/* Num courts */}
      <Field label="Jumlah Court" required hint="1-20">
        <input
          name="num_courts"
          type="number"
          required
          min={1}
          max={20}
          defaultValue={1}
          className="input"
        />
      </Field>

      {/* Fix partners toggle */}
      <div className="rounded-xl border border-border-light bg-bg-soft p-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="fix_partners"
            className="mt-1 size-4 accent-primary-500"
          />
          <div>
            <div className="text-sm font-bold text-text-900">Fix Partners</div>
            <div className="text-xs text-text-500 mt-0.5">
              Aktifkan kalau pasangan main tetap (Round Robin behavior).
            </div>
          </div>
        </label>
      </div>

      {/* Host playing toggle */}
      <div className="rounded-xl border border-border-light bg-bg-soft p-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="host_is_playing"
            defaultChecked
            className="mt-1 size-4 accent-primary-500"
          />
          <div>
            <div className="text-sm font-bold text-text-900">Saya ikut main</div>
            <div className="text-xs text-text-500 mt-0.5">
              Uncheck kalau cuma jadi host (gak ikut court).
            </div>
          </div>
        </label>
      </div>

      {/* Description */}
      <Field label="Catatan" hint="Optional, max 500 char">
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          placeholder="Info tambahan: dress code, biaya patungan, dll"
          className="input resize-none"
        />
      </Field>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-accent-50 border border-accent-100">
          <p className="text-xs text-accent-600 font-semibold">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-primary-500 text-white font-display font-bold text-base shadow-fab disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary-600 active:scale-[0.98] transition"
      >
        {isPending ? "Membuat..." : "Buat Session"}
      </button>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-bg-card);
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 4px var(--color-primary-100);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-bold text-text-700 uppercase tracking-wide">
          {label}
          {required && <span className="text-accent-600"> *</span>}
        </span>
        {hint && <span className="text-xs text-text-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
