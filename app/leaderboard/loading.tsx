import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";
import { AppLogoMark } from "@/components/ui/AppLogoMark";
import { BottomNav } from "@/components/nav/BottomNav";

export default function LeaderboardLoading() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <AppLogoMark />
          <span className="logo-text">Leaderboard</span>
        </div>
      </header>
      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* Hero */}
        <Skeleton
          height={120}
          borderRadius="var(--r-2xl)"
          style={{ marginBottom: "var(--s-4)" }}
        />

        {/* Sort tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "var(--s-3)" }}>
          <Skeleton height={32} width={80} borderRadius="var(--r-full)" />
          <Skeleton height={32} width={80} borderRadius="var(--r-full)" />
          <Skeleton height={32} width={80} borderRadius="var(--r-full)" />
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
