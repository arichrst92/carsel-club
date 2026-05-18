import type { Metadata, Viewport } from "next";
import { Quicksand, Nunito } from "next/font/google";
import "./globals.css";
import "./shared.css";

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
    "Host & main padel bareng dengan mudah. Komunitas padel Indonesia — buat session, generate match, share live ke siapa pun.",
  applicationName: "Carsel Club",
  authors: [{ name: "Carsel Club" }],
  keywords: ["padel", "indonesia", "komunitas padel", "match", "americano", "mexicano"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Carsel Club",
    title: "Carsel Club — Padel Community Indonesia",
    description: "Host & main padel bareng dengan mudah.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carsel Club",
    description: "Host & main padel bareng dengan mudah.",
  },
  icons: {
    icon: [
      { url: "/logo-icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/logo-icon.png",
    shortcut: "/logo-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#14b8a6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${quicksand.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
