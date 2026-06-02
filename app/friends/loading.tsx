import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";

export default function FriendsLoading() {
  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Skeleton width={40} height={40} borderRadius="var(--r-full)" />
        <Skeleton height={20} width={120} />
        <div style={{ width: 40 }} />
      </header>
      <main className="app-content subscreen">
        <Skeleton
          height={140}
          borderRadius="var(--r-xl)"
          style={{ marginBottom: "var(--s-4)" }}
        />
        <Skeleton height={20} width={160} style={{ marginBottom: "var(--s-2)" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </main>
    </div>
  );
}
