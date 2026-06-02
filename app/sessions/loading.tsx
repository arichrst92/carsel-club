import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/nav/BottomNav";

export default function SessionsLoading() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Sessions</span>
        </div>
      </header>
      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "var(--s-3)" }}>
          <Skeleton height={36} width={100} borderRadius="var(--r-full)" />
          <Skeleton height={36} width={100} borderRadius="var(--r-full)" />
        </div>

        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
      </main>
      <BottomNav />
    </div>
  );
}
