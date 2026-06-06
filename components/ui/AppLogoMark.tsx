/**
 * AppLogoMark — Carsel Club icon (square) untuk app header / brand spots.
 *
 * Sprint 49: replace placeholder "CC" gradient di semua header dgn
 * actual logo dari `/public/icon.png`. Pakai komponen ini supaya
 * konsisten + bisa swap sumber file di 1 tempat.
 */

import Image from "next/image";

type Props = {
  /** Sisi (px). Default 36 — match .logo-mark size di shared.css */
  size?: number;
  /** Tambahan className (mis. utk override margin). */
  className?: string;
  /** Priority loading (true untuk above-the-fold header). Default true. */
  priority?: boolean;
};

export function AppLogoMark({
  size = 36,
  className,
  priority = true,
}: Props) {
  return (
    <Image
      src="/icon.png"
      alt="Carsel Club"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{
        borderRadius: "var(--r-md, 8px)",
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}
