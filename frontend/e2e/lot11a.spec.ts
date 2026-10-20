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

test.describe.serial('LOT 11A — Refonte des espaces personnels (Propriétaire et Admin)', () => {
  let userContext: any;
  let userPage: any;
  let adminContext: any;
  let adminPage: any;

  test.beforeAll(async ({ browser }) => {
    // 1. Session utilisateur standard (Mamadou Diop)
    userContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await userContext.grantPermissions(['geolocation']);
    await userContext.setGeolocation({ latitude: 12.5738, longitude: -16.2650 });
    userPage = await userContext.newPage();
    await loginUser(userPage, 'demo@samaadresse.sn', 'Password123!');

    // 2. Session administrateur
    adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await adminContext.grantPermissions(['geolocation']);
    await adminContext.setGeolocation({ latitude: 12.5738, longitude: -16.2650 });
    adminPage = await adminContext.newPage();
    await loginUser(adminPage, 'admin@samaadresse.sn', 'Password123!');
  });

  test.afterAll(async () => {
    await userContext?.close();
    await adminContext?.close();
  });

  // ---------------------------------------------------------------------------
  // 1. TABLEAU DE BORD (/tableau-de-bord)
  // ---------------------------------------------------------------------------
  test('1. Tableau de bord : salutation avec prénom, 4 tuiles métriques réelles et liens', async () => {
    await userPage.goto('/tableau-de-bord');

    // 1.1 Salutation avec le prénom extrait ("Mamadou")
    const heading = userPage.locator('h1');
    await expect(heading).toContainText('Bonjour, Mamadou !');

    // 1.2 Vérification des 4 tuiles métriques réelles
    const activeTile = userPage.locator('[data-testid="stat-active"]');
    await expect(activeTile).toBeVisible();
    await expect(activeTile).toContainText('Adresses actives');

    const suspendedTile = userPage.locator('[data-testid="stat-suspended"]');
    await expect(suspendedTile).toBeVisible();
    await expect(suspendedTile).toContainText('Suspendues');

    const archivedTile = userPage.locator('[data-testid="stat-archived"]');
    await expect(archivedTile).toBeVisible();
    await expect(archivedTile).toContainText('Archivées');

    const pendingTile = userPage.locator('[data-testid="stat-pending"]');
    await expect(pendingTile).toBeVisible();
    await expect(pendingTile).toContainText('En attente synchro');

    // 1.3 Clic sur la tuile "Adresses actives" navigue vers Mes adresses avec le filtre
    await activeTile.click();
    await userPage.waitForURL((url: URL) => url.pathname.includes('/addresses/mine'));
    expect(userPage.url()).toContain('status=ACTIVE');
  });

  // ---------------------------------------------------------------------------
  // 2. MES ADRESSES : RECHERCHE ET FILTRES COMBINABLES
  // ---------------------------------------------------------------------------
  test('2. Mes adresses : recherche par code, filtres combinables et compteur de résultats', async () => {
    await userPage.goto('/addresses/mine');

    // Attendre le chargement des adresses
    await userPage.waitForSelector('text=ZIG-KBG-4271');

    // 2.1 Compteur de résultats présent
    const counter = userPage.locator('text=/Affichage de [0-9]+ sur [0-9]+ adresse/');
    await expect(counter).toBeVisible();

    // 2.2 Recherche par code (ex: "KBG")
    const searchInput = userPage.locator('input[type="search"]');
    await searchInput.fill('4271');
    await expect(userPage.locator('text=ZIG-KBG-4271')).toBeVisible();

    // 2.3 Recherche sans résultat affiche l'EmptyState dédié
    await searchInput.fill('INEXISTANT-9999');
    await expect(userPage.locator('text=Aucun résultat pour cette recherche')).toBeVisible();

    // Bouton de réinitialisation
    await userPage.click('button:has-text("Effacer les filtres")');
    await expect(userPage.locator('text=ZIG-KBG-4271')).toBeVisible();

    // 2.4 Filtre par type (ex: COMMERCE)
    const typeSelect = userPage.locator('select[aria-label="Filtrer par type de lieu"]');
    await typeSelect.selectOption('COMMERCE');
    await expect(userPage.locator('text=ZIG-TIL-3015')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 3. ACTIONS D'UNE ADRESSE ET DIALOGUE D'ARCHIVAGE
  // ---------------------------------------------------------------------------
  test('3. Mes adresses : menu d’actions accessible, modale d’archivage et annulation', async () => {
    await userPage.goto('/addresses/mine');
    await userPage.waitForSelector('text=ZIG-KBG-4271');

    // Trouver le bouton d'actions pour ZIG-KBG-4271
    const menuBtn = userPage.locator('button[aria-label="Actions pour ZIG-KBG-4271"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Le menu s'ouvre
    const menu = userPage.locator('div[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=Modifier')).toBeVisible();
    await expect(menu.locator('text=Archiver')).toBeVisible();

    // Clic sur "Archiver" ouvre le ConfirmDialog accessible
    await menu.locator('text=Archiver').click();
    const dialog = userPage.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Archiver l\'adresse ZIG-KBG-4271 ?')).toBeVisible();

    // Annuler ferme le dialogue sans modifier l'adresse
    await dialog.locator('button:has-text("Annuler")').click();
    await expect(dialog).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 4. ONGLETS DE « COMPTE »
  // ---------------------------------------------------------------------------
  test('4. Compte : navigation par 4 onglets, profil lecture seule, préférences et aide', async () => {
    await userPage.goto('/account');

    // 4.1 Onglet Profil actif par défaut
    const profilTab = userPage.locator('#tab-profil');
    await expect(profilTab).toHaveAttribute('aria-selected', 'true');
    await expect(userPage.getByRole('heading', { name: 'Mamadou Diallo' })).toBeVisible();
    await expect(userPage.locator('text=demo@samaadresse.sn')).toBeVisible();

    // 4.2 Onglet Application & hors ligne
    const offlineTab = userPage.locator('#tab-offline');
    await offlineTab.click();
    await expect(offlineTab).toHaveAttribute('aria-selected', 'true');
    await expect(userPage.locator('text=Stock local et synchronisation')).toBeVisible();
    await expect(userPage.locator('text=Codes réservés restants')).toBeVisible();

    // 4.3 Onglet Préférences
    const prefsTab = userPage.locator('#tab-preferences');
    await prefsTab.click();
    await expect(prefsTab).toHaveAttribute('aria-selected', 'true');
    await expect(userPage.locator('text=Préférences de création d\'adresses')).toBeVisible();
    const listedCheckbox = userPage.locator('input[type="checkbox"]').first();
    await listedCheckbox.check();
    await userPage.click('button:has-text("Enregistrer les préférences")');

    // 4.4 Onglet Aide & guide
    const aideTab = userPage.locator('#tab-aide');
    await aideTab.click();
    await expect(aideTab).toHaveAttribute('aria-selected', 'true');
    await expect(userPage.locator('text=Comment fonctionne mon code d\'adresse ?')).toBeVisible();
    await expect(userPage.locator('text=Puis-je utiliser SamaAdresse sans connexion Internet ?')).toBeVisible();
    await expect(userPage.locator('text=Qui peut consulter mon adresse et mes coordonnées ?')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 5. ADMINISTRATION & MODÉRATION (/admin)
  // ---------------------------------------------------------------------------
  test('5. Administration : indicateurs réels, file de modération en tableau et tiroir latéral', async () => {
    await adminPage.goto('/admin');

    // 5.1 En-tête et tuiles métriques admin
    const title = adminPage.locator('h1');
    await expect(title).toContainText('Administration & Modération');

    await expect(adminPage.locator('[data-testid="admin-stat-open"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="admin-stat-resolved"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="admin-stat-dismissed"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="admin-stat-total"]')).toBeVisible();

    // 5.2 Onglet Journal d'audit accessible
    const auditTab = adminPage.locator('#tab-audit');
    await expect(auditTab).toBeVisible();
    await auditTab.click();
    await expect(adminPage.locator('text=Traçabilité des actions administratives')).toBeVisible();

    // Retour sur l'onglet modération
    await adminPage.locator('#tab-moderation').click();
    await expect(adminPage.locator('table[aria-label="Tableau de données"]').or(adminPage.locator('text=Aucun signalement'))).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 6. MES ADRESSES : BASCULE VUE LISTE ET VUE GRILLE À 1280 PX
  // ---------------------------------------------------------------------------
  test('6. Mes adresses : bascule effective entre vue liste et vue grille à 1280 px', async () => {
    await userPage.setViewportSize({ width: 1280, height: 800 });
    await userPage.goto('/addresses/mine');

    // Attendre le chargement des adresses
    await userPage.waitForSelector('text=ZIG-KBG-4271');

    // Par défaut le mode est grille
    const gridView = userPage.locator('[data-testid="addresses-grid-view"]');
    const listView = userPage.locator('[data-testid="addresses-list-view"]');

    await expect(gridView).toBeVisible();
    await expect(listView).not.toBeVisible();

    // Basculer en vue liste via le bouton accessible
    const listBtn = userPage.locator('button[aria-label="Vue liste"]');
    await expect(listBtn).toBeVisible();
    await listBtn.click();

    // Vérifier l'état après bascule
    await expect(listView).toBeVisible();
    await expect(gridView).not.toBeVisible();
    await expect(listBtn).toHaveAttribute('aria-pressed', 'true');

    // Basculer de nouveau en vue grille
    const gridBtn = userPage.locator('button[aria-label="Vue grille"]');
    await expect(gridBtn).toBeVisible();
    await gridBtn.click();

    // Vérifier le retour au mode grille
    await expect(gridView).toBeVisible();
    await expect(listView).not.toBeVisible();
    await expect(gridBtn).toHaveAttribute('aria-pressed', 'true');
  });

  // ---------------------------------------------------------------------------
  // 7. HORS LIGNE : TABLEAU DE BORD, COMPTE ET ADMINISTRATION AVEC DONNÉES EN CACHE
  // ---------------------------------------------------------------------------
  test('7. Hors ligne : affichage du tableau de bord, du compte et de l\'administration avec données en cache', async () => {
    // 7.1 Pré-chargement des pages en ligne
    await userPage.goto('/tableau-de-bord');
    await expect(userPage.locator('h1')).toContainText('Bonjour');
    await userPage.waitForSelector('[data-testid="stat-active"]');

    await userPage.goto('/account');
    await expect(userPage.locator('#tab-profil')).toBeVisible();

    await adminPage.goto('/admin');
    await expect(adminPage.locator('h1')).toContainText('Administration');

    // 7.2 Coupure du réseau utilisateur (émulation hors ligne)
    await userContext.setOffline(true);

    // 7.3 Navigation hors ligne vers le tableau de bord
    await userPage.goto('/tableau-de-bord');
    await expect(userPage.locator('h1')).toContainText('Bonjour');
    await expect(userPage.locator('[data-testid="stat-active"]')).toBeVisible();
    await expect(userPage.locator('text=Mode hors ligne actif').or(userPage.locator('text=Hors ligne')).first()).toBeVisible();

    // 7.4 Navigation hors ligne vers la page compte
    await userPage.goto('/account');
    await expect(userPage.locator('#tab-profil')).toBeVisible();
    const offlineTab = userPage.locator('#tab-offline');
    await offlineTab.click();
    await expect(userPage.locator('text=Stock local et synchronisation')).toBeVisible();

    await userContext.setOffline(false);

    // 7.5 Administration hors ligne (garde-fou explicite)
    await adminContext.setOffline(true);
    await adminPage.goto('/admin');
    await expect(adminPage.locator('text=Mode hors ligne actif')).toBeVisible();
    await expect(adminPage.locator('text=La modération et la consultation des signalements nécessitent une connexion réseau')).toBeVisible();
    await adminContext.setOffline(false);
  });
});
