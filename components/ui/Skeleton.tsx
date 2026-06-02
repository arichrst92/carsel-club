/**
 * Skeleton primitive — animated shimmer placeholder.
 * Pure CSS, server-renderable (no "use client" needed).
 */

type Props = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = "var(--r-md)",
  style,
  className,
}: Props) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, var(--bg-soft) 0%, var(--bg-canvas) 50%, var(--bg-soft) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonText({
  lines = 1,
  width,
}: {
  lines?: number;
  width?: string | number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 && lines > 1 ? "60%" : width}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120 }: { height?: number | string }) {
  return (
    <Skeleton
      height={height}
      borderRadius="var(--r-xl)"
      style={{ marginBottom: "var(--s-3)" }}
    />
  );
}

export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius="var(--r-full)" />;
}

export function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3)",
        background: "var(--bg)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
        marginBottom: "var(--s-2)",
      }}
    >
      <SkeletonAvatar />
      <div style={{ flex: 1 }}>
        <Skeleton height={12} width="60%" style={{ marginBottom: 6 }} />
        <Skeleton height={10} width="40%" />
      </div>
    </div>
  );
}
