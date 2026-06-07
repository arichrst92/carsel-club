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
        q: "Cara daftar Carsel Club?",
        a: "Tap Login, masukkan nomor WhatsApp aktif, terima OTP 6 digit, verifikasi, isi profil singkat (nama + kota + bio), selesai.",
      },
      {
        q: "Apa beda Member dan Guest?",
        a: "Member punya akun + stats lifetime + tier yang naik seiring waktu. Guest cuma satu sesi—host bisa tambah tanpa nomor WA, tapi gak punya stats lifetime.",
      },
      {
        q: "Aku tidak terima OTP. Kenapa?",
        a: "Pastikan nomor WA aktif. Tunggu 1-2 menit. Cek folder Archived/Spam di WA. Kalau belum masuk, tap 'Kirim ulang' (max 3 request per 10 menit) atau hubungi support.",
      },
    ],
  },
  {
    title: "Hosting Session",
    items: [
      {
        q: "Cara host session padel?",
        a: "Tap tombol + di tengah bottom nav, isi 5 step wizard (info, format, type, jadwal, review), invite player, lalu Generate Match saat siap mulai.",
      },
      {
        q: "Apa beda Americano, Mexicano, Tournament?",
        a: "Americano = partner rotate setiap round (semua main bareng semua). Mexicano = pairing by ranking di tiap round. Tournament = single-elimination bracket.",
      },
      {
        q: "Apa itu Fix Partners?",
        a: "Mode khusus Americano dimana team sama selama session—2 pemain selalu jadi partner. Untuk tournament atau session formal.",
      },
      {
        q: "Bisa edit session setelah create?",
        a: "Ya. Tap session → menu Edit. Kamu bisa ubah info, tambah/kurang player, ganti format selama status masih upcoming. Setelah live, banyak field ter-lock.",
      },
      {
        q: "Cara invite player non-member?",
        a: "Saat Add Player, pilih tab Guest, isi nama tampilan (gak perlu nomor WA). Guest cuma muncul di session ini.",
      },
    ],
  },
  {
    title: "Match & Scoring",
    items: [
      {
        q: "Siapa yang bisa input score?",
        a: "Host atau co-host. Player biasa cuma bisa lihat. Score input pakai tombol +/− saat match Live.",
      },
      {
        q: "Salah input score, gimana?",
        a: "Sebelum match End: edit langsung pakai +/−. Setelah End: tap match → Edit Score. Stats akan auto-recompute (revert delta + apply baru).",
      },
      {
        q: "Aku mau revert match dari completed ke live, bisa?",
        a: "Bisa. Host buka match detail → Revert. Stats akan reverse otomatis sampai score di-update lagi & End.",
      },
      {
        q: "Berapa poin yang aku dapat per match?",
        a: "Menang = 3 poin, Seri = 2 poin, Kalah = 1 poin. Akumulasi → naik tier otomatis.",
      },
    ],
  },
  {
    title: "Tier & Achievements",
    items: [
      {
        q: "Tier ladder lengkap?",
        a: "Rookie (0) → Bronze (50pts/10 matches) → Silver (150/25) → Gold (300/50) → Platinum (600/100) → Master (1000/200). Tier naik otomatis saat threshold tercapai.",
      },
      {
        q: "Kalau aku salah input score dan tier-down, gimana?",
        a: "Tier mengikuti stats riil. Setelah recompute via revert/edit, tier akan adjust juga (bisa naik atau turun).",
      },
      {
        q: "Pencapaian apa saja yang ada?",
        a: "Total 15+ badge: milestone match, win count, host count, streak, tier, perfect day, hot session. Lihat lengkap di Profile → Achievements.",
      },
      {
        q: "Apa itu streak?",
        a: "Win streak adalah jumlah match menang berturut-turut. Reset saat kalah/seri. Best win streak ditracking forever.",
      },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        q: "Notif apa saja yang aku terima?",
        a: "Session invite, session reminder H-1 jam, hasil match, friend request, tier up, dan achievement unlock. Atur per-tipe di Settings → Notifikasi.",
      },
      {
        q: "Cara matikan notif WA?",
        a: "Profile → Notifikasi → set channel WA jadi off per tipe yang gak mau dapat.",
      },
      {
        q: "Bisa set quiet hours?",
        a: "Bisa. Settings → Notifikasi → Quiet hours start/end. Push & WA tidak dikirim antara jam itu (in-app tetap masuk).",
      },
    ],
  },
  {
    title: "Privacy & Data",
    items: [
      {
        q: "Siapa yang bisa lihat profil aku?",
        a: "Default Public (siapa saja yang punya link). Bisa diset Friends (cuma friend) atau Private (cuma kamu) di Profile → Ubah Profil.",
      },
      {
        q: "Cara matikan friend request dari orang asing?",
        a: "Profile → Privacy → Friend request → set 'Mati' atau 'Hanya friend dari friend'.",
      },
      {
        q: "Mau export semua data aku, bisa?",
        a: "Bisa. Profile → Privacy → Data export → Download JSON. Berisi profile, session, match history, achievements.",
      },
      {
        q: "Mau hapus akun, gimana?",
        a: "Profile → Privacy → Hapus akun permanen → ketik 'HAPUS' untuk konfirmasi. Akun di-anonim secara permanen, stats historical tetap untuk integritas data sesi.",
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
              Kebijakan Privasi
            </Link>
          </li>
          <li>
            <Link href="/tos" style={{ color: "var(--primary-700)" }}>
              Syarat & Ketentuan
            </Link>
          </li>
        </ul>
      </section>

      <p style={{ marginTop: 28, fontSize: 12, color: "var(--text-500)" }}>
        Pertanyaan tidak terjawab? Tap WhatsApp di atas untuk chat support
        langsung.
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
