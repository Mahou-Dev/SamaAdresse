import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:4173';
const OUT_DIR = path.resolve('/home/mahou-dev/Documents/SamaAdresse/docs/audit/lot6');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const mockRouteCar = {
  distance: 2450,
  duration: 340,
  profile: 'driving-car',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-16.2719, 12.5833],
      [-16.2725, 12.5810],
      [-16.2730, 12.5795],
      [-16.271944, 12.578333]
    ]
  },
  steps: [
    { instruction: 'Dirigez-vous vers le sud sur la Rue Principale', distance: 450, duration: 60, name: 'Rue Principale' },
    { instruction: 'Tournez à gauche vers l’avenue Capitaine', distance: 800, duration: 110, name: 'Avenue Capitaine' },
    { instruction: 'Continuez tout droit vers la Grande Mosquée', distance: 1200, duration: 170, name: 'Grande Mosquée' }
  ]
};

const mockRouteFoot = {
  distance: 2100,
  duration: 1500,
  profile: 'foot-walking',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-16.2719, 12.5833],
      [-16.2722, 12.5815],
      [-16.2725, 12.5800],
      [-16.271944, 12.578333]
    ]
  },
  steps: [
    { instruction: 'Empruntez l’allée piétonne vers le sud', distance: 400, duration: 300, name: 'Allée' },
    { instruction: 'Suivez le passage ombragé à gauche', distance: 700, duration: 500, name: 'Passage' },
    { instruction: 'Arrivée face au portail vert de la concession', distance: 1000, duration: 700, name: 'Arrivée' }
  ]
};

async function loginUser(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('#email', 'demo@samaadresse.sn');
  await page.fill('#password', 'Password123!');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);
  await page.waitForURL(url => !url.pathname.includes('/login'));
}

async function run() {
  const browser = await chromium.launch({
    executablePath: '/home/mahou-dev/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    headless: true
  });

  const viewports = [
    { name: '360x780', width: 360, height: 780 },
    { name: '1440x900', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    console.log(`\n=================== VIEWPORT ${vp.name} ===================`);

    // 1. Landing hors ligne
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForSelector('text=ZIG-KBG-4271');
      await context.setOffline(true);
      await page.reload();
      await page.waitForSelector('text=ZIG-KBG-4271');
      await page.screenshot({ path: path.join(OUT_DIR, `landing_${vp.name}_offline.png`) });
      await context.close();
      console.log(`Captured: landing_${vp.name}_offline.png`);
    }

    // 2. Wizard hors ligne (fullPage avec bouton désactivé)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await loginUser(page);
      await page.goto(`${BASE_URL}/addresses/new`);
      await page.waitForSelector('text=Emplacement');
      await context.setOffline(true);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, `wizard_${vp.name}_offline_fullpage.png`), fullPage: true });
      await context.close();
      console.log(`Captured: wizard_${vp.name}_offline_fullpage.png`);
    }

    // 3. Carte hors ligne : zone déjà vue (tuiles en cache)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/a/ZIG-KBG-4271`);
      await page.waitForSelector('text=ZIG-KBG-4271');
      await page.waitForTimeout(1500); // laisser le temps aux tuiles de se cacher
      await context.setOffline(true);
      await page.reload();
      await page.waitForSelector('text=ZIG-KBG-4271');
      await page.waitForSelector('text=Vous êtes hors ligne');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `carte_${vp.name}_offline_vue.png`) });
      await context.close();
      console.log(`Captured: carte_${vp.name}_offline_vue.png`);
    }

    // 4. Carte hors ligne : zone non vue (fond neutre + message carte indisponible)
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      // On pré-remplit les métadonnées de l'adresse en localStorage pour simuler une consultation sans tuiles
      await page.goto(`${BASE_URL}/`);
      await page.evaluate(() => {
        localStorage.setItem('cached_date_ZIG-KBG-9999', '17/10/2026');
        localStorage.setItem('cached_addr_ZIG-KBG-9999', JSON.stringify({
          code: 'ZIG-KBG-9999',
          zone: 'ZIG',
          quartier: 'KBG',
          locationType: 'MAISON',
          description: 'Maison isolée en périphérie non pré-téléchargée',
          latitude: 12.5600,
          longitude: -16.2900,
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem('visited_address_codes', JSON.stringify(['ZIG-KBG-9999']));
      });
      await context.setOffline(true);
      await page.goto(`${BASE_URL}/a/ZIG-KBG-9999`);
      await page.waitForSelector('text=ZIG-KBG-9999');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `carte_${vp.name}_offline_non_vue.png`) });
      await context.close();
      console.log(`Captured: carte_${vp.name}_offline_non_vue.png`);
    }

    // 5. Annuaire : recherche avec résultats
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/annuaire?q=mosquee`);
      await page.waitForSelector('text=ZIG-KBG-4271');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `annuaire_${vp.name}_recherche.png`) });
      await context.close();
      console.log(`Captured: annuaire_${vp.name}_recherche.png`);
    }

    // 6. Annuaire : aucun résultat
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/annuaire?q=inconnuintrouvable`);
      await page.waitForSelector('text=Aucune adresse ne correspond à votre recherche');
      await page.screenshot({ path: path.join(OUT_DIR, `annuaire_${vp.name}_aucun_resultat.png`) });
      await context.close();
      console.log(`Captured: annuaire_${vp.name}_aucun_resultat.png`);
    }

    // 7. Annuaire : hors ligne
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/annuaire`);
      await page.waitForSelector('text=Annuaire public');
      await context.setOffline(true);
      await page.reload();
      await page.waitForSelector('text=L\'annuaire n\'est pas disponible hors ligne');
      await page.screenshot({ path: path.join(OUT_DIR, `annuaire_${vp.name}_offline.png`) });
      await context.close();
      console.log(`Captured: annuaire_${vp.name}_offline.png`);
    }

    // 8. Wizard : Étape 2 avec visibilité dépliée
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await loginUser(page);
      await page.goto(`${BASE_URL}/addresses/new`);
      await page.click('button:has-text("Continuer vers les détails")');
      await page.waitForSelector('text=Visibilité dans l\'annuaire');
      await page.locator('summary:has-text("Visibilité dans l\'annuaire")').click();
      await page.locator('#directory-listed').check();
      await page.waitForSelector('#directory-show-owner');
      await page.screenshot({ path: path.join(OUT_DIR, `wizard_${vp.name}_etape2_visibilite.png`) });
      await context.close();
      console.log(`Captured: wizard_${vp.name}_etape2_visibilite.png`);
    }

    // 9. Mes adresses : Pill « Dans l'annuaire »
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await loginUser(page);
      await page.goto(`${BASE_URL}/addresses/mine`);
      await page.waitForSelector('text=Dans l\'annuaire');
      await page.screenshot({ path: path.join(OUT_DIR, `mes_adresses_${vp.name}_pill_annuaire.png`) });
      await context.close();
      console.log(`Captured: mes_adresses_${vp.name}_pill_annuaire.png`);
    }

    // 10. Fiche publique : Itinéraire Voiture
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        geolocation: { latitude: 12.5833, longitude: -16.2719 },
        permissions: ['geolocation']
      });
      const page = await context.newPage();
      // Intercepter route pour simuler la réponse valide du service ORS
      await page.route('**/api/public/route*', (route) => {
        const url = route.request().url();
        if (url.includes('foot-walking')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRouteFoot) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRouteCar) });
      });

      await page.goto(`${BASE_URL}/a/ZIG-KBG-4271`);
      await page.waitForSelector('text=Itinéraire vers ce lieu');
      const calcBtn = page.locator('button.bg-\\[\\#1D528F\\]:has-text("Itinéraire depuis ma position")');
      await calcBtn.click();
      await page.waitForSelector('text=Voir les 3 étapes');
      await page.click('button:has-text("Voir les 3 étapes")');
      await page.waitForSelector('text=Rue Principale');
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT_DIR, `fiche_${vp.name}_itineraire_voiture.png`) });

      // 11. Fiche publique : Itinéraire À pied
      await page.click('button:has-text("À pied")');
      await page.waitForSelector('text=Allée');
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT_DIR, `fiche_${vp.name}_itineraire_pied.png`) });

      await context.close();
      console.log(`Captured: fiche_${vp.name}_itineraire_voiture.png & pied.png`);
    }
  }

  await browser.close();
  console.log('\n=== ALL PROOF SCREENSHOTS CAPTURED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
