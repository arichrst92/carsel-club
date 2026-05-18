"use client";

/**
 * Bottom navigation — 5 tabs: Home / Sessions / Create (FAB) / Leaderboard / Profile.
 * Highlights active tab based on current path.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  matchPrefix?: string;
  fab?: boolean;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12L12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </svg>
    ),
  },
  {
    href: "/sessions",
    label: "Sessions",
    matchPrefix: "/sessions",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/sessions/new",
    label: "Create",
    fab: true,
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    matchPrefix: "/leaderboard",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5A2.5 2.5 0 0 1 2 6.5V6h4M18 9h1.5A2.5 2.5 0 0 0 22 6.5V6h-4" />
        <path d="M6 22h12M9 22V12.5M15 22V12.5" />
        <path d="M6 6V2h12v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V6z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    matchPrefix: "/profile",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const path = usePathname();

  function isActive(tab: Tab): boolean {
    if (tab.fab) return false;
    if (tab.matchPrefix) {
      // Sessions tab should match /sessions but NOT /sessions/new (which is Create)
      if (tab.href === "/sessions") {
        return path === "/sessions" || /^\/sessions\/[^/]+/.test(path);
      }
      return path.startsWith(tab.matchPrefix);
    }
    return path === tab.href;
  }

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-item ${active ? "active" : ""} ${tab.fab ? "fab-wrap" : ""}`}
          >
            {tab.fab ? <div className="nav-fab">{tab.icon}</div> : tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
