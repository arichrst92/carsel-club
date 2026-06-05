import { Skeleton } from "@/components/ui/Skeleton";

export default function PublicMatchLoading() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Skeleton height={200} style={{ marginBottom: 16 }} />
        <Skeleton height={300} style={{ marginBottom: 16 }} />
        <Skeleton height={80} />
      </main>
    </div>
  );
}
