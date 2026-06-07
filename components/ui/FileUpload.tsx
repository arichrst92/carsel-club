"use client";

/**
 * Reusable file upload UI dengan drag-drop, preview, dan validation lokal.
 *
 * Sprint 1: component-only, belum di-wire ke any actual upload endpoint.
 * Sprint 8 (Avatar) akan jadi caller pertama yang pass real action.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1 (storage UI scaffold)
 * - GUI:  docs/CarselClubPrototype/onboarding.html (avatar picker contoh)
 */

import { useState, useRef, useCallback } from "react";
import { compressImageClient } from "@/lib/image/compress-client";

export type FileUploadProps = {
  /** Accepted MIME types (e.g. "image/*"). Default: image/* */
  accept?: string;
  /** Max bytes (client-side guard). Default 25 MB (raw, sebelum compress). */
  maxBytes?: number;
  /** Server should also validate. */
  onSelect: (file: File) => void | Promise<void>;
  /** Show preview thumb saat file dipilih. Default true untuk image. */
  showPreview?: boolean;
  /** Label untuk button (default "Pick file") */
  label?: string;
  /** Disabled state. */
  disabled?: boolean;
  /**
   * Sprint 48: auto-compress image client-side sebelum onSelect
   * supaya tidak hit Server Action body size limit (1MB default).
   * Default true.
   */
  autoCompress?: boolean;
};

export function FileUpload({
  accept = "image/*",
  maxBytes = 25 * 1024 * 1024,
  onSelect,
  showPreview = true,
  label = "Pick file",
  disabled = false,
  autoCompress = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxBytes) {
        const mb = Math.round(maxBytes / 1024 / 1024);
        setError(`File too large. Maximum ${mb} MB.`);
        return;
      }
      if (accept !== "*" && accept !== "*/*") {
        // Coarse client check; server will validate magic bytes.
        const matchesAccept = accept
          .split(",")
          .map((s) => s.trim())
          .some((rule) => {
            if (rule.endsWith("/*")) {
              return file.type.startsWith(rule.slice(0, -1));
            }
            return file.type === rule;
          });
        if (!matchesAccept) {
          setError("File type not allowed.");
          return;
        }
      }

      if (showPreview && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(String(e.target?.result ?? ""));
        reader.readAsDataURL(file);
      }

      setBusy(true);
      try {
        // Sprint 48: compress sebelum upload supaya muat di Server Action
        // body limit. Compress aman untuk non-image (return as-is).
        const toUpload = autoCompress
          ? await compressImageClient(file)
          : file;
        await onSelect(toUpload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [accept, autoCompress, maxBytes, onSelect, showPreview]
  );

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset value supaya same file bisa di-select lagi
    e.target.value = "";
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        padding: "var(--s-4)",
        border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
        background: isDragging ? "var(--primary-50)" : "var(--bg-soft)",
        textAlign: "center",
        transition: "all 0.15s",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      role="button"
      aria-disabled={disabled || busy}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        style={{ display: "none" }}
        disabled={disabled || busy}
      />

      {preview ? (
        <img
          src={preview}
          alt="Preview"
          style={{
            maxWidth: 200,
            maxHeight: 200,
            borderRadius: "var(--r-md)",
            margin: "0 auto var(--s-2)",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 32,
            marginBottom: "var(--s-2)",
            opacity: 0.6,
          }}
        >
          📁
        </div>
      )}

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          color: "var(--text-900)",
        }}
      >
        {busy ? "Uploading..." : label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-500)",
          marginTop: 4,
        }}
      >
        {isDragging ? "Drop file here" : "Tap or drag & drop"}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "var(--s-2)",
            padding: "8px 12px",
            background: "var(--accent-50)",
            color: "var(--accent-600)",
            borderRadius: "var(--r-md)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
