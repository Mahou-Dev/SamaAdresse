import { test, expect, type Page } from '@playwright/test';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const OWNER_USER = {
  id: 'u-owner-1',
  fullName: 'Mamadou Diallo',
  email: 'demo@samaadresse.sn',
  phoneNumber: '+221771234567',
  role: 'PROPRIETAIRE' as const,
  enabled: true,
  createdAt: '2026-01-15T10:00:00Z',
};

const ADMIN_USER = {
  id: 'u-admin-1',
  fullName: 'Awa Ndiaye',
  email: 'admin@samaadresse.sn',
  phoneNumber: '+221779990000',
  role: 'ADMIN' as const,
  enabled: true,
  createdAt: '2025-11-01T08:00:00Z',
};

const SAMPLE_ADDRESSES = [
  {
    id: 'addr-1001',
    code: 'ZIG-KBG-4271',
    latitude: 12.578333,
    longitude: -16.271944,
    zone: 'ZIG',
    quartier: 'KBG',
    description: 'Maison familiale au portail vert face à la grande mosquée',
    photoUrl: '/uploads/facade-1.png',
    locationType: 'MAISON' as const,
    status: 'ACTIVE' as const,
    listed: true,
    showOwnerName: false,
    createdAt: '2026-10-15T10:00:00Z',
    owner: OWNER_USER,
  },
  {
    id: 'addr-1002',
    code: 'ZIG-TIL-3015',
    latitude: 12.569,
    longitude: -16.265,
    zone: 'ZIG',
    quartier: 'TIL',
    description: 'Quincaillerie moderne du marché Tilène',
    photoUrl: undefined,
    locationType: 'COMMERCE' as const,
    status: 'ACTIVE' as const,
    listed: false,
    showOwnerName: false,
    createdAt: '2026-10-18T14:30:00Z',
    owner: OWNER_USER,
  },
  {
    id: 'addr-1003',
    code: 'ZIG-ESC-1102',
    latitude: 12.5835,
    longitude: -16.2712,
    zone: 'ZIG',
    quartier: 'ESC',
    description: 'Ancien local commercial déplacé',
    photoUrl: undefined,
    locationType: 'COMMERCE' as const,
    status: 'ARCHIVED' as const,
    listed: false,
    showOwnerName: false,
    createdAt: '2026-09-05T09:00:00Z',
    owner: OWNER_USER,
  },
  {
    id: 'addr-1004',
    code: 'DKR-PLT-2104',
    latitude: 14.6708,
    longitude: -17.4381,
    zone: 'DKR',
    quartier: 'PLT',
    description: 'Bureau signalé pour vérification GPS',
    photoUrl: undefined,
    locationType: 'INSTITUTION' as const,
    status: 'SUSPENDED' as const,
    listed: false,
    showOwnerName: false,
    moderationNotice: 'Position GPS à vérifier sur le terrain',
    createdAt: '2026-08-20T12:00:00Z',
    owner: OWNER_USER,
  },
];

const SAMPLE_REPORTS = [
  {
    id: 'rep-101',
    reason: 'POSITION_INCORRECTE' as const,
    comment: 'Le marqueur pointe dans la rue voisine.',
    status: 'OPEN' as const,
    createdAt: '2026-11-22T09:15:00Z',
    addressId: 'addr-1001',
    addressCode: 'ZIG-KBG-4271',
    addressZone: 'ZIG',
    addressQuartier: 'KBG',
    addressLocationType: 'MAISON' as const,
    addressDescription: 'Maison familiale au portail vert face à la grande mosquée',
    addressPhotoUrl: '/uploads/facade-1.png',
    addressStatus: 'ACTIVE' as const,
  },
  {
    id: 'rep-102',
    reason: 'CONTENU_INAPPROPRIE' as const,
    comment: 'Description publicitaire non conforme.',
    status: 'OPEN' as const,
    createdAt: '2026-11-23T14:40:00Z',
    addressId: 'addr-1002',
    addressCode: 'ZIG-TIL-3015',
    addressZone: 'ZIG',
    addressQuartier: 'TIL',
    addressLocationType: 'COMMERCE' as const,
    addressDescription: 'Quincaillerie moderne du marché Tilène',
    addressPhotoUrl: null,
    addressStatus: 'ACTIVE' as const,
  },
];

async function installOnlineShim(page: Page, initialOnline = true) {
  await page.addInitScript((online) => {
    (window as unknown as { __pwOnline: boolean }).__pwOnline = online;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => (window as unknown as { __pwOnline: boolean }).__pwOnline,
    });
  }, initialOnline);
}

async function installAuthSession(
  page: Page,
  user: typeof OWNER_USER | typeof ADMIN_USER,
  options?: { failRefresh?: boolean }
) {
  await page.addInitScript((u) => {
    localStorage.setItem('sa_session', '1');
    localStorage.setItem(
      'sa_offline_user',
      JSON.stringify({ userId: u.id, displayName: u.fullName, role: u.role })
    );
  }, user);

  await page.route('**/api/auth/refresh', async (route) => {
    if (options?.failRefresh) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Refresh token expiré' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        user,
      }),
    });
  });

  await page.route('**/api/address-codes/reservations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'res-1',
          code: 'ZIG-KBG-8811',
          zone: 'ZIG',
          quartier: 'KBG',
          status: 'RESERVED',
          createdAt: '2026-11-20T00:00:00Z',
          expiresAt: '2099-12-31T23:59:59Z',
        },
        {
          id: 'res-2',
          code: 'ZIG-KBG-8812',
          zone: 'ZIG',
          quartier: 'KBG',
          status: 'RESERVED',
          createdAt: '2026-11-20T00:00:00Z',
          expiresAt: '2099-12-31T23:59:59Z',
        },
      ]),
    });
  });
}

async function installStaticMocks(page: Page) {
  await page.route('**/uploads/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });
  await page.route('**/api/addresses/*/qrcode', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
  });
  await page.route('**/api/public/directory**', async (route) => {
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
  });
}

test.describe('P04 — Expérience connectée, gestion des comptes, modération & finalisation', () => {
  test.use({ serviceWorkers: 'block' });

  test('1. Tableau de bord : données réelles, état vide (0 adresse) et erreur API 500 + Réessayer', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page, OWNER_USER);
    await installStaticMocks(page);

    let mode: 'error' | 'empty' | 'filled' = 'error';

    await page.route('**/api/addresses/mine', async (route) => {
      if (mode === 'error') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Serveur momentanément indisponible' }),
        });
        return;
      }
      if (mode === 'empty') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_ADDRESSES),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    // 1a. Erreur API -> ErrorState explicite (JAMAIS faux état vide "0 adresse")
    await page.goto('/tableau-de-bord');
    await expect(page.locator('h1')).toContainText('Bonjour, Mamadou !');
    await expect(page.locator('[role="alert"]')).toContainText('Serveur momentanément indisponible');

    // 1b. Clic Réessayer -> état vide (0 adresse)
    mode = 'empty';
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator("text=Vous n'avez pas encore créé d'adresse")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Créer ma première adresse' })).toBeVisible();
    await expect(page.getByTestId('stat-active')).toContainText('0');

    // 1c. Tableau de bord chargé avec données réelles
    mode = 'filled';
    await page.reload();
    await expect(page.getByTestId('stat-active')).toContainText('2');
    await expect(page.getByTestId('stat-suspended')).toContainText('1');
    await expect(page.getByTestId('stat-archived')).toContainText('1');
    await expect(page.getByTestId('stat-pending')).toContainText('0');

    // Bloc "À traiter" affiche l'adresse suspendue avec motif + l'adresse active sans photo
    await expect(page.locator('text=Position GPS à vérifier sur le terrain')).toBeVisible();
    await expect(page.locator('text=Ajouter une photo')).toBeVisible();

    // Clic sur tuile Adresses actives -> /addresses/mine?status=ACTIVE
    await page.getByTestId('stat-active').click();
    await page.waitForURL(/\/addresses\/mine\?status=ACTIVE/);
  });

  test('2. Mes adresses : filtres, Grille/Liste, archivage + restauration, visibilité annuaire, suspendue, édition', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page, OWNER_USER);
    await installStaticMocks(page);

    const state = SAMPLE_ADDRESSES.map((a) => ({ ...a }));
    let failVisibilityOnce = true;

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state),
      });
    });

    await page.route('**/api/addresses/*/archive', async (route) => {
      const id = route.request().url().split('/').slice(-2)[0];
      const item = state.find((a) => a.id === id)!;
      item.status = 'ARCHIVED';
      item.listed = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(item),
      });
    });

    await page.route('**/api/addresses/*/restore', async (route) => {
      const id = route.request().url().split('/').slice(-2)[0];
      const item = state.find((a) => a.id === id)!;
      item.status = 'ACTIVE';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(item),
      });
    });

    await page.route('**/api/addresses/*/visibility', async (route) => {
      if (failVisibilityOnce) {
        failVisibilityOnce = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erreur de mise à jour visibilité' }),
        });
        return;
      }
      const id = route.request().url().split('/').slice(-2)[0];
      const body = route.request().postDataJSON() as { listed: boolean; showOwnerName: boolean };
      const item = state.find((a) => a.id === id)!;
      item.listed = body.listed;
      item.showOwnerName = body.showOwnerName;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(item),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/addresses/mine');
    await expect(page.locator('h1')).toContainText('Mes adresses');
    await expect(page.locator('text=Affichage de 4 sur 4 adresses')).toBeVisible();

    // 2a. Bascule Grille <-> Liste à 1280 px
    await expect(page.getByTestId('addresses-grid-view')).toBeVisible();
    await page.locator('button[aria-label="Vue liste"]').click();
    await expect(page.getByTestId('addresses-list-view')).toBeVisible();
    await expect(page.getByTestId('addresses-grid-view')).toHaveCount(0);
    await page.locator('button[aria-label="Vue grille"]').click();
    await expect(page.getByTestId('addresses-grid-view')).toBeVisible();

    // 2b. Adresse suspendue : bandeau visible, aucun menu Actions
    await expect(page.locator('text=Suspendue par la modération')).toBeVisible();
    await expect(page.locator('button[aria-label="Actions pour DKR-PLT-2104"]')).toHaveCount(0);

    // 2c. Changement de visibilité (erreur 500 ne falsifie pas l'état -> 2e tentative réussit)
    await page.locator('button[aria-label="Actions pour ZIG-TIL-3015"]').click();
    await page.locator('button[role="menuitem"]:has-text("Publier dans l\'annuaire")').click();
    await page.getByRole('dialog').getByRole('button', { name: "Publier dans l'annuaire" }).click();
    await expect(page.locator('text=Erreur de mise à jour visibilité')).toBeVisible();
    // 2e tentative réussit
    await page.getByRole('dialog').getByRole('button', { name: "Publier dans l'annuaire" }).click();
    await expect(page.locator("text=Adresse ZIG-TIL-3015 publiée dans l'annuaire public.")).toBeVisible();

    // 2d. Archivage confirmé + Restauration depuis l'onglet Archivées
    await page.locator('button[aria-label="Actions pour ZIG-KBG-4271"]').click();
    await page.locator('button[role="menuitem"]:has-text("Archiver")').click();
    await expect(page.getByRole('dialog')).toContainText("Archiver l'adresse ZIG-KBG-4271 ?");
    await page.getByRole('dialog').getByRole('button', { name: "Archiver l'adresse" }).click();
    await expect(page.locator('text=Adresse archivée (ZIG-KBG-4271)')).toBeVisible();

    await page.locator('button[role="tab"]:has-text("Archivées")').click();
    await expect(page.getByTestId('addresses-grid-view').getByText('ZIG-KBG-4271')).toBeVisible();
    await page.locator('button[aria-label="Actions pour ZIG-KBG-4271"]').click();
    await page.locator('button[role="menuitem"]:has-text("Restaurer")').click();
    await expect(page.locator('text=Adresse ZIG-KBG-4271 restaurée avec succès.')).toBeVisible();

    // 2e. Navigation vers Modifier puis retour à Mes adresses
    await page.locator('button[role="tab"]:has-text("Actives")').click();
    await page.locator('button[aria-label="Actions pour ZIG-KBG-4271"]').click();
    await page.locator('button[role="menuitem"]:has-text("Modifier")').click();
    await page.waitForURL('/addresses/addr-1001/edit');
    await expect(page.locator('#edit-description')).toBeVisible();
    await page.getByRole('link', { name: 'Retour à mes adresses' }).click();
    await page.waitForURL('/addresses/mine');
  });

  test('3. Compte & Profil, protection déconnexion avec brouillon hors ligne, et gestion session expirée', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page, OWNER_USER);
    await installStaticMocks(page);

    let logoutCalls = 0;
    await page.route('**/api/auth/logout', async (route) => {
      logoutCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Déconnexion réussie' }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/account');

    // 3a. Profil lecture seule & infos session réelles
    await expect(page.locator('h1')).toContainText('Espace personnel');
    await expect(page.getByRole('heading', { name: 'Mamadou Diallo' })).toBeVisible();
    await expect(page.locator('text=demo@samaadresse.sn')).toBeVisible();
    await expect(page.locator('text=+221771234567')).toBeVisible();
    await expect(page.locator('text=Session authentifiée active')).toBeVisible();

    // 3b. Onglet Hors ligne, Préférences et Aide
    await page.locator('#tab-offline').click();
    await expect(page.locator('text=Stock local et synchronisation')).toBeVisible();
    await expect(page.locator('text=Codes réservés restants')).toBeVisible();

    await page.locator('#tab-preferences').click();
    await page.locator('input[type="checkbox"]').first().check();
    await expect(page.locator('text=Non enregistré')).toBeVisible();
    await page.getByRole('button', { name: 'Enregistrer les préférences' }).click();
    await expect(page.locator('text=Préférences enregistrées avec succès.')).toBeVisible();

    await page.locator('#tab-aide').click();
    await expect(page.locator('text=Boucotte - Kangourou')).toBeVisible();

    // 3c. Ensemencer 1 brouillon hors ligne dans IndexedDB -> garde-fou de déconnexion
    await page.locator('#tab-profil').click();
    await page.evaluate(async () => {
      const db = (window as unknown as {
        __offlineDb: {
          clearDrafts: () => Promise<void>;
          saveDraft: (d: unknown) => Promise<void>;
        };
      }).__offlineDb;
      await db.clearDrafts();
      await db.saveDraft({
        id: 'draft-logout-1',
        clientRequestId: 'req-logout-1',
        latitude: 12.575,
        longitude: -16.27,
        description: 'Brouillon à préserver à la déconnexion',
        locationType: 'MAISON',
        zone: 'ZIG',
        quartier: 'KBG',
        photoBlob: null,
        reservedCode: 'ZIG-KBG-8811',
        createdAt: '2026-11-26T10:00:00Z',
        status: 'PENDING',
        attempts: 0,
      });
    });

    await page.getByRole('button', { name: 'Se déconnecter' }).last().click();
    await expect(page.getByRole('dialog')).toContainText("Adresses en attente d'envoi");
    // Annuler garde la session ouverte
    await page.getByRole('dialog').getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(logoutCalls).toBe(0);

    // Confirmer déconnecte SANS supprimer le brouillon local IndexedDB
    await page.getByRole('button', { name: 'Se déconnecter' }).last().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmer la déconnexion' }).click();
    await page.waitForURL('/');
    expect(logoutCalls).toBe(1);

    const remainingDrafts = await page.evaluate(async () => {
      return await (window as unknown as { __offlineDb: { getDraftsCount: () => Promise<number> } })
        .__offlineDb.getDraftsCount();
    });
    expect(remainingDrafts).toBe(1);
    const hasSession = await page.evaluate(() => localStorage.getItem('sa_session'));
    expect(hasSession).toBeNull();

    // Nettoyage brouillon
    await page.evaluate(async () => {
      await (window as unknown as { __offlineDb: { clearDrafts: () => Promise<void> } })
        .__offlineDb.clearDrafts();
    });
  });

  test('3b. Session expirée (HTTP 401) redirige proprement vers /login avec bandeau explicite', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installAuthSession(page, OWNER_USER);
    await installStaticMocks(page);

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Jeton expiré' }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tableau-de-bord');
    await expect(page.locator('text=Session expirée')).toBeVisible();
    await page.getByRole('button', { name: 'Se reconnecter' }).click();
    await page.waitForURL('/login');
    await expect(
      page.locator('text=Votre session a expiré. Reconnectez-vous pour continuer.')
    ).toBeVisible();
  });

  test('4. Administration & Modération : contrôle rôle, suspension/rétablissement, résolution/classement, erreur 500 et audit', async ({
    browser,
  }) => {
    // 4a. Visiteur anonyme sur /admin -> /login
    const anonCtx = await browser.newContext({ serviceWorkers: 'block' });
    const anonPage = await anonCtx.newPage();
    await installOnlineShim(anonPage);
    await anonPage.goto('/admin');
    await anonPage.waitForURL(/\/login/);
    await anonCtx.close();

    // 4b. PROPRIETAIRE sur /admin -> Accès réservé
    const ownerCtx = await browser.newContext({ serviceWorkers: 'block' });
    const ownerPage = await ownerCtx.newPage();
    await installOnlineShim(ownerPage);
    await installAuthSession(ownerPage, OWNER_USER);
    await ownerPage.goto('/admin');
    await expect(ownerPage.locator('h1')).toContainText('Accès réservé');
    await ownerCtx.close();

    // 4c. ADMIN sur /admin -> Modération complète
    const adminCtx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      serviceWorkers: 'block',
    });
    const page = await adminCtx.newPage();
    await installOnlineShim(page);
    await installAuthSession(page, ADMIN_USER);
    await installStaticMocks(page);

    const reports = SAMPLE_REPORTS.map((r) => ({ ...r }));
    let failSuspendOnce = true;
    let suspendCalls = 0;

    await page.route('**/api/admin/reports**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (req.method() === 'PATCH') {
        const id = url.pathname.split('/').pop()!;
        const body = req.postDataJSON() as { status: 'RESOLVED' | 'DISMISSED' };
        const rep = reports.find((r) => r.id === id)!;
        rep.status = body.status;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(rep),
        });
        return;
      }

      const status = url.searchParams.get('status');
      const filtered = status ? reports.filter((r) => r.status === status) : reports;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: filtered,
          totalElements: filtered.length,
          totalPages: 1,
          number: 0,
          size: 20,
        }),
      });
    });

    await page.route('**/api/admin/addresses/*/suspend', async (route) => {
      suspendCalls += 1;
      await new Promise((r) => setTimeout(r, 120));
      if (failSuspendOnce) {
        failSuspendOnce = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erreur de modération temporaire' }),
        });
        return;
      }
      const addressId = route.request().url().split('/').slice(-2)[0];
      reports
        .filter((r) => r.addressId === addressId)
        .forEach((r) => {
          r.addressStatus = 'SUSPENDED';
        });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SAMPLE_ADDRESSES[0], id: addressId, status: 'SUSPENDED' }),
      });
    });

    await page.route('**/api/admin/addresses/*/reinstate', async (route) => {
      const addressId = route.request().url().split('/').slice(-2)[0];
      reports
        .filter((r) => r.addressId === addressId)
        .forEach((r) => {
          r.addressStatus = 'ACTIVE';
        });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...SAMPLE_ADDRESSES[0], id: addressId, status: 'ACTIVE' }),
      });
    });

    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Administration & Modération des signalements');
    await expect(page.getByTestId('admin-stat-open')).toContainText('2');

    // Ouvrir le 1er signalement (ZIG-KBG-4271)
    await page.locator('tr:has-text("ZIG-KBG-4271") button:has-text("Examiner")').click();
    await expect(page.locator('#suspend-reason-input')).toBeVisible();
    // Aucune PII propriétaire exposée
    await expect(page.locator('body')).not.toContainText('demo@samaadresse.sn');

    // Validation motif obligatoire
    await page.locator('button[type="submit"]:has-text("Suspendre l\'adresse")').click();
    await expect(page.locator('text=Le motif de suspension est obligatoire.')).toBeVisible();

    // Erreur serveur 500 sur suspension -> aucun faux succès
    await page.fill('#suspend-reason-input', 'Coordonnées décalées confirmées');
    await page.locator('button[type="submit"]:has-text("Suspendre l\'adresse")').click();
    await expect(page.locator('text=Erreur de modération temporaire').first()).toBeVisible();
    expect(suspendCalls).toBe(1);

    // Double clic simultané -> 1 seul envoi -> suspension réussie
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('form button[type="submit"]');
      btn?.click();
      btn?.click();
    });
    await expect(page.locator('text=Adresse ZIG-KBG-4271 suspendue.')).toBeVisible();
    expect(suspendCalls).toBe(2);

    // Rétablissement via Modal accessible
    await page.getByRole('button', { name: "Rétablir l'adresse" }).first().click();
    await page.fill('#reinstate-reason-input', 'Coordonnées vérifiées et conformes');
    await page.getByRole('button', { name: 'Confirmer le rétablissement' }).click();
    await expect(page.locator('text=Adresse ZIG-KBG-4271 rétablie avec succès.')).toBeVisible();

    // Marquer traité (RESOLVED) avec confirmation
    await page.getByRole('button', { name: 'Marquer traité' }).click();
    await page.getByRole('button', { name: 'Confirmer comme traité' }).click();
    await expect(page.locator('text=Signalement marqué comme traité.')).toBeVisible();

    // Fermer le tiroir et classer le 2e signalement sans suite (DISMISSED)
    await page.keyboard.press('Escape');
    await page.locator('tr:has-text("ZIG-TIL-3015") button:has-text("Examiner")').click();
    await page.getByRole('button', { name: 'Classer sans suite' }).click();
    await page.getByRole('button', { name: 'Confirmer le classement' }).click();
    await expect(page.locator('text=Signalement classé sans suite.')).toBeVisible();
    await page.keyboard.press('Escape');

    // Vérifier les compteurs mis à jour & le journal d'audit de session
    await expect(page.getByTestId('admin-stat-open')).toContainText('0');
    await expect(page.getByTestId('admin-stat-resolved')).toContainText('1');
    await expect(page.getByTestId('admin-stat-dismissed')).toContainText('1');

    await page.locator('#tab-audit').click();
    await expect(page.locator('text=Traçabilité des actions administratives')).toBeVisible();
    const auditTable = page.getByRole('table', { name: "Journal d'audit de session" });
    await expect(auditTable.getByText("Suspension d'adresse")).toBeVisible();
    await expect(auditTable.getByText("Rétablissement d'adresse")).toBeVisible();
    await expect(auditTable.getByText('Signalement marqué traité')).toBeVisible();
    await expect(auditTable.getByText('Signalement classé sans suite')).toBeVisible();

    await adminCtx.close();
  });

  test('5. Harmonisation Auth & 404 : /login, /register (aucun <main> imbriqué) et /404', async ({
    page,
  }) => {
    await installOnlineShim(page);
    await installStaticMocks(page);

    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(OWNER_USER),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/register');
    await expect(page.locator('main main')).toHaveCount(0);
    await page.fill('#fullName', 'Mamadou Diallo');
    await page.fill('#email', 'nouveau@samaadresse.sn');
    await page.fill('#phoneNumber', '+221771234567');
    await page.fill('#password', 'Password123');
    await page.fill('#confirmPassword', 'Password123');
    await expect(page.locator('text=Fort')).toBeVisible();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/login');
    await expect(page.locator('main main')).toHaveCount(0);

    await page.goto('/route-introuvable-p04');
    await expect(page.locator('text=Page ou repère introuvable')).toBeVisible();
    await expect(page.getByRole('link', { name: "Explorer l'annuaire" })).toBeVisible();
  });

  test('6. Responsive 7 viewports (320 à 1440px), Web Vitals CLS/LCP et captures visuelles', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await installOnlineShim(page);
    await installAuthSession(page, ADMIN_USER);
    await installStaticMocks(page);

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_ADDRESSES),
      });
    });

    await page.route('**/api/admin/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: SAMPLE_REPORTS,
          totalElements: SAMPLE_REPORTS.length,
          totalPages: 1,
          number: 0,
          size: 20,
        }),
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
      { path: '/tableau-de-bord', marker: '[data-testid="stat-active"]' },
      { path: '/addresses/mine', marker: '[data-testid="addresses-grid-view"]' },
      { path: '/account', marker: '#tab-profil' },
      { path: '/admin', marker: '[data-testid="admin-stat-open"]' },
      { path: '/login', marker: '#email' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const r of routesToCheck) {
        await page.goto(r.path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator(r.marker).first()).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(
          overflow,
          `Débordement horizontal sur ${r.path} à ${vp.width}x${vp.height}`
        ).toBeLessThanOrEqual(1);
      }
    }

    // Vérifier qu'à 360 px les cartes de /addresses/mine ne font déborder aucun bouton
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/addresses/mine', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('addresses-grid-view')).toBeVisible();
    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();
    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      const cardBox = await cards.nth(i).boundingBox();
      if (!cardBox) continue;
      const buttons = cards.nth(i).locator('button, a');
      const btnCount = await buttons.count();
      for (let j = 0; j < btnCount; j++) {
        if (await buttons.nth(j).isVisible()) {
          const btnBox = await buttons.nth(j).boundingBox();
          if (btnBox) {
            expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
          }
        }
      }
    }

    // Mesures Web Vitals & captures visuelles desktop 1440 et mobile 390
    const vitals: Record<string, { cls: number; lcp: number }> = {};
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const target of [
      { key: 'dashboard', path: '/tableau-de-bord', marker: '[data-testid="stat-active"]' },
      { key: 'my-addresses', path: '/addresses/mine', marker: '[data-testid="addresses-grid-view"]' },
      { key: 'account', path: '/account', marker: '#tab-profil' },
      { key: 'admin', path: '/admin', marker: '[data-testid="admin-stat-open"]' },
    ]) {
      await page.goto(target.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(target.marker).first()).toBeVisible();
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const w = window as unknown as { __cls: number; __lcp: number };
        return { cls: Number(w.__cls.toFixed(4)), lcp: Math.round(w.__lcp) };
      });
      vitals[target.key] = m;
      expect(m.cls, `CLS sur ${target.path}`).toBeLessThan(0.1);
      expect(m.lcp, `LCP sur ${target.path}`).toBeLessThanOrEqual(2500);
      await page.screenshot({ path: `/tmp/p04-visual/${target.key}-1440.png`, fullPage: false });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-stat-open')).toBeVisible();
    await page.screenshot({ path: '/tmp/p04-visual/admin-mobile-390.png', fullPage: false });

    console.log(`[P04 Web Vitals] ${JSON.stringify(vitals)}`);
  });
});

test.describe('P04 — PWA, sécurité Cache Storage & hors ligne réel sur espaces connectés', () => {
  test.use({ serviceWorkers: 'allow' });

  test('7. Service Worker réel : zéro route sensible en Cache Storage, repli hors ligne connecté & ReloadPrompt PWA', async ({
    context,
    page,
  }) => {
    await installOnlineShim(page, true);
    await installAuthSession(page, ADMIN_USER);
    await installStaticMocks(page);

    await page.route('**/api/addresses/mine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SAMPLE_ADDRESSES),
      });
    });

    await page.route('**/api/admin/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: SAMPLE_REPORTS,
          totalElements: SAMPLE_REPORTS.length,
          totalPages: 1,
          number: 0,
          size: 20,
        }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tableau-de-bord');
    await expect(page.getByTestId('stat-active')).toBeVisible();

    await page.goto('/account');
    await expect(page.locator('#tab-profil')).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByTestId('admin-stat-open')).toBeVisible();

    // Attendre que Workbox SW soit prêt
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });
    await page.waitForTimeout(400);

    // Vérifier la sécurité du Cache Storage : AUCUNE route sensible en cache Workbox
    const cacheUrls = await page.evaluate(async () => {
      const names = await caches.keys();
      const urls: string[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        urls.push(...keys.map((r) => r.url));
      }
      return urls;
    });

    for (const u of cacheUrls) {
      expect(u).not.toContain('/api/auth/');
      expect(u).not.toContain('/api/addresses/mine');
      expect(u).not.toContain('/api/admin/');
    }

    // Vérifier le bandeau de mise à jour PWA Clarté (ReloadPrompt)
    await page.evaluate(() => {
      (window as unknown as { __triggerPwaRefreshPrompt?: () => void }).__triggerPwaRefreshPrompt?.();
    });
    await expect(page.locator('text=Nouvelle version disponible')).toBeVisible();
    await page.getByRole('button', { name: 'Plus tard' }).click();

    // Coupure réseau réelle -> vérifier fonctionnement hors ligne des espaces connectés
    await context.setOffline(true);
    await page.addInitScript(() => {
      (window as unknown as { __pwOnline: boolean }).__pwOnline = false;
    });

    await page.goto('/tableau-de-bord', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Bonjour, Awa !');
    await expect(page.getByTestId('stat-active')).toBeVisible();

    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#tab-profil')).toBeVisible();
    await page.locator('#tab-offline').click();
    await expect(page.locator('text=Stock local et synchronisation')).toBeVisible();

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Mode hors ligne actif')).toBeVisible();
    await expect(
      page.locator('text=La modération et la consultation des signalements nécessitent une connexion réseau')
    ).toBeVisible();

    await context.setOffline(false);
  });
});
