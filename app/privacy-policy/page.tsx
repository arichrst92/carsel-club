/**
 * Privacy Policy (Sprint 37) — minimum viable disclosure untuk public launch.
 *
 * IMPORTANT: Review legal sebelum production. Replace [PT NAMA HOLDING],
 * alamat, dan kontak DPO dengan info real.
 */

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Kebijakan Privasi",
};

const LAST_UPDATED = "6 Juni 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Kebijakan Privasi">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 0 }}>
        Kebijakan Privasi
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-500)" }}>
        Terakhir diperbarui: {LAST_UPDATED}
      </p>

      <h2 style={h2}>1. Data yang Kami Kumpulkan</h2>
      <ul>
        <li>
          <strong>Nomor WhatsApp</strong> — digunakan untuk autentikasi via
          OTP dan notifikasi opsional.
        </li>
        <li>
          <strong>Nama tampilan + kota (opsional)</strong> — ditampilkan di
          profil + leaderboard.
        </li>
        <li>
          <strong>Foto profil + cover session</strong> — opsional, ditampilkan
          publik kalau profil kamu Public.
        </li>
        <li>
          <strong>Stats permainan</strong> — match, win/loss/draw, points,
          tier — direkam otomatis saat kamu main.
        </li>
        <li>
          <strong>Log aktivitas</strong> — event seperti login, create session,
          tier-up disimpan untuk troubleshooting + monitoring (retensi 30 hari).
        </li>
      </ul>

      <h2 style={h2}>2. Cara Data Digunakan</h2>
      <ul>
        <li>Operasional aplikasi: matchmaking, stats, leaderboard, notifikasi.</li>
        <li>
          Notifikasi: invite session, reminder H-1, hasil match, tier-up
          (sesuai preferensi kamu di Settings).
        </li>
        <li>
          Keamanan: detect penyalahgunaan via rate-limit + log review.
        </li>
      </ul>

      <h2 style={h2}>3. Data yang Tidak Kami Kumpulkan</h2>
      <p>
        Lokasi GPS, kontak buku alamat, data pembayaran, foto galeri (kecuali
        yang kamu upload manual).
      </p>

      <h2 style={h2}>4. Dengan Siapa Data Dibagikan</h2>
      <ul>
        <li>
          <strong>Fonnte</strong> (gateway WhatsApp) — hanya nomor WA + isi
          pesan notifikasi.
        </li>
        <li>
          <strong>Web Push provider</strong> (FCM/APNs) — endpoint push tidak
          identifikasi user secara langsung.
        </li>
        <li>
          Kami <strong>tidak</strong> menjual data ke advertiser.
        </li>
      </ul>

      <h2 style={h2}>5. Hak Kamu</h2>
      <ul>
        <li>
          <strong>Akses</strong> data: lihat semua data via halaman Profil.
        </li>
        <li>
          <strong>Koreksi</strong>: edit profile + privacy settings kapan saja.
        </li>
        <li>
          <strong>Hapus akun</strong>: hubungi support@carsel.club untuk
          permintaan penghapusan (dilaksanakan dalam 14 hari).
        </li>
        <li>
          <strong>Cabut consent</strong>: matikan notifikasi WA via Settings.
        </li>
      </ul>

      <h2 style={h2}>6. Retensi</h2>
      <p>
        Data akun disimpan selama akun aktif. Log aktivitas dihapus otomatis
        setelah 30 hari. Backup database disimpan 14 hari (local) + remote
        sesuai konfigurasi internal.
      </p>

      <h2 style={h2}>7. Anak di Bawah Umur</h2>
      <p>
        Carsel Club ditujukan untuk pengguna 17 tahun ke atas. Kami tidak
        secara sengaja mengumpulkan data dari anak-anak di bawah 17 tahun.
      </p>

      <h2 style={h2}>8. Kontak</h2>
      <p>
        Pertanyaan kebijakan privasi:{" "}
        <a href="mailto:support@carsel.club" style={{ color: "var(--primary-700)" }}>
          support@carsel.club
        </a>
        .
      </p>

      <p style={{ marginTop: 28, fontSize: 12, color: "var(--text-500)" }}>
        Dokumen ini adalah versi minimum viable. Versi lengkap dengan dasar
        hukum (UU PDP 27/2022) akan dipublikasi sebelum launch publik penuh.
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
