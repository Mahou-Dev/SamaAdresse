import { chromium } from '@playwright/test';
import fs from 'fs';

const USER_DATA_DIR = '/tmp/lh-profile';

async function setup() {
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: '/home/mahou-dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    headless: true,
  });

  const page = context.pages()[0] || await context.newPage();
  console.log('Navigating to login...');
  await page.goto('http://127.0.0.1:4173/login');
  await page.fill('#email', 'demo@samaadresse.sn');
  await page.fill('#password', 'Password123!');
  
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);

  await page.waitForURL('**/addresses/mine');
  console.log('Logged in successfully, current url:', page.url());
  
  // Wait a moment for cookies/storage to settle
  await page.waitForTimeout(1000);
  await context.close();
  console.log('Profile saved to', USER_DATA_DIR);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
