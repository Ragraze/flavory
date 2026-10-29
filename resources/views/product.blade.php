<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Temukan ide masakan, tulis resep sendiri, atur porsi, dan susun Rencana belanja. Flavory adalah buku masak pribadimu, tanpa akun.">
    <meta name="theme-color" content="#fdf9fa">
    <title>Flavory · Masak dari yang kamu punya</title>
    <link rel="icon" href="data:,">
    <script src="/appearance.js"></script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <a class="skip-link" href="#main">Lewati ke konten</a>
    <header class="site-header"><div class="header-inner">
        <a class="wordmark" href="/" aria-label="Flavory, beranda"><span class="logo-clip"><img src="/img/flavory-removebg-preview.png" width="156" height="156" alt="Flavory"></span></a>
        <nav id="main-nav" aria-label="Navigasi utama"><a href="/">Beranda</a><a href="/resep">Buku resep</a><a href="/rencana">Rencana masak</a><a href="/belanja">Rencana belanja</a><a href="/koleksi">Koleksiku</a></nav>
        <form class="header-search" action="/resep" role="search" aria-label="Cari resep"><label class="visually-hidden" for="header-search">Cari resep atau bahan</label><input id="header-search" type="search" name="q" placeholder="Cari resep…"><button type="submit">Cari</button></form>
        <div class="header-menu"><button class="menu-toggle" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="appearance-menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><div id="appearance-menu" class="appearance-menu" hidden><fieldset><legend>Tema</legend><label><input type="radio" name="appearance" value="system">Sistem</label><label><input type="radio" name="appearance" value="dark">Gelap</label><label><input type="radio" name="appearance" value="light">Putih</label></fieldset><a href="/pengaturan">Pengaturan</a><a href="/privasi">Data & privasi</a></div></div>
    </div></header>
    <main id="main" tabindex="-1"><div class="initial-state" role="status">Membuka buku masak…</div></main>
    <noscript><div class="page-width notice">Aktifkan JavaScript untuk membaca resep dan menyimpan buku masak. Resep pribadimu tersimpan di browser, tanpa akun.</div></noscript>
    <footer class="site-footer"><div class="page-width"><span>© {{ date('Y') }} Flavory. All rights reserved.</span></div></footer>
    <a class="github-float" href="https://github.com/Ragraze/flavory" target="_blank" rel="noopener noreferrer" aria-label="Kode Flavory di GitHub (tab baru)" title="GitHub">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.105.77-.244.77-.542 0-.267-.01-.975-.015-1.914-3.132.68-3.793-1.51-3.793-1.51-.512-1.3-1.25-1.646-1.25-1.646-1.023-.7.077-.686.077-.686 1.13.08 1.725 1.16 1.725 1.16 1.006 1.724 2.64 1.226 3.283.938.102-.729.394-1.226.716-1.508-2.5-.284-5.13-1.25-5.13-5.565 0-1.23.44-2.234 1.16-3.022-.116-.285-.503-1.43.11-2.98 0 0 .945-.303 3.094 1.154A10.79 10.79 0 0 1 12 6.173c.957.005 1.92.13 2.819.379 2.148-1.457 3.091-1.154 3.091-1.154.615 1.55.228 2.695.112 2.98.722.788 1.158 1.792 1.158 3.022 0 4.326-2.633 5.278-5.142 5.557.405.35.766 1.043.766 2.1 0 1.516-.014 2.739-.014 3.11 0 .3.203.65.774.54A11.25 11.25 0 0 0 12 .75Z"/></svg>
    </a>
    <div id="announcement" class="toast" role="status" aria-live="polite" aria-atomic="true"></div>
    <div id="storage-warning" class="storage-warning" role="alert" hidden></div>
    <dialog id="confirm-dialog" aria-labelledby="dialog-title"><h2 id="dialog-title"></h2><p id="dialog-message"></p><div class="actions"><button type="button" data-dialog="cancel">Batal</button><button type="button" class="danger" data-dialog="confirm">Hapus</button></div></dialog>
</body>
</html>
