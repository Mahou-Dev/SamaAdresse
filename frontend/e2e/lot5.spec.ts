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

test.describe('LOT 5 — PWA & Mode Hors Ligne', () => {

  test('Parcours A : Consultation hors ligne d\'une fiche déjà vue (données, photo, bandeau, badge)', async ({ context, page }) => {
    const code = 'ZIG-KBG-8454';
    // 1. Navigation vers /a/{code} en ligne
    await page.goto(`/a/${code}`);
    await page.waitForSelector(`text=${code}`);
    await expect(page.locator(`text=${code}`).first()).toBeVisible();
    await expect(page.locator('text=Chez Amadou')).toBeVisible();

    // Attente brève pour assurer la persistance dans le cache
    await page.waitForTimeout(1000);

    // 2. Coupure réseau
    await context.setOffline(true);

    // 3. Rechargement hors ligne
    await page.reload();

    // 4. Assertions
    // Fiche affichée (code, description)
    await expect(page.locator(`text=${code}`).first()).toBeVisible();
    await expect(page.locator('text=Chez Amadou')).toBeVisible();

    // Bandeau hors ligne présent
    const offlineBanner = page.locator('text=Vous êtes hors ligne');
    await expect(offlineBanner).toBeVisible();

    // Badge de fraîcheur présent
    const freshnessBadge = page.locator('text=hors ligne');
    await expect(freshnessBadge.first()).toBeVisible();

    // Lien d'itinéraire préservé
    const itineraryLink = page.locator('button:has-text("Itinéraire"), a:has-text("Itinéraire")');
    await expect(itineraryLink.first()).toBeVisible();

    // Rétablir la connexion
    await context.setOffline(false);
  });

  test('Parcours B : Consultation hors ligne d\'une fiche JAMAIS vue', async ({ context, page }) => {
    // 1. Visite préalable d'une fiche pour peupler le cache
    await page.goto('/a/ZIG-KBG-8454');
    await page.waitForSelector('text=ZIG-KBG-8454');
    await page.waitForTimeout(500);

    // 2. Coupure réseau
    await context.setOffline(true);

    // 3. Navigation vers une fiche jamais vue
    await page.goto('/a/ZIG-XXX-9999');

    // 4. Assertions
    // État sobre « Cette page n'est pas disponible hors ligne »
    await expect(page.locator('text=Cette page n\'est pas disponible hors ligne')).toBeVisible();

    // Liens vers fiches déjà consultées affichés et fonctionnels
    const cachedLink = page.locator('a:has-text("ZIG-KBG-8454")');
    await expect(cachedLink).toBeVisible();

    // Clic vers la fiche en cache fonctionne
    await cachedLink.click();
    await expect(page.locator('text=Chez Amadou')).toBeVisible();

    await context.setOffline(false);
  });

  test('Parcours C : Révocation du cache après archivage / suspension', async ({ context, page }) => {
    // 1. Obtenir un token pour l'API
    const loginApi = await page.request.post('/api/auth/login', {
      data: { email: 'demo@samaadresse.sn', password: 'Password123!' }
    });
    expect(loginApi.status()).toBe(200);
    const { accessToken } = await loginApi.json();

    // Créer une adresse dédiée pour le test
    const createRes = await page.request.post('/api/addresses', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        latitude: 12.579,
        longitude: -16.273,
        description: 'Adresse test pour révocation de cache Workbox',
        locationType: 'COMMERCE',
      }
    });
    expect(createRes.status()).toBe(201);
    const addr = await createRes.json();
    const testCode = addr.code;
    const testId = addr.id;

    // 2. En ligne : consultation de la fiche pour la mettre en cache
    await page.goto(`/a/${testCode}`);
    await expect(page.locator(`text=${testCode}`).first()).toBeVisible();
    await page.waitForTimeout(1000);

    // 3. Archivage de l'adresse par son propriétaire
    const archiveRes = await page.request.post(`/api/addresses/${testId}/archive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(archiveRes.status()).toBe(200);

    // 4. Consultation de la fiche en ligne : l'API répond 410
    const check410 = await page.request.get(`/api/addresses/${testCode}`);
    expect(check410.status()).toBe(410);

    // Déclencher le fetch côté page pour que le cache Workbox & localStorage purgent
    await page.goto(`/a/${testCode}`);
    await page.waitForTimeout(500);

    // 5. Coupure réseau + rechargement
    await context.setOffline(true);
    await page.reload();

    // 6. Assertion : la fiche n'est plus lisible, affichage de l'état « non disponible hors ligne »
    await expect(page.locator('text=Cette page n\'est pas disponible hors ligne')).toBeVisible();

    // Rétablissement réseau
    await context.setOffline(false);

    // Nettoyage : restaurer
    await page.request.post(`/api/addresses/${testId}/restore`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  });

  test('Parcours D : Création hors ligne bloquée honnêtement', async ({ context, page }) => {
    // 1. Initialiser le PWA shell en ligne et connecter l'utilisateur
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('/');
    await page.waitForSelector('h1');
    await page.waitForTimeout(500);

    // 2. Coupure réseau
    await context.setOffline(true);

    // 3. Navigation vers /addresses/new
    await page.goto('/addresses/new');

    // 4. Assertions
    // Message sobre présent
    await expect(page.locator('text=La création d\'une adresse nécessite une connexion.')).toBeVisible();

    // Bouton de validation désactivé
    const continueBtn = page.locator('button:has-text("Continuer vers les détails")');
    await expect(continueBtn).toBeDisabled();

    await context.setOffline(false);
  });

  test('Parcours E : Données personnelles JAMAIS en cache + Inventaire Cache Storage', async ({ page }) => {
    // 1. Visite de /addresses/mine en connecté
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('/addresses/mine');
    await expect(page.locator('h1:has-text("Mes adresses")')).toBeVisible();

    // Visite de /account
    await page.goto('/account');
    await expect(page.locator('h1:has-text("Espace personnel")')).toBeVisible();

    // Visite de /admin avec compte admin
    await loginUser(page, 'admin@samaadresse.sn');
    await page.goto('/admin');
    await expect(page.locator('h1:has-text("Modération des signalements")')).toBeVisible();

    // 2. Inspection programmatique du Cache Storage
    const cacheInventory = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const result: Record<string, string[]> = {};
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        result[name] = requests.map(r => r.url);
      }
      return result;
    });

    console.log('=== INVENTAIRE CACHE STORAGE ===');
    console.log(JSON.stringify(cacheInventory, null, 2));

    // 3. Assertions : AUCUNE URL contenant /api/auth/, /api/addresses/mine ou /api/admin/
    for (const [cacheName, urls] of Object.entries(cacheInventory)) {
      for (const url of urls) {
        expect(url, `Cache ${cacheName} contient une route interdite auth`).not.toContain('/api/auth/');
        expect(url, `Cache ${cacheName} contient la liste personnelle /api/addresses/mine`).not.toContain('/api/addresses/mine');
        expect(url, `Cache ${cacheName} contient la route admin /api/admin/`).not.toContain('/api/admin/');
      }
    }
  });

  test('Parcours F : Installation PWA & Manifeste', async ({ page }) => {
    // 1. Manifeste
    const manifestRes = await page.request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();

    expect(manifest.name).toBe('SamaAdresse');
    expect(manifest.short_name).toBe('SamaAdresse');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#B84A24');
    expect(manifest.background_color).toBe('#FBF9F5');

    // Icônes
    const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192' && !i.purpose?.includes('maskable'));
    const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512' && !i.purpose?.includes('maskable'));
    const maskableIcon = manifest.icons.find((i: any) => i.purpose?.includes('maskable'));
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(maskableIcon).toBeDefined();

    // Raccourcis
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);
    expect(manifest.shortcuts.some((s: any) => s.name === 'Nouvelle adresse')).toBe(true);
    expect(manifest.shortcuts.some((s: any) => s.name === 'Mes adresses')).toBe(true);

    // 2. Service Worker enregistré
    await page.goto('/');
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    expect(swRegistered).toBe(true);

    // 3. Section « Installer l'application » dans la page Compte
    await loginUser(page, 'demo@samaadresse.sn');
    await page.goto('/account');
    await expect(page.getByText("Installer l'application", { exact: true })).toBeVisible();
  });

});
