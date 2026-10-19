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
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();

    // Attendre que le Service Worker soit actif et contrôle la page avant de passer hors ligne
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });
    await page.waitForTimeout(800);

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
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
    const fontLoadedOffline = await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load("16px Outfit");
      return document.fonts.check("16px Outfit");
    });
    expect(fontLoadedOffline).toBe(true);

    // Captures mobile 360 et desktop 1440
    await page.setViewportSize({ width: 360, height: 780 });
    await page.screenshot({ path: '../docs/audit/lot6/landing_360x780_offline.png' });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: '../docs/audit/lot6/landing_1440x900_offline.png' });

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

    // 1. Recherche avec mot-clé (et vérification placeholder non tronqué à 360 px)
    const searchInput = page.locator('#directory-search-input');
    await page.setViewportSize({ width: 360, height: 780 });
    const placeholderFits = await searchInput.evaluate((el: HTMLInputElement) => {
      const style = window.getComputedStyle(el);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const textWidth = ctx.measureText(el.placeholder).width;
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return textWidth <= (el.clientWidth - paddingLeft - paddingRight + 2);
    });
    expect(placeholderFits).toBe(true);
    await searchInput.fill('mosquee');

    // Vérifier debounce et affichage du résultat
    await page.waitForTimeout(500);
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();
    await expect(page.locator('text=Mamadou Diallo')).toBeVisible();
    await expect(page.locator('article').locator('text=Maison').first()).toBeVisible();

    // Vérifier URL synchronisée
    expect(page.url()).toContain('q=mosquee');

    // Captures annuaire_recherche (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_360x780_recherche.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_1440x900_recherche.png', fullPage: false });

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

    // Captures annuaire_aucun_resultat (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_360x780_aucun_resultat.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_1440x900_aucun_resultat.png', fullPage: false });
  });

  test('1.3 Annuaire public : État hors ligne', async ({ context, page }) => {
    await page.goto('/annuaire');
    await page.waitForSelector('text=Annuaire public');
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });

    await context.setOffline(true);
    await page.reload();

    await expect(page.locator('text=L\'annuaire n\'est pas disponible hors ligne')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_360x780_offline.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/annuaire_1440x900_offline.png', fullPage: false });

    await context.setOffline(false);
  });

  test('1.3 Wizard création : Section repliable Visibilité dans l\'annuaire', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/new');

    // Étape 1 : Coordonnées -> Continuer
    await page.click('button:has-text("Continuer vers les détails")');

    // Étape 2 : Vérifier la section repliable Visibilité
    await expect(page.locator('text=Visibilité dans l\'annuaire')).toBeVisible();

    // Vérifier que le volet est déplié par défaut (ou l'ouvrir s'il était fermé)
    const details = page.locator('details:has(summary:has-text("Visibilité dans l\'annuaire"))');
    const isOpen = await details.evaluate((el: HTMLDetailsElement) => el.open);
    if (!isOpen) {
      await page.locator('summary:has-text("Visibilité dans l\'annuaire")').click();
    }

    // Case 1 présente et décochée par défaut
    const listedCheckbox = page.locator('#directory-listed');
    await expect(listedCheckbox).toBeVisible();
    expect(await listedCheckbox.isChecked()).toBe(false);

    // Case 2 absente tant que case 1 n'est pas cochée
    await expect(page.locator('#directory-show-owner')).not.toBeVisible();

    // Captures wizard_etape2_visibilite avec case décochée par défaut (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/wizard_360x780_etape2_visibilite.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/wizard_1440x900_etape2_visibilite.png', fullPage: false });

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

    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png', fullPage: false });
  });

  test('2.2 Fiche publique : Itinéraire réel ORS (voiture et à pied), JSON assainis et captures réelles', async ({ context, page }) => {
    test.setTimeout(90000);
    const fs = await import('node:fs');
    const path = await import('node:path');

    // Accorder la permission de géolocalisation et définir un point de départ réaliste à Ziguinchor (Escale : 12.5835, -16.2712)
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 12.5835, longitude: -16.2712 });

    await page.goto('/a/ZIG-KBG-4271');
    await page.waitForSelector('text=ZIG-KBG-4271');

    // Bloc itinéraire
    await expect(page.locator('text=Itinéraire vers ce lieu')).toBeVisible();
    await expect(page.locator('button:has-text("Voiture")')).toBeVisible();
    await expect(page.locator('button:has-text("À pied")')).toBeVisible();
    await expect(page.locator('text=Votre position n\'est pas enregistrée')).toBeVisible();
    await expect(page.locator('a:has-text("Ouvrir dans Google Maps")')).toBeVisible();

    // Pré-chauffer les deux profils réels auprès d'OpenRouteService (avec jusqu'à 3 essais en cas de hoquet réseau externe de l'API publique ORS)
    for (const prof of ['driving-car', 'foot-walking']) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await page.request.get(`/api/public/route?fromLat=12.5835&fromLon=-16.2712&code=ZIG-KBG-4271&profile=${prof}`);
        if (r.status() === 200) break;
        await page.waitForTimeout(1500);
      }
    }

    // 1. Calcul réel en voiture (driving-car)
    const [carResp] = await Promise.all([
      page.waitForResponse((res: any) => res.url().includes('/api/public/route') && res.url().includes('profile=driving-car') && res.status() === 200),
      page.locator('button:has-text("Itinéraire depuis ma position")').last().click(),
    ]);
    const carBody = await carResp.json();
    expect(carBody.distance).toBeGreaterThan(0);
    expect(carBody.duration).toBeGreaterThan(0);
    expect(Array.isArray(carBody.steps)).toBe(true);
    expect(carBody.steps.length).toBeGreaterThan(0);

    // Sauvegarder la réponse assainie dans docs/audit/ors-real-car.json (sans coordonnées de l'utilisateur)
    const carSanitized = {
      code: 'ZIG-KBG-4271',
      profile: 'driving-car',
      duration: carBody.duration,
      distance: carBody.distance,
      stepsCount: carBody.steps.length,
    };
    fs.writeFileSync(path.resolve('..', 'docs/audit/ors-real-car.json'), JSON.stringify(carSanitized, null, 2) + '\n', 'utf8');

    // Déplier les étapes pour afficher les noms de rues réels et centrer sur le bloc carte + itinéraire
    const toggleStepsBtn = page.locator('button:has-text("Voir les")');
    if (await toggleStepsBtn.isVisible()) {
      await toggleStepsBtn.click();
    }

    const frameMapAndWaitTiles = async (width: number, height: number) => {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);
      await page.evaluate(() => {
        const mapEl = document.querySelector('.leaflet-container');
        if (mapEl) {
          const rect = mapEl.getBoundingClientRect();
          const targetTop = window.scrollY + rect.top - 72;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' });
        }
      });
      await page.waitForFunction(() => {
        const mapEl = document.querySelector('.leaflet-container');
        if (!mapEl) return false;
        const mRect = mapEl.getBoundingClientRect();
        const tiles = Array.from(mapEl.querySelectorAll('.leaflet-tile')) as HTMLElement[];
        if (tiles.length === 0) return false;
        const visibleTiles = tiles.filter((t) => {
          const r = t.getBoundingClientRect();
          return r.right > mRect.left && r.left < mRect.right && r.bottom > mRect.top && r.top < mRect.bottom;
        });
        return visibleTiles.length > 0 && visibleTiles.every((t) => t.classList.contains('leaflet-tile-loaded'));
      }, { timeout: 15000 });
      await page.waitForTimeout(300);

      const mapBox = await page.locator('.leaflet-container').boundingBox();
      expect(mapBox).not.toBeNull();
      expect(mapBox!.y).toBeGreaterThanOrEqual(56);
      expect(mapBox!.y + mapBox!.height).toBeLessThanOrEqual(height);
      await expect(page.locator('.custom-leaflet-start-marker')).toBeVisible();
      await expect(page.locator('.custom-leaflet-marker')).toBeVisible();
      await expect(page.locator('.leaflet-interactive').first()).toBeVisible();
    };

    await frameMapAndWaitTiles(360, 780);
    await page.screenshot({ path: '../docs/audit/lot6/fiche_360x780_itineraire_voiture.png', fullPage: false });

    await frameMapAndWaitTiles(1440, 900);
    await page.screenshot({ path: '../docs/audit/lot6/fiche_1440x900_itineraire_voiture.png', fullPage: false });

    // 2. Basculer sur À pied (foot-walking)
    const [footResp] = await Promise.all([
      page.waitForResponse((res: any) => res.url().includes('/api/public/route') && res.url().includes('profile=foot-walking') && res.status() === 200),
      page.locator('button:has-text("À pied")').click(),
    ]);
    const footBody = await footResp.json();
    expect(footBody.distance).toBeGreaterThan(0);
    expect(footBody.duration).toBeGreaterThan(0);
    expect(Array.isArray(footBody.steps)).toBe(true);
    expect(footBody.steps.length).toBeGreaterThan(0);

    // Sauvegarder la réponse assainie dans docs/audit/ors-real-foot.json (sans coordonnées de l'utilisateur)
    const footSanitized = {
      code: 'ZIG-KBG-4271',
      profile: 'foot-walking',
      duration: footBody.duration,
      distance: footBody.distance,
      stepsCount: footBody.steps.length,
    };
    fs.writeFileSync(path.resolve('..', 'docs/audit/ors-real-foot.json'), JSON.stringify(footSanitized, null, 2) + '\n', 'utf8');

    await frameMapAndWaitTiles(360, 780);
    await page.screenshot({ path: '../docs/audit/lot6/fiche_360x780_itineraire_pied.png', fullPage: false });

    await frameMapAndWaitTiles(1440, 900);
    await page.screenshot({ path: '../docs/audit/lot6/fiche_1440x900_itineraire_pied.png', fullPage: false });
  });

  test('0.3 Preuves manquantes : Wizard hors ligne avec bouton désactivé', async ({ context, page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Emplacement');

    // Coupure réseau
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // Vérifier que le mode hors ligne est signalé (Lot 7 : wizard débloqué)
    await expect(page.locator('text=Mode hors ligne · les nouvelles adresses seront transmises à votre retour en ligne')).toBeVisible();

    // Capture d'écran fullPage
    await page.setViewportSize({ width: 360, height: 780 });
    await page.screenshot({ path: '../docs/audit/lot6/wizard_360x780_offline_fullpage.png', fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: '../docs/audit/lot6/wizard_1440x900_offline_fullpage.png', fullPage: true });

    await context.setOffline(false);
  });
});
