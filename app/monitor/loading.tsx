import { Skeleton } from "@/components/ui/Skeleton";

export default function MonitorLoading() {
  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <div style={{ width: 40 }} />
        <h2 className="subscreen-title">Monitor</h2>
        <div style={{ width: 40 }} />
      </header>
      <main className="app-content subscreen">
        <Skeleton height={48} style={{ marginBottom: 12 }} />
        <Skeleton height={56} style={{ marginBottom: 12 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={64} style={{ marginBottom: 8 }} />
        ))}
      </main>
    </div>
  );
}
