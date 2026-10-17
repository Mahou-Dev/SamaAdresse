import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('../docs/audit/lot5');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function loginUser(page, email, pass = 'Password123!') {
  await page.goto('http://127.0.0.1:4173/login');
  await page.fill('#email', email);
  await page.fill('#password', pass);
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Préparation des données de test via API
  console.log('--- Préparation des données de test ---');
  const demoLogin = await fetch('http://127.0.0.1:8082/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@samaadresse.sn', password: 'Password123!' })
  });
  const { accessToken: demoToken } = await demoLogin.json();

  const adminLogin = await fetch('http://127.0.0.1:8082/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@samaadresse.sn', password: 'Password123!' })
  });
  const { accessToken: adminToken } = await adminLogin.json();

  // 1. Créer une adresse suspendue pour demo user
  const createSuspendedRes = await fetch('http://127.0.0.1:8082/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${demoToken}` },
    body: JSON.stringify({
      latitude: 12.577,
      longitude: -16.274,
      description: 'Maison suspendue par la modération pour vérification foncière',
      locationType: 'MAISON'
    })
  });
  const suspendedAddr = await createSuspendedRes.json();
  // Suspendre l'adresse via admin
  await fetch(`http://127.0.0.1:8082/api/admin/addresses/${suspendedAddr.id}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ reason: 'Position GPS signalée litigieuse' })
  });

  // 2. Créer un signalement OPEN pour capturer la modale de suspension admin
  await fetch('http://127.0.0.1:8082/api/public/addresses/ZIG-KBG-8454/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: 'POSITION_INCORRECTE',
      comment: 'Repère placé sur la voie publique au lieu de la parcelle'
    })
  });

  console.log('Adresse suspendue créée :', suspendedAddr.code);

  // -------------------------------------------------------------
  // Capture Scénario 1 : bandeau hors ligne sur l'accueil (360x780 et 1440x900)
  // -------------------------------------------------------------
  console.log('Capture 1: offline-banner-home');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForSelector('h1');
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('text=Vous êtes hors ligne');
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-offline-banner-home.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 2 : fiche d'adresse en cache consultée hors ligne (photo + badge fraîcheur)
  // -------------------------------------------------------------
  console.log('Capture 2: fiche-offline-cached');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/a/ZIG-KBG-8454');
    await page.waitForSelector('text=ZIG-KBG-8454');
    await page.waitForSelector('text=Chez Amadou');
    await page.waitForTimeout(1000);
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('text=ZIG-KBG-8454');
    await page.waitForSelector('text=hors ligne');
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-fiche-offline-cached.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 3 : fiche non consultée hors ligne
  // -------------------------------------------------------------
  console.log('Capture 3: fiche-offline-uncached');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/a/ZIG-KBG-8454'); // Mettre une fiche en cache
    await page.waitForSelector('text=ZIG-KBG-8454');
    await context.setOffline(true);
    await page.goto('http://127.0.0.1:4173/a/ZIG-XXX-9999');
    await page.waitForSelector('text=Cette page n\'est pas disponible hors ligne');
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-fiche-offline-uncached.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 4 : wizard /addresses/new hors ligne
  // -------------------------------------------------------------
  console.log('Capture 4: wizard-offline');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.goto('http://127.0.0.1:4173/addresses/new');
    await page.waitForSelector('text=La création d\'une adresse nécessite une connexion.');
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-wizard-offline.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 5 : compte avec section "Installer l'application"
  // -------------------------------------------------------------
  console.log('Capture 5: compte-pwa-install');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('http://127.0.0.1:4173/account');
    await page.waitForSelector('text=Installer l\'application');
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-compte-pwa-install.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 6 : pwa-reload-prompt (360x780)
  // -------------------------------------------------------------
  console.log('Capture 6: pwa-reload-prompt');
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForSelector('h1');
    await page.evaluate(() => {
      if (typeof window !== 'undefined' && window.__triggerPwaRefreshPrompt) {
        window.__triggerPwaRefreshPrompt();
      }
    });
    await page.waitForSelector('text=Nouvelle version disponible');
    await page.screenshot({ path: `${OUT_DIR}/360x780-pwa-reload-prompt.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 7 : tile-offline-fallback (360x780)
  // -------------------------------------------------------------
  console.log('Capture 7: tile-offline-fallback');
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    // Bloquer les requêtes de tuiles OpenStreetMap pour forcer le fallback SVG errorTileUrl
    await page.route('**/tile.openstreetmap.org/**', (route) => route.abort('failed'));
    await page.goto('http://127.0.0.1:4173/a/ZIG-KBG-8454');
    await page.waitForSelector('.leaflet-container');
    await page.evaluate(() => {
      document.querySelector('.leaflet-container')?.scrollIntoView();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT_DIR}/360x780-tile-offline-fallback.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 8 : my-addresses-skeleton (360x780)
  // -------------------------------------------------------------
  console.log('Capture 8: my-addresses-skeleton');
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    await loginUser(page, 'demo@samaadresse.sn');
    // Bloquer la route mine pour figer l'état squelette
    await page.route('**/api/addresses/mine', async () => {
      // Bloque indéfiniment
    });
    await page.goto('http://127.0.0.1:4173/addresses/mine');
    await page.waitForSelector('.animate-pulse');
    await page.screenshot({ path: `${OUT_DIR}/360x780-my-addresses-skeleton.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 9 : vue propriétaire adresse suspendue (360x780 et 1440x900)
  // -------------------------------------------------------------
  console.log('Capture 9: owner-view-suspended');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('http://127.0.0.1:4173/addresses/mine');
    await page.waitForSelector(`text=${suspendedAddr.code}`);
    await page.evaluate((code) => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent?.includes(code));
      el?.scrollIntoView();
    }, suspendedAddr.code);
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-owner-view-suspended.png` });
    await context.close();
  }

  // -------------------------------------------------------------
  // Capture Scénario 10 : modale de suspension admin avec message d'erreur
  // -------------------------------------------------------------
  console.log('Capture 10: admin-suspend-modal-error');
  for (const [w, h, prefix] of [[360, 780, '360x780'], [1440, 900, '1440x900']]) {
    const filePath = `${OUT_DIR}/${prefix}-admin-suspend-modal-error.png`;
    if (fs.existsSync(filePath)) continue;
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await loginUser(page, 'admin@samaadresse.sn');
    await page.goto('http://127.0.0.1:4173/admin');
    await page.waitForSelector('text=Modération des signalements');
    // Cliquer sur le signalement OPEN visible
    const reportCard = page.locator('button:has-text("Examiner"):visible').first();
    await reportCard.click();
    await page.waitForSelector('text=Détail du signalement');
    // Cliquer directement sur "Suspendre l'adresse" avec le motif vide
    const suspendBtn = page.locator('button:has-text("Suspendre l\'adresse"):visible').first();
    await suspendBtn.click();
    await page.waitForSelector('text=Le motif est obligatoire');
    await page.screenshot({ path: filePath });
    await context.close();
  }

  await browser.close();
  console.log('Toutes les captures ont été enregistrées avec succès !');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
