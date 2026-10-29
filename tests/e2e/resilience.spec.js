import { test, expect } from '@playwright/test';

async function appName(page) { return (await page.title()).includes('Codeventure') ? 'codeventure' : 'flavory'; }

test('mobile keyboard navigation, dismissible menu and 200 percent text reflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Lewati ke konten' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
    await expect(page.locator('#appearance-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Buka menu', exact: true })).toBeFocused();
    await expect(page.locator('#appearance-menu')).not.toBeVisible();
    await page.evaluate(() => document.documentElement.style.fontSize = '212.5%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'test-results/mobile-200-percent.png', fullPage: true });
    const app = await appName(page);
    const urls = app === 'codeventure' ? ['/jalur', '/jalur/html-dasar', '/belajar/html-dasar/struktur-semantik', '/progres', '/catatan', '/pengaturan', '/privasi'] : ['/resep', '/resep/pasta-tomat-bawang', '/resep/baru', '/koleksi', '/rencana', '/belanja', '/pengaturan', '/privasi'];
    for (const url of urls) {
        await page.goto(url);
        await page.evaluate(() => document.documentElement.style.fontSize = '212.5%');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `200% text on ${url}`).toBeTruthy();
    }
});

test('a browser refusing writes gives visible feedback without crashing', async ({ page }) => {
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
    await page.goto('/');
    const app = await appName(page);
    if (app === 'codeventure') {
        await page.goto('/pengaturan');
        await page.getByLabel('Nama panggilan').fill('Sesi sementara');
        await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    } else {
        await page.getByRole('button', { name: 'Simpan Pasta tomat bawang putih', exact: true }).click();
    }
    await expect(page.locator('#storage-warning')).toBeVisible();
    await expect(page.locator('#storage-warning')).toContainText('tidak bisa menyimpan');
    await expect(page.locator('h1')).toBeVisible();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Ekspor data sesi ini' }).click();
    expect((await pending).suggestedFilename()).toContain('cadangan');
});

test('stale tabs cannot silently overwrite a newer saved collection', async ({ page, context }) => {
    await page.goto('/');
    const app = await appName(page);
    const target = app === 'codeventure' ? '/pengaturan' : '/resep?koleksi=harian';
    await page.goto(target);
    const other = await context.newPage();
    await other.goto(target);
    if (app === 'codeventure') {
        await page.getByLabel('Nama panggilan').fill('Perubahan pertama');
        await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
        await other.getByLabel('Nama panggilan').fill('Perubahan tab lama');
        await other.getByRole('button', { name: 'Simpan pengaturan' }).click();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('codeventure-data-v1')));
        expect(saved.data.name).toBe('Perubahan pertama');
    } else {
        await page.getByRole('button', { name: 'Simpan Pasta tomat bawang putih', exact: true }).click();
        await other.getByRole('button', { name: 'Simpan Es semangka jeruk nipis', exact: true }).click();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flavory-data-v1')));
        expect(saved.data.saved).toEqual(['pasta-tomat-bawang']);
    }
    await expect(other.locator('#storage-warning')).toContainText('Data berubah di tab lain');
    await other.close();
});
