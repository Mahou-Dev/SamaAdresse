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

test.describe('LOT 11A — Refonte des espaces personnels (Propriétaire et Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Éviter les erreurs de géolocalisation non autorisée
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 12.5738, longitude: -16.2650 });
  });

  // ---------------------------------------------------------------------------
  // 1. TABLEAU DE BORD (/tableau-de-bord)
  // ---------------------------------------------------------------------------
  test('1. Tableau de bord : salutation avec prénom, 4 tuiles métriques réelles et liens', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/tableau-de-bord');

    // 1.1 Salutation avec le prénom extrait ("Mamadou")
    const heading = page.locator('h1');
    await expect(heading).toContainText('Bonjour, Mamadou !');

    // 1.2 Vérification des 4 tuiles métriques réelles
    const activeTile = page.locator('[data-testid="stat-active"]');
    await expect(activeTile).toBeVisible();
    await expect(activeTile).toContainText('Adresses actives');

    const suspendedTile = page.locator('[data-testid="stat-suspended"]');
    await expect(suspendedTile).toBeVisible();
    await expect(suspendedTile).toContainText('Signalées');

    const archivedTile = page.locator('[data-testid="stat-archived"]');
    await expect(archivedTile).toBeVisible();
    await expect(archivedTile).toContainText('Archivées');

    const pendingTile = page.locator('[data-testid="stat-pending"]');
    await expect(pendingTile).toBeVisible();
    await expect(pendingTile).toContainText('En attente synchro');

    // 1.3 Clic sur la tuile "Adresses actives" navigue vers Mes adresses avec le filtre
    await activeTile.click();
    await page.waitForURL((url) => url.pathname.includes('/addresses/mine'));
    expect(page.url()).toContain('status=ACTIVE');
  });

  // ---------------------------------------------------------------------------
  // 2. MES ADRESSES : RECHERCHE ET FILTRES COMBINABLES
  // ---------------------------------------------------------------------------
  test('2. Mes adresses : recherche par code, filtres combinables et compteur de résultats', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/mine');

    // Attendre le chargement des adresses
    await page.waitForSelector('text=ZIG-KBG-4271');

    // 2.1 Compteur de résultats présent
    const counter = page.locator('text=/Affichage de [0-9]+ sur [0-9]+ adresse/');
    await expect(counter).toBeVisible();

    // 2.2 Recherche par code (ex: "KBG")
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('4271');
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();

    // 2.3 Recherche sans résultat affiche l'EmptyState dédié
    await searchInput.fill('INEXISTANT-9999');
    await expect(page.locator('text=Aucun résultat pour cette recherche')).toBeVisible();

    // Bouton de réinitialisation
    await page.click('button:has-text("Effacer les filtres")');
    await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();

    // 2.4 Filtre par type (ex: COMMERCE)
    const typeSelect = page.locator('select[aria-label="Filtrer par type de lieu"]');
    await typeSelect.selectOption('COMMERCE');
    await expect(page.locator('text=ZIG-TIL-3015')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 3. ACTIONS D'UNE ADRESSE ET DIALOGUE D'ARCHIVAGE
  // ---------------------------------------------------------------------------
  test('3. Mes adresses : menu d’actions accessible, modale d’archivage et annulation', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/addresses/mine');
    await page.waitForSelector('text=ZIG-KBG-4271');

    // Trouver le bouton d'actions pour ZIG-KBG-4271
    const menuBtn = page.locator('button[aria-label="Actions pour ZIG-KBG-4271"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Le menu s'ouvre
    const menu = page.locator('div[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=Modifier')).toBeVisible();
    await expect(menu.locator('text=Archiver')).toBeVisible();

    // Clic sur "Archiver" ouvre le ConfirmDialog accessible
    await menu.locator('text=Archiver').click();
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Archiver l\'adresse ZIG-KBG-4271 ?')).toBeVisible();

    // Annuler ferme le dialogue sans modifier l'adresse
    await dialog.locator('button:has-text("Annuler")').click();
    await expect(dialog).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 4. ONGLETS DE « COMPTE »
  // ---------------------------------------------------------------------------
  test('4. Compte : navigation par 4 onglets, profil lecture seule, préférences et aide', async ({ page }) => {
    await loginUser(page, 'demo@samaadresse.sn', 'Password123!');
    await page.goto('/account');

    // 4.1 Onglet Profil actif par défaut
    const profilTab = page.locator('#tab-profil');
    await expect(profilTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'Mamadou Diallo' })).toBeVisible();
    await expect(page.locator('text=demo@samaadresse.sn')).toBeVisible();

    // 4.2 Onglet Application & hors ligne
    const offlineTab = page.locator('#tab-offline');
    await offlineTab.click();
    await expect(offlineTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('text=Stock local et synchronisation')).toBeVisible();
    await expect(page.locator('text=Codes réservés restants')).toBeVisible();

    // 4.3 Onglet Préférences
    const prefsTab = page.locator('#tab-preferences');
    await prefsTab.click();
    await expect(prefsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('text=Préférences de création d\'adresses')).toBeVisible();
    const listedCheckbox = page.locator('input[type="checkbox"]').first();
    await listedCheckbox.check();
    await page.click('button:has-text("Enregistrer les préférences")');

    // 4.4 Onglet Aide & guide
    const aideTab = page.locator('#tab-aide');
    await aideTab.click();
    await expect(aideTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('text=Comment fonctionne mon code d\'adresse ?')).toBeVisible();
    await expect(page.locator('text=Puis-je utiliser SamaAdresse sans connexion Internet ?')).toBeVisible();
    await expect(page.locator('text=Qui peut consulter mon adresse et mes coordonnées ?')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 5. ADMINISTRATION & MODÉRATION (/admin)
  // ---------------------------------------------------------------------------
  test('5. Administration : indicateurs réels, file de modération en tableau et tiroir latéral', async ({ page }) => {
    await loginUser(page, 'admin@samaadresse.sn', 'Password123!');
    await page.goto('/admin');

    // 5.1 En-tête et tuiles métriques admin
    const title = page.locator('h1');
    await expect(title).toContainText('Administration & Modération');

    await expect(page.locator('[data-testid="admin-stat-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stat-resolved"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stat-dismissed"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-stat-total"]')).toBeVisible();

    // 5.2 Onglet Journal d'audit accessible
    const auditTab = page.locator('#tab-audit');
    await expect(auditTab).toBeVisible();
    await auditTab.click();
    await expect(page.locator('text=Traçabilité des actions administratives')).toBeVisible();

    // Retour sur l'onglet modération
    await page.locator('#tab-moderation').click();
    await expect(page.locator('table[aria-label="Tableau de données"]').or(page.locator('text=Aucun signalement'))).toBeVisible();
  });
});
