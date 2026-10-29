import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.use({ bypassCSP: true });

test('Mustika Rasa searches historical recipes and preserves cross-page content', async ({ page }) => {
    await page.goto('/mustika-rasa');
    await expect(page.locator('.recipe-card')).toHaveCount(24);
    await page.getByLabel('Cari judul atau bahan').fill('nasi kebuli');
    await expect(page.locator('.recipe-card h2').filter({ hasText: 'NASI KEBULI' })).toHaveCount(2);
    await page.locator('.recipe-card h2 a').first().click();
    await expect(page.locator('#main-nav a[href="/resep"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('h1')).toContainText('NASI KEBULI');
    await expect(page.locator('.archive-body > .panel')).toContainText('beras');
    await page.evaluate(() => { window.print = () => { window.bookPrinted = true; }; });
    await page.getByRole('button', { name: 'Cetak resep', exact: true }).click();
    expect(await page.evaluate(() => window.bookPrinted)).toBe(true);
    await page.getByRole('link', { name: 'Baca halaman buku' }).click();
    await expect(page.locator('h1')).toContainText('Halaman pindai');
    await expect(page.getByRole('link', { name: 'Lihat sumber' })).toHaveAttribute('href', /oldid=/);
    await page.goto('/mustika-rasa?q=xyzmustikatidakada');
    await expect(page.getByRole('heading', { name: 'Belum ada resep yang cocok' })).toBeVisible();
    await page.getByRole('link', { name: 'Hapus pencarian' }).click();
    await expect(page.locator('.recipe-card')).toHaveCount(24);
    await page.getByRole('button', { name: 'Berikutnya' }).click();
    await expect(page).toHaveURL(/p=2/);
    await page.reload();
    await expect(page).toHaveURL(/p=2/);
});

test('pantry presets respect the eight ingredient limit after custom additions', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Cari dari bahan di dapur', { exact: true }).click();
    for (let i = 1; i <= 8; i++) {
        await page.getByLabel('Bahan lain', { exact: true }).fill(`Bahan ${i}`);
        await page.getByRole('button', { name: 'Tambahkan bahan', exact: true }).click();
    }
    await page.locator('[data-pantry="Tomat"]').click();
    await expect(page.locator('[data-pantry="Tomat"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#pantry-hint')).toContainText('8 bahan');
    await page.getByRole('button', { name: 'Hapus bahan Bahan 1', exact: true }).click();
    await page.locator('[data-pantry="Tomat"]').click();
    await expect(page.locator('[data-pantry="Tomat"]')).toHaveAttribute('aria-pressed', 'true');
});

test('book and GitHub control work across themes, sizes and keyboard', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
        for (const width of [360, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/mustika-rasa');
            await page.evaluate((value) => document.documentElement.dataset.theme = value, theme);
            await expect(page.locator('.recipe-card')).toHaveCount(24);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const github = page.getByRole('link', { name: 'Kode Flavory di GitHub (tab baru)' });
            await expect(github).toHaveAttribute('href', 'https://github.com/Ragraze/flavory');
            await github.focus();
            await expect(github).toBeFocused();
            expect(await github.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
            expect(await github.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(0, 0, 0)');
            const box = await github.boundingBox();
            expect(box.width).toBe(56);
            expect(box.height).toBe(56);
            await page.addScriptTag({ content: axe.source });
            expect((await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }))).violations).toEqual([]);
        }
    }
});
