import { Skeleton } from "@/components/ui/Skeleton";

export default function AchievementsLoading() {
  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Skeleton width={40} height={40} borderRadius="var(--r-full)" />
        <Skeleton height={20} width={140} />
        <div style={{ width: 40 }} />
      </header>
      <main className="app-content subscreen">
        <Skeleton
          height={140}
          borderRadius="var(--r-2xl)"
          style={{ marginBottom: "var(--s-4)" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--s-2)",
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} height={110} borderRadius="var(--r-lg)" />
          ))}
        </div>
      </main>
    </div>
  );
}
