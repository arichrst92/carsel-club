"use client";

/**
 * QR Scan modal untuk add friend via QR code.
 *
 * Pakai native BarcodeDetector API (Chrome Android, Safari iOS 16+).
 * Tanpa external lib supaya bundle kecil. Fallback message kalau browser
 * tidak support — minta user pakai mobile.
 *
 * Flow:
 * 1. Request camera (getUserMedia)
 * 2. Polling tiap ~250ms — detect QR di frame
 * 3. QR berisi URL → kalau path `/u/{userId}` → router.push ke profil
 * 4. User klik Add Friend di profil utk send request
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { onClose: () => void };

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => {
  detect: (image: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (
    window as Window & { BarcodeDetector?: BarcodeDetectorCtor }
  ).BarcodeDetector;
  return ctor ?? null;
}

export function QRScanModal({ onClose }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [matched, setMatched] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let pollId: ReturnType<typeof setInterval> | null = null;
    const Detector = getBarcodeDetector();

    async function start() {
      if (!Detector) {
        setError(
          "Browser ini belum mendukung pemindai QR. Coba pakai HP (Safari/Chrome terbaru)."
        );
        setBusy(false);
        return;
      }
      try {
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

        const detector = new Detector({ formats: ["qr_code"] });

        pollId = setInterval(async () => {
          if (!mounted || !video.videoWidth) return;
          try {
            const codes = await detector.detect(video);
            for (const c of codes) {
              const userId = parseFriendUrl(c.rawValue);
              if (userId) {
                setMatched(userId);
                if (pollId) clearInterval(pollId);
                // Stop camera
                streamRef.current?.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
                // Navigate
                setTimeout(() => {
                  router.push(`/u/${userId}`);
                  onClose();
                }, 600);
                return;
              }
            }
          } catch {
            // ignore intermittent detect errors
          }
        }, 250);
      } catch (e) {
        const err = e as Error;
        if (err.name === "NotAllowedError") {
          setError(
            "Akses kamera ditolak. Izinkan kamera di setting browser untuk scan QR."
          );
        } else if (err.name === "NotFoundError") {
          setError("Kamera tidak ditemukan di perangkat ini.");
        } else {
          setError(err.message || "Gagal membuka kamera.");
        }
        setBusy(false);
      }
    }

    start();
    return () => {
      mounted = false;
      if (pollId) clearInterval(pollId);
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
            Scan QR Teman
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
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
          Arahkan kamera ke QR Code teman di halaman Profil mereka.
        </div>

        {/* Camera viewport */}
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
              ✓ Profil ditemukan
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
 * Return userId atau null kalau bukan profile link Carsel.
 */
export function parseFriendUrl(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/\/u\/([0-9a-fA-F-]{36})(?:[?#/].*)?$/);
  if (match) return match[1];
  return null;
}
