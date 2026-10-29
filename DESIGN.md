# Flavory

## Arah terbaru

Layout ringkas dan langsung ke pekerjaan. Putih dominan, aksen maroon, foto makanan bulat. Logo, tombol GitHub, dan susunan navbar dipertahankan. Pembaruan 29 Oktober 2026 menggantikan hero setinggi viewport serta pembuka halaman yang panjang.

## Token

Putih #ffffff, netral #f8f6f7, blush #fbf3f5, maroon #7c304a, teks #30282c, teks sekunder #706269. Tema gelap memakai token yang sama per peran, dengan latar #171518 dan permukaan #211e22. Georgia untuk hero dan nama hidangan; system font untuk halaman kerja, kontrol, serta isi. Target interaksi minimal 44 px; input 16 px.

## Susunan halaman

- Home: hero ringkas dengan dua aksi, kategori, resep harian, ringkasan menu, pencari bahan yang selalu terbuka. Tidak ada paragraf promosi atau tautan gulir tambahan. Kategori terlihat lebih awal.
- Buku resep: filter di kiri dan hasil tiga kolom di kanan pada desktop. Tablet/ponsel menumpuk filter di atas hasil. Foto arsip tetap diberi label ilustrasi, filter aktif tetap bisa dihapus, pencarian tetap mendukung pintasan `/`.
- Koleksi: judul dan aksi satu baris bila ruang cukup; impor dan pencarian berlabel, diikuti kartu koleksi.
- Detail resep: judul dan aksi di samping foto kecil; bahan di kolom 320 px, langkah di kolom utama. Ponsel mengikuti urutan dokumen. Ejaan/satuan arsip tetap asli.
- Tambah/edit: detail dan catatan di kiri; bahan dan langkah di kanan. Satu kolom di layar kecil. Aksi simpan dan status draft di akhir form.
- Rencana: form di kiri, agenda dan aksi belanja di kanan. Kolom tanggal selebar form agar nilai terbaca.
- Belanja: input bahan di kiri, daftar dan status centang di kanan. Satu kolom di ponsel.
- Pengaturan: baris pengaturan dengan judul di kiri dan kontrol di kanan, menumpuk di ponsel.
- Privasi: judul bagian dan penjelasan berdampingan pada desktop, satu kolom di ponsel.

## Teks dan interaksi

Gunakan nama tugas langsung, seperti “Tulis resep” dan “Daftar belanja”. Hapus pengantar promosi, keterangan berulang, serta label dekoratif. Pertahankan label form, status dinamis, batas input, atribusi, informasi penyimpanan lokal, dan konsekuensi impor/hapus. Tidak mengubah data atau menambah dependensi.

Navbar tetap menyediakan Home, Buku resep, Rencana, Belanja, pencarian dan menu tema. Menu mendukung Escape dan fokus keyboard. Reduced motion dan aturan cetak tetap tersedia. Tata letak memakai CSS grid tanpa mengubah urutan navigasi form melalui tabindex.
