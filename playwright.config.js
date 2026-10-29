import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 30000,
    reporter: 'list',
    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:8001',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        launchOptions: { args: ['--no-sandbox'] },
    },
});
