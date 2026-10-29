import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test.use({ bypassCSP: true });

test('product navigation, unified search and appearance menu work', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-nav a')).toHaveText(['Beranda', 'Buku resep', 'Rencana masak', 'Rencana belanja', 'Koleksiku']);
    await page.getByRole('button', { name: 'Buka menu' }).click();
    await page.getByRole('radio', { name: 'Putih', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Buka menu' })).toBeFocused();
    await page.getByLabel('Cari resep atau bahan', { exact: true }).fill('nasi kebuli');
    await page.locator('.header-search button').click();
    await expect(page).toHaveURL(/\/resep\?q=nasi/);
    await expect(page.locator('.recipe-card').first()).toContainText(/NASI KEBULI/i);
    await expect(page.locator('.recipe-card img').first()).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('appearance follows system, synchronizes settings, closes outside and remains accessible', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Buka menu' }).click();
    await page.getByRole('radio', { name: 'Sistem', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(axe.source);
    expect((await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] }))).violations).toEqual([]);
    await page.getByRole('link', { name: 'Pengaturan', exact: true }).click();
    await expect(page.getByLabel('Tampilan', { exact: true })).toHaveValue('system');
    await page.getByLabel('Tampilan', { exact: true }).selectOption('light');
    await page.getByRole('button', { name: 'Buka menu' }).click();
    await expect(page.getByRole('radio', { name: 'Putih', exact: true })).toBeChecked();
    await page.mouse.click(12, 600);
    await expect(page.locator('#appearance-menu')).not.toBeVisible();
});

test('unavailable archive retains existing recipes and shows a recovery action', async ({ page }) => {
    await page.route('**/data/mustikarasa.json', (route) => route.abort());
    await page.goto('/resep');
    await expect(page.locator('#collection-loading')).toContainText('belum dimuat');
    await expect(page.locator('.recipe-card')).toHaveCount(4);
    await expect(page.locator('#collection-loading a')).toHaveText('Coba lagi');
});

test('a pending archive never blocks local search or personal collection controls', async ({ page }) => {
    await page.route('**/data/mustikarasa.json', () => {});
    await page.goto('/resep');
    await expect(page.locator('.recipe-card')).toHaveCount(4);
    await page.getByLabel('Cari judul atau bahan').fill('pasta');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.goto('/koleksi');
    await expect(page.getByLabel('Koleksi', { exact: true })).toHaveValue('saved');
    await page.goto('/resep/baru');
    await expect(page.getByRole('button', { name: 'Impor resep', exact: true })).toBeVisible();
});

test('archive and existing recipes share one collection and archive favorites survive reload', async ({ page }) => {
    await page.goto('/resep?q=nasi+kebuli');
    await page.locator('.recipe-card [data-save]').first().click();
    await page.goto('/resep?koleksi=saved');
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('.recipe-card')).toHaveCount(1);
    await page.locator('.recipe-card h2 a').click();
    await expect(page.locator('h1')).toContainText(/NASI KEBULI/i);
    await expect(page.locator('.archive-photo')).toBeVisible();
});

test('home ingredient shortcut opens the finder by keyboard and survives a direct link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const shortcut = page.getByRole('link', { name: 'Cari dari bahanmu', exact: true });
    await shortcut.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#dari-bahan$/);
    await expect(page.getByRole('button', { name: 'Tomat', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tomat', exact: true }).click();
    await expect(page.locator('.pantry-match')).toHaveCount(2);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tomat', exact: true })).toBeVisible();
    await expect(page.locator('#pantry-status')).toHaveText('Ide dari resep harian.');
});

test('compact home reveals categories and keeps recipe and pantry navigation usable', async ({ page }) => {
    await page.goto('/');
    for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
        await page.setViewportSize({ width, height });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.getByRole('link', { name: 'Buka buku resep', exact: true })).toBeVisible();
        if (height >= 844) await expect(page.locator('#category-heading')).toBeInViewport();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: 'Buka buku resep', exact: true }).click();
    await expect(page).toHaveURL(/\/resep$/);
    await expect(page.locator('#filters')).toBeVisible();
});
