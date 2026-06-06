"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateCoverPhotoAction,
  removeCoverPhotoAction,
} from "@/app/actions/session-photo";
import { Toast } from "@/components/ui/Toast";
import { compressImageClient } from "@/lib/image/compress-client";
import { ImageCropModal } from "@/components/ui/ImageCropModal";

type Props = {
  sessionId: string;
  currentCoverUrl: string | null;
};

export function CoverPhotoUploader({ sessionId, currentCoverUrl }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentCoverUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Sprint 50: file dipick → tampil crop modal dulu sebelum upload
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  async function uploadCroppedFile(croppedFile: File) {
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(String(e.target?.result ?? ""));
    reader.readAsDataURL(croppedFile);

    setPickedFile(null);

    startTransition(async () => {
      // Compress (crop sudah handle dimension, ini cuma re-encode kalau perlu)
      const compressed = await compressImageClient(croppedFile);
      const fd = new FormData();
      fd.set("file", compressed);
      const result = await updateCoverPhotoAction(sessionId, null, fd);
      if (result?.error) {
        setError(result.error);
        setPreview(currentCoverUrl);
      } else if (result?.coverPhotoUrl) {
        setPreview(result.coverPhotoUrl);
        setSuccess(result.success ?? "Cover updated!");
        router.refresh();
      }
    });
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPickedFile(file); // open crop modal
    e.target.value = "";
  }

  function handleRemove() {
    if (!preview) return;
    if (!confirm("Hapus cover photo session?")) return;
    startTransition(async () => {
      const result = await removeCoverPhotoAction(sessionId);
      if (result?.error) {
        setError(result.error);
      } else {
        setPreview(null);
        setSuccess(result?.success ?? "Cover dihapus.");
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Crop modal — Sprint 50 — buka saat user pick file baru */}
      {pickedFile && (
        <ImageCropModal
          file={pickedFile}
          aspectRatio={2}
          outputWidth={1600}
          onConfirm={uploadCroppedFile}
          onCancel={() => setPickedFile(null)}
        />
      )}
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      {preview ? (
        // Existing cover: show + replace/remove controls
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 160,
            background: `url(${preview}) center/cover no-repeat`,
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-card)",
            marginBottom: "var(--s-2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              display: "flex",
              gap: 8,
            }}
          >
            <label
              style={{
                padding: "8px 14px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onInputChange}
                disabled={isPending}
                style={{ display: "none" }}
              />
              {isPending ? "Mengunggah..." : "Ganti"}
            </label>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              style={{
                padding: "8px 12px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 11,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              🗑
            </button>
          </div>
        </div>
      ) : (
        // No cover: empty state + upload button
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            height: 120,
            background: "var(--bg-soft)",
            border: "2px dashed var(--border)",
            borderRadius: "var(--r-xl)",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.6 : 1,
            marginBottom: "var(--s-2)",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onInputChange}
            disabled={isPending}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: 28, opacity: 0.5 }}>📸</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              color: "var(--text-900)",
            }}
          >
            {isPending ? "Mengunggah..." : "Tambah cover photo"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 600,
            }}
          >
            JPG/PNG/HEIC — auto-crop 2:1 landscape
          </div>
        </label>
      )}
    </>
  );
}
