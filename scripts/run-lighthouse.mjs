import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from '../frontend/node_modules/@playwright/test/index.mjs';

const BASE_URL = process.env.LH_BASE_URL || 'http://127.0.0.1:4173';
const ROOT_DIR = path.resolve('.');
const OUT_DIR = path.join(ROOT_DIR, 'docs/audit/lighthouse');
const CONSOLE_ERRORS_PATH = path.join(ROOT_DIR, 'docs/audit/console-errors.md');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function createProfile(dir, targetUrl) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const executablePath = chromium.executablePath();
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath,
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
  console.log(`[Lighthouse Auth] Session établie. Navigation vers ${targetUrl} et attente du Service Worker...`);
  await page.goto(`${BASE_URL}${targetUrl}`);
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
    }
  });
  await page.waitForTimeout(2000);
  await ctx.close();
}

const auditsToRun = [
  { name: 'landing', path: '/', auth: false, offline: false },
  { name: 'login', path: '/login', auth: false, offline: false },
  { name: 'register', path: '/register', auth: false, offline: false },
  { name: 'public_address', path: '/a/ZIG-KBG-4271', auth: false, offline: false },
  { name: 'directory', path: '/annuaire', auth: false, offline: false },
  { name: 'addresses_mine', path: '/addresses/mine', auth: true, offline: false, profileDir: '/tmp/lh-mine-profile' },
  { name: 'addresses_new', path: '/addresses/new', auth: true, offline: false, profileDir: '/tmp/lh-new-profile' },
  { name: 'addresses_mine_offline', path: '/addresses/mine', auth: true, offline: true, profileDir: '/tmp/lh-mine-offline-profile' },
];

async function main() {
  console.log('=== LANCEMENT DE LA SUITE LIGHTHOUSE (8 PAGES — PROD BUILD) ===\n');

  for (const item of auditsToRun) {
    console.log(`--- Audit en cours : ${item.name} (${item.path}${item.offline ? ' [HORS LIGNE]' : ''}) ---`);
    let chromeFlags = '--headless=new --no-sandbox';

    if (item.auth) {
      await createProfile(item.profileDir, item.path);
      chromeFlags = `--headless=new --user-data-dir=${item.profileDir} --no-sandbox`;
    }

    const outPath = path.join(OUT_DIR, item.name);
    let extraFlags = '';
    if (item.offline) {
      // Conserver le cache Service Worker et IndexedDB du profil authentifié et simuler une latence/débit hors ligne
      extraFlags = ' --disable-storage-reset=true --throttling-method=devtools --throttling.ThroughputKbps=0 --throttling.uploadThroughputKbps=0 --throttling.downloadThroughputKbps=0';
    }
    const cmd = `npx lighthouse ${BASE_URL}${item.path} --chrome-flags="${chromeFlags}"${extraFlags} --output=json,html --output-path=${outPath} --form-factor=mobile --quiet`;
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log('\n=== ANALYSE DES RAPPORTS LIGHTHOUSE JSON ===\n');

  const rows = [];
  let postFixConsoleMd = '\n## Après correctifs (extraction depuis les 8 rapports JSON Lighthouse)\n\n';

  for (const item of auditsToRun) {
    const jsonPath = path.join(OUT_DIR, `${item.name}.report.json`);
    if (!fs.existsSync(jsonPath)) {
      console.error(`ECHEC CRITIQUE : Rapport JSON manquant pour ${item.name}`);
      process.exit(1);
    }

    const r = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const perfScore = r.categories.performance?.score;
    const a11yScore = r.categories.accessibility?.score;
    const bpScore = r.categories['best-practices']?.score;
    const seoScore = r.categories.seo?.score;

    if (perfScore === undefined || perfScore === null ||
        a11yScore === undefined || a11yScore === null ||
        bpScore === undefined || bpScore === null ||
        seoScore === undefined || seoScore === null) {
      console.error(`ECHEC CRITIQUE : Une catégorie est absente du JSON pour ${item.name}`);
      process.exit(1);
    }

    const perf = Math.round(perfScore * 100);
    const a11y = Math.round(a11yScore * 100);
    const bp = Math.round(bpScore * 100);
    const seo = Math.round(seoScore * 100);

    const lcp = r.audits['largest-contentful-paint']?.displayValue || 'N/A';
    const lcpMs = r.audits['largest-contentful-paint']?.numericValue ?? null;
    const cls = r.audits['cumulative-layout-shift']?.displayValue || 'N/A';
    const clsVal = r.audits['cumulative-layout-shift']?.numericValue ?? null;
    const tbt = r.audits['total-blocking-time']?.displayValue || 'N/A';

    const failingAudits = Object.entries(r.audits || {})
      .filter(([, a]) => a && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'informative')
      .map(([id]) => `\`${id}\``);

    rows.push({
      page: item.name,
      finalUrl: r.finalUrl || `${BASE_URL}${item.path}`,
      perf,
      a11y,
      bp,
      seo,
      lcp,
      lcpMs,
      cls,
      clsVal,
      tbt,
      failing: failingAudits.join(', ') || 'Aucun',
    });

    const errAudit = r.audits['errors-in-console'];
    const errItems = errAudit?.details?.items || [];
    postFixConsoleMd += `### ${item.name} (\`${r.finalUrl}\`) — score : ${errAudit ? errAudit.score : 'N/A'}\n\n`;
    if (errItems.length === 0) {
      postFixConsoleMd += `- Aucune erreur console.\n\n`;
    } else {
      postFixConsoleMd += `| URL | Description |\n| --- | --- |\n`;
      for (const it of errItems) {
        const url = (it.url || it.sourceLocation?.url || '').replace(/\|/g, '\\|');
        const desc = (it.description || '').replace(/\n/g, ' ').replace(/\|/g, '\\|');
        postFixConsoleMd += `| \`${url}\` | \`${desc}\` |\n`;
      }
      postFixConsoleMd += `\n`;
    }
  }

  let md = '| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |\n';
  md += '|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|\n';
  for (const row of rows) {
    md += `| **${row.page}** | \`${row.finalUrl}\` | **${row.perf}** | **${row.a11y}** | **${row.bp}** | **${row.seo}** | ${row.lcp} | ${row.cls} | ${row.tbt} | ${row.failing} |\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary-table.md'), md, 'utf8');

  if (fs.existsSync(CONSOLE_ERRORS_PATH)) {
    const existing = fs.readFileSync(CONSOLE_ERRORS_PATH, 'utf8').split('\n## Après correctifs')[0];
    fs.writeFileSync(CONSOLE_ERRORS_PATH, existing.trimEnd() + '\n' + postFixConsoleMd, 'utf8');
  } else {
    fs.writeFileSync(CONSOLE_ERRORS_PATH, '# Audit `errors-in-console` (Lighthouse)\n' + postFixConsoleMd, 'utf8');
  }

  console.log('Tableau Lighthouse généré avec succès dans docs/audit/lighthouse/summary-table.md\n');
  console.log(md);
}

main().catch(err => {
  console.error('Erreur Lighthouse :', err);
  process.exit(1);
});
