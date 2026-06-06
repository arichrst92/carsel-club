"use client";

export function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.location.reload();
      }}
      className="btn-primary"
      style={{ minWidth: 160 }}
    >
      Coba lagi
    </button>
  );
}
