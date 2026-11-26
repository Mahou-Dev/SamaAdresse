import { test, expect, type Page } from '@playwright/test';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const MOCK_USER = {
  id: 'u-demo-1',
  fullName: 'Mamadou Diallo',
  email: 'demo@samaadresse.sn',
  phoneNumber: '+221771234567',
  role: 'PROPRIETAIRE',
  enabled: true,
  createdAt: '2026-01-01T00:00:00Z',
};

const SAMPLE_ADDRESS = {
  id: 'addr-1001',
  code: 'ZIG-KBG-4271',
  latitude: 12.578333,
  longitude: -16.271944,
  zone: 'ZIG',
  quartier: 'KBG',
  description: 'Maison familiale au portail vert face à la grande mosquée de Boucotte',
  photoUrl: '/uploads/facade-demo.png',
  locationType: 'MAISON' as const,
  status: 'ACTIVE' as const,
  listed: true,
  showOwnerName: false,
  createdAt: '2026-10-15T10:00:00Z',
  owner: MOCK_USER,
};

async function installOnlineShim(page: Page, initialOnline = true) {
  await page.addInitScript((online) => {
    (window as unknown as { __pwOnline: boolean }).__pwOnline = online;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => (window as unknown as { __pwOnline: boolean }).__pwOnline,
    });
  }, initialOnline);
}

async function installAuthSession(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('sa_session', '1');
    localStorage.setItem(
      'sa_offline_user',
      JSON.stringify({ userId: user.id, displayName: user.fullName, role: user.role })
    );
  }, MOCK_USER);

  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-jwt-token',
        user: MOCK_USER,
      }),
    });
  });

  await page.route('**/api/address-codes/reservations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function installCommonStaticMocks(page: Page, options?: { failTiles?: boolean }) {
  await page.route('https://tile.openstreetmap.org/**', async (route) => {
    if (options?.failTiles) {
      await route.fulfill({ status: 503, body: 'Tile error' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });

  await page.route('**/uploads/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });

  await page.route('**/api/addresses/*/qrcode', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });
}

test.describe('P03 — Fiche publique, Carte, Itinéraire, Partage, Signalement, Création & Modification', () => {
  test.use({ serviceWorkers: 'block' });

  test('1. Fiche publique : adresse existante, photo, 404, 410 Gone, 500 + Réessayer, et absence de QR dans le flux fermé', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installCommonStaticMocks(page);

    let failOnce = true;
    await page.route('**/api/addresses/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/qrcode')) return route.fallback();
      const code = url.pathname.split('/').pop() || '';
      if (code === 'ZIG-KBG-4271') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: SAMPLE_ADDRESS.code,
            latitude: SAMPLE_ADDRESS.latitude,
            longitude: SAMPLE_ADDRESS.longitude,
            zone: SAMPLE_ADDRESS.zone,
            quartier: SAMPLE_ADDRESS.quartier,
            description: SAMPLE_ADDRESS.description,
            photoUrl: SAMPLE_ADDRESS.photoUrl,
            locationType: SAMPLE_ADDRESS.locationType,
            createdAt: SAMPLE_ADDRESS.createdAt,
          }),
        });
      } else if (code === 'ZIG-NOPHOTO-0001') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'ZIG-NOPHOTO-0001',
            latitude: 12.578,
            longitude: -16.271,
            zone: 'ZIG',
            quartier: 'KBG',
            description: 'Lieu sans photo de façade',
            locationType: 'COMMERCE',
            createdAt: '2026-10-15T10:00:00Z',
          }),
        });
      } else if (code === 'ZIG-GONE-4100') {
        await route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Adresse archivée' }),
        });
      } else if (code === 'ZIG-RETRY-5000') {
        if (failOnce) {
          failOnce = false;
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Erreur interne temporaire' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'ZIG-RETRY-5000',
              latitude: 12.578,
              longitude: -16.271,
              zone: 'ZIG',
              quartier: 'KBG',
              description: 'Adresse récupérée après retry',
              locationType: 'INSTITUTION',
              createdAt: '2026-10-15T10:00:00Z',
            }),
          });
        }
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Adresse introuvable' }),
        });
      }
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    // 1a. Adresse existante avec photo
    await page.goto('/a/ZIG-KBG-4271');
    await expect(page.getByTestId('address-plate')).toBeVisible();
    await expect(page.locator('text=ZIG-KBG-4271').first()).toBeVisible();
    await expect(page.locator('text=Maison familiale au portail vert')).toBeVisible();
    await expect(page.locator('img[alt="Photo de façade ZIG-KBG-4271"]')).toBeVisible();
    // Aucune information privée du propriétaire (email/téléphone) exposée
    await expect(page.locator('body')).not.toContainText('demo@samaadresse.sn');
    await expect(page.locator('body')).not.toContainText('+221771234567');
    // Compatibilité lot12b-offline : pas de QR code dans le flux fermé initial
    await expect(page.locator('img[alt*="QR"], img[alt*="qr-code"]')).toHaveCount(0);

    // 1b. Adresse sans photo -> état vide honnête
    await page.goto('/a/ZIG-NOPHOTO-0001');
    await expect(page.locator('text=Pas de photo pour ce lieu')).toBeVisible();

    // 1c. Adresse 410 Gone -> aucune plaque ni donnée
    await page.goto('/a/ZIG-GONE-4100');
    await expect(page.locator("text=Cette adresse n'est plus disponible.")).toBeVisible();
    await expect(page.getByTestId('address-plate')).toHaveCount(0);

    // 1d. Adresse inexistante 404
    await page.goto('/a/ZIG-INCONNU-9999');
    await expect(page.locator('text=Adresse introuvable').first()).toBeVisible();

    // 1e. Erreur 500 -> bouton Réessayer rétablit la fiche
    await page.goto('/a/ZIG-RETRY-5000');
    await expect(page.locator('text=Erreur interne temporaire')).toBeVisible();
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('text=Adresse récupérée après retry')).toBeVisible();
  });

  test('2. Carte & Itinéraire ORS : tuiles en erreur, coordonnées absentes, calcul Voiture/À pied et erreurs GPS/API', async ({
    context,
    page,
  }) => {
    await installOnlineShim(page);
    await installCommonStaticMocks(page, { failTiles: true });

    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 12.5835, longitude: -16.2712 });

    let routeModeCalls: string[] = [];
    let forceRouteErrorStatus: number | null = null;

    await page.route('**/api/addresses/*', async (route) => {
      const code = new URL(route.request().url()).pathname.split('/').pop() || '';
      if (code === 'ZIG-NOCOORD-0001') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'ZIG-NOCOORD-0001',
            latitude: null,
            longitude: null,
            zone: 'ZIG',
            quartier: 'KBG',
            description: 'Adresse sans coordonnées valides',
            locationType: 'MAISON',
            createdAt: '2026-10-15T10:00:00Z',
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: SAMPLE_ADDRESS.code,
          latitude: SAMPLE_ADDRESS.latitude,
          longitude: SAMPLE_ADDRESS.longitude,
          zone: SAMPLE_ADDRESS.zone,
          quartier: SAMPLE_ADDRESS.quartier,
          description: SAMPLE_ADDRESS.description,
          locationType: SAMPLE_ADDRESS.locationType,
          createdAt: SAMPLE_ADDRESS.createdAt,
        }),
      });
    });

    await page.route('**/api/public/route**', async (route) => {
      const url = new URL(route.request().url());
      const profile = url.searchParams.get('profile') || 'driving-car';
      routeModeCalls.push(profile);
      if (forceRouteErrorStatus) {
        await route.fulfill({
          status: forceRouteErrorStatus,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erreur itinéraire' }),
        });
        return;
      }
      const isFoot = profile === 'foot-walking';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          distance: isFoot ? 850 : 1200,
          duration: isFoot ? 660 : 240,
          profile,
          geometry: {
            type: 'LineString',
            coordinates: [
              [-16.2712, 12.5835],
              [-16.2715, 12.581],
              [-16.271944, 12.578333],
            ],
          },
          steps: [
            { instruction: 'Continuer sur Avenue Émile Badiane', distance: 600, duration: 120, name: 'Av. Badiane' },
            { instruction: 'Tourner à gauche vers Boucotte', distance: 600, duration: 120, name: 'Rue Boucotte' },
          ],
        }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    // 2a. Coordonnées absentes -> aucun marqueur fabriqué
    await page.goto('/a/ZIG-NOCOORD-0001');
    await expect(page.getByTestId('map-missing-coords')).toBeVisible();
    await expect(page.locator('.custom-leaflet-marker')).toHaveCount(0);

    // 2b. Coordonnées valides + erreur tuiles non bloquante + calcul Voiture & À pied
    await page.goto('/a/ZIG-KBG-4271');
    await expect(page.locator('.custom-leaflet-marker')).toBeVisible();
    await expect(
      page.locator("text=Certaines tuiles de carte n'ont pas pu être chargées")
    ).toBeVisible();

    await page.locator('button:has-text("Itinéraire depuis ma position")').last().click();
    await expect(page.getByTestId('ors-route-summary')).toContainText('4 min');
    await expect(page.getByTestId('ors-route-summary')).toContainText('(1,2 km)');

    // Déplier les étapes
    await page.locator('button:has-text("Voir les 2 étapes")').click();
    await expect(page.locator('text=Continuer sur Avenue Émile Badiane')).toBeVisible();

    // Basculer en mode À pied -> recalcul automatique
    await page.locator('button:has-text("À pied")').click();
    await expect(page.getByTestId('ors-route-summary')).toContainText('11 min');
    await expect(page.getByTestId('ors-route-summary')).toContainText('(850 m)');
    expect(routeModeCalls).toEqual(['driving-car', 'foot-walking']);

    // Erreur ORS 503 après bascule
    forceRouteErrorStatus = 503;
    await page.locator('button:has-text("Voiture")').click();
    await expect(page.locator("text=Service d'itinéraire momentanément indisponible.")).toBeVisible();
  });

  test('3. Partage (lien, QR Code, SMS connecté) et Signalement (validation, 429, anti-double soumission, succès)', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page);
    await installCommonStaticMocks(page);

    let smsCalls = 0;
    let reportCalls = 0;
    let firstReport429 = true;

    await page.route('**/api/addresses/ZIG-KBG-4271', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_ADDRESS),
      });
    });

    await page.route('**/api/addresses/ZIG-KBG-4271/share/sms', async (route) => {
      smsCalls += 1;
      await new Promise((r) => setTimeout(r, 150));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'SENT', maskedPhone: '+221 77 *** ** 67' }),
      });
    });

    await page.route('**/api/public/addresses/ZIG-KBG-4271/reports', async (route) => {
      reportCalls += 1;
      await new Promise((r) => setTimeout(r, 180));
      if (firstReport429) {
        firstReport429 = false;
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Rate limited' }),
        });
        return;
      }
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'OPEN', message: 'Signalement pris en compte.' }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/a/ZIG-KBG-4271');

    // 3a. Partage : ouvrir panneau -> QR Code chargé, WhatsApp présent, SMS connecté validé
    await page.getByRole('button', { name: 'Partager' }).click();
    await expect(page.locator('#public-share-panel')).toBeVisible();
    await expect(page.locator('img[alt="QR code de l\'adresse ZIG-KBG-4271"]')).toBeVisible();
    await expect(page.locator('#share-whatsapp-btn')).toHaveAttribute('href', /wa\.me/);

    await page.locator('#share-sms-toggle-btn').click();
    await page.fill('#sms-phone-input', '+221338210000');
    await page.locator('#sms-share-panel button[type="submit"]').click();
    await expect(page.locator('#sms-phone-error')).toContainText('33 fixe');

    await page.fill('#sms-phone-input', '+221771234567');
    await page.locator('#sms-share-panel button[type="submit"]').click();
    await expect(page.locator('text=SMS envoyé !')).toBeVisible();
    await expect(page.locator('text=+221 77 *** ** 67')).toBeVisible();
    expect(smsCalls).toBe(1);

    // 3b. Signalement : erreur 429 puis double clic rapide -> 1 seul envoi -> succès
    const reportTrigger = page.getByRole('button', { name: 'Signaler un problème' });
    await reportTrigger.click();
    await expect(page.locator('#report-modal-title')).toBeVisible();

    await page.locator('input[value="CONTENU_INAPPROPRIE"]').check();
    await page.fill('#report-comment', 'Information erronée sur le bâtiment.');
    await page.locator('button[type="submit"]:has-text("Envoyer le signalement")').click();
    await expect(page.locator('text=Trop de signalements, réessayez plus tard.')).toBeVisible();
    expect(reportCalls).toBe(1);

    // Double-clic simultané pour vérifier la protection anti-double soumission
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>(
        'button[type="submit"][form="public-report-form"]'
      );
      btn?.click();
      btn?.click();
    });
    await expect(page.locator('text=Merci, votre signalement a été transmis.')).toBeVisible();
    expect(reportCalls).toBe(2);

    // Fermeture Échap restitue le focus au déclencheur
    await page.keyboard.press('Escape');
    await expect(page.locator('#report-modal-title')).not.toBeVisible();
    await expect(reportTrigger).toBeFocused();
  });

  test('4. Création 4 étapes en ligne : GPS autorisé/refusé, hors zone, conservation saisies, photo invalide/valide, plaque', async ({
    context,
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page);
    await installCommonStaticMocks(page);

    let createPayloadDescription = '';
    await page.route('**/api/addresses', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = route.request().postData() || '';
      createPayloadDescription = body;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...SAMPLE_ADDRESS,
          id: 'created-online-1',
          code: 'ZIG-KBG-7742',
          description: 'Atelier menuiserie moderne face à la pharmacie',
          locationType: 'COMMERCE',
          listed: true,
          showOwnerName: true,
        }),
      });
    });

    await context.clearPermissions();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/addresses/new');

    await expect(page.locator('text=Nouvelle adresse').first()).toBeVisible();
    await expect(page.locator('text=Étape 1 sur 4').first()).toBeVisible();

    // Capture GPS refusée -> message explicite + possibilité de placement manuel
    await page.getByRole('button', { name: 'Capturer ma position GPS' }).click();
    await expect(
      page.locator('text=Autorisation refusée. Vous pouvez positionner le repère sur la carte.')
    ).toBeVisible();

    // Capture GPS autorisé
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 12.575, longitude: -16.27, accuracy: 18 });
    await page.getByRole('button', { name: 'Capturer ma position GPS' }).click();
    await expect(page.locator('text=Précision : ± 18 m')).toBeVisible();
    await expect(page.getByTestId('detected-quartier-badge')).toContainText('Boucotte');

    // Rejet hors zone
    await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
    await page.fill('#manual-lat', '13.7700');
    await page.fill('#manual-lng', '-13.6700');
    await expect(page.getByTestId('outside-zone-hint')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer vers les détails' }).click();
    await expect(page.locator('[role="alert"]')).toContainText('hors des zones couvertes');

    // Retour dans la zone couverte -> Étape 2
    await page.fill('#manual-lat', '12.5750');
    await page.fill('#manual-lng', '-16.2700');
    await page.getByRole('button', { name: 'Continuer vers les détails' }).click();
    await expect(page.locator('text=Étape 2 sur 4').first()).toBeVisible();

    // Sélection Commerce + description + visibilité conditionnelle
    await page.getByRole('radio', { name: 'Commerce' }).click();
    await page.fill('#address-desc', 'Atelier menuiserie moderne face à la pharmacie');
    await expect(page.locator('#directory-show-owner')).toHaveCount(0);
    await page.locator('#directory-listed').check();
    await expect(page.locator('#directory-show-owner')).toBeVisible();
    await page.locator('#directory-show-owner').check();

    // Retour à l'étape 1 puis retour étape 2 : conservation des saisies
    await page.getByRole('button', { name: "Retour à l'emplacement" }).click();
    await expect(page.locator('#step1-title')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer vers les détails' }).click();
    await expect(page.locator('#address-desc')).toHaveValue(
      'Atelier menuiserie moderne face à la pharmacie'
    );

    // Étape 3 : fichier PDF rejeté puis PNG valide compressé
    await page.getByRole('button', { name: 'Continuer vers la photo' }).click();
    await expect(page.locator('text=Étape 3 sur 4').first()).toBeVisible();

    await page.locator('#camera-input').setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    });
    await expect(page.locator('text=Format non supporté')).toBeVisible();

    await page.locator('#camera-input').setInputFiles({
      name: 'facade.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.locator('img[alt="Aperçu de la façade"]')).toBeVisible();
    await expect(page.locator('text=Poids optimisé :')).toBeVisible();

    // Soumission finale en ligne -> Étape 4
    await page.getByRole('button', { name: "Valider et créer l'adresse" }).click();
    await expect(page.locator('text=Adresse créée et enregistrée')).toBeVisible();
    await expect(page.getByTestId('address-plate')).toContainText('ZIG-KBG-7742');
    await expect(page.locator('img[alt="QR code pour l\'adresse ZIG-KBG-7742"]')).toBeVisible();
    expect(createPayloadDescription).toContain('Atelier menuiserie moderne');
  });

  test('5. Création hors ligne (IndexedDB + code réservé + code temporaire ????) et synchronisation après reconnexion', async ({
    page,
  }) => {
    await installOnlineShim(page, true);
    await installAuthSession(page);
    await installCommonStaticMocks(page);

    let syncedCalls = 0;
    await page.route('**/api/addresses', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      syncedCalls += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...SAMPLE_ADDRESS,
          id: 'synced-srv-1',
          code: 'ZIG-KBG-9001',
          description: 'Concession capturée hors ligne',
        }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/addresses/new');
    await expect(page.locator('#step1-title')).toBeVisible();

    // Préparer IndexedDB avec 1 code réservé KBG puis passer hors ligne
    await page.evaluate(async () => {
      const db = (window as unknown as {
        __offlineDb: {
          clearDrafts: () => Promise<void>;
          clearReservedCodes: () => Promise<void>;
          saveReservedCodes: (items: unknown[]) => Promise<void>;
        };
      }).__offlineDb;
      await db.clearDrafts();
      await db.clearReservedCodes();
      await db.saveReservedCodes([
        {
          code: 'ZIG-KBG-9001',
          zone: 'ZIG',
          quartier: 'KBG',
          expiresAt: '2099-12-31T23:59:59.000Z',
          status: 'RESERVED',
        },
      ]);
      (window as unknown as { __pwOnline: boolean }).__pwOnline = false;
      window.dispatchEvent(new Event('offline'));
    });

    await expect(
      page.locator('text=Mode hors ligne · cette adresse sera enregistrée sur votre appareil')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Continuer vers les détails' }).click();
    await page.fill('#address-desc', 'Concession capturée hors ligne');
    await page.getByRole('button', { name: 'Continuer vers la photo' }).click();
    await page.getByRole('button', { name: 'Passer cette étape' }).click();

    // Vérifier distinction stricte locale vs serveur (1 seule mention attendue)
    await expect(
      page.locator("text=Enregistrée sur cet appareil · en attente d'envoi")
    ).toHaveCount(1);
    await expect(page.getByTestId('address-plate')).toContainText('ZIG-KBG-9001');
    await expect(page.locator('img[alt*="QR"]')).toHaveCount(0);

    const draftCountBefore = await page.evaluate(async () => {
      return await (window as unknown as { __offlineDb: { getDraftsCount: () => Promise<number> } })
        .__offlineDb.getDraftsCount();
    });
    expect(draftCountBefore).toBe(1);

    // Reconnexion -> le listener automatique 'online' de syncManager synchronise en direct
    await page.evaluate(() => {
      (window as unknown as { __pwOnline: boolean }).__pwOnline = true;
      window.dispatchEvent(new Event('online'));
    });

    await expect(page.locator('text=Adresse créée et enregistrée')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: 'Voir la fiche publique' })).toBeVisible();
    expect(syncedCalls).toBe(1);

    const draftCountAfter = await page.evaluate(async () => {
      return await (window as unknown as { __offlineDb: { getDraftsCount: () => Promise<number> } })
        .__offlineDb.getDraftsCount();
    });
    expect(draftCountAfter).toBe(0);

    // 5b. Création hors ligne SANS code réservé -> code temporaire ZIG-KBG-????
    await page.getByRole('button', { name: 'Créer une autre adresse' }).click();
    await expect(page.locator('#step1-title')).toBeVisible();

    await page.evaluate(async () => {
      const db = (window as unknown as {
        __offlineDb: { clearReservedCodes: () => Promise<void> };
      }).__offlineDb;
      await db.clearReservedCodes();
      (window as unknown as { __pwOnline: boolean }).__pwOnline = false;
      window.dispatchEvent(new Event('offline'));
    });

    await page.getByRole('button', { name: 'Continuer vers les détails' }).click();
    await page.fill('#address-desc', 'Adresse créée sans réserve hors ligne');
    await page.getByRole('button', { name: 'Continuer vers la photo' }).click();
    await page.getByRole('button', { name: 'Passer cette étape' }).click();

    await expect(page.getByTestId('address-plate')).toContainText('ZIG-KBG-????');
    await expect(page.locator('text=Code temporaire attribué hors ligne.')).toBeVisible();
    await expect(page.locator('img[alt*="QR"]')).toHaveCount(0);
  });

  test('6. Modification d’adresse : préremplissage, protection pertes saisies, conservation photo, suppression photo, erreurs', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page);
    await installCommonStaticMocks(page);

    let patchCalls = 0;
    let photoDeleteCalls = 0;
    let photoUploadCalls = 0;
    let failFirstPatch = true;

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          SAMPLE_ADDRESS,
          {
            ...SAMPLE_ADDRESS,
            id: 'addr-archived-2',
            code: 'ZIG-KBG-9998',
            status: 'ARCHIVED',
            description: 'Ancienne boutique archivée',
          },
        ]),
      });
    });

    await page.route('**/api/addresses/addr-1001', async (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      patchCalls += 1;
      if (failFirstPatch) {
        failFirstPatch = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erreur serveur temporaire' }),
        });
        return;
      }
      const body = route.request().postDataJSON() as {
        description: string;
        locationType: string;
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...SAMPLE_ADDRESS,
          description: body.description,
          locationType: body.locationType,
        }),
      });
    });

    await page.route('**/api/addresses/addr-1001/photo', async (route) => {
      if (route.request().method() === 'DELETE') {
        photoDeleteCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...SAMPLE_ADDRESS, photoUrl: null }),
        });
        return;
      }
      photoUploadCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SAMPLE_ADDRESS, photoUrl: '/uploads/updated.png' }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/addresses/addr-1001/edit');

    // Préremplissage exact & plaque immuable
    await expect(page.getByTestId('address-plate')).toContainText('ZIG-KBG-4271');
    await expect(page.locator('#edit-description')).toHaveValue(SAMPLE_ADDRESS.description);
    await expect(page.locator('text=Le code et la position ne peuvent pas changer.')).toBeVisible();

    // Modification -> badge non enregistré -> Annuler ouvre la modale de garde-fou
    await page.fill('#edit-description', 'Maison rénovée portail bleu ciel');
    await expect(page.locator('text=Modifications non enregistrées')).toBeVisible();
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.locator('text=Quitter sans enregistrer ?')).toBeVisible();
    await page.getByRole('button', { name: "Continuer l'édition" }).click();
    await expect(page.locator('#edit-description')).toHaveValue('Maison rénovée portail bleu ciel');

    // Erreur serveur 500 conserve la saisie
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await expect(page.locator('text=Erreur serveur temporaire')).toBeVisible();
    await expect(page.locator('#edit-description')).toHaveValue('Maison rénovée portail bleu ciel');
    expect(photoDeleteCalls).toBe(0);
    expect(photoUploadCalls).toBe(0);

    // Suppression de photo protégée par ConfirmDialog
    await page.getByRole('button', { name: 'Supprimer la photo' }).click();
    await expect(page.locator('text=Supprimer la photo de façade ?')).toBeVisible();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Supprimer la photo' })
      .click();
    await expect(page.locator('text=Aucune photo associée à cette adresse.')).toBeVisible();
    expect(photoDeleteCalls).toBe(1);

    // Enregistrement réussi -> redirection /addresses/mine
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
    await page.waitForURL('/addresses/mine');
    expect(patchCalls).toBe(2);

    // 6b. Adresse archivée -> mode lecture seule explicite et soumission désactivée
    await page.goto('/addresses/addr-archived-2/edit');
    await expect(page.locator("text=Cette adresse n'est pas active (archivée).")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enregistrer les modifications' })).toBeDisabled();
  });

  test('7. Responsive 7 viewports (320 à 1440px), Web Vitals CLS/LCP et captures visuelles', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await installOnlineShim(page);
    await installAuthSession(page);
    await installCommonStaticMocks(page);

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          SAMPLE_ADDRESS,
          {
            ...SAMPLE_ADDRESS,
            id: 'addr-archived-2',
            code: 'ZIG-KBG-9998',
            status: 'ARCHIVED',
            description: 'Ancienne boutique archivée',
          },
        ]),
      });
    });

    await page.route('**/api/addresses/ZIG-KBG-4271', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_ADDRESS),
      });
    });

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
        if (last) w.__lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ];

    const routesToCheck = [
      { path: '/a/ZIG-KBG-4271', marker: '[data-testid="address-plate"]' },
      { path: '/addresses/new', marker: '#step1-title' },
      { path: '/addresses/addr-1001/edit', marker: '#edit-description' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const r of routesToCheck) {
        await page.goto(r.path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator(r.marker).first()).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `Overflow horizontal sur ${r.path} à ${vp.width}x${vp.height}`).toBeLessThanOrEqual(1);
      }
    }

    // Mesure Web Vitals et captures visuelles desktop 1440 & mobile 390
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/a/ZIG-KBG-4271', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.custom-leaflet-marker')).toBeVisible();
    await page.waitForTimeout(300);
    const publicMetrics = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      return { cls: Number(w.__cls.toFixed(4)), lcp: Math.round(w.__lcp) };
    });
    expect(publicMetrics.cls).toBeLessThan(0.1);
    expect(publicMetrics.lcp).toBeLessThanOrEqual(2500);
    await page.screenshot({ path: '/tmp/p03-visual/public-address-1440.png', fullPage: true });

    await page.goto('/addresses/new', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#step1-title')).toBeVisible();
    await expect(page.locator('.custom-leaflet-marker')).toBeVisible();
    await page.screenshot({ path: '/tmp/p03-visual/new-address-step1-1440.png', fullPage: false });

    await page.goto('/addresses/addr-1001/edit', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#edit-description')).toBeVisible();
    await page.screenshot({ path: '/tmp/p03-visual/edit-address-1440.png', fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/a/ZIG-KBG-4271', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('address-plate')).toBeVisible();
    await page.screenshot({ path: '/tmp/p03-visual/public-address-mobile-390.png', fullPage: false });

    console.log(
      `[P03 Web Vitals] PublicAddress CLS=${publicMetrics.cls} LCP=${publicMetrics.lcp}ms`
    );
  });
});

test.describe('P03 — Mode hors ligne PWA réel sur /a/:code', () => {
  test.use({ serviceWorkers: 'allow' });

  test('8. Fiche publique en cache hors ligne + fiche jamais visitée hors ligne', async ({
    context,
    page,
  }) => {
    await installOnlineShim(page, true);
    await installCommonStaticMocks(page);

    await page.route('**/api/addresses/ZIG-KBG-4271', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: SAMPLE_ADDRESS.code,
          latitude: SAMPLE_ADDRESS.latitude,
          longitude: SAMPLE_ADDRESS.longitude,
          zone: SAMPLE_ADDRESS.zone,
          quartier: SAMPLE_ADDRESS.quartier,
          description: SAMPLE_ADDRESS.description,
          locationType: SAMPLE_ADDRESS.locationType,
          createdAt: SAMPLE_ADDRESS.createdAt,
        }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Attendre que Workbox SW soit actif et ensemencer le cache local de la fiche consultée
    await page.evaluate(async (addr) => {
      localStorage.setItem('cached_date_ZIG-KBG-4271', '26/11/2026');
      localStorage.setItem('cached_addr_ZIG-KBG-4271', JSON.stringify(addr));
      localStorage.setItem('visited_address_codes', JSON.stringify(['ZIG-KBG-4271']));
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    }, {
      code: SAMPLE_ADDRESS.code,
      latitude: SAMPLE_ADDRESS.latitude,
      longitude: SAMPLE_ADDRESS.longitude,
      zone: SAMPLE_ADDRESS.zone,
      quartier: SAMPLE_ADDRESS.quartier,
      description: SAMPLE_ADDRESS.description,
      locationType: SAMPLE_ADDRESS.locationType,
      createdAt: SAMPLE_ADDRESS.createdAt,
    });
    await page.waitForTimeout(500);

    // Coupure réseau réelle -> rechargement complet hors ligne via Service Worker Workbox
    await context.setOffline(true);
    await page.addInitScript(() => {
      (window as unknown as { __pwOnline: boolean }).__pwOnline = false;
    });
    await page.goto('/a/ZIG-KBG-4271', { waitUntil: 'domcontentloaded' });

    // Fiche déjà consultée reste lisible hors ligne avec carte hors ligne et badge fraîcheur
    await expect(page.getByTestId('address-plate')).toContainText('ZIG-KBG-4271');
    await expect(page.locator('text=Version enregistrée le 26/11/2026')).toBeVisible();
    await expect(page.locator('text=Carte indisponible hors ligne')).toBeVisible();

    // Navigation vers une fiche jamais visitée hors ligne
    await page.goto('/a/ZIG-INCONNU-0000', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator("text=Cette page n'est pas disponible hors ligne")
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'ZIG-KBG-4271' })).toBeVisible();

    await context.setOffline(false);
  });
});
