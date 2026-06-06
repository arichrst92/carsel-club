import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carsel Club — Padel Community",
    short_name: "Carsel Club",
    description:
      "Padel community app — host sessions, track matches, climb leaderboard.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#FFFBF5",
    theme_color: "#F97316",
    orientation: "portrait",
    lang: "id",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["sports", "social", "lifestyle"],
  };
}
