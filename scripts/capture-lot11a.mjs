#!/usr/bin/env node
/**
 * scripts/capture-lot11a.mjs
 * Génère les captures 360x800, 768x1024 et 1280x800 pour le Lot 11A :
 * - Tableau de bord (/tableau-de-bord)
 * - Mes adresses (/addresses/mine : liste, grille, vide)
 * - Compte (/account : profil, application, préférences, aide)
 * - Administration (/admin : indicateurs, file de modération, panneau latéral, journal d'audit)
 */

import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8082';
const OUT_DIR = path.join(ROOT_DIR, 'docs', 'audit', 'lot11a');

fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 }
];

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(500);
}

async function captureAll() {
  console.log(`Démarrage de la capture Lot 11A sur ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  let userStorageState = null;
  let adminStorageState = null;

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Résolution ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      storageState: userStorageState || undefined,
    });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 12.5738, longitude: -16.2650 });

    const page = await context.newPage();

    // 1. Connexion en tant qu'utilisateur standard (Mamadou Diop)
    if (!userStorageState) {
      console.log(`[${vp.name}] Connexion utilisateur standard (demo@samaadresse.sn)...`);
      await login(page, 'demo@samaadresse.sn', process.env.DEMO_PASSWORD || 'Password123!');
      userStorageState = await context.storageState();
    }

    // 2. Tableau de bord
    console.log(`[${vp.name}] Capture Tableau de bord...`);
    await page.goto(`${BASE_URL}/tableau-de-bord`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, `dashboard_${vp.name}.png`), fullPage: false });

    // 3. Mes adresses - Vue Liste & Grille
    console.log(`[${vp.name}] Capture Mes adresses...`);
    await page.goto(`${BASE_URL}/addresses/mine`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(600);

    if (vp.width >= 1024) {
      // 3.1 Vue Liste explicite
      console.log(`[${vp.name}] Bascule en Vue Liste...`);
      const listBtn = page.getByRole('button', { name: /liste/i });
      if (await listBtn.isVisible()) {
        await listBtn.click();
        await page.waitForSelector('[data-testid="addresses-list-view"]', { timeout: 5000 });
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: path.join(OUT_DIR, `addresses_mine_list_${vp.name}.png`), fullPage: false });

      // 3.2 Vue Grille explicite
      console.log(`[${vp.name}] Bascule en Vue Grille...`);
      const gridBtn = page.getByRole('button', { name: /grille/i });
      if (await gridBtn.isVisible()) {
        await gridBtn.click();
        await page.waitForSelector('[data-testid="addresses-grid-view"]', { timeout: 5000 });
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: path.join(OUT_DIR, `addresses_mine_grid_${vp.name}.png`), fullPage: false });
    } else {
      // Sur mobile/tablette, la vue standard est capturée
      await page.screenshot({ path: path.join(OUT_DIR, `addresses_mine_list_${vp.name}.png`), fullPage: false });
    }

    // Mes adresses - Vue vide (aucun résultat via recherche filtrée)
    console.log(`[${vp.name}] Capture Mes adresses (aucun résultat)...`);
    const searchInput = page.getByPlaceholder(/rechercher par code/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('INTROUVABLE_XYZ');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `addresses_mine_empty_${vp.name}.png`), fullPage: false });
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // 4. Compte - 4 onglets
    console.log(`[${vp.name}] Capture Compte (onglets)...`);
    await page.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 });

    // Onglet Profil
    await page.getByRole('tab', { name: /profil/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, `account_profile_${vp.name}.png`), fullPage: false });

    // Onglet Application & hors ligne
    await page.getByRole('tab', { name: /application/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, `account_app_${vp.name}.png`), fullPage: false });

    // Onglet Préférences
    await page.getByRole('tab', { name: /préférences/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, `account_preferences_${vp.name}.png`), fullPage: false });

    // Onglet Aide
    await page.getByRole('tab', { name: /aide/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, `account_help_${vp.name}.png`), fullPage: false });

    // Captures hors ligne (spécifiquement pour la résolution 1280)
    if (vp.width === 1280) {
      console.log(`[${vp.name}] Capture Tableau de bord et Compte en mode hors ligne...`);
      await context.setOffline(true);

      // Tableau de bord hors ligne
      await page.goto(`${BASE_URL}/tableau-de-bord`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT_DIR, `dashboard_offline_${vp.name}.png`), fullPage: false });

      // Compte hors ligne (onglet Application)
      await page.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const appTab = page.getByRole('tab', { name: /application/i });
      if (await appTab.isVisible()) {
        await appTab.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(OUT_DIR, `account_offline_${vp.name}.png`), fullPage: false });

      await context.setOffline(false);
    }

    await context.close();

    // 5. Administration (Connexion en Admin)
    const adminContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      storageState: adminStorageState || undefined,
    });
    await adminContext.grantPermissions(['geolocation']);
    await adminContext.setGeolocation({ latitude: 12.5738, longitude: -16.2650 });

    const adminPage = await adminContext.newPage();
    if (!adminStorageState) {
      console.log(`[${vp.name}] Connexion Admin (admin@samaadresse.sn)...`);
      await login(adminPage, 'admin@samaadresse.sn', process.env.DEMO_PASSWORD || 'Password123!');
      adminStorageState = await adminContext.storageState();
    }

    console.log(`[${vp.name}] Capture Administration (Indicateurs & File)...`);
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('h1', { timeout: 10000 });
    await adminPage.waitForTimeout(600);
    await adminPage.screenshot({ path: path.join(OUT_DIR, `admin_queue_${vp.name}.png`), fullPage: false });

    // Panneau latéral de détail sur le premier élément de la file
    const detailBtn = adminPage.getByRole('button', { name: /voir le détail/i }).first();
    if (await detailBtn.isVisible()) {
      console.log(`[${vp.name}] Capture Panneau latéral de modération...`);
      await detailBtn.click();
      await adminPage.waitForSelector('[role="dialog"][aria-label*="Détail"]', { timeout: 5000 });
      await adminPage.waitForTimeout(400);
      await adminPage.screenshot({ path: path.join(OUT_DIR, `admin_panel_detail_${vp.name}.png`), fullPage: false });
      // Fermer le panneau
      const closeBtn = adminPage.getByRole('button', { name: /fermer/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
      await adminPage.waitForTimeout(300);
    }

    // Onglet Journal d'audit
    console.log(`[${vp.name}] Capture Journal d'audit...`);
    const auditTab = adminPage.getByRole('tab', { name: /journal d'audit/i });
    if (await auditTab.isVisible()) {
      await auditTab.click();
      await adminPage.waitForTimeout(500);
      await adminPage.screenshot({ path: path.join(OUT_DIR, `admin_audit_${vp.name}.png`), fullPage: false });
    }

    // Capture Administration hors ligne
    if (vp.width === 1280) {
      console.log(`[${vp.name}] Capture Administration en mode hors ligne...`);
      await adminContext.setOffline(true);
      await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
      await adminPage.waitForTimeout(1000);
      await adminPage.screenshot({ path: path.join(OUT_DIR, `admin_offline_${vp.name}.png`), fullPage: false });
      await adminContext.setOffline(false);
    }

    await adminContext.close();
  }

  await browser.close();
  console.log(`\nToutes les captures ont été enregistrées avec succès dans ${OUT_DIR}`);
}

captureAll().catch(err => {
  console.error('Erreur lors des captures :', err);
  process.exit(1);
});
