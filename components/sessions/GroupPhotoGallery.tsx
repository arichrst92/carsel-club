"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GroupPhotoRow } from "@/lib/db/queries/session-photos";
import {
  addGroupPhotoAction,
  removeGroupPhotoAction,
} from "@/app/actions/session-photo";
import { Toast } from "@/components/ui/Toast";
import { compressImageClient } from "@/lib/image/compress-client";

const MAX = 5;

type Props = {
  sessionId: string;
  photos: GroupPhotoRow[];
  canManage: boolean;
};

export function GroupPhotoGallery({ sessionId, photos, canManage }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const remaining = MAX - photos.length;

  function handleFile(file: File) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      // Sprint 48: compress dulu supaya muat di 1MB Server Action body limit
      const compressed = await compressImageClient(file);
      const fd = new FormData();
      fd.set("file", compressed);
      const result = await addGroupPhotoAction(sessionId, null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(result?.success ?? "Foto ditambahkan");
        router.refresh();
      }
    });
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    // Sequential upload to respect rate limit + max count
    files.slice(0, remaining).forEach(handleFile);
  }

  function handleRemove(photoId: string) {
    if (!confirm("Hapus foto ini?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeGroupPhotoAction(photoId);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(result?.success ?? "Foto dihapus.");
        router.refresh();
      }
    });
  }

  if (photos.length === 0 && !canManage) {
    return null;
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      <section>
        <div className="section-head">
          <h3>
            Foto Group{" "}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-500)",
              }}
            >
              ({photos.length}/{MAX})
            </span>
          </h3>
        </div>

        {photos.length === 0 ? (
          canManage && (
            <UploadButton
              isPending={isPending}
              onInputChange={onInputChange}
              fullWidth
            />
          )
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            {photos.map((p, idx) => (
              <PhotoThumb
                key={p.id}
                photo={p}
                onOpen={() => setLightboxIdx(idx)}
                onRemove={canManage ? () => handleRemove(p.id) : undefined}
                disabled={isPending}
              />
            ))}
            {canManage && remaining > 0 && (
              <UploadTileButton
                isPending={isPending}
                onInputChange={onInputChange}
              />
            )}
          </div>
        )}
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          currentIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNext={() =>
            setLightboxIdx((i) =>
              i !== null && i < photos.length - 1 ? i + 1 : i
            )
          }
          onPrev={() =>
            setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : i))
          }
        />
      )}
    </>
  );
}

function PhotoThumb({
  photo,
  onOpen,
  onRemove,
  disabled,
}: {
  photo: GroupPhotoRow;
  onOpen: () => void;
  onRemove?: () => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        background: `url(${photo.url}) center/cover no-repeat`,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={onOpen}
    >
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          aria-label="Hapus foto"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            fontSize: 12,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function UploadButton({
  isPending,
  onInputChange,
  fullWidth = false,
}: {
  isPending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fullWidth?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        padding: "var(--s-5)",
        background: "var(--bg-soft)",
        border: "2px dashed var(--border)",
        borderRadius: "var(--r-xl)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
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
        {isPending ? "Mengunggah..." : "Upload foto group"}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-500)",
          fontWeight: 600,
        }}
      >
        Max {MAX} foto · Multi-select OK
      </div>
    </label>
  );
}

function UploadTileButton({
  isPending,
  onInputChange,
}: {
  isPending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      style={{
        aspectRatio: "1 / 1",
        background: "var(--bg-soft)",
        border: "2px dashed var(--border)",
        borderRadius: "var(--r-md)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onInputChange}
        disabled={isPending}
        style={{ display: "none" }}
      />
      <div style={{ fontSize: 22, opacity: 0.5 }}>+</div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "var(--text-500)",
          letterSpacing: "0.04em",
        }}
      >
        TAMBAH
      </div>
    </label>
  );
}

function Lightbox({
  photos,
  currentIdx,
  onClose,
  onNext,
  onPrev,
}: {
  photos: GroupPhotoRow[];
  currentIdx: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const photo = photos[currentIdx];
  const hasNext = currentIdx < photos.length - 1;
  const hasPrev = currentIdx > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight") onNext();
        if (e.key === "ArrowLeft") onPrev();
      }}
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          border: "none",
          width: 40,
          height: 40,
          borderRadius: "50%",
          fontSize: 18,
          cursor: "pointer",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
        }}
      >
        ×
      </button>

      <img
        src={photo.url}
        alt="Foto group"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "92vw",
          maxHeight: "82vh",
          borderRadius: 8,
          objectFit: "contain",
          cursor: "default",
        }}
      />

      {/* Pagination indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          disabled={!hasPrev}
          aria-label="Previous"
          style={{
            background: hasPrev ? "rgba(255,255,255,0.18)" : "transparent",
            color: "#fff",
            border: "none",
            width: 36,
            height: 36,
            borderRadius: "50%",
            fontSize: 18,
            cursor: hasPrev ? "pointer" : "default",
            opacity: hasPrev ? 1 : 0.3,
          }}
        >
          ‹
        </button>
        <span>
          {currentIdx + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={!hasNext}
          aria-label="Next"
          style={{
            background: hasNext ? "rgba(255,255,255,0.18)" : "transparent",
            color: "#fff",
            border: "none",
            width: 36,
            height: 36,
            borderRadius: "50%",
            fontSize: 18,
            cursor: hasNext ? "pointer" : "default",
            opacity: hasNext ? 1 : 0.3,
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
