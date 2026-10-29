# Landing Flavory dengan hero setinggi layar

Brief: hero mengikuti tinggi layar, landing memakai arah desain frontend terbaik yang sesuai dengan identitas putih-maroon, foto lingkaran dan navigasi yang sudah disepakati. Logo dan tombol GitHub tetap; breadcrumb dan keterangan arsip yang diminta dihapus tidak dikembalikan.

## Keputusan

Hero berubah dari kartu inset menjadi pembuka selebar halaman. Tingginya `100svh` dikurangi tinggi navbar yang diukur dengan ResizeObserver, sehingga reflow navbar tidak meninggalkan tebakan tinggi tetap. `min-height` menjaga isi tetap bisa tumbuh saat pembesaran teks membutuhkan ruang lebih.

Judul editorial maksimal 96 px dan foto hidangan maksimal 460 px memberi pembuka satu fokus. Kategori desktop menjadi judul + lima pilihan, kartu resep Home menjadi empat foto lingkaran besar tanpa bingkai, dan kalender berada pada bidang netral. Isi, tujuan tombol, data resep dan penyimpanan tetap sama.

Layar pendek memakai tata letak tersendiri. Pada ponsel pendek, foto berada di samping judul dan nama resep tetap menjadi nama aksesibel tautan gambar. Landscape pendek memakai tipografi dan foto yang lebih kecil. Tautan gulir disembunyikan di landscape pendek karena konten berikutnya sudah dekat.

Interaksi: tautan “Lihat ide masakan” menuju bagian pilihan resep; offset hanya memperhitungkan navbar ketika navbar melekat. Foto masuk satu kali selama 550 ms, tanpa menyembunyikan konten awal. Smooth scroll dan animasi tidak aktif saat reduced motion diminta.

## Bukti pengukuran

| Viewport | Tinggi navbar | Tinggi hero | Batas bawah hero |
| --- | --- | --- | --- |
| 1440×900 | 91,59 px | 808,41 px | 900 px |
| 1366×768 | 91,59 px | 676,41 px | 768 px |
| 768×1024 | 155,19 px | 868,81 px | 1024 px |
| 390×844 | 191,17 px | 652,83 px | 844 px |
| 360×800 | 191,17 px | 608,83 px | 800 px |
| 320×568 | 235,17 px | 332,83 px | 568 px |
| 844×390 | 155,19 px | 234,81 px | 390 px |

Satu tes baru memeriksa batas bawah hero setelah viewport berubah pada halaman yang sama, keterlihatan aksi utama, tidak ada overflow, dan tautan gulir menuju pilihan resep. Tes ini memeriksa reflow header dan pembaruan pengukuran, bukan sekadar nilai CSS.

Build production dan pemeriksaan whitespace lulus. Pada putaran suite lengkap, 26 tes lama lulus; kasus baru menemukan layout 320×568 yang kemudian diperbaiki. Pemeriksaan ulang kasus hero, axe seluruh halaman pada dua tema, serta pembesaran teks/keyboard lulus. Sepuluh tes navigasi, hero, pintasan bahan dan ketahanan juga lulus pada build akhir. Source lint untuk dua file Home: 0 FAIL, 0 WARN. Browser inspector: 0 FAIL pada 1440, 768 dan 390 px; peringatan ukuran judul aplikasi diterima karena Home memang memakai pembuka landing editorial, bukan judul halaman formulir.

## Tinjauan visual

ROUND 1

Seen in one second: buku masak editorial dengan judul besar dan foto hidangan.

Idea (one sentence): satu layar untuk memilih masuk ke koleksi atau mencari dari bahan yang ada.

Live thing: pencari bahan dan koleksi resep yang sudah berfungsi.

Layout words by section: hero=viewport / kategori=judul dan pilihan / resep=empat hidangan / rencana=minggu / bahan=disclosure.

Scores: design 7.8 · usability 7.6 · creativity 6.5 · content 8.0 → overall 7.5. Penilaian internal subjektif.

Caps applied: identitas dan fungsi lama dipertahankan, tidak mengejar efek galeri yang tidak membantu memasak.

Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. `/tmp/flavory-full-hero-320.png`: judul/aksi masih terlalu tinggi; berikan komposisi ponsel pendek dengan foto di samping judul.
2. `/tmp/flavory-hero-refined-320.png`: kata judul dan aksi masih membungkus; kecilkan tipografi hanya untuk viewport pendek dan pertahankan sasaran sentuh 44 px.
3. `/tmp/flavory-landing-recipes.png`: scroll margin dan scroll padding menumpuk; hilangkan offset ganda serta aktifkan offset header hanya ketika header melekat.

ROUND 2 / final

Seen in one second: judul dan hidangan mengisi pembuka dengan aksi yang jelas; tinggi mengikuti viewport.

Idea (one sentence): mulai memasak melalui resep atau bahan, lalu jelajahi kategori dan rencana.

Live thing: koleksi, simpan resep, pencari bahan, dan ringkasan menu nyata.

Layout words by section: hero=dua kolom atau komposisi ringkas / kategori=lingkaran kecil / resep=lingkaran besar / rencana=panel mingguan / bahan=disclosure.

Scores: design 8.0 · usability 8.2 · creativity 6.5 · content 8.0 → overall 7.8. Penilaian internal subjektif.

Caps applied: foto tetap berasal dari repository awal; tidak dibuat aset atau klaim baru.

## Gate

- Hard Gate PASS: build dan interaksi teruji; axe kedua tema dan reflow teks lulus; tidak ada aset, angka atau testimoni baru.
- Purpose Gate PASS: viewport hero mengikuti permintaan; lingkaran mengikuti aset; satu animasi kedatangan dan umpan balik aksi; tidak ada loop.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 1; judul dan hidangan menjadi fokus, bagian bawah berbeda sesuai pekerjaan.
- Craftsmanship PASS: navigasi, logo, GitHub, data dan fitur tetap; layout sempit/pendek disusun khusus, bukan dipotong dengan overflow hidden.

Screenshot sementara: `/tmp/flavory-viewport-hero-release`. Pemeriksaan menggunakan Chromium; perangkat fisik, Safari dan Firefox belum diuji. Saat teks diperbesar, hero diizinkan lebih tinggi daripada viewport agar isi tetap terbaca.
