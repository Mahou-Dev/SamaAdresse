import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  outputDir: '/tmp/p02-pw-results',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    trace: 'off',
  },
  webServer: {
    command: 'npx vite preview --port 4174 --strictPort --host 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
