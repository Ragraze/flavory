import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test('search, save, portions, cooking mode, timer and shopping work together', async ({ page }) => {
    await page.goto('/resep');
    await page.getByLabel('Koleksi', { exact: true }).selectOption('harian');
    await page.getByLabel('Cari judul atau bahan').fill('pasta');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Simpan Pasta tomat bawang putih', exact: true }).click();
    await expect(page.locator('[data-save="pasta-tomat-bawang"]')).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/tersimpan');
    await expect(page).toHaveURL(/\/koleksi$/);
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.getByRole('link', { name: 'Baca resep', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah porsi' }).click();
    await expect(page.getByLabel('Porsi', { exact: true })).toHaveValue('3');
    await expect(page.locator('#ingredients')).toContainText('270 g');
    await page.getByRole('button', { name: 'Tambahkan ke daftar belanja' }).click();
    await page.getByRole('button', { name: 'Mulai memasak' }).click();
    await expect(page.locator('#cooking-dialog')).toBeVisible();
    await page.getByLabel('Menit (1–180)').fill('1');
    await page.getByLabel('Menit (1–180)').press('Tab');
    await page.getByRole('button', { name: 'Mulai pengingat' }).click();
    await expect(page.getByRole('button', { name: 'Jeda', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Jeda', exact: true }).click();
    await page.getByRole('button', { name: 'Atur ulang', exact: true }).click();
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
    await page.getByRole('button', { name: 'Selesai memasak' }).click();
    await expect(page.locator('#cooked-status')).toContainText('Terakhir kamu masak');
    await page.goto('/belanja');
    await expect(page.locator('.shopping-list')).toContainText('270 g');
    await page.locator('.shopping-list input[type="checkbox"]').first().check();
    await page.reload();
    await expect(page.locator('.shopping-list input:checked')).toHaveCount(1);
});

test('write, autosave draft, edit, share and delete a private recipe', async ({ page }) => {
    await page.goto('/resep/baru');
    await page.getByLabel('Nama resep', { exact: true }).fill('Tumis tahu pengujian');
    await page.getByLabel('Cerita singkat').fill('Tahu dan sayur untuk makan siang.');
    await page.getByLabel('Bahan 1', { exact: true }).fill('Tahu');
    await page.getByLabel('Jumlah', { exact: true }).fill('200');
    await page.getByLabel('Satuan', { exact: true }).fill('g');
    await page.getByLabel('Langkah 1', { exact: true }).fill('Potong tahu, lalu masak sampai matang.');
    await expect(page.locator('#draft-status')).toHaveText('Draft tersimpan di browser ini.');
    await page.reload();
    await expect(page.getByLabel('Nama resep', { exact: true })).toHaveValue('Tumis tahu pengujian');
    await page.getByRole('button', { name: 'Simpan resep', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tumis tahu pengujian');
    await page.goto('/koleksi');
    await page.getByLabel('Koleksi', { exact: true }).selectOption('own');
    const recipeCard = page.locator('.recipe-card').filter({ hasText: 'Tumis tahu pengujian' });
    await expect(recipeCard.locator('.card-actions > *')).toHaveCount(4);
    await expect(recipeCard.getByRole('link', { name: 'Baca', exact: true })).toBeVisible();
    await expect(recipeCard.getByRole('button', { name: 'Hapus', exact: true })).toBeVisible();
    await recipeCard.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Nama resep', { exact: true }).fill('Tumis tahu versiku');
    await page.getByRole('button', { name: 'Simpan resep', exact: true }).click();
    await page.getByLabel('Apa yang ingin diubah saat memasak lagi?').fill('<script>alert(1)</script> Kurangi garam.');
    await page.getByLabel('Penilaian pribadi').selectOption('4');
    await page.getByRole('button', { name: 'Simpan catatan rasa' }).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh file resep' }).click();
    const file = await pending;
    expect(file.suggestedFilename()).toContain('flavory-recipe-');
    const filename = await file.path();
    await page.goto('/resep/baru');
    await page.getByLabel('Pilih file resep Flavory').setInputFiles(filename);
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page.locator('#recipe-import-status')).toContainText('ditambahkan ke Resepku');
    await page.goto('/koleksi');
    await page.getByLabel('Koleksi', { exact: true }).selectOption('own');
    await expect(page.locator('.recipe-card')).toHaveCount(2);
    await expect(page.locator('.recipe-card').first().locator('.card-actions > *')).toHaveCount(4);
    await page.locator('.recipe-card').first().getByRole('button', { name: 'Hapus', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.recipe-card')).toHaveCount(2);
    await page.locator('.recipe-card').first().getByRole('button', { name: 'Hapus', exact: true }).click();
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page).toHaveURL(/koleksi/);
    await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('saving a recipe clears its draft before writing another recipe', async ({ page }) => {
    await page.goto('/resep/baru?salin=pasta-tomat-bawang');
    await page.getByLabel('Nama resep', { exact: true }).fill('Pasta versiku');
    await expect(page.locator('#draft-status')).toHaveText('Draft tersimpan di browser ini.');
    await page.getByRole('button', { name: 'Simpan resep', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pasta versiku');
    await page.goto('/resep/baru');
    await expect(page.getByLabel('Nama resep', { exact: true })).toHaveValue('');
});

test('meal plan builds a shopping list and preserves manual items', async ({ page }) => {
    await page.goto('/resep?koleksi=harian');
    await page.locator('[data-save="pasta-tomat-bawang"]').click();
    await page.goto('/belanja');
    await page.getByLabel('Nama bahan', { exact: true }).fill('Beras');
    await page.getByLabel('Jumlah', { exact: true }).fill('1');
    await page.getByLabel('Satuan', { exact: true }).fill('kg');
    await page.getByRole('button', { name: 'Tambah bahan', exact: true }).click();
    await page.goto('/rencana');
    await page.getByLabel('Resep', { exact: true }).selectOption('pasta-tomat-bawang');
    await page.getByLabel('Porsi', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Simpan menu' }).click();
    await expect(page.locator('#week-list')).toContainText('Pasta tomat bawang putih');
    await page.getByRole('button', { name: 'Buat daftar belanja minggu ini' }).click();
    await expect(page).toHaveURL(/belanja/);
    await expect(page.locator('.shopping-list')).toContainText('Beras');
    await expect(page.locator('.shopping-list')).toContainText('360 g');
    await page.getByRole('button', { name: 'Kosongkan daftar' }).click();
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page.getByRole('heading', { name: 'Daftar belanja masih kosong' })).toBeVisible();
    await page.goto('/rencana');
    await expect(page.locator('#week-list')).toContainText('Pasta tomat bawang putih');
});

test('all pages reflow and pass automated accessibility checks in both themes', async ({ page }) => {
    test.setTimeout(180000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const urls = ['/', '/resep', '/resep/pasta-tomat-bawang', '/resep/baru', '/koleksi', '/rencana', '/belanja', '/pengaturan', '/privasi'];
    for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ['light', 'dark']) {
            await page.goto('/pengaturan');
            await page.getByLabel('Tampilan', { exact: true }).selectOption(theme);
            for (const url of urls) {
                await page.goto(url);
                await expect(page.locator('h1')).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width} ${theme} ${url}`).toBeTruthy();
                await page.evaluate(axe.source);
                const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
                expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), `${width} ${theme} ${url}`).toEqual([]);
            }
        }
    }
    expect(errors).toEqual([]);
});

test('invalid backup does not erase an existing collection', async ({ page }) => {
    await page.goto('/resep');
    await page.locator('[data-save]').first().click();
    await page.goto('/pengaturan');
    await page.getByLabel('Impor cadangan Flavory').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page.locator('#import-result')).toContainText('bukan JSON yang valid');
    await page.goto('/koleksi');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('ingredient and step editors preserve content when adding and removing rows', async ({ page }) => {
    await page.goto('/resep/baru');
    await page.getByLabel('Bahan 1', { exact: true }).fill('Tomat');
    await page.getByLabel('Langkah 1', { exact: true }).fill('Cuci tomat.');
    await page.getByRole('button', { name: 'Tambah bahan', exact: true }).click();
    await expect(page.getByLabel('Bahan 1', { exact: true })).toHaveValue('Tomat');
    await page.getByLabel('Bahan 2', { exact: true }).fill('Bawang');
    await page.getByRole('button', { name: 'Tambah langkah', exact: true }).click();
    await expect(page.getByLabel('Langkah 1', { exact: true })).toHaveValue('Cuci tomat.');
    await page.getByRole('button', { name: 'Hapus bahan 2', exact: true }).click();
    await expect(page.getByLabel('Bahan 1', { exact: true })).toHaveValue('Tomat');
    await page.getByRole('button', { name: 'Hapus langkah 2', exact: true }).click();
    await page.getByRole('button', { name: 'Buang draft', exact: true }).click();
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page).toHaveURL(/koleksi/);
    await page.goto('/resep/baru');
    await expect(page.getByLabel('Bahan 1', { exact: true })).toHaveValue('');
});

test('timer completion, printing, clipboard sharing and backup round trip', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/resep/pasta-tomat-bawang');
    await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
    await page.getByRole('button', { name: 'Cetak resep', exact: true }).click();
    expect(await page.evaluate(() => window.__printed)).toBe(true);
    await page.getByRole('button', { name: 'Bagikan teks resep' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Pasta tomat bawang putih');
    await page.clock.install();
    await page.getByRole('button', { name: 'Mulai memasak' }).click();
    await page.getByLabel('Menit (1–180)').fill('1');
    await page.getByLabel('Menit (1–180)').press('Tab');
    await page.getByRole('button', { name: 'Mulai pengingat' }).click();
    await page.clock.fastForward('01:01');
    await expect(page.locator('#timer-status')).toContainText('Waktu pengingat selesai');
    await page.keyboard.press('Escape');
    await expect(page.locator('#cooking-dialog')).not.toBeVisible();
    await page.locator('[data-save]').click();
    await page.goto('/pengaturan');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Ekspor cadangan' }).click();
    const file = await pending;
    const backup = await file.path();
    await page.getByRole('button', { name: 'Hapus data Flavory', exact: true }).click();
    await page.locator('[data-dialog="confirm"]').click();
    await page.getByLabel('Impor cadangan Flavory').setInputFiles(backup);
    await page.locator('[data-dialog="confirm"]').click();
    await expect(page.locator('#import-result')).toContainText('berhasil diimpor');
    await page.goto('/koleksi');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('filters, empty states, plan removal and manual shopping removal work', async ({ page }) => {
    await page.goto('/resep?koleksi=harian');
    await page.locator('[data-save="pasta-tomat-bawang"]').click();
    await page.goto('/resep');
    await page.getByLabel('Kategori', { exact: true }).selectOption('Minuman');
    await page.getByLabel('Waktu memasak', { exact: true }).selectOption('15');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.getByLabel('Kategori', { exact: true }).selectOption('');
    await page.getByLabel('Waktu memasak', { exact: true }).selectOption('');
    await page.getByLabel('Urutkan', { exact: true }).selectOption('time');
    await expect(page.locator('.recipe-card h2').first()).toHaveText('Es semangka jeruk nipis');
    await page.getByLabel('Cari judul atau bahan').fill('tidak-ada-resep-ini');
    await expect(page.getByRole('heading', { name: 'Belum ada resep yang cocok' })).toBeVisible();
    await page.goto('/rencana');
    await page.getByRole('button', { name: 'Buat daftar belanja minggu ini' }).click();
    await expect(page.locator('#shopping-plan-status')).toContainText('Tambahkan setidaknya satu menu');
    await page.getByRole('button', { name: 'Simpan menu' }).click();
    await page.locator('[data-remove-plan]').first().click();
    await expect(page.locator('[data-remove-plan]')).toHaveCount(0);
    await page.goto('/belanja');
    await page.getByLabel('Nama bahan', { exact: true }).fill('Beras');
    await page.getByLabel('Satuan', { exact: true }).fill('kg');
    await page.getByRole('button', { name: 'Tambah bahan', exact: true }).click();
    await page.getByRole('button', { name: 'Hapus Beras', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Daftar belanja masih kosong' })).toBeVisible();
    await page.goto('/resep/baru');
    await page.getByRole('button', { name: 'Simpan resep', exact: true }).click();
    await expect(page.getByLabel('Nama resep', { exact: true })).toBeFocused();
});

test('home filters real recipes by ingredient combinations without changing the recipe collection', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Cari dari bahan di dapur', { exact: true }).click();
    await page.locator('[data-pantry="Tomat"]').click();
    await expect(page.locator('#pantry-status')).toHaveText('2 resep memuat Tomat.');
    await expect(page.locator('.pantry-match')).toHaveCount(2);
    await page.locator('[data-pantry="Bawang putih"]').click();
    await expect(page.locator('.pantry-match')).toHaveCount(1);
    await expect(page.locator('.pantry-match h3')).toHaveText('Pasta tomat bawang putih');
    await page.locator('[data-pantry="Semangka"]').click();
    await expect(page.locator('.pantry-empty')).toContainText('Belum ada kombinasi yang cocok');
    await page.getByRole('button', { name: 'Hapus pilihan bahan' }).click();
    await expect(page.locator('[data-pantry][aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator('.pantry-match')).toHaveCount(3);
    await expect(page.locator('.week-preview-day')).toHaveCount(7);
    await expect(page.locator('.week-preview-heading')).toContainText('0 menu');
    await page.locator('[data-save="pasta-tomat-bawang"]').click();
    await page.goto('/koleksi');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
});

test('ingredient readiness survives portion changes and related recipes avoid save buttons', async ({ page }) => {
    await page.goto('/resep/pasta-tomat-bawang');
    await page.locator('#ingredients input').nth(0).check();
    await page.locator('#ingredients input').nth(2).check();
    await expect(page.locator('#ingredient-readiness')).toHaveText('2 dari 7 bahan siap');
    await page.locator('#more-servings').click();
    await expect(page.locator('#servings')).toHaveValue('3');
    await expect(page.locator('#ingredients input:checked')).toHaveCount(2);
    await expect(page.locator('#ingredient-readiness')).toHaveText('2 dari 7 bahan siap');
    await expect.poll(() => page.locator('#readiness-bar').evaluate((el) => el.value)).toBe(2);

    await expect(page.getByRole('heading', { name: 'Resep lain untuk dicoba' })).toBeVisible();
    await expect(page.locator('.related-card')).toHaveCount(3);
    await expect(page.locator('.related-recipes [data-save]')).toHaveCount(0);
    await expect(page.locator('[data-save]')).toHaveCount(1);
    await page.locator('.related-card').first().click();
    await expect(page.locator('.recipe-intro h1')).toBeVisible();
    await expect(page).not.toHaveURL(/pasta-tomat-bawang$/);
});

test('custom pantry ingredients combine with presets and can be removed', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Cari dari bahan di dapur', { exact: true }).click();
    await page.locator('[data-pantry="Tomat"]').click();
    await page.locator('#pantry-custom').fill('jagung');
    await page.locator('#pantry-form button').click();
    await expect(page.locator('#pantry-status')).toHaveText('1 resep memuat Tomat, Jagung.');
    await expect(page.locator('.pantry-match h3')).toHaveText('Salad sayur saus lemon');
    await expect(page.locator('.pantry-chip')).toContainText('Jagung');
    await page.locator('.pantry-chip').click();
    await expect(page.locator('#pantry-status')).toHaveText('2 resep memuat Tomat.');
    await expect(page.locator('.pantry-chip')).toHaveCount(0);
    await page.getByRole('button', { name: 'Hapus pilihan bahan' }).click();
    await expect(page.locator('.pantry-match')).toHaveCount(3);
});

test('header search jumps from the landing page into filtered recipes', async ({ page }) => {
    await page.goto('/');
    const headerSearch = page.getByLabel('Cari resep atau bahan');
    await expect(headerSearch).toBeVisible();
    await page.keyboard.press('/');
    await expect(headerSearch).toBeFocused();
    await headerSearch.fill('pasta');
    await headerSearch.press('Enter');
    await expect(page).toHaveURL(/\/resep\?q=pasta/);
    await expect(page.locator('.recipe-card h2').filter({ hasText: 'Pasta tomat bawang putih' })).toHaveCount(1);
    await expect(page.getByLabel('Cari resep atau bahan')).toHaveValue('pasta');
    await expect(page.locator('#search')).toHaveValue('pasta');
});

test('catalog filter chips and slash shortcut stay in sync with recipe results', async ({ page }) => {
    await page.goto('/resep?category=Sarapan&time=15');
    await expect(page.locator('.filter-chip')).toHaveCount(2);
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.keyboard.press('/');
    await expect(page.locator('#search')).toBeFocused();
    await page.locator('[data-clear-filter="time"]').click();
    await expect(page.locator('.filter-chip')).toHaveCount(1);
    await expect.poll(() => page.locator('.recipe-card').count()).toBeGreaterThan(1);
    await page.locator('[data-clear-all]').click();
    await expect(page.locator('.filter-chip')).toHaveCount(0);
    await expect(page.locator('.recipe-card')).toHaveCount(24);
    await expect(page).toHaveURL(/\/resep$/);
});

 test('menu choices follow saved recipes including the archive and persist after reload', async ({ page }) => {
    await page.goto('/rencana');
    await expect(page.getByRole('button', { name: 'Simpan menu', exact: true })).toBeDisabled();
    await page.goto('/resep?q=nasi+kebuli');
    const saved = page.locator('.recipe-card [data-save]').first();
    const id = await saved.getAttribute('data-save');
    await saved.click();
    await page.goto('/rencana');
    await expect(page.locator('#plan-recipe option')).toHaveCount(1);
    await expect(page.locator('#plan-recipe')).toHaveValue(id);
    await page.getByRole('button', { name: 'Simpan menu', exact: true }).click();
    await page.reload();
    await expect(page.locator('#week-list')).toContainText('NASI KEBULI');
    await page.getByRole('button', { name: 'Buat daftar belanja minggu ini' }).click();
    await expect(page.locator('#shopping-plan-status')).toContainText('manual');
});
