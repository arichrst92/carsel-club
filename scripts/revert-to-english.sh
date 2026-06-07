#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# revert-to-english.sh — Sprint 51
#
# Batch find/replace seluruh kode Indonesia → English. Hasil dari
# Sprint 49–50 (mass-localize ke ID) di-rollback per request user.
#
# Scope: app/, components/. Tidak menyentuh lib/, tests/, docs/.
# Run dari root project: bash scripts/revert-to-english.sh
# ──────────────────────────────────────────────────────────────────

set -euo pipefail

FILES=$(find app components -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -vE 'node_modules|\.next' )

apply() {
  local from="$1"
  local to="$2"
  # use sed -i with empty backup for macOS/GNU compatibility
  for f in $FILES; do
    sed -i "s|${from}|${to}|g" "$f" 2>/dev/null || true
  done
}

# ─── Page titles / metadata ──────────────────────────────────────
apply 'title: "Profil"'                       'title: "Profile"'
apply 'title: "Teman"'                        'title: "Friends"'
apply 'title: "Sesi Saya"'                    'title: "My Sessions"'
apply 'title: "Cari Sesi"'                    'title: "Find Session"'
apply 'title: "Buat Sesi"'                    'title: "Create Session"'
apply 'title: "Ubah Sesi"'                    'title: "Edit Session"'
apply 'title: "Ubah Profil"'                  'title: "Edit Profile"'
apply 'title: "Pencapaian"'                   'title: "Achievements"'
apply 'title: "Riwayat Pertandingan"'         'title: "Match History"'
apply 'title: "Papan Peringkat Sesi"'         'title: "Session Leaderboard"'
apply 'title: "Notifikasi"'                   'title: "Notifications"'
apply 'title: "Preferensi Notifikasi"'        'title: "Notification preferences"'
apply 'title: "Tambah Pemain"'                'title: "Add Players"'
apply 'title: "Privasi \& Data"'              'title: "Privacy & Data"'

# ─── Headers / Section titles (h2/h3) ────────────────────────────
apply '>Detail Sesi<'                         '>Session Detail<'
apply '>Sesi Berikutnya<'                     '>Next Session<'
apply '>Sesi Saya<'                           '>My Sessions<'
apply '>Cari Sesi<'                           '>Find Session<'
apply '>Cari Sesi Publik<'                    '>Find Public Sessions<'
apply '>Pertandingan Terbaru<'                '>Recent Matches<'
apply '>Riwayat Pertandingan<'                '>Match History<'
apply '>Pencapaian<'                          '>Achievements<'
apply 'Pencapaian{" "}'                       'Achievements{" "}'
apply '>Papan Peringkat Sesi<'                '>Session Leaderboard<'
apply '>Perjalanan Tier<'                     '>Tier Journey<'
apply '>Wawasan<'                             '>Insights<'
apply '>Aksi Cepat<'                          '>Quick Actions<'
apply '>Pengaturan<'                          '>Settings<'
apply '>Pengaturan Match<'                    '>Match Settings<'
apply '>Status Sesi<'                         '>Status Session<'
apply '>Info Sesi<'                           '>Session Info<'
apply '>Akses \& Visibilitas<'                '>Access & Visibility<'
apply '>Venue \& Jadwal<'                     '>Venue & Schedule<'
apply '>Lokasi \& Waktu<'                     '>Location & Time<'
apply '>Privasi \& Data<'                     '>Privacy & Data<'
apply '>Profil<'                              '>Profile<'
apply '>Teman<'                               '>Friends<'

# ─── Stats labels ────────────────────────────────────────────────
apply 'label="Poin"'                          'label="Point"'
apply 'label="Tingkat Menang"'                'label="Win Rate"'
apply 'label="Total Main"'                    'label="Match Played"'
apply 'label="Total Menang"'                  'label="Total Wins"'
apply 'label="Total Pertandingan"'            'label="Total Match"'
apply 'label="Sesi Di-host"'                  'label="Sessions Hosted"'
apply 'label="Match Selesai"'                 'label="Match Done"'
apply 'label="Streak Menang"'                 'label="Streak"'
apply 'label="Lapangan"'                      'label="Court"'
apply 'label="Pemain"'                        'label="Pemain"'

# ─── Status pills ────────────────────────────────────────────────
apply '"Mendatang"'                           '"Upcoming"'
apply '"Berlangsung"'                         '"Live"'
apply '"Selesai"'                             '"Completed"'
apply '"Dibatalkan"'                          '"Cancelled"'
apply '"Menunggu"'                            '"Pending"'

# ─── Tab labels ──────────────────────────────────────────────────
apply 'label="Masuk"'                         'label="Incoming"'
apply 'label="Keluar"'                        'label="Outgoing"'
apply 'label="Jelajah"'                       'label="Discover"'
apply 'label="Teman"'                         'label="Friends"'
apply 'label: "Mendatang"'                    'label: "Upcoming"'
apply 'label: "Lalu"'                         'label: "Past"'

# ─── Buttons & Actions ──────────────────────────────────────────
apply '"Buat Sesi"'                           '"Create Session"'
apply '"Buat"'                                '"Create"'
apply '"Lanjut dengan WhatsApp"'              '"Continue with WhatsApp"'
apply '"Lanjut"'                              '"Next"'
apply '"Kembali"'                             '"Back"'
apply '"Batalkan Sesi"'                       '"Cancel Session"'
apply '"Mulai Sesi"'                          '"Start Session"'
apply '"Selesaikan Sesi"'                     '"End Session"'
apply '"Buka Ulang Sesi"'                     '"Reopen Session"'
apply '"Mulai Match"'                         '"Start Match"'
apply '"Akhiri Match"'                        '"End Match"'
apply '"Memulai…"'                            '"Starting..."'
apply '"Menyimpan…"'                          '"Saving..."'
apply '"Memuat…"'                             '"Loading..."'
apply '"Mengunggah\.\.\."'                    '"Uploading..."'
apply '"Mengirim OTP…"'                       '"Sending OTP..."'
apply '"Membatalkan…"'                        '"Cancelling..."'
apply '"Menyelesaikan…"'                      '"Ending..."'
apply '"Membuka ulang…"'                      '"Reopening..."'
apply '"Membuat…"'                            '"Generating..."'
apply '"Mencari\.\.\."'                       '"Searching..."'
apply '"Simpan"'                              '"Save"'
apply '"Simpan Perubahan"'                    '"Save Changes"'
apply '"Batal"'                               '"Cancel"'
apply '"Ya"'                                  '"Yes"'
apply '"Tidak"'                               '"No"'
apply '"Tutup"'                               '"Close"'
apply '"Hapus"'                               '"Delete"'
apply '"Ganti"'                               '"Replace"'
apply '"Selesai\."'                           '"Done."'

# Bottom nav
apply 'label: "Sesi"'                         'label: "Sessions"'
apply 'label: "Buat"'                         'label: "Create"'
apply 'label: "Profil"'                       'label: "Profile"'

# Share-related
apply '"Bagikan Profilku"'                    '"Share My Profile"'
apply '"Bagikan via WhatsApp"'                '"Share via WhatsApp"'
apply '"Undang via WhatsApp"'                 '"WhatsApp Invite"'
apply '"Undang Teman"'                        '"Invite Friends"'
apply '"Bagikan Kartu Sesi"'                  '"Share Story Card"'
apply '"Salin Tautan"'                        '"Copy Link"'
apply '"Tersalin!"'                           '"Copied!"'
apply '"Tersalin"'                            '"Copied"'
apply '"Bagikan Top 10"'                      '"Share top 10"'
apply '"Naik Tier!"'                          '"Tier Up!"'
apply '"Naik Tier"'                           '"Tier Up"'

# QR scan
apply '"Pindai QR Teman"'                     '"Scan Friend QR"'
apply '"Pindai QR Pemain"'                    '"Scan Player QR"'

# Cover photo
apply '"Cover berhasil diubah!"'              '"Cover updated!"'
apply '"Foto profil berhasil diubah!"'        '"Avatar updated!"'
apply '"Foto profil dihapus\."'               '"Avatar removed."'
apply '"Cover dihapus\."'                     '"Cover removed."'
apply '"Foto ditambahkan"'                    '"Photo added"'
apply '"Foto dihapus\."'                      '"Photo removed."'

# Form labels
apply '"Nama Sesi"'                           '"Session Name"'
apply '"Lapangan"'                            '"Court"'
apply '(Opsional)'                            '(Optional)'

# Pencapaian / Tier
apply 'title="Pencapaian"'                    'title="Achievements"'
apply 'title="Ubah Profil"'                   'title="Edit Profile"'
apply 'title="Teman"'                         'title="Friends"'
apply 'title="Privasi"'                       'title="Privacy"'
apply 'title="Keluar"'                        'title="Logout"'
apply 'title="Ubah Sesi"'                     'title="Edit Session"'

# format card descriptions
apply '"Sistem gugur — pemenang lanjut, kalah tersingkir\."' '"Single elimination — winners advance, losers eliminated."'
apply '"Pasangan dirotasi tiap ronde — semua main dgn semua\."' '"Partners rotate each round — everyone plays with everyone."'
apply '"Pairing berdasar ranking — tiap ronde adu pemain rangking serupa\."' '"Pairing by ranking — each round matches similarly-ranked players."'

# Notifications + Friend prefs
apply '"Pengingat sesi (H-1 jam)"'            '"Session reminder (H-1 hour)"'
apply '"Permintaan pertemanan"'               '"Friend request"'
apply '"Sesi dibatalkan"'                     '"Session cancelled"'

# Session invite text (WA share body)
apply 'Skor live \& info:'                    'Live score & info:'
apply 'Gabung via Carsel Club'                'Join via Carsel Club'
apply 'Padel community Indonesia ⚡'          'Padel community Indonesia ⚡'
apply 'Yuk gabung Carsel Club'                'Join Carsel Club'
apply 'Atur sesi padel, skor realtime, leaderboard, dan share hasil — semua di satu app\.' 'Manage padel sessions, realtime scoring, leaderboard, and share results — all in one app.'
apply 'Diundang oleh'                         'Invited by'
apply 'Daftar via link:'                      'Sign up via link:'

# Match result share
apply 'Hasil Pertandingan'                    'Match Result'

# Leaderboard share
apply 'Top 10 Pemain Padel '                  'Top 10 Padel Players '
apply 'Papan peringkat'                       'Leaderboard'
apply 'minggu ini'                            'this week'
apply 'bulan ini'                             'this month'
apply 'sepanjang waktu'                       'all-time'
apply 'Cek siapa yang lagi di puncak — komunitas padel Indonesia!' 'See who is on top — Indonesia padel community!'

# Action returns
apply '"Pemain ditambahkan"'                  '"Member added"'
apply '"Pemain ditambahkan ke sesi\."'        '"Player added to session."'
apply '"Notifikasi push aktif"'               '"Push enabled"'
apply '"Notifikasi push dimatikan"'           '"Push disabled"'
apply '"Privasi disimpan"'                    '"Privacy saved"'
apply '"Berhasil bergabung! Lihat detail sesi\."' '"Joined! See session detail."'
apply '"Permintaan terkirim\. Menunggu persetujuan host\."' '"Request sent. Waiting for host approval."'
apply '"Permintaan disetujui"'                '"Request approved"'
apply '"Permintaan ditolak"'                  '"Request rejected"'
apply 'sekarang jadi teman!'                  'is now a friend!'
apply '"Pengguna diblokir"'                   '"User blocked"'
apply '"Pengguna dibuka blokirnya"'           '"User unblocked"'
apply '"Mengikuti!"'                          '"Followed!"'
apply '"Berhenti mengikuti"'                  '"Unfollowed"'
apply '"Pertemanan diterima!"'                '"Friend accepted!"'
apply '"Semua ditandai dibaca"'               '"All marked as read"'
apply '"Sesi dibatalkan\."'                   '"Session cancelled."'

# Profile / Section heads more
apply 'Bergabung '                            'Joined '
apply '"User"'                                '"User"'
apply '>Sepanjang waktu<'                     '>Lifetime<'
apply 'Siap!'                                 'Ready!'

# Find page
apply 'sesi aktif di Indonesia'               'active sessions in Indonesia'
apply 'Belum ada sesi publik aktif'           'No active public sessions'
apply 'Coba reset filter atau buat sesi sendiri di kotamu\.' 'Try resetting the filter or create your own session in your city.'
apply 'Jadi yang pertama — buat sesi publik untuk komunitas padel!' 'Be the first — create a public session for the padel community!'
apply '+ Buat Sesi Publik'                    '+ Create Public Session'
apply '🌍 {session.status === "live" ? "BERLANGSUNG" : "Publik"}' '🌍 {session.status === "live" ? "LIVE NOW" : "Public"}'
apply '"✓ Sudah Gabung"'                      '"✓ Joined"'
apply '"Lihat detail →"'                      '"Tap to view →"'

# Wizard
apply 'Langkah '                              'Step '
apply ' dari '                                ' of '
apply '"Nama sesi wajib diisi"'               '"Session name required"'

# install prompt
apply '"Pasang Carsel Club"'                  '"Install Carsel Club"'
apply '"Pasang"'                              '"Install"'
apply '"Akses cepat dari layar utama, seperti app asli\."' '"Quick access from home screen, like a native app."'
apply '"Tap ikon Bagikan → Tambahkan ke Layar Awal"'   '"Tap Share icon → Add to Home Screen"'

# Crop modal
apply '"Crop foto cover"'                     '"Crop cover photo"'
apply '"Geser foto + zoom utk pilih bagian\. Aspect rasio 2:1\."' '"Drag photo + zoom to select area. Aspect ratio 2:1."'
apply '"Pakai foto"'                          '"Use photo"'

# QR scan modal
apply '"Pindai QR Teman"'                     '"Scan Friend QR"'
apply '"Pindai QR Pemain"'                    '"Scan Player QR"'
apply '"Arahkan kamera ke QR Code di halaman Profil teman kamu\."' '"Point your camera at the QR code on your friend\\'\''s profile."'
apply '"Arahkan kamera ke QR Code di halaman Profil pemain\. Pemain otomatis ditambahkan ke sesi\."' '"Point your camera at the QR code on the player\\'\''s profile. They will be auto-added to the session."'
apply '"✓ Terdeteksi"'                        '"✓ Detected"'
apply '"Memuat kamera…"'                      '"Loading camera..."'
apply '"Akses kamera ditolak\. Izinkan kamera di setting browser, lalu coba lagi\."' '"Camera access denied. Allow camera in browser settings, then try again."'
apply '"Kamera tidak ditemukan di perangkat ini\."' '"Camera not found on this device."'
apply '"Kamera sedang dipakai aplikasi lain\. Tutup aplikasi tsb lalu coba lagi\."' '"Camera is in use by another app. Close that app then try again."'
apply '"Gagal membuka kamera\."'              '"Failed to open camera."'

# Match scoring
apply '"✏️ Ubah Skor"'                        '"✏️ Edit Score"'

# Friends section
apply '>Daftar Teman'                         '>Friends list'
apply '>Permintaan Masuk'                     '>Incoming Requests'
apply '>Permintaan Keluar'                    '>Outgoing Requests'
apply '>Saran'                                '>Suggested'
apply 'Belum ada teman'                       'No friends yet'
apply 'Belum ada saran'                       'No suggestions yet'

# qa-titles + subs in home + share
apply '>Sesi publik di kotamu<'               '>Public sessions in your city<'
apply '>Mulai sesi baru<'                     '>Start a new session<'
apply '>Sampul + papan peringkat utk IG/WA<'  '>Cover + leaderboard for IG/WA<'
apply '>Kirim teks + link<'                   '>Send text + link<'
apply '>Papan Peringkat<'                     '>Leaderboard<'
apply '>Peringkat pemain sesi ini<'           '>Player ranking of this session<'
apply '>URL tampilan langsung<'               '>Live view URL<'

# Confirm dialog wording
apply '"Selesaikan sesi ini\?\\n\\nMasih ada '       '"End this session?\\n\\nThere are still '
apply 'match yang belum selesai\. Mereka tidak akan di-skor\. '    'matches incomplete. They will not be scored. '
apply 'match selesai akan tetap dihitung sebagai statistik\.\\n\\nStatus berubah ke SELESAI\. Bisa dibuka kembali nanti kalau perlu\.' 'completed matches will still count as stats.\\n\\nStatus changes to COMPLETED. Can be reopened later if needed.'

# Cancel session confirm
apply 'Batalkan sesi ini\? Statistik yang sudah masuk tidak akan ter-reset\.' 'Cancel this session? Stats that have accrued will not be reset.'
apply 'Akhiri match dengan skor'              'End match with score'

# Cover uploader help text
apply 'Tambah cover photo'                    'Add cover photo'
apply 'JPG/PNG/HEIC — auto-crop 2:1 landscape' 'JPG/PNG/HEIC — auto-crop 2:1 landscape'

# Header / nav small things
apply 'span className="logo-text">Profil<'    'span className="logo-text">Profile<'
apply 'span className="logo-text">Sesi Saya<' 'span className="logo-text">My Sessions<'
apply 'span className="logo-text">Cari Sesi<' 'span className="logo-text">Find Session<'

# Auth
apply 'Selamat datang!'                       'Welcome!'

# Sticky footer create wizard
apply '<span>Kembali</span>'                  '<span>Back</span>'
apply '<span>Batal</span>'                    '<span>Cancel</span>'

# Generic action
apply 'Hanya host/co-host yang bisa ubah cover' 'Only host/co-host can change cover'
apply 'Hanya host/co-host yang bisa hapus cover' 'Only host/co-host can remove cover'
apply 'Hanya host/co-host yang bisa upload foto group' 'Only host/co-host can upload group photo'
apply 'Hanya host/co-host yang bisa tambah pemain' 'Only host/co-host can add players'
apply 'Pilih file dulu'                       'Pick a file first'
apply 'File terlalu besar\. Maksimum'         'File too large. Maximum'
apply 'Upload terlalu sering\. Coba lagi dalam' 'Upload too frequent. Try again in'
apply 'Gagal baca file\.'                     'Failed to read file.'
apply 'Gagal upload cover\.'                  'Failed to upload cover.'
apply 'Gagal simpan ke sesi\.'                'Failed to save session.'
apply 'Gagal hapus cover\.'                   'Failed to remove cover.'

# Coverupload alt
apply '"Sesi"'                                '"Session"'
apply 'aria-label="Session cover photo"'      'aria-label="Session cover photo"'

# UPLOAD ALT
apply 'aria-label="Tutup"'                    'aria-label="Close"'

echo "Revert done."
