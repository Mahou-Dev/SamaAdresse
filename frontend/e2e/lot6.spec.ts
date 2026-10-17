import { test, expect } from '@playwright/test';

async function loginUser(page: any, email: string = 'demo@samaadresse.sn', pass: string = 'Password123!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', pass);
  await Promise.all([
    page.waitForResponse((res: any) => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'));
}

test.describe('LOT 6 — Annuaire & Itinéraire & Correctifs Lot 5', () => {

  test('0.1 Landing hors ligne : Outfit woff2 préchargé et code plaque visible immédiatement', async ({ context, page }) => {
    // 1. Visite en ligne
    await page.goto('/');
    await page.waitForSelector('text=ZIG-KBG-4271');
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();

    // Vérifier chargement de police Outfit
    const fontLoadedOnline = await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load("16px Outfit");
      return document.fonts.check("16px Outfit");
    });
    expect(fontLoadedOnline).toBe(true);

    // 2. Passage hors ligne
    await context.setOffline(true);

    // 3. Rechargement hors ligne
    await page.reload();

    // 4. Assertions
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();
    const fontLoadedOffline = await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load("16px Outfit");
      return document.fonts.check("16px Outfit");
    });
    expect(fontLoadedOffline).toBe(true);

    // Captures mobile 360 et desktop 1440
    await page.setViewportSize({ width: 360, height: 780 });
    await page.screenshot({ path: 'docs/audit/lot6/landing-offline-360.png' });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'docs/audit/lot6/landing-offline-1440.png' });

    await context.setOffline(false);
  });

  test('0.5 Inventaire complet du Cache Storage après consultation', async ({ page }) => {
    await page.goto('/a/ZIG-KBG-4271');
    await page.waitForSelector('text=ZIG-KBG-4271');
    await page.waitForTimeout(1000);

    const cacheReport = await page.evaluate(async () => {
      const keys = await caches.keys();
      const report: { name: string; count: number; sampleKeys: string[] }[] = [];
      for (const k of keys) {
        const cache = await caches.open(k);
        const reqs = await cache.keys();
        report.push({
          name: k,
          count: reqs.length,
          sampleKeys: reqs.slice(0, 3).map((r) => r.url),
        });
      }
      return report;
    });

    console.log('=== INVENTAIRE CACHE STORAGE ===');
    console.log(JSON.stringify(cacheReport, null, 2));
    expect(cacheReport.length).toBeGreaterThan(0);
  });

  test('1.3 Annuaire public : Recherche, filtres, URL synchronisée et cartes', async ({ page }) => {
    await page.goto('/annuaire');
    await page.waitForSelector('text=Annuaire public');

    // 1. Recherche avec mot-clé
    const searchInput = page.locator('#directory-search-input');
    await searchInput.fill('mosquee');

    // Vérifier debounce et affichage du résultat
    await page.waitForTimeout(500);
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();
    await expect(page.locator('text=Mamadou Diallo')).toBeVisible();

    // Vérifier URL synchronisée
    expect(page.url()).toContain('q=mosquee');

    // 2. Recherche par filtre
    await searchInput.fill('');
    await page.waitForTimeout(400);
    await page.locator('#filter-quartier').selectOption('ESC');
    await page.waitForTimeout(500);
    await expect(page.locator('text=ZIG-ESC-1042')).toBeVisible();
    expect(page.url()).toContain('quartier=ESC');

    // Vérifier que le propriétaire est masqué si non autorisé
    await expect(page.locator('text=Mamadou Diallo')).not.toBeVisible();

    // 3. Recherche sans résultat
    await page.locator('#filter-quartier').selectOption('');
    await searchInput.fill('motinconnuintrouvable');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Aucune adresse ne correspond à votre recherche')).toBeVisible();
  });

  test('1.3 Annuaire public : État hors ligne', async ({ context, page }) => {
    await page.goto('/annuaire');
    await page.waitForSelector('text=Annuaire public');

    await context.setOffline(true);
    await page.reload();

    await expect(page.locator('text=L\'annuaire n\'est pas disponible hors ligne')).toBeVisible();
    await context.setOffline(false);
  });

  test('1.3 Wizard création : Section repliable Visibilité dans l\'annuaire', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/new');

    // Étape 1 : Coordonnées -> Continuer
    await page.click('button:has-text("Continuer vers les détails")');

    // Étape 2 : Vérifier la section repliable Visibilité
    await expect(page.locator('text=Visibilité dans l\'annuaire')).toBeVisible();

    // Ouvrir le details
    await page.locator('summary:has-text("Visibilité dans l\'annuaire")').click();

    // Case 1 présente et décochée par défaut
    const listedCheckbox = page.locator('#directory-listed');
    await expect(listedCheckbox).toBeVisible();
    expect(await listedCheckbox.isChecked()).toBe(false);

    // Case 2 absente tant que case 1 n'est pas cochée
    await expect(page.locator('#directory-show-owner')).not.toBeVisible();

    // Cocher case 1
    await listedCheckbox.check();

    // Case 2 apparaît
    const showOwnerCheckbox = page.locator('#directory-show-owner');
    await expect(showOwnerCheckbox).toBeVisible();
    expect(await showOwnerCheckbox.isChecked()).toBe(false);
  });

  test('1.3 Mes adresses : Pill « Dans l\'annuaire » visible pour adresses listées', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/mine');
    await page.waitForSelector('text=ZIG-KBG-4271');

    // ZIG-KBG-4271 est listée dans les données de test, son badge doit être visible
    const card = page.locator('div:has-text("ZIG-KBG-4271")').first();
    await expect(card.locator('text=Dans l\'annuaire')).toBeVisible();
  });

  test('2.2 Fiche publique : Bloc itinéraire, bascule Voiture/À pied, mention confidentialité', async ({ page }) => {
    await page.goto('/a/ZIG-KBG-4271');
    await page.waitForSelector('text=ZIG-KBG-4271');

    // Bloc itinéraire
    await expect(page.locator('text=Itinéraire vers ce lieu')).toBeVisible();
    await expect(page.locator('button:has-text("Voiture")')).toBeVisible();
    await expect(page.locator('button:has-text("À pied")')).toBeVisible();
    await expect(page.locator('text=Votre position n\'est pas enregistrée')).toBeVisible();
    await expect(page.locator('a:has-text("Ouvrir dans Google Maps")')).toBeVisible();
  });

  test('0.3 Preuves manquantes : Wizard hors ligne avec bouton désactivé', async ({ context, page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Emplacement');

    // Coupure réseau
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // Vérifier que le bouton Continuer est désactivé
    const continueBtn = page.locator('button:has-text("Continuer vers les détails")');
    await expect(continueBtn).toBeDisabled();

    // Capture d'écran fullPage
    await page.setViewportSize({ width: 360, height: 780 });
    await page.screenshot({ path: 'docs/audit/lot6/wizard-offline-full-360.png', fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'docs/audit/lot6/wizard-offline-full-1440.png', fullPage: true });

    await context.setOffline(false);
  });
});
