"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateAvatarAction,
  removeAvatarAction,
} from "@/app/actions/avatar";
import { Toast } from "@/components/ui/Toast";
import { compressImageClient } from "@/lib/image/compress-client";

type Props = {
  currentAvatarUrl: string | null;
  initial: string;
};

export function AvatarUploader({ currentAvatarUrl, initial }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileSelect(file: File) {
    setError(null);
    setSuccess(null);

    // Optimistic preview (data URL)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(String(e.target?.result ?? ""));
    reader.readAsDataURL(file);

    startTransition(async () => {
      // Sprint 48: compress dulu — avatar cukup 800px square
      const compressed = await compressImageClient(file, { maxSide: 800 });
      const fd = new FormData();
      fd.set("file", compressed);
      const result = await updateAvatarAction(null, fd);
      if (result?.error) {
        setError(result.error);
        setPreview(currentAvatarUrl); // rollback
      } else if (result?.avatarUrl) {
        setPreview(result.avatarUrl);
        setSuccess(result.success ?? "Tersimpan!");
        router.refresh();
      }
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  }

  function handleRemove() {
    if (!preview) return;
    if (!confirm("Hapus avatar?")) return;
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (result?.error) {
        setError(result.error);
      } else {
        setPreview(null);
        setSuccess(result?.success ?? "Avatar dihapus.");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginBottom: "var(--s-5)",
        }}
      >
        {/* Avatar circle (preview) */}
        <label
          style={{
            position: "relative",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={isPending}
            style={{ display: "none" }}
          />
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: preview
                ? `url(${preview}) center/cover no-repeat`
                : "linear-gradient(135deg, #FB7185, #F43F5E)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 40,
              boxShadow: "var(--shadow-md)",
              border: "4px solid var(--bg)",
            }}
          >
            {!preview && initial}
          </div>
          {/* Camera badge */}
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              background: "var(--primary)",
              color: "#fff",
              width: 30,
              height: 30,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              border: "2px solid var(--bg)",
              boxShadow: "var(--shadow-sm)",
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
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <label
            style={{
              padding: "8px 16px",
              borderRadius: "var(--r-full)",
              background: "var(--bg)",
              color: "var(--text-900)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              disabled={isPending}
              style={{ display: "none" }}
            />
            {isPending ? "Mengunggah..." : preview ? "Ganti foto" : "Pilih foto"}
          </label>

          {preview && !isPending && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--r-full)",
                background: "transparent",
                color: "var(--accent-600)",
                border: "1px solid var(--accent-100)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Hapus
            </button>
          )}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            textAlign: "center",
            maxWidth: 240,
          }}
        >
          Foto akan di-crop square (1:1) otomatis dan dikompres untuk performa.
        </div>
      </div>
    </>
  );
}
