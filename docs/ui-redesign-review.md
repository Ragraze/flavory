# Hasil rombak UI/UX Flavory

Sesuai arahan pemilik: maroon/putih, logo tetap, Home/Buku resep/Rencana/Belanja, pencarian di kanan dan hamburger untuk Sistem/Gelap/Putih serta Pengaturan. Data tetap tanpa database.

Perubahan utama:

- Home dibangun ulang menjadi pembuka maroon dengan foto, lima kategori, empat resep pilihan, ringkasan minggu dan pencari bahan yang bisa dibuka. Panel promosi berulang dihapus.
- `/resep` menjadi satu Buku resep untuk 1.642 entri Mustika Rasa, empat resep harian dan resep pribadi, dilengkapi kategori, filter koleksi, favorit, pencarian serta paginasi.
- Foto dummy memakai aset lama yang sesuai kelompok; semua kartu arsip diberi label Ilustrasi. Bab Djadjanan/Minuman mengikuti halaman buku. Takaran dan durasi tidak direka.
- Navbar memiliki empat tujuan tetap. Pencarian menuju katalog gabungan; kecocokan nama diprioritaskan sebelum kecocokan isi. Hamburger dapat ditutup Escape, klik luar atau fokus keluar; tema tersinkron dengan Pengaturan.
- Detail, penulis resep, rencana, belanja, koleksi tersimpan dan pengaturan memakai token maroon/putih/charcoal, tipografi, kontrol dan spacing yang sama.
- Favorit arsip bertahan saat reload dan validasi cadangan. Resep lokal tetap bisa dicari saat arsip lambat/gagal; permintaan arsip dibatasi 12 detik.

Pemeriksaan:

- PASS: build Vite.
- PASS: 25 pengujian browser, termasuk navigasi, pencarian gabungan, tema, favorit, impor/ekspor, penulis resep, porsi, memasak/timer, rencana, belanja dan kegagalan penyimpanan.
- PASS: 8 tes Node, termasuk validasi favorit arsip dan bahan yang ditulis sebagai paragraf atau isian setelah langkah memasak.
- PASS: 5 tes PHP, 49 assertions, termasuk rute produk dengan koneksi database yang sengaja tidak tersedia.
- PASS: axe WCAG A/AA untuk kedua tema, lebar 360/768/1440 px. Menu tema yang terbuka turut diuji.
- PASS: navigasi keyboard, fokus terlihat, Escape, pembesaran teks 200% dan reflow.
- PASS: review independen memeriksa responsif di 320/360/768/1024/1440 px. Dua temuan awal diperbaiki dan diperiksa ulang: akses lokal saat arsip pending, serta bahan arsip pada format non-tabel.
- PASS: screenshot Home, katalog, rencana, pengaturan dan menu pada terang/gelap, desktop/ponsel diperiksa. Label kecil diperbesar menjadi minimal 12 px, judul aplikasi diperkecil, dan judul Home ponsel dirapikan.

Pengecualian inspector yang disengaja: `below-fold` tidak diterapkan pada daftar katalog 24 kartu berhalaman; semua kartu tidak perlu berada pada layar pertama. `panel-void` diperbolehkan untuk menyamakan posisi aksi kartu pada satu baris ketika judul sumber berbeda panjang. Foto memiliki ukuran/aspect ratio agar tidak menggeser tata letak.

Gerbang desain:

- Hard gate PASS: tidak ada overflow yang ditemukan; kontras/fokus, nama kontrol, loading/error/empty dan fungsi utama diuji. Jumlah koleksi berasal dari dataset, gambar diberi label, sumber dan lisensi tetap terlihat.
- Purpose gate PASS: maroon berasal dari arahan pemilik; serif Home merujuk buku masak; foto berasal dari aset proyek. Tanpa gradien, animasi dekoratif atau ikon pengisi.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 1. Pembuka maroon menjadi fokus, foto makanan membawa identitas, putih memisahkan kelompok kerja.
- Craft PASS: empat tujuan navigasi, satu pencarian gabungan, tindakan berlabel, pilihan tema yang konsisten, data pengguna tetap dipertahankan dan tidak menambah klaim resep/gizi rekaan.

Batas: pengujian browser memakai Chromium. Tidak menguji Safari/Firefox atau pembaca layar fisik. Resep historis belum ditelaah manual satu per satu; pengelompokan selain bab kue/minuman bersifat umum. Ubah porsi dan perencana tetap memakai resep harian/pribadi yang memiliki takaran terstruktur.
