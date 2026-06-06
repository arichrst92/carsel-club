"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function FriendsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} scope="friends" />;
}
