#!/usr/bin/env bash
# Round 2 sweep: strings yang ketinggalan dari round 1.
set -euo pipefail

FILES=$(find app components -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -vE 'node_modules|\.next' )

apply() {
  local from="$1"
  local to="$2"
  for f in $FILES; do
    sed -i "s|${from}|${to}|g" "$f" 2>/dev/null || true
  done
}

# Profile advanced stats section
apply '>Stats Lengkap<'                       '>Full Stats<'
apply '>Stats Mendalam<'                      '>Deep Stats<'
apply '>Partner Terbaik<'                     '>Best Partners<'
apply 'Tingkat menang paling tinggi'          'Highest win rate'
apply 'subtitle="Tingkat menang paling tinggi (min 3 match)"' 'subtitle="Highest win rate (min 3 matches)"'
apply 'Lawan yang paling sering kalahin kamu' 'Opponents who beat you most'
apply 'belum ada nemesis'                     'no nemesis yet'
apply 'Belum ada nemesis'                     'No nemesis yet'
apply 'subtitle="Lawan yang paling sering kalahin kamu"' 'subtitle="Opponents who beat you most"'
apply '>Menang<'                              '>Win<'

# Profile share + invite (catch any remaining)
apply '>Bagikan Profilku<'                    '>Share My Profile<'
apply 'Bagikan Profilku'                      'Share My Profile'
apply '>Undang Teman<'                        '>Invite Friends<'
apply 'Undang Teman'                          'Invite Friends'
apply 'Ajak teman padelmu'                    'Invite your padel friends'
apply 'bagikan link'                          'share the link'
apply 'Bagikan via Whatsapp'                  'Share via WhatsApp'
apply 'Bagikan via WhatsApp'                  'Share via WhatsApp'
apply '>Salin<'                               '>Copy<'

# Profile edit form
apply 'label="Nama"'                          'label="Name"'
apply 'label="Kota"'                          'label="City"'
apply '>Nama<'                                '>Name<'
apply '>Kota<'                                '>City<'

# Settings rows
apply 'title="Bantuan"'                       'title="Help"'
apply '"Bantuan"'                             '"Help"'
apply 'title="Kebijakan privasi"'             'title="Privacy Policy"'
apply '"Kebijakan privasi"'                   '"Privacy Policy"'
apply 'title="Syarat \& ketentuan"'           'title="Terms & Conditions"'
apply '"Syarat \& ketentuan"'                 '"Terms & Conditions"'
apply 'title="Bahasa"'                        'title="Language"'
apply '"Bahasa"'                              '"Language"'
apply 'Keluar dari Carsel Club'               'Log out of Carsel Club'

# Profile achievements / tier
apply '"Sepanjang Masa"'                      '"All-time"'
apply '>Sepanjang Masa<'                      '>All-time<'
apply '>Sepanjang waktu<'                     '>Lifetime<'
apply 'Sepanjang waktu'                       'Lifetime'

# Leaderboard
apply '"Posisi Kamu"'                         '"Your Position"'
apply '>Posisi Kamu<'                         '>Your Position<'
apply 'Bagikan Top 10'                        'Share Top 10'

# Sessions list empty state
apply 'Belum ada upcoming session'            'No upcoming sessions yet'

# Sessions filter
apply '">Semua<"'                             '">All<"'
apply 'label="Semua"'                         'label="All"'
apply 'label="Baru"'                          'label="New"'
apply '>Semua<'                               '>All<'
apply '>Baru<'                                '>New<'

# Home greetings + sections
apply '"Selamat pagi"'                        '"Good morning"'
apply '"Selamat siang"'                       '"Good afternoon"'
apply '"Selamat sore"'                        '"Good evening"'
apply '"Selamat malam"'                       '"Good night"'
apply 'Selamat Pagi'                          'Good Morning'
apply 'lagi ke '                              'going to '
apply '>Stats Kamu<'                          '>Your Stats<'
apply '>Lihat Semua<'                         '>See All<'
apply 'Lihat Semua'                           'See All'
apply '>Sesi Berikutnya<'                     '>Next Session<'
apply '>Pertandingan Terbaru<'                '>Recent Matches<'

# Quick actions home
apply '>Buat Sesi<'                           '>Create Session<'
apply 'Buat Sesi'                             'Create Session'
apply 'Mulai sesi baru'                       'Start a new session'
apply 'Sesi publik di kotamu'                 'Public sessions in your city'

# Create Session form labels
apply '"Format Permainan"'                    '"Game Format"'
apply '>Format Permainan<'                    '>Game Format<'
apply '"Lapangan"'                            '"Court"'
apply 'label="Lapangan"'                      'label="Court"'
apply '"Tanggal"'                             '"Date"'
apply '>Tanggal<'                             '>Date<'
apply '"Jam Mulai"'                           '"Start Time"'
apply '>Jam Mulai<'                           '>Start Time<'
apply '"Jam Berakhir"'                        '"End Time"'
apply '>Jam Berakhir<'                        '>End Time<'
apply '>Kembali<'                             '>Back<'
apply '<span>Kembali</span>'                  '<span>Back</span>'
apply '"Jumlah"'                              '"Count"'
apply '>Jumlah<'                              '>Count<'
apply '"Hitung Otomatis"'                     '"Auto Calculate"'
apply 'Hitung Otomatis'                       'Auto Calculate'
apply '"Set Sendiri"'                         '"Set Manually"'
apply 'Set Sendiri'                           'Set Manually'
apply 'Tidak ada batas pemain'                'No player limit'
apply 'Match tidak punya batas point'         'Match has no point limit'
apply 'Saya akan ikut main'                   'I will play'
apply 'Co-host bisa di-assign'                'Co-host can be assigned'

# Format card sub
apply 'Pasangan dirotasi tiap ronde — semua main dgn semua\.' 'Partners rotate each round — everyone plays with everyone.'
apply 'Pairing berdasar ranking — tiap ronde adu pemain rangking serupa\.' 'Pairing by ranking — each round matches similarly-ranked players.'
apply 'Sistem gugur — pemenang lanjut, kalah tersingkir\.' 'Single elimination — winners advance, losers eliminated.'

# Misc form / help
apply 'Tambah cover photo'                    'Add cover photo'
apply 'Tap atau drag & drop'                  'Tap or drag & drop'
apply 'Lepas file di sini'                    'Drop file here'
apply 'Pilih file'                            'Pick file'

# Match cards
apply '"Wajib diisi"'                         '"Required"'
apply 'wajib diisi'                           'required'

# Leaderboard hero
apply 'Ranking pemain di sesi ini'            'Player ranking of this session'
apply 'Peringkat pemain di sesi ini'          'Player ranking of this session'
apply 'Belum ada pemain aktif di sesi ini'    'No active players in this session'
apply '>Total Pts<'                           '>Total Pts<'

# Misc text
apply '" hari"'                               '" days"'
apply '"Hari ini"'                            '"Today"'
apply '"Besok"'                               '"Tomorrow"'
apply '" hari lalu"'                          '" days ago"'

# Friends page
apply '>Daftar Teman'                         '>Friends List'
apply '>Permintaan Masuk'                     '>Incoming Requests'
apply '>Permintaan Keluar'                    '>Outgoing Requests'
apply '>Saran '                               '>Suggestions '

# Subscreen titles
apply '>Detail Sesi<'                         '>Session Detail<'
apply '>Detail Pertandingan<'                 '>Match Detail<'
apply '>Tambah Pemain<'                       '>Add Players<'
apply '>Pertandingan<'                        '>Matches<'

echo "Round 2 done."
