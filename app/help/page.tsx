/**
 * Help & Support stub (Sprint 37). Full FAQ planned di Sprint 40.
 */

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Bantuan",
};

export default function HelpPage() {
  return (
    <LegalShell title="Bantuan">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 0 }}>
        Bantuan & Support
      </h1>
      <p>Ada pertanyaan atau kendala? Hubungi tim Carsel Club via:</p>
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

      <h2 style={{ fontSize: 16, marginTop: 28 }}>FAQ singkat</h2>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Bagaimana cara host session?
        </summary>
        <p>
          Tap tombol <strong>+</strong> di tengah bottom nav, isi detail
          (judul, format, venue, jadwal), invite member/guest, lalu Generate
          Match saat siap mulai.
        </p>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Apakah guest perlu daftar?
        </summary>
        <p>
          Tidak. Host bisa tambah guest tanpa nomor WA. Guest tidak punya
          stats lifetime, hanya muncul di session itu.
        </p>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Bagaimana sistem tier-up bekerja?
        </summary>
        <p>
          Tier naik otomatis saat kamu memenuhi threshold total poin + total
          match. Detail: Rookie → Bronze → Silver → Gold → Platinum → Master.
        </p>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Saya tidak dapat OTP. Kenapa?
        </summary>
        <p>
          Cek nomor WA + status WhatsApp aktif. Tunggu 1-2 menit. Kalau
          belum masuk, tap "Kirim ulang" (max 3 request per 10 menit).
        </p>
      </details>

      <p style={{ marginTop: 28, fontSize: 12, color: "var(--text-500)" }}>
        FAQ lengkap, video tutorial, dan onboarding guide datang di update
        berikutnya.
      </p>
    </LegalShell>
  );
}
