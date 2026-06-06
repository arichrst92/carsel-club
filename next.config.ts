import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bump dari default 1 MB → 10 MB. Client side sudah compress
      // image ke ≤1 MB lewat lib/image/compress-client.ts, tapi
      // limit ini guard untuk file non-image atau edge case.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
