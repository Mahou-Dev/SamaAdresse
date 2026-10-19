import fs from 'node:fs';
import path from 'node:path';
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

const cspViolations: { url: string; message: string }[] = [];

test.describe('LOT 7 — Capture d\'adresse hors ligne & synchronisation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('securitypolicyviolation')) {
        cspViolations.push({ url: page.url(), message: text });
      }
    });
  });

  test.afterAll(async () => {
    const cspPath = path.resolve('..', 'docs/audit/csp-violations.json');
    fs.writeFileSync(
      cspPath,
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          totalViolations: cspViolations.length,
          violations: cspViolations,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
  });

  test('Parcours complet : session limitée, création hors ligne < 3s, file et synchronisation', async ({ context, page }) => {
    test.setTimeout(60000);
    // 1. Connexion en ligne
    await loginUser(page);

    // Attendre que la session charge les réservations de code
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Nouvelle adresse');
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });

    // Attendre que IndexedDB contienne des codes réservés
    let reservedCount = 0;
    for (let i = 0; i < 20; i++) {
      reservedCount = await page.evaluate(async () => {
        let list = await (window as any).__offlineDb?.getReservedCodes();
        if (!list || list.length === 0) {
          await (window as any).__syncManager?.refreshReservedCodes('ZIG');
          list = await (window as any).__offlineDb?.getReservedCodes();
        }
        return list ? list.length : 0;
      });
      if (reservedCount > 0) break;
      await page.waitForTimeout(500);
    }

    console.log(`[LOT 7] Codes réservés en cache local : ${reservedCount}`);
    expect(reservedCount).toBeGreaterThan(0);

    // 2. Couper le réseau
    await context.setOffline(true);

    // 3. Recharger la page : session reste ouverte en mode limité, bandeau discret visible
    await page.reload();
    await page.waitForSelector('text=Nouvelle adresse');
    await expect(page.locator('text=Nouvelle adresse')).toBeVisible();

    const banner = page.locator('text=Mode hors ligne · les nouvelles adresses seront transmises à votre retour en ligne');
    await expect(banner).toBeVisible();

    // 4. Créer une adresse à Ziguinchor (Boucotte KBG)
    await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
    await page.fill('#manual-lat', '12.5750');
    await page.fill('#manual-lng', '-16.2700');

    // Passer à l'étape 2
    await page.click('button:has-text("Continuer vers les détails")');
    await page.waitForSelector('#address-desc');

    // Étape 2 : Description
    await page.fill('#address-desc', 'Maison familiale en face du marché Boucotte avec portail bleu');
    await page.click('button:has-text("Continuer vers la photo")');
    await page.waitForSelector('text=Ajouter une photo de façade');

    // Captures preuve : wizard_hors_ligne_validation (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/wizard_hors_ligne_validation_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png', fullPage: false });

    // 5. Mesure du temps d'affichage de la plaque hors ligne
    const elapsedMs = await page.evaluate(async () => {
      const t0 = performance.now();
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Passer cette étape') || b.textContent?.includes('Valider et créer')
      ) as HTMLButtonElement | undefined;
      btn?.click();
      while (!document.querySelector('[data-testid="address-plate"]')) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      return Number((performance.now() - t0).toFixed(2));
    });

    console.log(`[LOT 7] Temps d'affichage plaque hors ligne : ${elapsedMs} ms`);
    expect(elapsedMs).toBeLessThan(3000);

    // Vérifier qu'une seule mention "Enregistrée sur cet appareil · en attente d'envoi" est rendue
    const offlineBadges = page.locator('text=Enregistrée sur cet appareil · en attente d\'envoi');
    await expect(offlineBadges).toHaveCount(1);
    const plateCode = await page.locator('[data-testid="address-plate"]').innerText();
    console.log(`[LOT 7] Code de la plaque générée hors ligne : ${plateCode}`);
    expect(plateCode).toMatch(/ZIG-KBG-\d{4}/);

    // Captures preuve 1 : plaque hors ligne avec code réservé (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png', fullPage: false });

    // 6. Aller sur /addresses/mine : le brouillon apparaît dans la file
    await page.goto('/addresses/mine');
    await page.waitForSelector('text=En attente d\'envoi');
    await expect(page.locator('text=En attente d\'envoi')).toBeVisible();
    await expect(page.locator('button:has-text("Envoyer maintenant")')).toBeDisabled();

    // Captures preuve 2 : file d'attente /addresses/mine avec brouillon (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    // Vérifier que le code dans la file d'attente ne se coupe pas sur plusieurs lignes à 360 px
    const queueCodeRects = await page.locator('span.font-mono.whitespace-nowrap').first().evaluate((el) => {
      return {
        rects: el.getClientRects().length,
        whiteSpace: window.getComputedStyle(el).whiteSpace,
      };
    });
    expect(queueCodeRects.whiteSpace).toBe('nowrap');
    expect(queueCodeRects.rects).toBe(1);
    await page.screenshot({ path: '../docs/audit/lot7/file_attente_adresses_mine_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/file_attente_adresses_mine_1440x900.png', fullPage: false });

    // 7. Rétablir le réseau
    await context.setOffline(false);
    await page.waitForTimeout(500);
    await loginUser(page);
    await page.goto('/addresses/mine');
    await page.waitForSelector('text=Mes adresses');

    // 8. Déclencher ou attendre la synchronisation
    const syncBtn = page.locator('button:has-text("Envoyer maintenant")');
    if (await syncBtn.isVisible().catch(() => false)) {
      if (await syncBtn.isEnabled({ timeout: 5000 }).catch(() => false)) {
        await syncBtn.click().catch(() => {});
      }
    }

    // Attendre que la synchronisation soit terminée et que la file d'attente disparaisse
    await expect(page.locator('text=En attente d\'envoi')).not.toBeVisible({ timeout: 15000 });

    // 9. Attendre que l'adresse apparaisse dans les adresses actives
    await expect(page.locator('text=Maison familiale en face du marché Boucotte').first()).toBeVisible({ timeout: 10000 });

    // Captures preuve : adresse_apres_synchronisation (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/adresse_apres_synchronisation_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/adresse_apres_synchronisation_1440x900.png', fullPage: false });

    // 10. Aller sur /a/{code} : la fiche publique est accessible
    const publicLink = page.locator('a[title="Ouvrir la fiche publique"]').first();
    await publicLink.waitFor({ state: 'visible', timeout: 10000 });
    await publicLink.click();
    await page.waitForURL('**/a/**', { timeout: 10000 });
    await expect(page.locator('text=Maison familiale en face du marché Boucotte').first()).toBeVisible({ timeout: 10000 });
  });

  test('Cas limite 1 : création hors ligne sans code réservé (ZIG-KBG-????) et hors zone hors ligne', async ({ context, page }) => {
    await loginUser(page);

    // Naviguer sur la page de création
    await page.goto('/addresses/new');
    await page.waitForSelector('#step1-title');

    // Passer hors ligne
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#step1-title');
    await page.waitForSelector('.leaflet-container');

    // Vider les codes réservés locaux dans IndexedDB pendant qu'on est hors ligne
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearReservedCodes();
    });

    // 1a. Vérifier le rejet hors zone hors ligne (ex: Tambacounda 13.7700, -13.6700 — hors zones couvertes)
    await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
    await page.waitForSelector('#manual-lat', { state: 'visible' });
    await page.fill('#manual-lat', '13.7700');
    await page.fill('#manual-lng', '-13.6700');
    await expect(page.locator('#manual-lat')).toHaveValue('13.7700');
    await expect(page.locator('#manual-lng')).toHaveValue('-13.6700');
    await page.click('button:has-text("Continuer vers les détails")');
    await expect(page.locator('[role="alert"]')).toContainText(
      "Ces coordonnées sont hors des zones couvertes (Ziguinchor, Dakar, Saint-Louis). Déplacez le repère ou saisissez d'autres coordonnées."
    );

    // Captures preuve : hors_zone_hors_ligne (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/hors_zone_hors_ligne_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/hors_zone_hors_ligne_1440x900.png', fullPage: false });

    // 1b. Saisie manuelle valide quartier KBG sans code réservé
    await page.fill('#manual-lat', '12.5750');
    await page.fill('#manual-lng', '-16.2700');
    await page.click('button:has-text("Continuer vers les détails")');

    await page.waitForSelector('#address-desc');
    await page.fill('#address-desc', 'Atelier mécanique sans réservation préalable');
    await page.click('button:has-text("Continuer vers la photo")');

    await page.waitForSelector('text=Ajouter une photo de façade');
    await page.click('button:has-text("Passer cette étape")');

    // Vérifier la plaque avec ???? et l'avertissement (une seule mention d'attente d'envoi)
    await page.waitForSelector('text=ZIG-KBG-????');
    await expect(page.locator('text=ZIG-KBG-????')).toBeVisible();
    await expect(page.locator('text=Enregistrée sur cet appareil · en attente d\'envoi')).toHaveCount(1);
    await expect(page.getByText('Code temporaire attribué hors ligne', { exact: false })).toBeVisible();

    // Captures preuve 3 : plaque hors ligne sans code réservé (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png', fullPage: false });

    // Nettoyer le brouillon créé
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });

    await context.setOffline(false);
  });

  test('Cas limite 2 : modale d\'avertissement à la déconnexion avec brouillon en attente', async ({ page }) => {
    await loginUser(page);

    // Insérer un brouillon en attente dans IndexedDB
    await page.goto('/account');
    await page.waitForSelector('text=Espace personnel');
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.saveDraft({
        id: 'draft-test-logout',
        clientRequestId: 'req-test-logout',
        latitude: 12.5800,
        longitude: -16.2710,
        zone: 'ZIG',
        quartier: 'ESC',
        description: 'Brouillon test logout',
        locationType: 'MAISON',
        photoBlob: null,
        reservedCode: 'ZIG-ESC-9999',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
    });

    // Cliquer sur déconnexion
    await page.click('button:has-text("Se déconnecter")');

    // Vérifier apparition de la modale d'avertissement
    await page.waitForSelector('text=Adresses en attente d\'envoi');
    await expect(page.locator('text=Adresses en attente d\'envoi')).toBeVisible();
    await expect(page.locator('text=1 adresse enregistrée sur cet appareil n\'est pas encore envoyée')).toBeVisible();

    // Captures preuve 4 : modale d'avertissement déconnexion (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/modale_avertissement_deconnexion_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png', fullPage: false });

    // Annuler la déconnexion et nettoyer le brouillon
    await page.click('button:has-text("Annuler")');
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });
  });

  test('Cas limite 3 : réassignation réelle de code par le serveur lors de la synchronisation', async ({ page }) => {
    await loginUser(page);

    // 1. S'assurer que l'utilisateur dispose de vrais codes réservés depuis le serveur
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Nouvelle adresse');
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });

    let realKbgReservedCode: string | null = null;
    for (let i = 0; i < 20; i++) {
      realKbgReservedCode = await page.evaluate(async () => {
        let list = await (window as any).__offlineDb?.getReservedCodes();
        let kbg = list?.find((c: any) => c.quartier === 'KBG' && c.status === 'RESERVED');
        if (!kbg) {
          await (window as any).__syncManager?.refreshReservedCodes('ZIG');
          list = await (window as any).__offlineDb?.getReservedCodes();
          kbg = list?.find((c: any) => c.quartier === 'KBG' && c.status === 'RESERVED');
        }
        return kbg ? kbg.code : null;
      });
      if (realKbgReservedCode) break;
      await page.waitForTimeout(500);
    }
    expect(realKbgReservedCode).toMatch(/^ZIG-KBG-\d{4}$/);

    // 2. Créer un brouillon dont les coordonnées réelles sont dans ESC (Escale) mais portant le code réservé de KBG
    await page.evaluate(async (reservedCode: string) => {
      await (window as any).__offlineDb?.saveDraft({
        id: crypto.randomUUID(),
        clientRequestId: crypto.randomUUID(),
        latitude: 12.5852,
        longitude: -16.2684,
        zone: 'ZIG',
        quartier: 'ESC',
        description: 'Cabinet médical Escale après déplacement du point GPS',
        locationType: 'COMMERCE',
        photoBlob: null,
        reservedCode,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
    }, realKbgReservedCode);

    // 3. Aller sur /addresses/mine et déclencher la synchronisation réelle avec le backend
    await page.goto('/addresses/mine');
    await page.waitForSelector('text=En attente d\'envoi');
    await page.click('button:has-text("Envoyer maintenant")');

    // 4. Attendre la bannière de réassignation générée par la réponse du serveur (avec le nom du quartier Escale, sans toast en double)
    const statusBanner = page.locator('[role="status"]').filter({ hasText: 'a été remplacé par' });
    await expect(statusBanner).toBeVisible({ timeout: 10000 });
    const bannerText = await statusBanner.innerText();
    console.log(`[LOT 7] Bannière de réassignation réelle : ${bannerText}`);
    expect(bannerText).toContain(`Le code provisoire ${realKbgReservedCode} a été remplacé par `);
    expect(bannerText).toMatch(/ZIG-ESC-\d{4}, car l'adresse se trouve à Escale( Center)?\./);

    // Un seul message de réattribution (pas de toast en double), le toast "synchronisée !" reste distinct
    await expect(page.locator('text=a été remplacé par')).toHaveCount(1);
    await expect(page.locator('text=synchronisée !')).toBeVisible();

    // Vérifier la taille tactile >= 44px du bouton Fermer de la bannière
    const closeBtnBox = await statusBanner.locator('button:has-text("Fermer")').boundingBox();
    expect(closeBtnBox).not.toBeNull();
    expect(closeBtnBox!.height).toBeGreaterThanOrEqual(44);
    expect(closeBtnBox!.width).toBeGreaterThanOrEqual(44);

    // Captures preuve 5 : notification réassignation de code réelle (360x780 et 1440x900)
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/notification_reassignation_code_360x780.png', fullPage: false });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: '../docs/audit/lot7/notification_reassignation_code_1440x900.png', fullPage: false });
  });

  test('Cas limite 4 : plafond de 20 brouillons', async ({ context, page }) => {
    await loginUser(page);

    // Remplir la file avec 20 brouillons via __offlineDb
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Nouvelle adresse');
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
      for (let i = 1; i <= 20; i++) {
        await (window as any).__offlineDb?.saveDraft({
          id: `draft-cap-${i}`,
          clientRequestId: `req-cap-${i}`,
          latitude: 12.5750,
          longitude: -16.2700,
          zone: 'ZIG',
          quartier: 'KBG',
          description: `Brouillon cap ${i}`,
          locationType: 'MAISON',
          photoBlob: null,
          reservedCode: `ZIG-KBG-00${i < 10 ? '0' + i : i}`,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          attempts: 0,
        });
      }
    });

    // Passer hors ligne et tenter une 21e création
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('text=Nouvelle adresse');

    await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
    await page.fill('#manual-lat', '12.5750');
    await page.fill('#manual-lng', '-16.2700');
    await page.click('button:has-text("Continuer vers les détails")');

    await page.waitForSelector('#address-desc');
    await page.fill('#address-desc', '21e adresse dépassant le plafond');
    await page.click('button:has-text("Continuer vers la photo")');

    await page.waitForSelector('text=Ajouter une photo de façade');
    await page.click('button:has-text("Passer cette étape")');

    // Vérifier l'erreur de plafond
    await page.waitForSelector('text=File d\'attente pleine (20 adresses)');
    await expect(page.locator('text=File d\'attente pleine (20 adresses)')).toBeVisible();

    // Nettoyer IndexedDB
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });

    await context.setOffline(false);
  });

  test('Mesure de performance hors ligne : 5 mesures avec code réservé et 5 sans code réservé (< 3000 ms)', async ({ context, page }) => {
    await loginUser(page);
    await page.goto('/addresses/new');
    await page.waitForSelector('text=Nouvelle adresse');

    // S'assurer d'avoir des codes réservés en local
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
      await (window as any).__syncManager?.refreshReservedCodes('ZIG');
    });

    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#step1-title');

    // Activer le ralentissement CPU 4x via Chrome DevTools Protocol pour documenter le ralentissement processeur utilisé
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const withReservedCodeMs: number[] = [];
    const withoutReservedCodeMs: number[] = [];
    const quartiers = [
      { lat: '12.5750', lng: '-16.2700' }, // KBG
      { lat: '12.5852', lng: '-16.2684' }, // ESC
      { lat: '12.5654', lng: '-16.2948' }, // TIL
      { lat: '12.5542', lng: '-16.2731' }, // KND
      { lat: '12.5583', lng: '-16.2455' }, // NEM
    ];

    // 5 mesures AVEC code réservé
    for (let i = 0; i < 5; i++) {
      const q = quartiers[i];
      await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
      await page.fill('#manual-lat', q.lat);
      await page.fill('#manual-lng', q.lng);
      await page.click('button:has-text("Continuer vers les détails")');
      await page.waitForSelector('#address-desc');
      await page.fill('#address-desc', `Mesure timing avec code réservé #${i + 1}`);
      await page.click('button:has-text("Continuer vers la photo")');
      await page.waitForSelector('text=Ajouter une photo de façade');

      const duration = await page.evaluate(async () => {
        const t0 = performance.now();
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.includes('Passer cette étape')
        ) as HTMLButtonElement | undefined;
        btn?.click();
        while (!document.querySelector('[data-testid="address-plate"]')) {
          await new Promise((r) => requestAnimationFrame(r));
        }
        return Number((performance.now() - t0).toFixed(2));
      });
      withReservedCodeMs.push(duration);

      await page.click('button:has-text("Enregistrer une autre adresse")');
      await page.waitForSelector('#step1-title');
    }

    // Vider les codes réservés et les brouillons pour mesurer SANS code réservé
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
      await (window as any).__offlineDb?.clearReservedCodes();
    });

    // 5 mesures SANS code réservé
    for (let i = 0; i < 5; i++) {
      const q = quartiers[i];
      await page.locator('summary:has-text("Saisir les coordonnées manuellement")').click();
      await page.fill('#manual-lat', q.lat);
      await page.fill('#manual-lng', q.lng);
      await page.click('button:has-text("Continuer vers les détails")');
      await page.waitForSelector('#address-desc');
      await page.fill('#address-desc', `Mesure timing sans code réservé #${i + 1}`);
      await page.click('button:has-text("Continuer vers la photo")');
      await page.waitForSelector('text=Ajouter une photo de façade');

      const duration = await page.evaluate(async () => {
        const t0 = performance.now();
        const btn = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.includes('Passer cette étape')
        ) as HTMLButtonElement | undefined;
        btn?.click();
        while (!document.querySelector('[data-testid="address-plate"]')) {
          await new Promise((r) => requestAnimationFrame(r));
        }
        return Number((performance.now() - t0).toFixed(2));
      });
      withoutReservedCodeMs.push(duration);

      await page.click('button:has-text("Enregistrer une autre adresse")');
      await page.waitForSelector('#step1-title');
    }

    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.evaluate(async () => {
      await (window as any).__offlineDb?.clearDrafts();
    });
    await context.setOffline(false);

    const computeMedian = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    const allMeasurements = [...withReservedCodeMs, ...withoutReservedCodeMs];
    const medianWithReserved = computeMedian(withReservedCodeMs);
    const medianWithoutReserved = computeMedian(withoutReservedCodeMs);
    const medianOverall = computeMedian(allMeasurements);

    const timingData = {
      measuredAt: new Date().toISOString(),
      criterionMaxMs: 3000,
      excludedFromMeasurement:
        "Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)",
      cpuThrottling: '4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)',
      withReservedCode: {
        samplesMs: withReservedCodeMs,
        medianMs: medianWithReserved,
      },
      withoutReservedCode: {
        samplesMs: withoutReservedCodeMs,
        medianMs: medianWithoutReserved,
      },
      overallMedianMs: medianOverall,
      status: medianWithReserved < 3000 && medianWithoutReserved < 3000 ? 'Atteint' : 'NON ATTEINT',
    };

    const outPath = path.resolve('..', 'docs/audit/offline-timing.json');
    fs.writeFileSync(outPath, JSON.stringify(timingData, null, 2) + '\n', 'utf8');
    console.log('[LOT 7] Mesures offline-timing.json :', JSON.stringify(timingData));

    expect(medianWithReserved).toBeLessThan(3000);
    expect(medianWithoutReserved).toBeLessThan(3000);
  });
});
