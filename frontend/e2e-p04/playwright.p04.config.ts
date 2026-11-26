import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  outputDir: '/tmp/p04-pw-results',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4176',
    headless: true,
    locale: 'fr-FR',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4176 --strictPort',
    cwd: '..',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
