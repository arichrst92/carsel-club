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
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
        <path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
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
