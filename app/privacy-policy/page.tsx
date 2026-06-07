/**
 * Privacy Policy (Sprint 37) — minimum viable disclosure for public launch.
 *
 * IMPORTANT: Review with legal before production. Replace [PT NAMA HOLDING],
 * address, and DPO contact with the real info.
 */

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy",
};

const LAST_UPDATED = "June 6, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 0 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-500)" }}>
        Last updated: {LAST_UPDATED}
      </p>

      <h2 style={h2}>1. Data We Collect</h2>
      <ul>
        <li>
          <strong>WhatsApp number</strong> — used for OTP authentication and
          optional notifications.
        </li>
        <li>
          <strong>Display name + city (optional)</strong> — shown on your
          profile + the leaderboard.
        </li>
        <li>
          <strong>Profile photo + session cover</strong> — optional; shown
          publicly if your profile is Public.
        </li>
        <li>
          <strong>Gameplay stats</strong> — matches, win/loss/draw, points,
          tier — recorded automatically as you play.
        </li>
        <li>
          <strong>Activity logs</strong> — events like logins, session
          creation, tier-ups are stored for troubleshooting + monitoring
          (30-day retention).
        </li>
      </ul>

      <h2 style={h2}>2. How We Use Your Data</h2>
      <ul>
        <li>App operations: matchmaking, stats, leaderboard, notifications.</li>
        <li>
          Notifications: session invites, H-1 reminders, match results, tier-ups
          (per your preferences in Settings).
        </li>
        <li>
          Security: detecting abuse via rate-limit + log review.
        </li>
      </ul>

      <h2 style={h2}>3. Data We Don't Collect</h2>
      <p>
        GPS location, address book contacts, payment data, gallery photos
        (except what you upload manually).
      </p>

      <h2 style={h2}>4. Who We Share Data With</h2>
      <ul>
        <li>
          <strong>Fonnte</strong> (WhatsApp gateway) — only your WA number +
          notification message body.
        </li>
        <li>
          <strong>Web Push providers</strong> (FCM/APNs) — the push endpoint
          doesn't directly identify the user.
        </li>
        <li>
          We do <strong>not</strong> sell data to advertisers.
        </li>
      </ul>

      <h2 style={h2}>5. Your Rights</h2>
      <ul>
        <li>
          <strong>Access</strong>: view all your data via the Profile page.
        </li>
        <li>
          <strong>Correction</strong>: edit your profile + privacy settings any time.
        </li>
        <li>
          <strong>Delete account</strong>: email support@carsel.club to request
          deletion (carried out within 14 days).
        </li>
        <li>
          <strong>Withdraw consent</strong>: disable WA notifications in Settings.
        </li>
      </ul>

      <h2 style={h2}>6. Retention</h2>
      <p>
        Account data is kept while the account is active. Activity logs are
        automatically deleted after 30 days. Database backups are kept 14 days
        (local) + remote per internal configuration.
      </p>

      <h2 style={h2}>7. Minors</h2>
      <p>
        Carsel Club is intended for users 17 and older. We do not knowingly
        collect data from children under 17.
      </p>

      <h2 style={h2}>8. Contact</h2>
      <p>
        Privacy policy questions:{" "}
        <a href="mailto:support@carsel.club" style={{ color: "var(--primary-700)" }}>
          support@carsel.club
        </a>
        .
      </p>

      <p style={{ marginTop: 28, fontSize: 12, color: "var(--text-500)" }}>
        This document is a minimum viable version. A full version with the
        legal basis (Indonesian Personal Data Protection Law, UU PDP 27/2022)
        will be published before the full public launch.
      </p>
    </LegalShell>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 16,
  marginTop: 24,
  marginBottom: 8,
};
