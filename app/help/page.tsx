/**
 * Help & Support — full FAQ (Sprint 40).
 *
 * Replaces Sprint 37 stub with expanded sectioned FAQ + contact + legal links.
 */

import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Help",
};

const FAQ_SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I sign up for Carsel Club?",
        a: "Tap Log in, enter your active WhatsApp number, receive the 6-digit OTP, verify, fill in a short profile (name + city + bio) — done.",
      },
      {
        q: "What's the difference between Member and Guest?",
        a: "Members have an account + lifetime stats + a tier that grows over time. Guests are session-only — the host can add them without a WA number, but they have no lifetime stats.",
      },
      {
        q: "I didn't receive the OTP. Why?",
        a: "Make sure your WA number is active. Wait 1–2 minutes. Check the Archived/Spam folders in WA. If it still doesn't arrive, tap 'Resend' (max 3 requests per 10 minutes) or contact support.",
      },
    ],
  },
  {
    title: "Hosting a Session",
    items: [
      {
        q: "How do I host a padel session?",
        a: "Tap the + button in the middle of the bottom nav, fill out the 5-step wizard (info, format, type, schedule, review), invite players, then Generate Match when you're ready to start.",
      },
      {
        q: "What's the difference between Americano, Mexicano, and Tournament?",
        a: "Americano = partners rotate every round (everyone plays with everyone). Mexicano = pairings by ranking each round. Tournament = single-elimination bracket.",
      },
      {
        q: "What is Fix Partners?",
        a: "An Americano sub-mode where teams stay the same throughout the session — 2 players are always partners. Useful for tournaments or formal sessions.",
      },
      {
        q: "Can I edit a session after creating it?",
        a: "Yes. Tap the session → Edit menu. You can change info, add/remove players, switch format while the status is still upcoming. Once it's live, many fields lock.",
      },
      {
        q: "How do I invite a non-member player?",
        a: "When adding a player, pick the Guest tab and enter a display name (no WA number needed). The guest only shows up in this session.",
      },
    ],
  },
  {
    title: "Match & Scoring",
    items: [
      {
        q: "Who can enter scores?",
        a: "The host or a co-host. Regular players can only view. Scores are entered using the +/− buttons while the match is Live.",
      },
      {
        q: "What if I entered the wrong score?",
        a: "Before the match ends: edit directly with +/−. After it ends: tap the match → Edit Score. Stats auto-recompute (revert the delta + apply the new value).",
      },
      {
        q: "Can I revert a match from completed back to live?",
        a: "Yes. The host opens match detail → Revert. Stats reverse automatically until the score is updated and the match is ended again.",
      },
      {
        q: "How many points do I earn per match?",
        a: "Win = 3 points, Draw = 2 points, Loss = 1 point. The total accumulates and you tier up automatically.",
      },
    ],
  },
  {
    title: "Tier & Achievements",
    items: [
      {
        q: "What's the full tier ladder?",
        a: "Rookie (0) → Bronze (50 pts/10 matches) → Silver (150/25) → Gold (300/50) → Platinum (600/100) → Master (1000/200). Tier goes up automatically when the threshold is reached.",
      },
      {
        q: "What if a wrong score causes me to tier down?",
        a: "Tier follows real stats. After a recompute via revert/edit, the tier adjusts too (can go up or down).",
      },
      {
        q: "What achievements are available?",
        a: "Over 15 badges: match milestones, win counts, host counts, streaks, tiers, perfect day, hot session. See the full list under Profile → Achievements.",
      },
      {
        q: "What's a streak?",
        a: "A win streak is the number of matches won in a row. It resets on a loss or draw. Your best win streak is tracked forever.",
      },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        q: "What notifications do I receive?",
        a: "Session invites, the H-1 hour session reminder, match results, friend requests, tier-ups, and achievement unlocks. Configure per type under Settings → Notifications.",
      },
      {
        q: "How do I turn off WA notifications?",
        a: "Profile → Notifications → toggle the WA channel off for any type you don't want.",
      },
      {
        q: "Can I set quiet hours?",
        a: "Yes. Settings → Notifications → Quiet hours start/end. Push & WA aren't sent during those hours (in-app still arrives).",
      },
    ],
  },
  {
    title: "Privacy & Data",
    items: [
      {
        q: "Who can see my profile?",
        a: "Public by default (anyone with the link). You can switch to Friends (friends only) or Private (only you) under Profile → Edit Profile.",
      },
      {
        q: "How do I block friend requests from strangers?",
        a: "Profile → Privacy → Friend requests → set 'Off' or 'Friends of friends only'.",
      },
      {
        q: "Can I export all my data?",
        a: "Yes. Profile → Privacy → Data export → Download JSON. Includes profile, sessions, match history, achievements.",
      },
      {
        q: "How do I delete my account?",
        a: "Profile → Privacy → Permanently delete account → type 'DELETE' to confirm. The account is permanently anonymized; historical stats are kept to preserve session data integrity.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <LegalShell title="Help">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          marginTop: 0,
        }}
      >
        Help & Support
      </h1>
      <p>Have questions or issues? Reach the Carsel Club team via:</p>
      <ul>
        <li>
          WhatsApp:{" "}
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--primary-700)" }}
          >
            +62 812-3456-7890
          </a>
        </li>
        <li>Email: support@carsel.club</li>
        <li>Instagram: @carsel.club</li>
      </ul>

      {FAQ_SECTIONS.map((section) => (
        <section key={section.title} style={{ marginTop: 28 }}>
          <h2 style={h2}>{section.title}</h2>
          {section.items.map((item) => (
            <details key={item.q} style={{ marginTop: 8 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: "6px 0",
                  fontSize: 14,
                }}
              >
                {item.q}
              </summary>
              <p
                style={{
                  marginTop: 4,
                  marginBottom: 8,
                  paddingLeft: 16,
                  borderLeft: "2px solid var(--border-light)",
                  fontSize: 13,
                  color: "var(--text-700)",
                  lineHeight: 1.6,
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </section>
      ))}

      <section style={{ marginTop: 32 }}>
        <h2 style={h2}>Legal</h2>
        <ul>
          <li>
            <Link
              href="/privacy-policy"
              style={{ color: "var(--primary-700)" }}
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/tos" style={{ color: "var(--primary-700)" }}>
              Terms & Conditions
            </Link>
          </li>
        </ul>
      </section>

      <p style={{ marginTop: 28, fontSize: 12, color: "var(--text-500)" }}>
        Didn't find your answer? Tap the WhatsApp link above to chat with
        support directly.
      </p>
    </LegalShell>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 16,
  marginTop: 24,
  marginBottom: 8,
  color: "var(--text-900)",
};
