import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function testPortLighthouse() {
  const browser = await chromium.launch({
    executablePath: '/home/mahou-dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    headless: true,
    args: ['--remote-debugging-port=9222', '--no-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to login...');
  await page.goto('http://127.0.0.1:4173/login');
  await page.fill('#email', 'demo@samaadresse.sn');
  await page.fill('#password', 'Password123!');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  console.log('Logged in successfully!');

  // Now run lighthouse connecting to port 9222
  console.log('Running Lighthouse on /addresses/new via port 9222...');
  const outJson = '/tmp/test_lh_auth.report.json';
  const cmd = `npx lighthouse http://127.0.0.1:4173/addresses/new --port=9222 --output=json --output-path=${outJson} --form-factor=mobile --quiet`;
  execSync(cmd, { stdio: 'inherit' });

  const data = JSON.parse(fs.readFileSync(outJson, 'utf-8'));
  console.log('Lighthouse finalUrl:', data.finalUrl);
  console.log('Scores:', {
    performance: data.categories.performance?.score,
    accessibility: data.categories.accessibility?.score,
    bestPractices: data.categories['best-practices']?.score,
    seo: data.categories.seo?.score,
  });

  await browser.close();
}

testPortLighthouse().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
