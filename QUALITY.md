# Pemeriksaan rilis Codeventure dan Flavory

Status: **PASS** untuk cakupan edisi pribadi/local-first yang berjalan tanpa database aplikasi. Tanggal pemeriksaan: 28 Oktober 2026. Identitas visual mengikuti konsep awal sesuai arahan pemilik, memakai skill apple-design dan antislop during.

## Bukti verifikasi

- Codeventure: 5 tes PHP (41 assertions) dan 12 tes browser lulus.
- Flavory: 5 tes PHP (43 assertions), 3 tes unit JavaScript, dan 17 tes browser lulus.
- Total 42 tes. Semua 29 tes browser dijalankan pada image production hasil build terbaru, bukan hanya server development.
- Kedua build Vite berhasil. `composer validate --strict`, `composer audit`, dan `npm audit` lulus; tidak ada advisory dependensi yang dilaporkan.
- Pembaruan UX 28 Oktober 2026 mencakup meter baca, ritme tujuh hari, navigasi pelajaran berjudul, dan ringkasan filter di Codeventure; kesiapan bahan yang bertahan saat porsi berubah, saran resep lintas kategori, bahan kustom di pemilih dapur, ringkasan filter, pencarian header lintas halaman, dan logo gelap yang terbaca di Flavory. Setiap alur baru memiliki tes browser khusus.
- Aksesibilitas otomatis diuji pada 48 kombinasi halaman/tema/ukuran Codeventure dan 54 kombinasi Flavory. Ukuran viewport 360, 768, 1440px; tema terang dan gelap. Axe-core melaporkan nol pelanggaran pada tag WCAG 2 A/AA dan 2.1 AA yang diperiksa.
- Keyboard Tab/Enter/Escape, menu mobile, pemulihan fokus, dan pembesaran teks 200% pada seluruh halaman utama diuji. Tidak ada overflow horizontal pada matriks tersebut.
- Data rusak, browser menolak penyimpanan, ekspor sesi saat penyimpanan gagal, impor invalid, pemulihan cadangan, dan konflik dua tab diuji. Data tab lama tidak bisa diam-diam menimpa versi baru.
- Codeventure: seluruh 12 kuis dan penanda selesai diuji; catatan bertahan setelah reload; markup berbahaya ditampilkan sebagai teks. Seluruh 12 URL dokumentasi sumber merespons HTTP 200 saat diperiksa.
- Flavory: draft pulih, draft dibersihkan setelah simpan, tambah/hapus bahan dan langkah, CRUD resep, impor/ekspor satu resep, favorit, porsi, mode memasak, pengingat, clipboard, pemanggilan cetak, menu mingguan, agregasi dan checklist belanja diuji.
- Image production menggunakan FrankenPHP/PHP 8.5.12, Composer tanpa dependensi dev, UID 33, `--cap-drop ALL`, dan `no-new-privileges`. `/health` dan halaman utama HTTP 200; healthcheck container healthy. CSP, nosniff, frame protection, referrer policy, dan pembatasan izin terverifikasi.
- Pengujian PHP sengaja memilih koneksi database yang tidak tersedia. Semua halaman produk tetap berhasil dibuka.

Pemeriksaan otomatis dan keyboard ini bukan sertifikasi aksesibilitas atau jaminan tidak adanya seluruh jenis risiko. Hosting publik, TLS domain nyata, dan provenance/lisensi komersial aset lama tidak termasuk hal yang telah diverifikasi. Baca DEPLOYMENT.md untuk batas operasionalnya.

## Apple Design: temuan dan penyelesaian

- Critical, aksesibilitas: struktur HTML berbahasa Indonesia, label form, skip link, fokus keyboard, status live region, kontras, reflow, dan reduced motion diterapkan. `accessibility.md` dan `layout.md` dipakai sebagai prinsip web, bukan aturan navigasi native.
- High, alur: halaman tidak lagi membuka katalog kosong yang memerlukan database atau endpoint akun lama. Tugas utamanya adalah belajar dan memasak; navigasi mengikuti tugas itu.
- Medium, feedback: penyimpanan, jawaban kuis, error impor, dan kegagalan storage menjelaskan hasil serta tindakan berikutnya dekat kontrolnya. Dasar: `feedback.md › Best practices`.
- Craft, judgment desain: logo, foto asli, dan bahasa warna awal dipertahankan. Kurikulum berurutan menjadi motif Codeventure; checklist bahan dan langkah bernomor menjadi motif Flavory. Tidak meniru tampilan aplikasi Apple.

Contoh kontras hasil perhitungan WCAG setelah mencocokkan ulang source GitHub: Codeventure #212529 pada kuning #ffc107 9.46:1; putih pada merah #dc3545 4.53:1; teks sekunder #495057 pada #f8f9fa 7.76:1. Flavory #282322 pada amber #eda60e 7.43:1; putih pada merah #bc1823 6.38:1; teks sekunder #685752 pada blush #f0e6e6 5.58:1; link #f3bf66 pada permukaan gelap #282020 9.45:1. Pasangan lainnya dicakup pemeriksaan kontras halaman dan token CSS.

Pembaruan home diverifikasi terhadap branch main GitHub: Codeventure commit 79b0c6d dan Flavory commit 58feb443. Sumber file dan keputusan palet dicatat di DESIGN.md. Logo asli dipertahankan dan margin kosongnya di-clip melalui CSS. Kuis contoh dan tab jalur dengan keyboard pada Codeventure, serta filter beberapa bahan dengan hasil kosong/berisi pada Flavory, mempunyai tes browser khusus. Tidak ada data contoh yang disisipkan sebagai progres atau jadwal pribadi.

## Antislop Delivery Gate

Ruang lingkup gate adalah antarmuka aktif pada routes/web.php, resources/views/product.blade.php, resources/js, resources/css, dan tampilan error. Template/backend historis yang tidak dirutekan bukan antarmuka yang dikirim ke pengunjung.

### Hard Gate

- R-02 PASS: pemindaian materi dan copy aktif menemukan nol em dash; rentang angka memakai en dash dan kode memakai sintaks aslinya.
- R-03 PASS: seluruh halaman utama diuji pada 360/768/1440px serta teks 200%; overflow pencarian dan form menu yang ditemukan sudah diperbaiki dan dites ulang.
- R-17 PASS: jumlah jalur, pelajaran, resep, progres, dan favorit berasal dari dataset atau state browser; tidak ada angka pengguna/uptime buatan.
- R-18 PASS: tidak ada testimoni, nama pelanggan, atau avatar pengguna rekaan pada UI aktif.
- R-23 PASS: logo dan foto berasal dari repo awal, dipertahankan atas instruksi pemilik; foto resep berlabel ilustrasi dan resep pribadi tanpa gambar diberi label tanpa foto.
- R-24 PASS: navigasi utama menuju route aktif; tes PHP membuka seluruh halaman utama dan tes browser mengikuti alur katalog/detail/pengaturan.
- R-25 PASS: token warna dihitung dan seluruh matriks axe-core tidak memiliki pelanggaran kontras; contoh rasio tercantum di atas. Teks di foto kode memakai scrim navy.
- R-26 PASS: kontrol dipetakan ke route, event handler, file picker, dialog, print, clipboard, atau pengaturan nyata; alur utama dan kontrol kondisional direkam dalam tests/e2e.
- R-27 PASS: status awal memuat, hasil kosong, error impor/storage, konflik tab, serta halaman 404/500 tersedia; skenario error storage dan impor diuji.
- R-28 PASS: tidak ada FAQ pengisi template pada halaman aktif.
- R-32 PASS: keyboard Tab/Enter/Escape, skip link, label, menu, dan pemulihan fokus diuji; CSS menyediakan focus-visible kontras pada kedua tema.
- R-33 PASS: fitur ditulis langsung di file sumber melalui patch/heredoc; formatter hanya merapikan kode yang sudah ditulis, bukan menyuntik fitur atau CSS dari skrip pengganti teks.
- R-34 PASS: seluruh halaman utama diuji pada tema terang dan gelap, termasuk pengaturan sistem; tidak ada tema yang menjadi placeholder.
- R-35 PASS: build, tes PHP, unit JS, 29 tes browser pada image production, dan alur interaksi tercatat; kedua container production berstatus healthy dan `/health` merespons HTTP 200.
- R-36 PASS: tidak ada klaim sertifikasi, keamanan absolut, performa terukur, atau pelanggan yang tidak punya bukti; laporan membatasi klaim pada hasil pemeriksaan.
- R-37 PASS: Design Read dan ENERGY 2 / RHYTHM 2 / MOTION 1 dinyatakan sebelum membangun; arahan pemilik mempertahankan konsep awal dicatat dalam DESIGN.md.
- R-38 PASS: resep bawaan disebut koleksi awal, foto disebut ilustrasi, durasi disebut perkiraan, dan penilaian rasa disebut pribadi; tidak ada komunitas atau ulasan publik palsu.

### Purpose Gate

- R-01 PASS: gradient hanya menjadi scrim di foto kode lama agar teks terbaca; tujuan tertulis di DESIGN.md. Pencarian amber Flavory memakai bidang solid.
- R-04 PASS: tidak ada pustaka ikon dekoratif baru; plus/minus mengubah porsi, tanda selesai menunjukkan status pelajaran, logo lama mempertahankan identitas produk.
- R-06 PASS: system-ui untuk membaca/kontrol, Trebuchet MS untuk judul Flavory yang ramah, monospace khusus kode nyata; alasan tipografi tertulis di DESIGN.md.
- R-07 PASS: tidak ada pola grid/dot/blueprint dekoratif; foto kode adalah aset asli yang diminta dipertahankan.
- R-08 PASS: CTA tidak dihias panah berulang; label menyatakan tindakan.
- R-09 PASS: label bidang, tingkat, dan asal resep menyatakan informasi nyata; tidak ada kapsul status AI/Beta atau titik hidup palsu.
- R-10 PASS: tidak ada backdrop-filter atau kaca berlapis pada UI aktif.
- R-12 PASS: bayangan hanya pada dialog untuk memisahkan lapisan modal; kartu dan navigasi bertumpu pada border/warna.
- R-13 PASS: tidak ada glow pada komponen atau latar aktif.
- R-14 PASS: kartu resep konsisten untuk membandingkan resep; baris kurikulum konsisten untuk urutan dan progres. Pengantar, daftar, pembaca, form, dan planner berbeda sesuai isi.
- R-19 PASS: motion dibatasi hover/status/toast; prefers-reduced-motion mematikan transisi dan animasi nonesensial.
- R-22 PASS: visual memakai foto dan logo asli repo yang relevan dengan kode/memasak; tidak menambah ilustrasi stok atau karakter generik.

### Liveliness

- Dials PASS: kedua DESIGN.md menyatakan ENERGY 2 / RHYTHM 2 / MOTION 1.
- Konsistensi dials PASS: pengantar memiliki aksen yang jelas, susunan konten bervariasi sesuai tugas, dan tidak ada animasi masuk atau parallax.
- Focal point PASS: setiap halaman memiliki satu h1 utama dan tindakan berikutnya yang menonjol; materi/masakan menjadi isi utamanya.
- Whitespace PASS: jarak memisahkan pengantar, hasil, formulir, bahan, dan langkah; panel ringkasan Codeventure tidak lagi meregang mengisi tinggi daftar.
- Accent PASS: warna awal dipakai dengan peran jelas, yakni navigasi/pencarian dan tindakan utama; isi bacaan tetap netral.
- Motif PASS: urutan bab/progres pada Codeventure dan checklist/nomor langkah pada Flavory berfungsi sebagai identitas sekaligus alat kerja.
- Design Read PASS: konteks, audiens, bahasa visual, dan dials dinyatakan sebelum generasi serta diperbarui setelah arahan pemilik tentang konsep awal.

### Craftsmanship & Quality Locks

- C-1 PASS: warna, aset, huruf, bentuk, layout, dan motion memiliki alasan dalam DESIGN.md dan berasal dari subjek serta konsep awal.
- C-2 PASS: tidak ada tombol fitur yang hanya dekoratif atau berstatus “segera hadir”; tes mencakup tugas belajar dan memasak dari awal sampai selesai.
- C-3 PASS: bagian halaman mengikuti tugas aktual, seperti mencari, membaca, mencatat, menulis resep, menyusun menu, dan berbelanja; tidak ada logo bar/testimoni/pricing pengisi.
- C-4 PASS: matriks responsif/tema, reflow teks 200%, keyboard, storage gagal, data rusak, dan konflik tab dijalankan sebagai tes nyata.
- C-5 PASS: metrik berasal dari data nyata aplikasi; tidak ada testimoni atau klaim pelanggan rekaan.
- R-05 PASS: layout memperbaiki konsep awal dengan struktur yang dibutuhkan produk; katalog bukan feature grid pemasaran dan halaman kerja memiliki susunan tugas yang berbeda.
- R-11 PASS: radius kontrol 8px dan bidang konten 14–18px; lingkaran dipakai untuk foto kategori asli/nomor langkah, bukan semua komponen.
- R-15 PASS: CTA menyebut tujuan, antara lain “Pilih jalur belajar”, “Periksa jawaban”, “Tandai pelajaran selesai”, “Mulai memasak”, dan “Buat daftar belanja minggu ini”.
- R-16 PASS: copy aktif menjelaskan fungsi yang ada, tanpa buzzword pemasaran AI.
- R-20 PASS: globe/foto kode/navigasi kuning-merah membedakan Codeventure; wajan/pencarian amber/foto makanan bulat/blush membedakan Flavory, sesuai konsep awal.
- R-21 PASS: tema mengikuti perangkat secara bawaan dan pilihan terang/gelap benar-benar bekerja serta tersimpan bila browser mengizinkan.
- R-29 PASS: palette aktif dibatasi pada warna merek awal dan permukaan netral; warna error/sukses hanya menyampaikan status bersama teks.
- R-30 PASS: prinsip Apple dipakai untuk aksesibilitas, hierarki, dan feedback; identitas produk tidak diganti dengan tiruan aplikasi populer.
- R-31 PASS: DESIGN.md mencatat alasan satu baris untuk pilihan mayor; report ini menghubungkannya dengan bukti build, source, dan pengujian.
