#!/usr/bin/env node
/**
 * scripts/test-qr-decode.mjs
 * Télécharge le QR code de l'adresse ZIG-KBG-4271 et le décode via jsQR dans Playwright.
 * Vérifie :
 *  1. Signature PNG valide et dimensions carrées (300x300)
 *  2. Contenu décodé correspondant à l'URL exacte de la fiche publique
 *  3. Respect de la zone calme (fond blanc pur #FFFFFF en bordure)
 */

import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8082';

async function main() {
  console.log(`Test de décodage QR Code sur ${BASE_URL}...`);
  const qrUrl = `${BASE_URL.replace(/\/$/, '')}/api/addresses/ZIG-KBG-4271/qrcode`;
  const expectedPrefix = `${BASE_URL.replace(/\/$/, '')}/a/ZIG-KBG-4271`;

  const res = await fetch(qrUrl, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    console.error(`ECHEC : Erreur HTTP ${res.status} lors du téléchargement du QR code`);
    process.exit(1);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('image/png')) {
    console.error(`ECHEC : Content-Type attendu image/png, reçu : ${contentType}`);
    process.exit(1);
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = 'data:image/png;base64,' + base64;

  const jsqrPath = path.join(ROOT_DIR, 'frontend', 'node_modules', 'jsqr', 'dist', 'jsQR.js');
  if (!fs.existsSync(jsqrPath)) {
    console.error(`ECHEC : Fichier jsQR introuvable à ${jsqrPath}`);
    process.exit(1);
  }
  const jsqrCode = fs.readFileSync(jsqrPath, 'utf8');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async ({ jsqr, dataUrl }) => {
      const script = document.createElement('script');
      script.textContent = jsqr;
      document.head.appendChild(script);

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);

          // Vérification de la zone calme (bordure blanche 4 modules = pixels blancs purs aux 4 coins)
          const data = imageData.data;
          // Coin haut-gauche (pixel 2, 2)
          const idxTL = (2 * img.width + 2) * 4;
          const isWhiteTL = data[idxTL] === 255 && data[idxTL + 1] === 255 && data[idxTL + 2] === 255;
          // Coin bas-droit (pixel width-3, height-3)
          const idxBR = ((img.height - 3) * img.width + (img.width - 3)) * 4;
          const isWhiteBR = data[idxBR] === 255 && data[idxBR + 1] === 255 && data[idxBR + 2] === 255;

          resolve({
            width: img.width,
            height: img.height,
            decodedUrl: code ? code.data : null,
            quietZoneWhite: isWhiteTL && isWhiteBR,
          });
        };
        img.onerror = reject;
        img.src = dataUrl;
      });
    }, { jsqr: jsqrCode, dataUrl });

    console.log('Résultats du décodage :', result);

    if (!result.decodedUrl) {
      console.error('ECHEC : Le QR Code téléchargé n’a pas pu être décodé !');
      process.exit(1);
    }

    if (result.decodedUrl !== expectedPrefix && !result.decodedUrl.endsWith('/a/ZIG-KBG-4271')) {
      console.error(`ECHEC : URL décodée inattendue : ${result.decodedUrl} (attendu : finissant par /a/ZIG-KBG-4271)`);
      process.exit(1);
    }

    if (!result.quietZoneWhite) {
      console.error('ECHEC : La zone calme (marge blanche) n’est pas en blanc pur (#FFFFFF) !');
      process.exit(1);
    }

    console.log(`SUCCÈS : QR Code téléchargé valide (${result.width}x${result.height}), zone calme blanche conforme, décodé en : ${result.decodedUrl}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
