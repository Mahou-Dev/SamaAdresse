#!/usr/bin/env node
/**
 * scripts/capture-lot10.mjs
 * Génère les captures 360x780 des écrans modifiés pour le Lot 10 :
 * 1. Toast avant (bottom-5) et après (bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))])
 * 2. Annuaire montrant les 4 illustrations distinctes
 * 3. Assistant étape 2 avec section visibilité dépliée par défaut
 * 4. Pied de page avec mention « Projet étudiant — Ziguinchor, Sénégal »
 */

import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8082';
const OUT_DIR = path.join(ROOT_DIR, 'docs', 'audit', 'lot10');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log(`Génération des captures Lot 10 sur ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // 1. Pied de page
  console.log('Capture 1/5 : Pied de page (360x780)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'pied_de_page_360x780.png'), fullPage: false });

  // 2. Annuaire avec 4 illustrations distinctes
  console.log('Capture 2/5 : Annuaire avec illustrations distinctes (360x780)...');
  await page.goto(`${BASE_URL}/annuaire`, { waitUntil: 'networkidle' });
  await page.waitForSelector('article', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, 'annuaire_360x780_illustrations.png'), fullPage: false });

  // Connexion pour les captures suivantes
  console.log('Connexion avec le compte démo...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo@samaadresse.sn');
  await page.fill('input[type="password"]', process.env.DEMO_PASSWORD || 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // 3. Assistant de création - Étape 2 avec visibilité dépliée
  console.log('Capture 3/5 : Assistant création étape 2 dépliée (360x780)...');
  await page.goto(`${BASE_URL}/addresses/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Passer à l'étape 2
  const nextBtn = page.getByRole('button', { name: /suivant|continuer|étape suivante/i }).first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }
  // Attendre le panneau de visibilité
  await page.waitForSelector('details[open]', { timeout: 5000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'assistant_etape2_360x780_deplie.png'), fullPage: false });

  // 4 & 5. Toasts avant et après au-dessus de la barre de navigation
  console.log('Captures 4 & 5 : Toasts avant/après au-dessus de la barre de navigation (360x780)...');
  await page.goto(`${BASE_URL}/addresses/mine`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Déclencher un toast de succès dans l'interface
  await page.evaluate(() => {
    // Créer ou injecter un élément toast pour capturer fidèlement la position
    const container = document.querySelector('.pointer-events-none.fixed');
    if (container) {
      // Version "Après" (position courante)
      const toastHtml = `
        <div id="test-toast-demo" class="pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all bg-[#EAF4ED] border-[#2A6B44]/40 text-[#1C4E30]">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-[#2A6B44] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="text-sm font-medium leading-snug">Adresse synchronisée avec succès</span>
          </div>
        </div>
      `;
      container.innerHTML = toastHtml;
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'toast_360x780_apres.png'), fullPage: false });

  // Version "Avant" (simuler bottom-5 sans la marge de navigation)
  await page.evaluate(() => {
    const container = document.querySelector('.pointer-events-none.fixed');
    if (container) {
      container.className = 'fixed bottom-5 right-0 md:right-5 left-0 md:left-auto mx-auto md:mx-0 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none';
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'toast_360x780_avant.png'), fullPage: false });

  await browser.close();
  console.log('Toutes les captures Lot 10 générées avec succès dans docs/audit/lot10/');
}

main().catch((err) => {
  console.error('ERREUR:', err);
  process.exit(1);
});
