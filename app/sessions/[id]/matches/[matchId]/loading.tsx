import { Skeleton } from "@/components/ui/Skeleton";

export default function MatchDetailLoading() {
  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <div style={{ width: 40 }} />
        <h2 className="subscreen-title">Match Detail</h2>
        <div style={{ width: 40 }} />
      </header>
      <main className="app-content subscreen">
        <Skeleton height={180} style={{ marginBottom: 16 }} />
        <Skeleton height={48} style={{ marginBottom: 8 }} />
        <Skeleton height={48} style={{ marginBottom: 8 }} />
        <Skeleton height={56} style={{ marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={64} style={{ marginBottom: 8 }} />
        ))}
      </main>
    </div>
  );
}
