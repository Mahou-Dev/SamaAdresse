import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  outputDir: '/tmp/p03-pw-results',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
    trace: 'off',
  },
  webServer: {
    command: 'npx vite preview --port 4175 --strictPort --host 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});
