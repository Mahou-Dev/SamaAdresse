#!/usr/bin/env node
/**
 * scripts/capture-palette.mjs
 * Capture d'écran automatisée des 8 vues clés de l'application sous la nouvelle palette (Lot 9) :
 *  1. accueil
 *  2. connexion
 *  3. mes_adresses
 *  4. fiche_publique
 *  5. annuaire
 *  6. assistant_etape2
 *  7. plaque_hors_ligne
 *  8. modale_deconnexion
 *
 * Résolutions : 360x780 (mobile) et 1440x900 (desktop)
 * Sortie : docs/audit/palette/*.png
 */

import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'docs', 'audit', 'palette');
const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8082';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Récupérer DEMO_PASSWORD
let demoPassword = process.env.DEMO_PASSWORD || '';
if (!demoPassword) {
  const envFile = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const l of lines) {
      if (l.startsWith('DEMO_PASSWORD=')) {
        demoPassword = l.split('=')[1].trim();
        break;
      }
    }
  }
}
if (!demoPassword) demoPassword = 'Password123!';

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#email');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function captureViews() {
  console.log(`Démarrage des captures sur ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 360, height: 780, suffix: '360x780' },
    { width: 1440, height: 900, suffix: '1440x900' },
  ];

  for (const vp of viewports) {
    console.log(`\n=== Capture pour résolution ${vp.suffix} ===`);

    // 1. ACCUEIL (Visiteur)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForSelector('[data-testid="address-plate"]');
      await page.waitForTimeout(500);
      const outPath = path.join(OUT_DIR, `accueil_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ accueil_${vp.suffix}.png`);
      await context.close();
    }

    // 2. CONNEXION
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`);
      await page.waitForSelector('form');
      await page.waitForTimeout(300);
      const outPath = path.join(OUT_DIR, `connexion_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ connexion_${vp.suffix}.png`);
      await context.close();
    }

    // 3. MES ADRESSES (Connecté)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await login(page, 'demo@samaadresse.sn', demoPassword);
      await page.goto(`${BASE_URL}/addresses/mine`);
      await page.waitForSelector('h1');
      await page.waitForTimeout(500);
      const outPath = path.join(OUT_DIR, `mes_adresses_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ mes_adresses_${vp.suffix}.png`);
      await context.close();
    }

    // 4. FICHE PUBLIQUE
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/a/ZIG-KBG-4271`);
      await page.waitForSelector('[data-testid="address-plate"]');
      await page.waitForTimeout(500);
      const outPath = path.join(OUT_DIR, `fiche_publique_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ fiche_publique_${vp.suffix}.png`);
      await context.close();
    }

    // 5. ANNUAIRE
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/annuaire`);
      await page.waitForSelector('#directory-search-input');
      await page.waitForTimeout(500);
      const outPath = path.join(OUT_DIR, `annuaire_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ annuaire_${vp.suffix}.png`);
      await context.close();
    }

    // 6. ÉTAPE 2 DE L'ASSISTANT (Connecté)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await login(page, 'demo@samaadresse.sn', demoPassword);
      await page.goto(`${BASE_URL}/addresses/new`);
      await page.waitForSelector('button:has-text("Continuer vers les détails")');
      await page.click('button:has-text("Continuer vers les détails")');
      await page.waitForSelector('#address-desc');
      await page.waitForTimeout(400);
      const outPath = path.join(OUT_DIR, `assistant_etape2_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ assistant_etape2_${vp.suffix}.png`);
      await context.close();
    }

    // 7. PLAQUE (HORS LIGNE)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await login(page, 'demo@samaadresse.sn', demoPassword);

      // Ouvrir le wizard hors ligne
      await context.setOffline(true);
      await page.goto(`${BASE_URL}/addresses/new`);
      await page.waitForSelector('button:has-text("Continuer vers les détails")');
      await page.click('button:has-text("Continuer vers les détails")');
      await page.waitForSelector('#address-desc');
      await page.fill('#address-desc', 'Maison hors ligne pour capture palette Lot 9');
      await page.click('button:has-text("Continuer vers la photo")');
      await page.waitForSelector('button:has-text("Passer cette étape")');
      await page.click('button:has-text("Passer cette étape")');
      await page.waitForSelector('text=Enregistrée sur cet appareil');
      await page.waitForTimeout(500);

      const outPath = path.join(OUT_DIR, `plaque_hors_ligne_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ plaque_hors_ligne_${vp.suffix}.png`);
      await context.close();
    }

    // 8. MODALE DE DÉCONNEXION (avec brouillon hors ligne en attente)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await login(page, 'demo@samaadresse.sn', demoPassword);

      // Créer un brouillon IndexedDB pour déclencher la modale d'avertissement
      await page.evaluate(async () => {
        const req = indexedDB.open('SamaAdresseOfflineDB', 1);
        await new Promise((resolve) => {
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('offline_drafts', 'readwrite');
            tx.objectStore('offline_drafts').put({
              id: 'draft-lot9-capture',
              code: 'ZIG-KBG-TEMP',
              latitude: 12.578,
              longitude: -16.271,
              description: 'Adresse en attente de synchronisation',
              locationType: 'MAISON',
              listed: false,
              showOwnerName: false,
              createdAt: new Date().toISOString()
            });
            tx.oncomplete = resolve;
          };
        });
      });

      await page.goto(`${BASE_URL}/account`);
      await page.waitForSelector('button:has-text("Se déconnecter")');
      await page.click('button:has-text("Se déconnecter")');
      await page.waitForSelector('h2:has-text("Adresses en attente d\'envoi")');
      await page.waitForTimeout(400);

      const outPath = path.join(OUT_DIR, `modale_deconnexion_${vp.suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  ✓ modale_deconnexion_${vp.suffix}.png`);
      await context.close();
    }
  }

  await browser.close();
  console.log('\nToutes les captures ont été réalisées avec succès dans docs/audit/palette/');
}

captureViews().catch((err) => {
  console.error('Erreur lors des captures :', err);
  process.exit(1);
});
