import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';

test.describe('Critère 4 — Fiche publique hors ligne (PWA & Cache)', () => {
  test('Consulter ZIG-KBG-4271 en ligne, couper réseau, recharger, puis consulter adresse inconnue', async ({ page, context }) => {
    // 1. Consulter /a/ZIG-KBG-4271 en ligne
    await page.goto('/a/ZIG-KBG-4271', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toContainText('ZIG-KBG-4271');
    await expect(page.locator('body')).toContainText('Boucotte');

    // Laisser le temps au Service Worker et au CacheStorage d'enregistrer la réponse
    await page.waitForTimeout(2000);

    // 2. Couper le réseau
    await context.setOffline(true);

    // 3. Recharger la page hors ligne
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 4. Vérifier le contenu réel de la fiche en cache :
    // Code, quartier, détails de l'adresse et plaque d'enseigne
    await expect(page.locator('body')).toContainText('ZIG-KBG-4271');
    await expect(page.locator('body')).toContainText('Boucotte');
    // Vérification de la mention explicite de carte indisponible hors ligne
    await expect(page.locator('text=Carte indisponible hors ligne')).toBeVisible();
    // La fiche publique ne comporte pas de QR code dans le flux principal (uniquement plaque et détails)
    const qrImages = page.locator('img[alt*="QR"], img[alt*="qr-code"]');
    await expect(qrImages).toHaveCount(0);

    const path1 = '../docs/audit/recette-live/preuves/offline-cached-address.png';
    const path2 = '../docs/audit/recette-live/preuves/offline-unvisited-address.png';

    // Capture 1 : Fiche rechargée hors ligne (avec plaque, détails et message carte hors ligne)
    await page.screenshot({
      path: path1,
      fullPage: true,
    });

    // 5. Naviguer vers une adresse jamais consultée auparavant
    await page.goto('/a/ZIG-NON-EXIST-9999', { waitUntil: 'domcontentloaded' });

    // 6. Vérifier le message de repli sobre prévu
    await expect(page.locator('text=Cette page n\'est pas disponible hors ligne')).toBeVisible();
    await expect(page.locator('text=Cette adresse n\'a pas encore été consultée sur cet appareil')).toBeVisible();

    // Capture 2 : Message de repli pour adresse inconnue
    await page.screenshot({
      path: path2,
      fullPage: true,
    });

    // 7. Vérification de l'unicité stricte des empreintes MD5 des deux captures
    const buf1 = fs.readFileSync(path1);
    const buf2 = fs.readFileSync(path2);
    const md5_1 = crypto.createHash('md5').update(buf1).digest('hex');
    const md5_2 = crypto.createHash('md5').update(buf2).digest('hex');
    expect(md5_1).not.toBe(md5_2);
  });
});
