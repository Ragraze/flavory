# Deployment

Edisi aktif adalah buku masak pribadi di browser. Server mengirim halaman dan aset; resep pribadi, rencana, dan catatan tidak diunggah ke server. Gunakan origin HTTPS yang stabil karena localStorage terikat pada scheme, hostname, dan port. Pemindahan domain memerlukan ekspor/impor oleh pengguna.

## Container production

`Dockerfile` membangun frontend dari lock file, memasang Composer tanpa dependensi development, dan menjalankan FrankenPHP/Caddy sebagai `www-data` pada port 8080. Container tidak memakai `artisan serve` dan tidak menyertakan `.env`, kredensial, atau data browser.

```sh
docker build -t flavory-production .
```

Siapkan file environment di luar repository, misalnya `production.env`:

```dotenv
APP_NAME=Flavory
APP_ENV=production
APP_DEBUG=false
APP_URL=https://resep.example.com
APP_KEY=base64:ISI_DENGAN_KEY_HASIL_GENERATE
LOG_CHANNEL=stderr
SESSION_DRIVER=file
SESSION_COOKIE=flavory_session
SESSION_SECURE_COOKIE=true
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

Buat key dan simpan hasilnya ke file environment yang hanya bisa dibaca operator. Pertahankan key saat memperbarui container:

```sh
php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'
docker run -d --name flavory --restart unless-stopped \
  --env-file /path/di-luar-repo/production.env \
  -p 127.0.0.1:8081:8080 flavory-production
```

Domain di atas adalah placeholder, bukan alamat produk yang sudah diterbitkan. Letakkan container di belakang reverse proxy HTTPS. Port internal memakai HTTP; proxy publik harus mengurus TLS dan HSTS. Tidak perlu migrasi, database, atau worker queue. Endpoint `/health` memeriksa proses aplikasi.

Caddy memakai `/app/public` sebagai document root, mengompresi respons, dan memberi cache immutable pada aset build ber-hash. PHP mematikan tampilan error internal. CSP membatasi resource ke origin sendiri, dan izin kamera/mikrofon/lokasi dimatikan. File impor tidak diunggah; validasi dan pembacaan berlangsung di browser, maksimal 1 MB.

## Pembaruan dan pemulihan

1. Jalankan tes PHP, unit JavaScript, tes browser, audit, dan build sebelum membuat image baru.
2. Uji image pada port terpisah, termasuk mode memasak dan rencana belanja.
3. Ganti container setelah sehat. Pertahankan image sebelumnya untuk rollback.
4. Ingatkan pengguna mengekspor cadangan sebelum berpindah domain/browser. Server tidak bisa memulihkan data lokal yang dihapus.

Edisi ini belum menyediakan publikasi resep bersama, akun cloud, atau sinkronisasi aplikasi mobile lama. Mengimpor satu resep membuat salinan pribadi; tidak berarti menerbitkannya ke internet. Pengingat dapur bergantung pada halaman yang terbuka dan bukan alarm keselamatan.

Foto dan logo diwarisi dari repository pemilik. Provenance/lisensi komersial aset lama belum diverifikasi; periksa sebelum distribusi komersial. Resep bawaan adalah pengantar aplikasi dengan foto ilustrasi, bukan resep yang diklaim sudah diuji dapur. Audit bersih bukan pengganti pemeriksaan logika aplikasi.

Dokumentasi runtime: https://frankenphp.dev/docs/docker/ dan https://laravel.com/docs/13.x/deployment.
