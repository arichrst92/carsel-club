import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/nav/BottomNav";

export default function ProfileLoading() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Profile</span>
        </div>
      </header>
      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* Avatar + name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: "var(--s-4)",
          }}
        >
          <Skeleton width={88} height={88} borderRadius="var(--r-full)" />
          <Skeleton height={20} width={180} />
          <Skeleton height={14} width={120} />
        </div>

        {/* Tier card */}
        <SkeletonCard height={120} />

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--s-2)",
            marginBottom: "var(--s-4)",
          }}
        >
          <Skeleton height={70} borderRadius="var(--r-xl)" />
          <Skeleton height={70} borderRadius="var(--r-xl)" />
          <Skeleton height={70} borderRadius="var(--r-xl)" />
        </div>

        <Skeleton height={20} width={140} style={{ marginBottom: "var(--s-2)" }} />
        <SkeletonCard height={100} />
      </main>
      <BottomNav />
    </div>
  );
}
