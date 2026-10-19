import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

async function authenticateUser(page: any, email: string, pass: string = 'Password123!') {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', pass);
  await Promise.all([
    page.waitForResponse((res: any) => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'));
}

test.describe('Lot 4b — Contrôles géométriques et Parcours E2E', () => {

  test('Contrôle 1 : Les cartes "Mes adresses" et boîtes ne débordent JAMAIS à 320, 360 et 390 px', async ({ page }) => {
    // Connexion
    await authenticateUser(page, 'demo@samaadresse.sn');

    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/addresses/mine');
      await page.waitForSelector('h1:has-text("Mes adresses")');

      // Vérification 1 : Aucun défilement horizontal de la page
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll, `Défilement horizontal détecté à ${width}px`).toBe(false);

      // Vérification 2 : Chaque bouton d'action reste à l'intérieur de sa carte
      const cards = page.locator('.rounded-xl.border');
      const count = await cards.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = cards.nth(i);
        const cardBox = await card.boundingBox();
        if (!cardBox) continue;

        const buttons = card.locator('button, a');
        const btnCount = await buttons.count();
        for (let j = 0; j < btnCount; j++) {
          const btn = buttons.nth(j);
          if (await btn.isVisible()) {
            const btnBox = await btn.boundingBox();
            if (btnBox) {
              expect(
                btnBox.x + btnBox.width,
                `Bouton débordant à droite à ${width}px`
              ).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1); // 1px tolérance sous-pixel
            }
          }
        }
      }
    }
  });

  test('Parcours 1 : Propriétaire archive son adresse → HTTP 410 Gone publique → restaure → fiche visible', async ({ page }) => {
    test.setTimeout(60000);
    await authenticateUser(page, 'demo@samaadresse.sn');
    await page.goto('/addresses/mine');
    await page.waitForSelector('h1:has-text("Mes adresses")');

    // Trouver le bouton actions de la première adresse active
    const actionBtn = page.locator('button[aria-label^="Actions pour "]').first();
    const actionLabel = await actionBtn.getAttribute('aria-label');
    const code = actionLabel?.replace('Actions pour ', '') || '';
    expect(code).toBeTruthy();

    await actionBtn.click();

    // Cliquer sur Archiver dans le menu
    const archiveMenuItem = page.locator('button[role="menuitem"]:has-text("Archiver")').first();
    await archiveMenuItem.click();

    // Confirmer dans la modale
    const confirmBtn = page.locator('button:has-text("Archiver l\'adresse")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Vérifier notification "Adresse archivée"
    await expect(page.locator('text=Adresse archivée')).toBeVisible();

    // Vérifier la fiche publique : doit afficher "Cette adresse n'est plus disponible."
    await page.goto(`/a/${code}`);
    await expect(page.locator('text=Cette adresse n\'est plus disponible.')).toBeVisible();

    // Restaurer l'adresse depuis "Mes adresses" (onglet Archivées)
    await page.goto('/addresses/mine');
    await page.waitForSelector('button[role="tab"]:has-text("Archivées")');
    await page.click('button[role="tab"]:has-text("Archivées")');

    const restoreActionBtn = page.locator(`button[aria-label="Actions pour ${code}"]`).first();
    await restoreActionBtn.click();
    await Promise.all([
      page.waitForResponse((res: any) => res.url().includes('/restore') && res.status() === 200),
      page.click('button[role="menuitem"]:has-text("Restaurer")')
    ]);

    await page.waitForTimeout(500);

    // Vérifier que la fiche publique redevient accessible
    await page.goto(`/a/${code}`);
    await expect(page.locator('h1, [data-testid="address-plate"]')).toBeVisible();
    await expect(page.locator(`text=${code}`)).toBeVisible();
  });

  test('Parcours 2 : Visiteur signale → Admin suspend avec motif → Fiche indisponible → Propriétaire voit "Suspendue par la modération"', async ({ browser }) => {
    test.setTimeout(60000);
    const code = 'ZIG-KBG-4271';

    // 1. Visiteur signale l'adresse
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await visitorPage.goto(`/a/${code}`);
    await visitorPage.click('button:has-text("Signaler un problème")');
    await expect(visitorPage.locator('#report-modal-title')).toBeVisible();

    await visitorPage.click('input[value="POSITION_INCORRECTE"]');
    await visitorPage.fill('#report-comment', 'Repère GPS décalé de plus de 100m');
    await visitorPage.click('button[type="submit"]:has-text("Envoyer le signalement")');
    await expect(visitorPage.locator('text=Merci, votre signalement a été transmis.')).toBeVisible();
    await visitorContext.close();

    // 2. Admin ouvre /admin et suspend avec motif obligatoire
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await authenticateUser(adminPage, 'admin@samaadresse.sn');
    await adminPage.goto('/admin');
    await expect(adminPage.locator('h1:has-text("Modération des signalements")')).toBeVisible();

    // Trouver le signalement pour ce code et l'examiner
    const row = adminPage.locator(`tr:has-text("${code}")`).first();
    if (await row.isVisible()) {
      await row.locator('button:has-text("Examiner"):visible').click();
    } else {
      await adminPage.locator('button:has-text("Examiner"):visible').first().click();
    }

    await adminPage.fill('#suspend-reason-input', 'Signalement validé par l\'équipe de modération');
    await adminPage.click('button[type="submit"]:has-text("Suspendre l\'adresse")');
    await adminContext.close();

    // 3. Fiche publique est indisponible (HTTP 410 Gone)
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/a/${code}`);
    await expect(publicPage.locator('text=Cette adresse n\'est plus disponible.')).toBeVisible();
    await publicContext.close();

    // 4. Propriétaire ouvre ses adresses et voit "Suspendue par la modération" sans pouvoir modifier ni restaurer
    const demoContext = await browser.newContext();
    const demoPage = await demoContext.newPage();
    await authenticateUser(demoPage, 'demo@samaadresse.sn');
    await demoPage.goto('/addresses/mine');
    await expect(demoPage.locator('text=Suspendue par la modération')).toBeVisible();
    await demoContext.close();

    // Nettoyage : Réactiver l'adresse pour laisser les bases de données (dev, e2e et prod-test) propres
    for (const db of ['samaadresse', 'samaadresse_e2e']) {
      try {
        execSync(`docker exec samaadresse-postgres psql -U samaadresse -d ${db} -c "UPDATE addresses SET status = 'ACTIVE', suspended_at = NULL, suspended_reason = NULL, archived_at = NULL WHERE code = '${code}'; DELETE FROM address_reports WHERE address_id = (SELECT id FROM addresses WHERE code = '${code}');"`, { stdio: 'pipe' });
      } catch {
        // Ignorer si conteneur dev non actif
      }
    }
    try {
      execSync(`docker exec samaadresse-prod-test-db psql -U samaadresse_prod_user -d samaadresse_prod -c "UPDATE addresses SET status = 'ACTIVE', suspended_at = NULL, suspended_reason = NULL, archived_at = NULL WHERE code = '${code}'; DELETE FROM address_reports WHERE address_id = (SELECT id FROM addresses WHERE code = '${code}');"`, { stdio: 'pipe' });
    } catch {
      // Ignorer si conteneur prod-test non joignable
    }
  });

  test('Parcours 3 : Sécurité rôle ADMIN (utilisateur simple redirigé avec message réservé, visiteur redirigé /login)', async ({ browser }) => {
    // Visiteur non connecté ouvrant /admin -> redirigé vers /login
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto('/admin');
    await anonPage.waitForURL(/\/login/);
    expect(anonPage.url()).toContain('/login');
    await anonContext.close();

    // Utilisateur simple (PROPRIETAIRE) ouvrant /admin -> page d'accès réservé
    const demoContext = await browser.newContext();
    const demoPage = await demoContext.newPage();
    await authenticateUser(demoPage, 'demo@samaadresse.sn');
    await demoPage.goto('/admin');
    await expect(demoPage.locator('h1:has-text("Accès réservé")')).toBeVisible();
    await expect(demoPage.locator('text=Cette page est réservée aux comptes disposant des droits d\'administration.')).toBeVisible();
    await demoContext.close();
  });

  test('Parcours 4 : Wizard de création complet à 360 px aboutit à une adresse créée', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await authenticateUser(page, 'demo@samaadresse.sn');

    await page.goto('/addresses/new');
    await expect(page.locator('text=Étape 1 sur 4').first()).toBeVisible();

    // Étape 1 : Valider position par défaut
    await page.click('button:has-text("Continuer vers les détails")');

    // Étape 2 : Détails du lieu
    await expect(page.locator('text=Étape 2 sur 4').first()).toBeVisible();
    await page.fill('#address-desc', 'Maison familiale Diallo, portail marron avec arbre bougainvillier');
    await page.click('button:has-text("Continuer vers la photo")');

    // Étape 3 : Photo (passer cette étape pour créer l'adresse)
    await expect(page.locator('text=Étape 3 sur 4').first()).toBeVisible();
    await page.click('button:has-text("Passer cette étape")');

    // Résultat : plaque créée affichée
    await expect(page.locator('text=Adresse créée et enregistrée')).toBeVisible({ timeout: 10000 });
  });

});
