import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from '../frontend/node_modules/@playwright/test/index.mjs';

const BASE_URL = process.env.LH_BASE_URL || 'http://127.0.0.1:4173';
const ROOT_DIR = path.resolve('.');
const OUT_DIR = path.join(ROOT_DIR, 'docs/audit/lighthouse');
const CONSOLE_ERRORS_PATH = path.join(ROOT_DIR, 'docs/audit/console-errors.md');
const TITLES_PATH = path.join(OUT_DIR, 'connected-titles.json');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const initializedProfiles = new Set();
const connectedPageTitles = {};

async function ensureProfile(profileDir, targetUrl, isAdmin = false, expectedTitle = '') {
  if (initializedProfiles.has(profileDir)) {
    return;
  }
  fs.rmSync(profileDir, { recursive: true, force: true });
  const executablePath = chromium.executablePath();
  const ctx = await chromium.launchPersistentContext(profileDir, {
    executablePath,
    headless: true,
  });
  const page = ctx.pages()[0] || await ctx.newPage();

  // 1. Connexion initiale
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const email = isAdmin ? (process.env.ADMIN_EMAIL || 'admin@samaadresse.sn') : 'fatou@samaadresse.sn';
  const pass = isAdmin ? (process.env.ADMIN_PASSWORD || 'Password123!') : (process.env.DEMO_PASSWORD || 'Password123!');
  await page.fill('#email', email);
  await page.fill('#password', pass);
  const [loginRes] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login')),
    page.click('button[type="submit"]')
  ]);

  if (loginRes.status() === 429) {
    try {
      execSync('docker restart samaadresse-prod-test-app', { stdio: 'pipe' });
      for (let i = 0; i < 30; i++) {
        try {
          const h = execSync('curl -sf http://localhost:8082/api/health', { stdio: 'pipe' }).toString();
          if (h.includes('UP')) break;
        } catch {}
        await page.waitForTimeout(500);
      }
    } catch {}
    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
      page.click('button[type="submit"]')
    ]);
  }

  await page.waitForURL(url => !url.pathname.includes('/login'));

  // 2. Navigation vers la page connectée
  await page.goto(`${BASE_URL}${targetUrl}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 3. Contrôle strict de l'absence du libellé "Connexion" dans l'en-tête
  const headerText = await page.locator('header').first().innerText();
  if (headerText.includes('Connexion')) {
    throw new Error(`[Lighthouse Auth Error] L'en-tête contient toujours 'Connexion' sur ${targetUrl}. Profil non authentifié !`);
  }

  // 4. Contrôle strict du titre de la page
  let pageHeading = '';
  try {
    const h1Loc = page.locator('h1').first();
    await h1Loc.waitFor({ state: 'visible', timeout: 5000 });
    pageHeading = (await h1Loc.innerText()).trim();
  } catch (err) {
    throw new Error(`[Lighthouse Auth Error] Sélecteur h1 introuvable sur ${targetUrl} : ${err.message}`);
  }

  if (expectedTitle && !pageHeading.toLowerCase().includes(expectedTitle.toLowerCase())) {
    throw new Error(`[Lighthouse Auth Error] Titre extrait '${pageHeading}' != attendu '${expectedTitle}' sur ${targetUrl}`);
  }

  connectedPageTitles[targetUrl] = pageHeading;

  // Pré-chargement Service Worker
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
    }
  });

  await page.waitForTimeout(1500);
  await ctx.close();
  initializedProfiles.add(profileDir);
}

const auditsToRun = [
  { name: 'landing', path: '/', auth: false, offline: false },
  { name: 'login', path: '/login', auth: false, offline: false },
  { name: 'register', path: '/register', auth: false, offline: false },
  { name: 'public_address', path: '/a/ZIG-KBG-4271', auth: false, offline: false },
  { name: 'directory', path: '/annuaire', auth: false, offline: false },
  { name: 'dashboard', path: '/tableau-de-bord', auth: true, offline: false, profileDir: '/tmp/lh-dashboard-profile', expectedTitle: 'Tableau de bord' },
  { name: 'addresses_mine', path: '/addresses/mine', auth: true, offline: false, profileDir: '/tmp/lh-mine-profile', expectedTitle: 'Mes adresses' },
  { name: 'addresses_new', path: '/addresses/new', auth: true, offline: false, profileDir: '/tmp/lh-new-profile', expectedTitle: 'Où se situe votre lieu' },
  { name: 'account', path: '/account', auth: true, offline: false, profileDir: '/tmp/lh-account-profile', expectedTitle: 'Mon compte' },
  { name: 'admin', path: '/admin', auth: true, admin: true, offline: false, profileDir: '/tmp/lh-admin-profile', expectedTitle: 'Administration' },
  { name: 'addresses_mine_offline', path: '/addresses/mine', auth: true, offline: true, profileDir: '/tmp/lh-mine-offline-profile', expectedTitle: 'Mes adresses' },
];

async function main() {
  console.log('=== LANCEMENT DE LA SUITE LIGHTHOUSE (11 PAGES — PROD BUILD) ===\n');

  for (const item of auditsToRun) {
    console.log(`--- Audit en cours : ${item.name} (${item.path}${item.offline ? ' [HORS LIGNE]' : ''}) ---`);
    let chromeFlags = '--headless=new --no-sandbox';
    let extraFlags = '';

    if (item.auth) {
      await ensureProfile(item.profileDir, item.path, !!item.admin, item.expectedTitle);
      chromeFlags = `--headless=new --user-data-dir=${item.profileDir} --no-sandbox`;
      extraFlags += ' --disable-storage-reset';
    }

    const outPath = path.join(OUT_DIR, item.name);
    if (item.offline) {
      extraFlags += ' --throttling-method=devtools --throttling.ThroughputKbps=0 --throttling.uploadThroughputKbps=0 --throttling.downloadThroughputKbps=0';
    }
    const lhBin = '/home/mahou-dev/.npm/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js';
    const cmd = `node ${lhBin} ${BASE_URL}${item.path} --chrome-flags="${chromeFlags}"${extraFlags} --output=json,html --output-path=${outPath} --form-factor=mobile --quiet`;
    execSync(cmd, { stdio: 'inherit' });
  }

  // Enregistrer les titres extraits pour la preuve de session
  fs.writeFileSync(TITLES_PATH, JSON.stringify(connectedPageTitles, null, 2), 'utf8');

  console.log('\n=== ANALYSE DES RAPPORTS LIGHTHOUSE JSON ===\n');

  const rows = [];
  let postFixConsoleMd = '\n## Après correctifs (extraction depuis les 11 rapports JSON Lighthouse)\n\n';

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
      auth: item.auth,
      title: connectedPageTitles[item.path] || '',
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

    const ssData = r.fullPageScreenshot?.screenshot?.data || r.audits['final-screenshot']?.details?.data;
    if (ssData && ssData.startsWith('data:image/')) {
      const ext = ssData.includes('image/webp') ? 'webp' : 'jpg';
      const ssPath = path.join(OUT_DIR, `${item.name}-screenshot.${ext}`);
      const base64Data = ssData.split(',')[1];
      fs.writeFileSync(ssPath, Buffer.from(base64Data, 'base64'));
    }

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

  let md = '| Page | Profil | URL finale (`finalUrl`) | Titre vérifié | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |\n';
  md += '|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|\n';
  for (const row of rows) {
    const profilLabel = row.auth ? '**Chaud (connecté)**' : 'Froid (anonyme)';
    const titreCol = row.title ? `« ${row.title} »` : '*(public)*';
    md += `| **${row.page}** | ${profilLabel} | \`${row.finalUrl}\` | ${titreCol} | **${row.perf}** | **${row.a11y}** | **${row.bp}** | **${row.seo}** | ${row.lcp} | ${row.cls} | ${row.tbt} | ${row.failing} |\n`;
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
