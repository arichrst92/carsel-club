import type { Metadata, Viewport } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import "./shared.css";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Carsel Club — Padel Community Indonesia",
    template: "%s · Carsel Club",
  },
  description:
    "Host & play padel easily. Indonesia padel community — create sessions, generate matches, share live with anyone.",
  applicationName: "Carsel Club",
  authors: [{ name: "Carsel Club" }],
  keywords: ["padel", "indonesia", "padel community", "match", "americano", "mexicano"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Carsel Club",
    title: "Carsel Club — Padel Community Indonesia",
    description: "Host & play padel easily.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carsel Club",
    description: "Host & play padel easily.",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Carsel Club",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Sprint 51: theme color align dgn brand teal + match manifest
  themeColor: "#14B8A6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
