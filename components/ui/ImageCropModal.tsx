"use client";

/**
 * ImageCropModal — modal crop foto dengan aspect ratio tetap.
 *
 * Use case: cover photo session (2:1 landscape), atau apa saja yang
 * butuh crop kompak sebelum upload. Output: File baru hasil canvas.
 *
 * Tanpa dependency external — pakai HTML5 canvas + pointer events.
 *
 * Cara pakai:
 *   <ImageCropModal
 *     file={pickedFile}
 *     aspectRatio={2/1}
 *     outputWidth={1600}
 *     onConfirm={(croppedFile) => uploadCroppedFile(croppedFile)}
 *     onCancel={() => setPickedFile(null)}
 *   />
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  file: File;
  /** width / height. Default 2 (2:1 landscape). */
  aspectRatio?: number;
  /** Output width px. Default 1600. Height auto dari aspect. */
  outputWidth?: number;
  /** JPEG quality 0-1. Default 0.88. */
  quality?: number;
  onConfirm: (croppedFile: File) => void | Promise<void>;
  onCancel: () => void;
};

export function ImageCropModal({
  file,
  aspectRatio = 2,
  outputWidth = 1600,
  quality = 0.88,
  onConfirm,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1); // 1.0 = fit-cover baseline
  const [offsetX, setOffsetX] = useState(0); // pixel offset
  const [offsetY, setOffsetY] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview area: max 360 wide (fit phone narrow), match aspect ratio
  const PREVIEW_W = 360;
  const PREVIEW_H = Math.round(PREVIEW_W / aspectRatio);

  // Drag state
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number }>(
    { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 }
  );

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLoading(false);
      // Center offset = 0,0
      setOffsetX(0);
      setOffsetY(0);
      setScale(1);
      requestAnimationFrame(draw);
    };
    img.onerror = () => {
      setError("Gagal load gambar");
      setLoading(false);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Re-draw saat state berubah
  useEffect(() => {
    if (!loading) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, offsetX, offsetY, loading]);

  function computeBaseFit(img: HTMLImageElement): {
    drawW: number;
    drawH: number;
  } {
    // Base = fit-cover ke preview area
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const previewAspect = PREVIEW_W / PREVIEW_H;
    let drawW: number;
    let drawH: number;
    if (imgAspect > previewAspect) {
      // image lebih lebar → fit height, crop sides
      drawH = PREVIEW_H;
      drawW = drawH * imgAspect;
    } else {
      // image lebih tinggi/sama → fit width, crop top/bottom
      drawW = PREVIEW_W;
      drawH = drawW / imgAspect;
    }
    return { drawW, drawH };
  }

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    const { drawW, drawH } = computeBaseFit(img);
    const scaledW = drawW * scale;
    const scaledH = drawH * scale;

    const x = (PREVIEW_W - scaledW) / 2 + offsetX;
    const y = (PREVIEW_H - scaledH) / 2 + offsetY;

    ctx.drawImage(img, x, y, scaledW, scaledH);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offsetX,
      baseY: offsetY,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffsetX(dragRef.current.baseX + dx);
    setOffsetY(dragRef.current.baseY + dy);
  }
  function onPointerUp() {
    dragRef.current.active = false;
  }

  async function handleConfirm() {
    if (!imgRef.current) return;
    setConfirming(true);
    try {
      const img = imgRef.current;
      const { drawW, drawH } = computeBaseFit(img);
      const scaledW = drawW * scale;
      const scaledH = drawH * scale;

      // Map preview coords ke output coords
      const ratio = outputWidth / PREVIEW_W;
      const outW = outputWidth;
      const outH = Math.round(outputWidth / aspectRatio);

      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("Canvas ctx null");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, outW, outH);

      const x = ((PREVIEW_W - scaledW) / 2 + offsetX) * ratio;
      const y = ((PREVIEW_H - scaledH) / 2 + offsetY) * ratio;
      ctx.drawImage(img, x, y, scaledW * ratio, scaledH * ratio);

      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob((b) => resolve(b), "image/jpeg", quality)
      );
      if (!blob) throw new Error("Toblob null");

      const base = file.name.replace(/\.[^./\\]+$/, "");
      const croppedFile = new File([blob], `${base}-cover.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      await onConfirm(croppedFile);
    } catch (e) {
      console.error("[ImageCropModal] confirm failed:", e);
      setError(e instanceof Error ? e.message : "Crop gagal");
      setConfirming(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 18,
          padding: 16,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 4,
            color: "var(--text-900)",
          }}
        >
          Crop foto cover
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Geser foto + zoom utk pilih bagian. Aspect rasio 2:1.
        </div>

        {/* Crop area */}
        <div
          style={{
            position: "relative",
            width: PREVIEW_W,
            maxWidth: "100%",
            margin: "0 auto",
            borderRadius: 8,
            overflow: "hidden",
            background: "#000",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Memuat…
            </div>
          )}
          {/* Frame overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid rgba(255,255,255,0.9)",
              pointerEvents: "none",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.35) inset",
            }}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ marginTop: 12 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-700)",
              display: "block",
              marginBottom: 4,
            }}
          >
            Zoom: {scale.toFixed(2)}×
          </label>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "var(--accent-50)",
              color: "var(--accent-600)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--bg-soft)",
              color: "var(--text-700)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              cursor: confirming ? "not-allowed" : "pointer",
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              cursor:
                confirming || loading ? "not-allowed" : "pointer",
              opacity: confirming || loading ? 0.6 : 1,
            }}
          >
            {confirming ? "Mengunggah…" : "Pakai foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
