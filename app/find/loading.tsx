import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { BottomNav } from "@/components/nav/BottomNav";

export default function FindLoading() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Find Session</span>
        </div>
      </header>
      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        <Skeleton
          height={120}
          borderRadius="var(--r-2xl)"
          style={{ marginBottom: "var(--s-3)" }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: "var(--s-3)" }}>
          <Skeleton height={32} width={120} borderRadius="var(--r-full)" />
          <Skeleton height={32} width={140} borderRadius="var(--r-full)" />
        </div>

        <SkeletonCard height={180} />
        <SkeletonCard height={180} />
      </main>
      <BottomNav />
    </div>
  );
}
