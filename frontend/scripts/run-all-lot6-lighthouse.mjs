import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { chromium } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4173';
const OUT_DIR = path.resolve('/home/mahou-dev/Documents/SamaAdresse/docs/audit/lot6/lighthouse');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function createProfile(dir, targetUrl) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath: '/home/mahou-dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    headless: true,
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto(`${BASE_URL}/login`);
  await page.fill('#email', 'demo@samaadresse.sn');
  await page.fill('#password', 'Password123!');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL(url => !url.pathname.includes('/login'));
  console.log(`[Auth] Logged in successfully. Navigating to ${targetUrl}...`);
  await page.goto(`${BASE_URL}${targetUrl}`);
  await page.waitForTimeout(1500);
  const bodyText = await page.innerText('body');
  console.log(`[Auth] Reached ${targetUrl}. Page snippet:`, bodyText.slice(0, 120).replace(/\n/g, ' '));
  await ctx.close();
}

const auditsToRun = [
  { name: 'landing', path: '/', auth: false },
  { name: 'login', path: '/login', auth: false },
  { name: 'register', path: '/register', auth: false },
  { name: 'public_address', path: '/a/ZIG-KBG-4271', auth: false },
  { name: 'directory', path: '/annuaire', auth: false },
  { name: 'addresses_mine', path: '/addresses/mine', auth: true, profileDir: '/tmp/mine-profile' },
  { name: 'addresses_new', path: '/addresses/new', auth: true, profileDir: '/tmp/new-profile' },
];

async function main() {
  console.log('=== STARTING LOT 6 LIGHTHOUSE SUITE ===');

  for (const item of auditsToRun) {
    console.log(`\n--- Auditing: ${item.name} (${item.path}) ---`);
    let chromeFlags = '--headless=new --no-sandbox';
    
    if (item.auth) {
      console.log(`Setting up authenticated profile for ${item.name}...`);
      await createProfile(item.profileDir, item.path);
      chromeFlags = `--headless=new --user-data-dir=${item.profileDir} --no-sandbox`;
    }

    const outPath = path.join(OUT_DIR, item.name);
    const cmd = `npx lighthouse ${BASE_URL}${item.path} --chrome-flags="${chromeFlags}" --output=json,html --output-path=${outPath} --form-factor=mobile --quiet`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Saved: ${outPath}.report.json and .html`);
  }

  console.log('\n=== ALL AUDITS COMPLETED! PARSING RESULTS ===\n');

  const summary = [];

  for (const item of auditsToRun) {
    const jsonPath = path.join(OUT_DIR, `${item.name}.report.json`);
    const r = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const perf = Math.round((r.categories.performance?.score || 0) * 100);
    const a11y = Math.round((r.categories.accessibility?.score || 0) * 100);
    const bp = Math.round((r.categories['best-practices']?.score || 0) * 100);
    const seo = Math.round((r.categories.seo?.score || 0) * 100);

    const lcp = r.audits['largest-contentful-paint']?.displayValue || 'N/A';
    const cls = r.audits['cumulative-layout-shift']?.displayValue || 'N/A';
    const tbt = r.audits['total-blocking-time']?.displayValue || 'N/A';

    // Collect failing audits (< 1)
    const failingAudits = Object.entries(r.audits)
      .filter(([id, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'informative')
      .map(([id, a]) => ({ id, title: a.title, score: a.score }));

    summary.push({
      page: item.name,
      finalUrl: r.finalUrl,
      perf,
      a11y,
      bp,
      seo,
      lcp,
      cls,
      tbt,
      failingCount: failingAudits.length,
      failingAudits
    });
  }

  console.log(JSON.stringify(summary, null, 2));

  // Write markdown table
  let md = '# Résultats Lighthouse — Lot 6\n\n';
  md += '| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |\n';
  md += '|---|---|---|---|---|---|---|---|---|---|\n';
  for (const s of summary) {
    const fails = s.failingAudits.map(f => `\`${f.id}\``).join(', ') || 'Aucun';
    md += `| **${s.page}** | \`${s.finalUrl}\` | **${s.perf}** | **${s.a11y}** | **${s.bp}** | **${s.seo}** | ${s.lcp} | ${s.cls} | ${s.tbt} | ${fails} |\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), md, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log('Saved summary to summary.md and summary.json');
}

main().catch(err => {
  console.error('Lighthouse runner failed:', err);
  process.exit(1);
});
