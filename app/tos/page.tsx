/**
 * Terms of Service (Sprint 37) — minimum viable.
 */

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Terms & Conditions",
};

const LAST_UPDATED = "June 6, 2026";

export default function TosPage() {
  return (
    <LegalShell title="Terms & Conditions">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 0 }}>
        Terms & Conditions
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-500)" }}>
        Last updated: {LAST_UPDATED}
      </p>

      <h2 style={h2}>1. Acceptance</h2>
      <p>
        By signing up and using Carsel Club, you agree to be bound by these
        terms. If you don't agree, don't use the app.
      </p>

      <h2 style={h2}>2. Account & Security</h2>
      <ul>
        <li>One account per WhatsApp number. Accounts are not transferable.</li>
        <li>You are responsible for all activity that happens under your account.</li>
        <li>Don't share your OTP or session link with people you don't know.</li>
      </ul>

      <h2 style={h2}>3. Prohibited Behavior</h2>
      <ul>
        <li>Spam, harassment, or content that offends other users.</li>
        <li>
          Stat manipulation (fake matches, score collusion, multiple accounts to
          inflate tier).
        </li>
        <li>
          Uploading content that violates copyright or is illegal (pornography,
          violence, etc.).
        </li>
        <li>
          Reverse-engineering, mass scraping, or building a clone for
          commercial purposes without permission.
        </li>
      </ul>

      <h2 style={h2}>4. Content You Upload</h2>
      <p>
        You grant Carsel Club a non-exclusive license to store, process, and
        display profile/cover/session photos you upload, solely for app
        operations.
      </p>

      <h2 style={h2}>5. Stats & Match Integrity</h2>
      <p>
        Hosts and co-hosts are responsible for score accuracy. Carsel Club
        reserves the right to review and adjust stats if there is evidence of
        manipulation. Admin recompute (see the admin dashboard) can rebuild
        stats from source data when needed.
      </p>

      <h2 style={h2}>6. Termination</h2>
      <p>
        We reserve the right to disable any account that violates these terms
        without notice. You can close your account any time via support.
      </p>

      <h2 style={h2}>7. Disclaimer</h2>
      <p>
        Carsel Club is provided "as-is". We don't guarantee the service is
        100% downtime-free or bug-free. Stats, leaderboards, and rankings are
        informational and not a substitute for official PB Padel tournaments.
      </p>

      <h2 style={h2}>8. Limitation of Liability</h2>
      <p>
        Carsel Club's liability is limited to the amount you have paid for the
        service (currently free). We are not responsible for indirect damages
        arising from use of the app.
      </p>

      <h2 style={h2}>9. Changes</h2>
      <p>
        These terms may change; material changes will be announced via in-app
        notification at least 14 days in advance. Continuing to use the app
        after an update means you accept the new terms.
      </p>

      <h2 style={h2}>10. Governing Law</h2>
      <p>
        These terms are governed by the laws of the Republic of Indonesia.
        Disputes are resolved through good-faith discussion; if unresolved,
        through the Indonesian National Arbitration Board (BANI) in Jakarta.
      </p>

      <h2 style={h2}>11. Contact</h2>
      <p>
        <a href="mailto:support@carsel.club" style={{ color: "var(--primary-700)" }}>
          support@carsel.club
        </a>
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
