# Rombak Flavory: maroon dan putih

Arahan pemilik: logo tetap, navbar Home/Buku resep/Rencana/Belanja, pencarian di kanan dan hamburger berisi Sistem/Gelap/Putih serta Pengaturan. Buku resep menyatukan resep harian, pribadi, dan Mustika Rasa dengan foto ilustrasi yang sudah ada. Tanpa database.

Pilihan implementasi: satu katalog dengan filter koleksi dan kategori. Koleksi arsip terpisah seperti sebelumnya ditinggalkan karena menambah pintu pencarian; memasukkan seluruh teks buku ke bundle utama dihindari karena memperberat home. Data arsip dimuat saat katalog/detail membutuhkannya. URL lama tetap berfungsi, data pengguna dipertahankan.

Urutan kerja:

1. Uji navigasi, tema hamburger, pencarian gabungan, favorit arsip, dan kategori bergambar.
2. Satukan adapter data resep untuk katalog dan koleksi tersimpan; pertahankan satuan arsip.
3. Ganti header dan home; buat token maroon/putih yang konsisten untuk seluruh halaman dan dark mode pilihan.
4. Rapikan katalog, detail arsip, perencana, belanja, dan pengaturan dengan sistem visual yang sama.
5. Uji alur utama, impor/ekspor, desktop/mobile, keyboard, kontras, dan screenshot; perbaiki temuan.

Arah visual: putih dominan, maroon #701b35 sebagai bidang pembuka dan aksi, teks charcoal, garis netral, foto makanan persegi panjang. Serif Georgia pada judul home memberi karakter buku masak; system font pada aplikasi menjaga keterbacaan. Tidak ada animasi dekoratif. Logo dan tombol GitHub tetap.

Risiko yang diperiksa: favorit arsip tidak hilang saat reload/ekspor; filter durasi tidak merekayasa waktu arsip; gambar tidak diklaim foto hasil resep; menu dapat ditutup Escape/klik luar; semua navigasi dapat dicapai di layar kecil; kegagalan memuat arsip tidak menghilangkan resep pribadi.
