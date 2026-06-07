"use client";

/**
 * QR Scan modal — reusable utk scan QR profil Carsel.
 *
 * Sprint 50: pakai `jsQR` (pure JS decoder) — works di Safari iOS,
 * Chrome iOS, Chrome Android, Firefox, semua browser modern.
 *
 * Caller pass `onScan(userId)` callback — modal extract userId dari
 * URL `/u/{uuid}` lalu hand off ke caller. Tetap akan call `onClose`
 * setelah handler selesai.
 *
 * Caller examples:
 * - AddFriendActions → router.push(`/u/${userId}`)
 * - ScanMemberButton → addMemberAction(sessionId, userId)
 */

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onScan: (userId: string) => void | Promise<void>;
  onClose: () => void;
  /** Judul header — default "Scan Friend QR". */
  title?: string;
  /** Subtitle deskriptif — default petunjuk standar. */
  subtitle?: string;
};

export function QRScanModal({
  onScan,
  onClose,
  title = "Scan Friend QR",
  subtitle = "Arahkan kamera ke QR Code di halaman Profil teman kamu.",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [matched, setMatched] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let rafId: number | null = null;
    let lastScanTs = 0;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError(
            "Browser ini tidak mendukung akses kamera. Coba update browser kamu."
          );
          setBusy(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setBusy(false);

        // Offscreen canvas untuk frame extraction
        const canvas = document.createElement("canvas");
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setError("Browser tidak mendukung Canvas 2D.");
          return;
        }

        function scan() {
          if (!mounted) return;
          rafId = requestAnimationFrame(scan);
          if (!video || video.videoWidth === 0) return;
          const now = performance.now();
          if (now - lastScanTs < 150) return; // throttle ~6-7 fps
          lastScanTs = now;

          // Downscale untuk speed — jsQR cukup pakai 640px lebar max
          const targetW = Math.min(video.videoWidth, 640);
          const scale = targetW / video.videoWidth;
          const targetH = Math.round(video.videoHeight * scale);
          canvas.width = targetW;
          canvas.height = targetH;
          ctx!.drawImage(video, 0, 0, targetW, targetH);
          const imgData = ctx!.getImageData(0, 0, targetW, targetH);

          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            const userId = parseFriendUrl(code.data);
            if (userId) {
              if (rafId) cancelAnimationFrame(rafId);
              setMatched(userId);
              streamRef.current?.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              setTimeout(async () => {
                try {
                  await onScan(userId);
                } finally {
                  onClose();
                }
              }, 500);
            }
          }
        }
        rafId = requestAnimationFrame(scan);
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotAllowedError") {
          setError(
            "Akses kamera ditolak. Izinkan kamera di setting browser, lalu coba lagi."
          );
        } else if (err.name === "NotFoundError") {
          setError("Kamera tidak ditemukan di perangkat ini.");
        } else if (err.name === "NotReadableError") {
          setError(
            "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tsb lalu coba lagi."
          );
        } else {
          setError(err.message || "Gagal membuka kamera.");
        }
        setBusy(false);
      }
    }

    start();
    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
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
          maxWidth: 420,
          boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 16,
              color: "var(--text-900)",
            }}
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "var(--bg-soft)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-700)",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: error ? "none" : "block",
            }}
          />
          {busy && !error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Memuat kamera…
            </div>
          )}
          {!busy && !error && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "12%",
                border: "3px solid rgba(255,255,255,0.85)",
                borderRadius: 14,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.45) inset",
                pointerEvents: "none",
              }}
            />
          )}
          {matched && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(20,184,166,0.85)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              ✓ Terdeteksi
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              background: "var(--accent-50)",
              color: "var(--accent-600)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "var(--bg-soft)",
            color: "var(--text-700)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

/**
 * Parse QR content. Accept:
 * - https://carsel.club/u/{uuid}
 * - http://carsel.club/u/{uuid}
 * - /u/{uuid}
 */
export function parseFriendUrl(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/\/u\/([0-9a-fA-F-]{36})(?:[?#/].*)?$/);
  if (match) return match[1];
  return null;
}
