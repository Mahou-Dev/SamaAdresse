import { test, expect, type Page } from '@playwright/test';

interface MockDirectoryItem {
  code: string;
  zone: string;
  quartier: string;
  locationType: 'MAISON' | 'COMMERCE' | 'INSTITUTION';
  description: string;
  photoUrl?: string;
  createdAt: string;
  ownerName?: string;
  latitude?: number;
  longitude?: number;
}

const DATASET: MockDirectoryItem[] = [
  {
    code: 'ZIG-KBG-4271',
    zone: 'ZIG',
    quartier: 'KBG',
    locationType: 'MAISON',
    description: 'Maison familiale près de la grande mosquée de Boucotte',
    createdAt: '2026-10-15T10:00:00Z',
    ownerName: 'Mamadou Diallo',
    latitude: 12.5783,
    longitude: -16.2719,
  },
  {
    code: 'ZIG-ESC-1042',
    zone: 'ZIG',
    quartier: 'ESC',
    locationType: 'COMMERCE',
    description: 'Boutique alimentation générale Escale Center',
    createdAt: '2026-10-16T10:00:00Z',
    latitude: 12.5835,
    longitude: -16.2712,
  },
  {
    code: 'ZIG-TIL-3015',
    zone: 'ZIG',
    quartier: 'TIL',
    locationType: 'COMMERCE',
    description: 'Atelier couture moderne marché Tilène',
    createdAt: '2026-10-17T10:00:00Z',
    ownerName: 'Fatou Sane',
    latitude: 12.5675,
    longitude: -16.2654,
  },
  {
    code: 'DKR-PLT-2104',
    zone: 'DKR',
    quartier: 'PLT',
    locationType: 'INSTITUTION',
    description: 'Centre administratif annexe Dakar Plateau',
    createdAt: '2026-10-18T10:00:00Z',
    latitude: 14.6708,
    longitude: -17.438,
  },
  {
    code: 'SL-NDR-5510',
    zone: 'SL',
    quartier: 'NDR',
    locationType: 'MAISON',
    description: 'Résidence historique sur Île de Ndar',
    createdAt: '2026-10-19T10:00:00Z',
    // Volontairement sans coordonnées retournées par /api/addresses pour tester unmappedItems
  },
];

// Petit PNG 1x1 gris clair pour mocker proprement les tuiles OSM hors réseau externe
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function installOnlineShim(page: Page) {
  // Dans un conteneur sandbox sans interface réseau externe, Chromium rapporte navigator.onLine=false
  // par défaut même pour 127.0.0.1 ; ce shim permet de simuler fidèlement en ligne / hors ligne.
  await page.addInitScript(() => {
    (window as unknown as { __pwOnline: boolean }).__pwOnline = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => (window as unknown as { __pwOnline: boolean }).__pwOnline,
    });
  });
}

async function installApiMocks(
  page: Page,
  options?: {
    directoryCounter?: { count: number };
    addressCounter?: { count: number };
    pageSizeOverride?: number;
    failTiles?: boolean;
  }
) {
  await installOnlineShim(page);

  await page.route('https://tile.openstreetmap.org/**', async (route) => {
    if (options?.failTiles) {
      await route.fulfill({ status: 503, body: 'Tile error' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });

  await page.route('**/api/public/directory**', async (route) => {
    if (options?.directoryCounter) {
      options.directoryCounter.count += 1;
    }
    const url = new URL(route.request().url());
    const q = normalizeText((url.searchParams.get('q') || '').trim());
    const quartier = (url.searchParams.get('quartier') || '').trim().toUpperCase();
    const type = (url.searchParams.get('type') || '').trim().toUpperCase();
    const pageNum = Number(url.searchParams.get('page') || '0');
    const size = options?.pageSizeOverride ?? Number(url.searchParams.get('size') || '12');

    let filtered = DATASET.slice();
    if (q) {
      filtered = filtered.filter(
        (item) =>
          normalizeText(item.code).includes(q) ||
          normalizeText(item.description).includes(q) ||
          normalizeText(item.quartier).includes(q) ||
          (item.ownerName && normalizeText(item.ownerName).includes(q))
      );
    }
    if (quartier) {
      filtered = filtered.filter((item) => item.quartier.toUpperCase() === quartier);
    }
    if (type) {
      filtered = filtered.filter((item) => item.locationType === type);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const slice = filtered.slice(pageNum * size, pageNum * size + size).map((item) => ({
      code: item.code,
      zone: item.zone,
      quartier: item.quartier,
      locationType: item.locationType,
      description: item.description,
      photoUrl: item.photoUrl,
      createdAt: item.createdAt,
      ownerName: item.ownerName,
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: slice,
        totalElements,
        totalPages,
        number: pageNum,
        size,
      }),
    });
  });

  await page.route('**/api/addresses/*', async (route) => {
    if (options?.addressCounter) {
      options.addressCounter.count += 1;
    }
    const url = new URL(route.request().url());
    const code = decodeURIComponent(url.pathname.split('/').pop() || '');
    const found = DATASET.find((item) => item.code === code);
    if (!found || found.latitude === undefined || found.longitude === undefined) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Adresse introuvable' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: found.code,
        latitude: found.latitude,
        longitude: found.longitude,
        zone: found.zone,
        quartier: found.quartier,
        description: found.description,
        photoUrl: found.photoUrl,
        locationType: found.locationType,
        createdAt: found.createdAt,
      }),
    });
  });
}

test.describe('P02 — Expérience publique & Annuaire SamaAdresse (API déterministe)', () => {
  // Désactive le SW uniquement sur les tests d'API mockée afin que page.route() intercepte
  // /api/addresses/* et les tuiles OSM de manière déterministe
  test.use({ serviceWorkers: 'block' });

  test('1. Accueil : chargement complet, hero visuel, plaque ZIG-KBG-4271, catégories, quartiers et adresses réelles', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await installApiMocks(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Hero et plaque
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Trouvez et partagez chaque adresse'
    );
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();

    // Image hero LCP chargée correctement
    const heroLoaded = await page
      .locator('img[src*="hero-accueil"]')
      .first()
      .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(heroLoaded).toBe(true);

    // Catégories et quartiers réels
    await expect(page.getByRole('link', { name: /Commerces & services/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Boucotte - Kangourou/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Dakar Plateau/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Île de Ndar/i })).toBeVisible();

    // Adresses publiques réelles chargées
    await expect(page.locator('text=ZIG-ESC-1042').first()).toBeVisible();
    await expect(page.locator('text=5 adresses publiques')).toBeVisible();

    // Sections Comment ça marche + CTA final
    await expect(page.getByRole('heading', { name: 'Comment fonctionne SamaAdresse' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Prêt à créer l'adresse de votre logement/i })
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('2. Recherche depuis la page d’accueil redirige vers /annuaire?q=... avec résultats filtrés', async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const heroSearch = page.getByRole('searchbox', {
      name: /Rechercher une adresse dans l'annuaire public/i,
    });
    await heroSearch.fill('mosquee');
    await heroSearch.press('Enter');

    await page.waitForURL(/\/annuaire\?q=mosquee/);
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
    await expect(page.locator('header').locator('text=1 adresse trouvée')).toBeVisible();
    await expect(page.locator('text=ZIG-ESC-1042')).not.toBeVisible();
  });

  test('3. Annuaire : affichage, placeholder non tronqué à 360px, filtres quartier/type, URL synchronisée et réinitialisation', async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/annuaire');

    await expect(page.getByRole('heading', { name: 'Annuaire public' })).toBeVisible();
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();

    // Vérifier placeholder non tronqué à 360px (compatibilité lot6)
    const searchInput = page.locator('#directory-search-input');
    const placeholderFits = await searchInput.evaluate((el: HTMLInputElement) => {
      const style = window.getComputedStyle(el);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const textWidth = ctx.measureText(el.placeholder).width;
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return textWidth <= el.clientWidth - paddingLeft - paddingRight + 2;
    });
    expect(placeholderFits).toBe(true);

    // Filtre mobile via Drawer
    await page.getByRole('button', { name: /Filtres/i }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await page.locator('#mobile-filter-quartier').selectOption('ESC');
    await drawer.getByRole('button', { name: /Voir 1 adresse/i }).click();
    await expect(drawer).not.toBeVisible();
    expect(page.url()).toContain('quartier=ESC');
    await expect(page.locator('text=ZIG-ESC-1042')).toBeVisible();

    // Basculer en desktop et filtrer par type + quartier
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#filter-quartier').selectOption('');
    await page
      .getByRole('group', { name: 'Filtrer par type de lieu' })
      .getByRole('button', { name: 'Commerce' })
      .click();

    await expect(page).toHaveURL(/type=COMMERCE/);
    await expect(page.locator('text=ZIG-ESC-1042')).toBeVisible();
    await expect(page.locator('text=ZIG-TIL-3015')).toBeVisible();
    await expect(page.locator('text=ZIG-KBG-4271')).not.toBeVisible();

    // Réinitialisation complète via le chip Tout effacer
    await page.getByRole('button', { name: 'Tout effacer' }).click();
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();
    expect(page.url()).not.toContain('type=');
    expect(page.url()).not.toContain('quartier=');
  });

  test('4. Bascule Grille ↔ Liste ↔ Carte préserve les filtres sans relancer la recherche API et charge Leaflet à la demande', async ({
    page,
  }) => {
    const directoryCounter = { count: 0 };
    const addressCounter = { count: 0 };
    const loadedScripts: string[] = [];

    page.on('response', (res) => {
      if (res.url().includes('/assets/') && res.url().endsWith('.js')) {
        loadedScripts.push(res.url());
      }
    });

    await installApiMocks(page, { directoryCounter, addressCounter });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/annuaire?type=COMMERCE');

    await expect(page.getByTestId('directory-grid-view')).toBeVisible();
    await expect(page.locator('text=ZIG-ESC-1042')).toBeVisible();

    const initialDirectoryCalls = directoryCounter.count;
    expect(initialDirectoryCalls).toBe(1);
    expect(addressCounter.count).toBe(0);
    // Leaflet ne doit PAS être chargé avant l'ouverture de la vue Carte
    expect(loadedScripts.some((u) => u.includes('leaflet'))).toBe(false);

    // Bascule vers Vue Liste
    await page.getByRole('button', { name: 'Vue liste' }).click();
    await expect(page.getByTestId('directory-list-view')).toBeVisible();
    expect(page.url()).toContain('type=COMMERCE');
    expect(page.url()).toContain('view=list');
    expect(directoryCounter.count).toBe(initialDirectoryCalls);
    expect(addressCounter.count).toBe(0);

    // Bascule vers Vue Carte : hydrate les coordonnées réelles à la demande et charge Leaflet
    await page.getByRole('button', { name: 'Vue carte' }).click();
    await expect(page.getByTestId('directory-map-view')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    expect(page.url()).toContain('type=COMMERCE');
    expect(page.url()).toContain('view=map');
    expect(directoryCounter.count).toBe(initialDirectoryCalls);

    await expect(page.locator('.sa-directory-pin')).toHaveCount(2);
    expect(addressCounter.count).toBe(2);
    expect(loadedScripts.some((u) => u.includes('leaflet'))).toBe(true);
  });

  test('5. Vue Carte : interaction marqueur ↔ carte, adresse non localisée sans coordonnées fictives et erreur de tuiles non bloquante', async ({
    page,
  }) => {
    await installApiMocks(page, { failTiles: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/annuaire?view=map');

    await expect(page.getByTestId('directory-map-view')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();

    // 4 adresses ont des coordonnées réelles, 1 adresse (SL-NDR-5510) répond 404 -> 4 marqueurs exacts
    await expect(page.locator('.sa-directory-pin')).toHaveCount(4);
    await expect(
      page.locator('text=1 adresse de cette page n’a pas pu être positionnée sur la carte')
    ).toBeVisible();

    // Bannière d'erreur de tuiles non bloquante visible
    await expect(
      page.locator("text=Certaines tuiles de carte n'ont pas pu être chargées")
    ).toBeVisible();

    // Clic sur le bouton Localiser de ZIG-ESC-1042 dans la colonne liste (carte -> marqueur)
    const escCard = page.locator('[data-address-code="ZIG-ESC-1042"]');
    await escCard.getByRole('button', { name: 'Localiser' }).click();

    // L'aperçu flottant s'affiche avec les coordonnées réelles et un lien vers la fiche
    const preview = page.getByTestId('map-selected-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('ZIG-ESC-1042');
    await expect(preview).toContainText('12.5835, -16.2712');

    // Clic direct sur un autre marqueur Leaflet désormais bien séparé au zoom quartier (marqueur -> aperçu & sélection)
    await page.locator('.sa-directory-pin:has([aria-label="Adresse ZIG-KBG-4271"])').click();
    await expect(preview).toContainText('ZIG-KBG-4271');
    await expect(preview).toContainText('12.5783, -16.2719');

    // Navigation vers la fiche publique depuis l'aperçu carte
    await preview.getByRole('link', { name: /Voir la fiche/i }).click();
    await page.waitForURL('/a/ZIG-KBG-4271');
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
  });

  test('5b. Navigation vers une fiche publique depuis l’accueil et depuis une carte annuaire', async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    // Depuis l'accueil (carte récente)
    await page.goto('/');
    const homeCard = page.locator('[data-address-code="ZIG-ESC-1042"]').first();
    await expect(homeCard).toBeVisible();
    await homeCard.getByRole('link', { name: /Voir la fiche/i }).click();
    await page.waitForURL('/a/ZIG-ESC-1042');
    await expect(page.locator('text=ZIG-ESC-1042').first()).toBeVisible();

    // Depuis l'annuaire (carte grille)
    await page.goto('/annuaire');
    const dirCard = page.locator('[data-address-code="ZIG-TIL-3015"]').first();
    await expect(dirCard).toBeVisible();
    await dirCard.getByRole('link', { name: /Voir la fiche/i }).click();
    await page.waitForURL('/a/ZIG-TIL-3015');
    await expect(page.locator('text=ZIG-TIL-3015').first()).toBeVisible();
  });

  test('6. Pagination (Afficher plus) cumule proprement les résultats', async ({ page }) => {
    await installApiMocks(page, { pageSizeOverride: 2 });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/annuaire');

    await expect(page.locator('[data-testid="directory-grid-view"] article')).toHaveCount(2);
    const loadMoreBtn = page.getByRole('button', { name: "Afficher plus d'adresses" });
    await expect(loadMoreBtn).toBeVisible();

    await loadMoreBtn.click();
    await expect(page.locator('[data-testid="directory-grid-view"] article')).toHaveCount(4);
  });

  test('7. États d’erreur (403 WAF, 500 + Réessayer, 429 rate-limit) et état vide', async ({
    page,
  }) => {
    await installOnlineShim(page);
    let callNum = 0;
    await page.route('**/api/public/directory**', async (route) => {
      callNum += 1;
      if (callNum === 1) {
        await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      } else if (callNum === 2) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      } else if (callNum === 3) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ retryAfterSeconds: 45 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 12,
          }),
        });
      }
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/annuaire?q=test');

    // 403 WAF
    await expect(
      page.getByRole('alert').getByText(/Votre requête a été bloquée par le pare-feu de sécurité/i)
    ).toBeVisible();

    // Réessayer -> 500 erreur générique
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(
      page.getByRole('alert').getByText('Une erreur est survenue lors de la recherche.')
    ).toBeVisible();

    // Réessayer -> 429 avec compte à rebours
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(
      page.getByRole('alert').getByText('Trop de recherches. Merci de patienter un instant.')
    ).toBeVisible();
    await expect(page.getByRole('alert').getByText('45s')).toBeVisible();

    // Réinitialiser -> état vide
    await page.getByRole('button', { name: 'Tout effacer' }).click();
    await expect(
      page.locator('text=Aucune adresse ne correspond à votre recherche.')
    ).toBeVisible();
  });

  test('9. Accessibilité clavier (skip-link, Drawer mobile Échap + restitution focus, aria-current)', async ({
    page,
  }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/annuaire');

    // Skip-link accessible au premier Tab
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu principal' })).toBeFocused();

    // Ouverture et fermeture par Échap du tiroir filtres mobile + restitution focus
    const filterBtn = page.getByRole('button', { name: /Filtres/i });
    await filterBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(filterBtn).toBeFocused();
  });

  test('10. Responsive : zéro débordement horizontal sur les 7 viewports obligatoires (/ et /annuaire)', async ({
    page,
  }) => {
    await installApiMocks(page);

    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);

      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const homeOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(homeOverflow, `Overflow horizontal sur / à ${vp.width}x${vp.height}`).toBeLessThanOrEqual(1);

      await page.goto('/annuaire');
      await expect(page.getByRole('heading', { name: 'Annuaire public' })).toBeVisible();
      await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
      const dirOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(
        dirOverflow,
        `Overflow horizontal sur /annuaire à ${vp.width}x${vp.height}`
      ).toBeLessThanOrEqual(1);
    }
  });

  test('11. Web Vitals (CLS < 0.1, LCP <= 2500ms) et captures visuelles de contrôle (/ et /annuaire)', async ({
    page,
  }) => {
    await installApiMocks(page);

    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      w.__cls = 0;
      w.__lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value?: number;
          hadRecentInput?: boolean;
        })[]) {
          if (!entry.hadRecentInput && typeof entry.value === 'number') {
            w.__cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          w.__lcp = last.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    // Desktop 1440x900 : Accueil
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('text=ZIG-ESC-1042').first()).toBeVisible();
    await page.waitForTimeout(300);
    const homeMetrics = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      return { cls: Number(w.__cls.toFixed(4)), lcp: Math.round(w.__lcp) };
    });
    expect(homeMetrics.cls).toBeLessThan(0.1);
    expect(homeMetrics.lcp).toBeLessThanOrEqual(2500);
    await page.screenshot({ path: '/tmp/p02-visual/home-desktop-1440.png', fullPage: true });

    // Mobile 390x844 : Accueil
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('text=ZIG-ESC-1042').first()).toBeVisible();
    await page.screenshot({ path: '/tmp/p02-visual/home-mobile-390.png', fullPage: false });

    // Desktop 1440x900 : Annuaire Grille
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/annuaire', { waitUntil: 'networkidle' });
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
    await page.waitForTimeout(300);
    const dirMetrics = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      return { cls: Number(w.__cls.toFixed(4)), lcp: Math.round(w.__lcp) };
    });
    expect(dirMetrics.cls).toBeLessThan(0.1);
    expect(dirMetrics.lcp).toBeLessThanOrEqual(2500);
    await page.screenshot({ path: '/tmp/p02-visual/directory-grid-1440.png', fullPage: false });

    // Desktop 1440x900 : Annuaire Carte
    await page.getByRole('button', { name: 'Vue carte' }).click();
    await expect(page.locator('.sa-directory-pin')).toHaveCount(4);
    await page.locator('[data-address-code="ZIG-KBG-4271"]').getByRole('button', { name: 'Localiser' }).click();
    await expect(page.getByTestId('map-selected-preview')).toBeVisible();
    await page.screenshot({ path: '/tmp/p02-visual/directory-map-1440.png', fullPage: false });

    // Mobile 390x844 : Annuaire Grille
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/annuaire', { waitUntil: 'networkidle' });
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
    await page.screenshot({ path: '/tmp/p02-visual/directory-mobile-390.png', fullPage: false });

    console.log(
      `[P02 Web Vitals] Home CLS=${homeMetrics.cls} LCP=${homeMetrics.lcp}ms | Directory CLS=${dirMetrics.cls} LCP=${dirMetrics.lcp}ms`
    );
  });
});

test.describe('P02 — PWA & Mode hors ligne réel (Service Worker actif)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('8. Mode hors ligne PWA : accueil + navigation /annuaire (Grille et Carte) + fiches en cache', async ({
    context,
    page,
  }) => {
    await installApiMocks(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();

    // Attendre que le Service Worker Workbox soit actif et précache l'application
    await page.evaluate(async () => {
      localStorage.setItem('visited_address_codes', JSON.stringify(['ZIG-KBG-4271']));
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });
    await page.waitForTimeout(500);

    // Coupure réseau réelle
    await context.setOffline(true);
    await page.evaluate(() => {
      (window as unknown as { __pwOnline: boolean }).__pwOnline = false;
      window.dispatchEvent(new Event('offline'));
    });

    // Bannière hors ligne et aperçu accueil hors ligne
    await expect(page.locator('text=Vous êtes hors ligne.')).toBeVisible();
    await expect(page.locator("text=Aperçu de l'annuaire indisponible hors ligne")).toBeVisible();
    await expect(page.getByRole('link', { name: 'ZIG-KBG-4271' })).toBeVisible();

    // Navigation SPA hors ligne vers /annuaire (chunk DirectoryPage servi par Workbox precache)
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Annuaire' })
      .click();
    await expect(page.locator("text=L'annuaire n'est pas disponible hors ligne.")).toBeVisible();
    await expect(page.getByRole('link', { name: 'ZIG-KBG-4271' })).toBeVisible();

    // Bascule en Vue Carte hors ligne -> repli dédié propre sans écran cassé
    await page.getByRole('button', { name: 'Vue carte' }).click();
    await expect(page.getByTestId('directory-map-offline')).toBeVisible();
    await expect(page.locator('text=Carte interactive indisponible hors ligne')).toBeVisible();

    await context.setOffline(false);
    await page.evaluate(() => {
      (window as unknown as { __pwOnline: boolean }).__pwOnline = true;
      window.dispatchEvent(new Event('online'));
    });
  });
});
