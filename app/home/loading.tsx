import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { AppLogoMark } from "@/components/ui/AppLogoMark";
import { BottomNav } from "@/components/nav/BottomNav";

export default function HomeLoading() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <AppLogoMark />
          <span className="logo-text">Carsel Club</span>
        </div>
      </header>
      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* Hero (tier card) */}
        <Skeleton
          height={140}
          borderRadius="var(--r-2xl)"
          style={{ marginBottom: "var(--s-4)" }}
        />

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--s-2)",
            marginBottom: "var(--s-4)",
          }}
        >
          <Skeleton height={80} borderRadius="var(--r-xl)" />
          <Skeleton height={80} borderRadius="var(--r-xl)" />
          <Skeleton height={80} borderRadius="var(--r-xl)" />
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "var(--s-2)", marginBottom: "var(--s-4)" }}>
          <Skeleton height={60} borderRadius="var(--r-lg)" />
          <Skeleton height={60} borderRadius="var(--r-lg)" />
        </div>

        {/* Next session */}
        <Skeleton height={20} width={140} style={{ marginBottom: "var(--s-2)" }} />
        <SkeletonCard height={160} />

        {/* Recent matches */}
        <Skeleton height={20} width={160} style={{ marginBottom: "var(--s-2)" }} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
      </main>
      <BottomNav />
    </div>
  );
}
