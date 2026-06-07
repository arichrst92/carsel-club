#!/usr/bin/env bash
# Round 4 sweep — list dari user.
set -euo pipefail
FILES=$(find app components -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -vE 'node_modules|\.next' )

apply() {
  local from="$1"
  local to="$2"
  for f in $FILES; do
    sed -i "s|${from}|${to}|g" "$f" 2>/dev/null || true
  done
}

# Home
apply 'Tier saat ini'                          'Current tier'
apply 'Tier Saat Ini'                          'Current Tier'

# Sessions page
apply 'placeholder="Cari nama'                 'placeholder="Search name'
apply 'placeholder="Cari'                      'placeholder="Search'
apply '"Cari nama'                             '"Search name'

# Sessions filter labels
apply '">semua<"'                              '">all<"'
apply '>semua<'                                '>all<'
apply 'label="semua"'                          'label="all"'
apply 'label: "semua"'                         'label: "all"'

# Leaderboard
apply 'Sepanjang masa'                         'All-time'
apply '"Share Top 10"'                         '"Share Top 10"'
apply '>Share Top 10<'                         '>Share Top 10<'
apply 'label="Total"'                          'label="Total"'
apply '"% menang"'                             '"% wins"'
apply 'sub="% menang"'                         'sub="% wins"'
apply '"main"'                                 '"played"'
apply 'sub="Total main"'                       'sub="Played"'
apply 'sub="Total poin"'                       'sub="Total points"'
apply 'sub="Total pemain"'                     'sub="Total players"'
apply '"Periode"'                              '"Period"'
apply '>Periode<'                              '>Period<'
apply 'label="Periode"'                        'label="Period"'

# Profile
apply ' menang"'                               ' wins"'
apply 'menang vs'                              'wins vs'
apply '>menang<'                               '>wins<'
apply 'belum cukup data partner'               'not enough partner data'
apply 'Belum cukup data partner'               'Not enough partner data'
apply '"Share via WhatsApp"'                   '"Share via WhatsApp"'
apply 'sub="Nama, kota"'                       'sub="Name, city"'
apply 'sub="nama, kota"'                       'sub="name, city"'
apply 'sub="Teman padel kamu"'                 'sub="Your padel friends"'
apply 'sub="teman padel kamu"'                 'sub="your padel friends"'
apply 'sub="Following + followers + teman padel"' 'sub="Following + followers + padel friends"'
apply 'kontak support'                         'contact support'
apply 'Kontak support'                         'Contact support'

# Create Session step 1
apply '"Nama Sesi'                             '"Session Name'
apply '>Nama Sesi<'                            '>Session Name<'
apply 'Beri nama yang mudah diingat untuk sesi kamu' 'Give your session a memorable name'
apply 'Beri nama yan gmudah diingat untuk sesi kamu' 'Give your session a memorable name'
apply 'Beri nama yan gmudah diingat untuk sesi'      'Give your session a memorable name'

# Wizard footer (Cancel/Back already done above but re-apply for safety)
apply '<span>Batal</span>'                     '<span>Cancel</span>'
apply '"Batal"'                                '"Cancel"'
apply 'btn-secondary-lg">Batal'                'btn-secondary-lg">Cancel'

# Create Session step 2 / location
apply '"Lapangan"'                             '"Court"'
apply '>Lapangan<'                             '>Court<'
apply 'placeholder="Lapangan'                  'placeholder="Court'
apply 'label="Lapangan"'                       'label="Court"'
apply '"Tanggal"'                              '"Date"'
apply '>Tanggal<'                              '>Date<'
apply 'label="Tanggal"'                        'label="Date"'
apply '"Jam Mulai"'                            '"Start Time"'
apply '>Jam Mulai<'                            '>Start Time<'
apply '"Jam Berakhir"'                         '"End Time"'
apply '>Jam Berakhir<'                         '>End Time<'
apply 'label="Jam Mulai"'                      'label="Start Time"'
apply 'label="Jam Berakhir"'                   'label="End Time"'
apply 'Jadwal session — kapan saja sebelum/saat session' 'Session schedule — anytime before/during the session'
apply 'kapan saja sebelum/saat session'        'anytime before/during the session'

# Create Session step 3 / players
apply '"Jumlah"'                               '"Count"'
apply '"JUmlah"'                               '"Count"'
apply '>Jumlah<'                               '>Count<'
apply '>JUmlah<'                               '>Count<'
apply 'label="Jumlah"'                         'label="Count"'
apply '"Hitung Otomatis"'                      '"Auto Calculate"'
apply '"hitung otomatis"'                      '"auto calculate"'
apply '"Set Sendiri"'                          '"Set Manually"'
apply '"set sendiri"'                          '"set manually"'
apply 'kapan match berakhir saat scoring'      'when matches end during scoring'
apply 'Hanya pemain yang dapat link WA'        'Only players who get the WA link'
apply 'Disable kalau kamu hanya jadi organizer/wasit' 'Disable if you''re just organizer/referee'

# Review step
apply 'cek detail sebelum create'              'review details before creating'
apply 'Cek detail sebelum create'              'Review details before creating'
apply 'Tap edit kalau mau ubah'                'Tap edit to modify'
apply 'tanpa batas pemain'                     'no player limit'
apply 'Tanpa batas pemain'                     'No player limit'
apply 'undangan saja'                          'invite only'
apply 'Setelah dibuat'                         'After creation'
apply 'Session akan masuk ke'                  'Session will appear in'
apply 'Kamu bisa undang pemain via WhatsApp link & atur match di dalam session' 'You can invite players via WhatsApp link & manage matches in the session'

# Wizard step label was already converted to "Step" in earlier round, but
# re-apply for safety in case any "Langkah" lingers.
apply 'Langkah '                               'Step '
apply '"Langkah "'                             '"Step "'

# Random remaining
apply 'session-info-title">Mendatang'          'session-info-title">Upcoming'
apply 'sebagai organizer'                      'as organizer'
apply 'ronde'                                  'round'

echo "Round 4 done."
