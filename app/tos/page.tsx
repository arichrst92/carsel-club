/**
 * Terms of Service (Sprint 37) — minimum viable.
 */

import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Syarat & Ketentuan",
};

const LAST_UPDATED = "6 Juni 2026";

export default function TosPage() {
  return (
    <LegalShell title="Syarat & Ketentuan">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 0 }}>
        Syarat & Ketentuan
      </h1>
      <p style={{ fontSize: 12, color: "var(--text-500)" }}>
        Terakhir diperbarui: {LAST_UPDATED}
      </p>

      <h2 style={h2}>1. Penerimaan</h2>
      <p>
        Dengan mendaftar dan menggunakan Carsel Club, kamu setuju terikat oleh
        syarat ini. Jika tidak setuju, jangan gunakan aplikasi.
      </p>

      <h2 style={h2}>2. Akun & Keamanan</h2>
      <ul>
        <li>Satu akun per nomor WhatsApp. Akun tidak dapat dipindahtangankan.</li>
        <li>Kamu bertanggung jawab atas semua aktivitas yang terjadi di akunmu.</li>
        <li>Jangan share OTP atau session link ke pihak yang tidak dikenal.</li>
      </ul>

      <h2 style={h2}>3. Perilaku yang Dilarang</h2>
      <ul>
        <li>Spam, harassment, atau konten yang menyinggung pengguna lain.</li>
        <li>
          Manipulasi stats (fake match, kolusi score, multi-akun untuk inflate
          tier).
        </li>
        <li>
          Upload konten yang melanggar hak cipta atau bersifat ilegal (porn,
          violence, dll).
        </li>
        <li>
          Reverse-engineering, scraping massal, atau membuat klon untuk
          kepentingan komersial tanpa izin.
        </li>
      </ul>

      <h2 style={h2}>4. Konten yang Kamu Upload</h2>
      <p>
        Kamu memberikan Carsel Club lisensi non-eksklusif untuk menyimpan,
        memproses, dan menampilkan foto profil/cover/session photo yang kamu
        upload, semata-mata untuk operasional aplikasi.
      </p>

      <h2 style={h2}>5. Stats & Match Integrity</h2>
      <p>
        Host & co-host bertanggung jawab atas akurasi score. Carsel Club berhak
        meninjau ulang dan menyesuaikan stats jika ada bukti manipulasi.
        Recompute admin (lihat dashboard) akan rebuild stats dari source data
        kalau diperlukan.
      </p>

      <h2 style={h2}>6. Pengakhiran</h2>
      <p>
        Kami berhak menonaktifkan akun yang melanggar syarat ini tanpa
        pemberitahuan. Kamu dapat menutup akun kapan saja via support.
      </p>

      <h2 style={h2}>7. Disclaimer</h2>
      <p>
        Carsel Club disediakan "as-is". Kami tidak menjamin layanan 100% bebas
        downtime atau bebas bug. Stats, leaderboard, dan ranking bersifat
        informatif, bukan pengganti turnamen resmi PB Padel.
      </p>

      <h2 style={h2}>8. Batas Tanggung Jawab</h2>
      <p>
        Tanggung jawab Carsel Club terbatas pada biaya yang kamu bayar untuk
        layanan (saat ini gratis). Kami tidak bertanggung jawab atas kerugian
        tidak langsung dari penggunaan aplikasi.
      </p>

      <h2 style={h2}>9. Perubahan</h2>
      <p>
        Syarat dapat berubah; perubahan material akan diberitahukan via
        notifikasi in-app minimal 14 hari sebelumnya. Tetap menggunakan
        aplikasi setelah update = menerima syarat baru.
      </p>

      <h2 style={h2}>10. Hukum yang Berlaku</h2>
      <p>
        Syarat ini diatur oleh hukum Republik Indonesia. Sengketa diselesaikan
        melalui musyawarah; jika gagal, melalui Badan Arbitrase Nasional
        Indonesia (BANI) di Jakarta.
      </p>

      <h2 style={h2}>11. Kontak</h2>
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
