import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8082';
const OUT_DIR = path.resolve('docs/captures/ambiance');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const targets = [
  { name: 'accueil', path: '/', waitSelector: 'h1' },
  { name: 'connexion', path: '/login', waitSelector: 'input#email' },
  { name: 'annuaire', path: '/annuaire', waitSelector: 'article' },
  { name: 'etat-vide', path: '/annuaire?q=RechercheSansResultatXYZ99', waitSelector: 'text=Aucune adresse ne correspond' },
];

const viewports = [
  { label: '360', width: 360, height: 740 },
  { label: '768', width: 768, height: 1024 },
  { label: '1280', width: 1280, height: 800 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const t of targets) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      page.on('console', msg => console.log(`[${t.name}-${vp.label}]`, msg.type(), msg.text()));
      page.on('pageerror', err => console.error(`[${t.name}-${vp.label}] ERROR:`, err));
      await page.goto(`${BASE_URL}${t.path}`, { waitUntil: 'networkidle' });
      if (t.waitSelector) {
        await page.waitForSelector(t.waitSelector, { timeout: 15000 });
      }
      // Attendre le rendu et chargement complet des images
      await page.waitForTimeout(1000);

      const filename = `${t.name}-${vp.label}.png`;
      const filePath = path.join(OUT_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: false });

      const buf = fs.readFileSync(filePath);
      const md5 = crypto.createHash('md5').update(buf).digest('hex');
      const sizeKo = (buf.length / 1024).toFixed(1);

      results.push({ target: t.name, viewport: vp.label, filename, sizeKo, md5 });
      await context.close();
    }
  }

  await browser.close();

  console.log('| Page | Viewport | Fichier | Taille | MD5 |');
  console.log('|---|---|---|---|---|');
  const hashes = new Set();
  let duplicates = 0;
  for (const r of results) {
    console.log(`| ${r.target} | ${r.viewport}px | docs/captures/ambiance/${r.filename} | ${r.sizeKo} Ko | \`${r.md5}\` |`);
    if (hashes.has(r.md5)) {
      duplicates++;
    }
    hashes.add(r.md5);
  }
  console.log(`\nTotal: ${results.length} captures, ${hashes.size} distinct MD5 hashes, ${duplicates} doublons.`);
  if (duplicates > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
