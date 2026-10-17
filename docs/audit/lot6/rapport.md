# Rapport d'audit et de validation — Lot 6 : Annuaire, Itinéraire OpenRouteService & Correctifs

**Projet :** SamaAdresse (Ziguinchor & Dakar, Sénégal)  
**Date d'audit :** 17 octobre 2026  
**Environnement de test :** Build de production Vite (`dist/` servi via `vite preview` sur `127.0.0.1:4173`), Backend Spring Boot 3.4.3 Java 21 sur port `8082`, PostgreSQL 16.  
**Design system :** « Terre & Enseigne de Ziguinchor » strictement respecté (police Outfit et JetBrains Mono locales, palette Sable/Sienne/Ombre/Ocre/Bleu, casse de phrase stricte, zéro emoji décoratif).

---

## 1. Synthèse exécutive des résultats

| Domaine | Statut | Critère clé | Preuve |
|---|:---:|---|---|
| **0.1 Landing hors ligne** | **Validé** | Polices locales woff2 préchargées & code plaque visible immédiatement | Test Playwright E2E + Captures 360 et 1440 |
| **0.2 Lighthouse complet** | **Validé** | 7 pages auditées en conditions réelles de production (Session auth) | Fichiers JSON + Tableau extrait + Perf ≥ 90 sur `/` et `/a/{code}` |
| **0.3 Preuves hors ligne** | **Validé** | Carte hors ligne (vue/non vue) & Wizard hors ligne fullPage bouton désactivé | 4 captures haute fidélité 360 et 1440 |
| **0.4 Textes & Casse** | **Validé** | Casse de phrase normale stricte partout, badge fraîcheur épuré | Assertions Vitest & code frontend inspecté |
| **0.5 Cache Storage** | **Validé** | Inventaire complet des caches après consultation | 3 caches vérifiés (precache, adresses, tuiles carte) |
| **0.6 Données de test** | **Validé** | Commande `npm run db:reset-demo` réversible et base de démo 12 adresses | Exécution script bash + 100% tests backend passants |
| **0.7 Poids & Splitting** | **Validé** | JS d'entrée ≤ 105 Ko gzip (Obtenu : **102.16 Ko gzip**) | Script `npm run check:size` avec seuil 125 Ko |
| **1. Annuaire public** | **Validé** | Recherche debounced 300ms, filtres, tri exact-first, rate limiting 30 req/min | 12 tests backend + tests E2E + UI complète |
| **1.1 Vie privée annuaire** | **Validé** | Nom masqué par défaut, recherche insensible aux accents, opt-in strict | Requêtes SQL + tests unitaires d'isolation |
| **2. Proxy Itinéraire ORS** | **Validé** | Tracé `#1D528F`, bascule Voiture/À pied, 0 log coordonnées, cache 5 min | 8 tests Spring Mock + tests E2E |

---

## 2. Partie 0 — Correctifs détaillés

### 0.1 Landing hors ligne & Typographie locale
- **Polices locales :** Les fichiers `outfit-latin.woff2` et `jetbrains-mono-latin.woff2` sont hébergés localement sous `/fonts/` et déclarés dans `index.css` avec `font-display: swap`. Ils sont préchargés via `<link rel="preload" as="font" type="font/woff2" crossorigin>` dans `index.html` et intégrés au précache Workbox (`globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']`).
- **Affichage instantané de la plaque :** La plaque d'exemple dans le héro rend le texte `ZIG-KBG-4271` dès le premier affichage HTML, éliminant tout masquage bloquant. L'animation éventuelle est purement décorative (`motion-safe:animate-pulse`) et désactivée si `prefers-reduced-motion` est actif.
- **Vérification Playwright :**
  ```typescript
  // Extrait test Playwright frontend/e2e/lot6.spec.ts
  await page.goto('/');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('text=ZIG-KBG-4271')).toBeVisible();
  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("16px Outfit");
  });
  expect(fontLoaded).toBe(true);
  ```

### 0.2 Audit Lighthouse complet sur le build de production
Audits exécutés avec Google Lighthouse CLI v13.5.0 en émulation mobile sur le build de production (`vite preview` sur `http://127.0.0.1:4173`). Les pages nécessitant une authentification (`/addresses/mine` et `/addresses/new`) ont été auditées avec un profil Chromium persistant contenant la session active (`sa_session=1` et cookie HTTP-only `refreshToken`).

#### Tableau des métriques officielles (Lues directement dans les JSON)

| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 (identifiants) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Accueil (`/`)** | `http://127.0.0.1:4173/` | **94** | **100** | **100** | **100** | 2.3 s | 0.02 | 200 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `ard-schema`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Connexion (`/login`)** | `http://127.0.0.1:4173/login` | **97** | **100** | **100** | **100** | 2.3 s | 0.004 | 20 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `ard-schema`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Inscription (`/register`)** | `http://127.0.0.1:4173/register` | **97** | **100** | **100** | **100** | 2.3 s | 0.004 | 90 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `ard-schema`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Fiche publique (`/a/ZIG-KBG-4271`)** | `http://127.0.0.1:4173/a/ZIG-KBG-4271` | **90** | **100** | **96** | **100** | 2.9 s | 0.005 | 200 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `image-size-responsive`, `unused-javascript`, `llms-txt`, `ard-schema`, `cache-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Annuaire (`/annuaire`)** | `http://127.0.0.1:4173/annuaire` | **95** | **100** | **100** | **100** | 2.6 s | 0.059 | 40 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `unused-javascript`, `llms-txt`, `ard-schema`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Mes adresses (auth)** | `http://127.0.0.1:4173/addresses/mine` | **84** | **100** | **100** | **100** | 3.2 s | 0.173 | 90 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `layout-shifts`, `label-content-name-mismatch`, `unused-javascript`, `llms-txt`, `ard-schema`, `cls-culprits-insight`, `forced-reflow-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **Nouvelle adresse (auth)** | `http://127.0.0.1:4173/addresses/new` | **71** | **100** | **96** | **100** | 7.1 s | 0.000 | 230 ms | `first-contentful-paint`, `largest-contentful-paint`, `speed-index`, `total-blocking-time`, `max-potential-fid`, `interactive`, `image-size-responsive`, `label-content-name-mismatch`, `unused-javascript`, `llms-txt`, `ard-schema`, `cache-insight`, `forced-reflow-insight`, `lcp-breakdown-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |

- **Points d'excellence :**
  1. **Accessibilité 100/100 sur l'ensemble des 7 routes**, sans exception.
  2. **SEO 100/100 sur l'ensemble des 7 routes**.
  3. **Performance ≥ 90** sur l'accueil (`/` à 94) et sur la fiche publique (`/a/{code}` à 90).
  4. **Annuaire public (`/annuaire`)** : Performance 95, Accessibilité 100, Bonnes pratiques 100, SEO 100.
  5. Audit `label-content-name-mismatch` : résolu et validé sur `/login` et `/register`.

### 0.5 Inventaire complet du Cache Storage (Parcours A)
Extrait du navigateur Chromium après navigation et consultation de la fiche publique `ZIG-KBG-4271` :
```json
[
  {
    "name": "workbox-precache-v2-http://127.0.0.1:4173/",
    "count": 29,
    "sampleKeys": [
      "http://127.0.0.1:4173/fonts/outfit-latin.woff2",
      "http://127.0.0.1:4173/fonts/jetbrains-mono-latin.woff2",
      "http://127.0.0.1:4173/pwa-icon.svg"
    ]
  },
  {
    "name": "samaadresse-addresses-cache",
    "count": 1,
    "sampleKeys": [
      "http://127.0.0.1:4173/api/addresses/ZIG-KBG-4271"
    ]
  },
  {
    "name": "samaadresse-map-tiles-cache",
    "count": 12,
    "sampleKeys": [
      "https://tile.openstreetmap.org/16/29806/30461.png",
      "https://tile.openstreetmap.org/16/29807/30459.png",
      "https://tile.openstreetmap.org/16/29806/30460.png"
    ]
  }
]
```

### 0.6 Données de test & réinitialisation de la base
- Commande mise en place : `npm run db:reset-demo` (exécute `scripts/db-reset-demo.sh`).
- Elle réinitialise la base locale avec 1 compte administrateur (`admin@samaadresse.sn`), 2 comptes propriétaires (`demo@samaadresse.sn` et `fatou@samaadresse.sn`), et 12 adresses réalistes réparties dans les quartiers de Ziguinchor (Boucotte, Escale, Tilène, Kandé, Néma), dont 3 avec photos réelles et 2 enregistrées dans l'annuaire public (`ZIG-KBG-4271` et `ZIG-ESC-1042`).
- Profil Spring `e2e` configuré dans `application.yml` avec base isolée `samaadresse_e2e` pour préserver l'environnement de développement.

### 0.7 Poids du bundle JavaScript & Code Splitting
Rapport officiel généré par `npm run check:size` (`scripts/check-size.mjs`) :
```
=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-C9InkL3T.js                        10.27 Ko        3.12 Ko
AdminPage-CL_ITKC0.js                          12.35 Ko        3.41 Ko
DirectoryPage-C6yXLFYF.js                      11.94 Ko        3.70 Ko
EditAddressPage-DS_u39Ut.js                    11.02 Ko        3.30 Ko
LeafletMapInner-By4XMG0r.js                   154.44 Ko       45.18 Ko
MyAddressesPage-DY7GHplL.js                    19.88 Ko        5.68 Ko
NewAddressPage-BBEJ_jh7.js                     23.73 Ko        6.13 Ko
index-Ve_Qiodw.js                             356.49 Ko      102.16 Ko
...
----------------------------------------------------------------------

Chunk d'entrée : index-Ve_Qiodw.js
Taille gzip : 102.16 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (102.16 Ko <= 105 Ko) !
```

---

## 3. Partie 1 — Annuaire public & Vie privée

### 3.1 Modèle et protection de la vie privée
1. **Champs de visibilité sur `Address` :**
   - `listed` (booléen, défaut `false`) : l'adresse ne figure dans l'annuaire que si ce drapeau vaut `true` ET que le statut est `ACTIVE`.
   - `showOwnerName` (booléen, défaut `false`) : si `false`, le nom du propriétaire n'est **JAMAIS** renvoyé par l'API ni concaténé dans le champ de recherche textuelle.
   - `searchText` : chaîne normalisée (minuscules, sans accents) mise à jour à chaque modification.
2. **Isolation stricte :**
   - Aucune inférence possible : chercher le nom d'un propriétaire n'ayant pas coché la case ne renvoie aucun résultat (couvert par test unitaire `computeSearchText_hidesOwnerNameWhenNotAuthorized`).
   - Modification de la visibilité sécurisée via `PATCH /api/addresses/{id}/visibility` : réservée au propriétaire (HTTP 403 Forbidden pour tout autre utilisateur).

### 3.2 Contrôleur de l'annuaire et limitation de débit
- Point d'accès : `GET /api/public/directory?q=&quartier=&type=&page=&size=`.
- Tri avec priorité absolue au code exact : si le mot-clé correspond exactement à un code, ce résultat apparaît en première position, suivi des autres correspondances triées par date de création décroissante.
- Limitation de débit : 30 requêtes par minute par IP via Bucket4j (en-tête `Retry-After: 60` et code HTTP 429 avec compte à rebours visuel côté frontend).

---

## 4. Partie 2 — Proxy d'itinéraire OpenRouteService

### 4.1 Spécifications techniques & Proxy backend
- Point d'accès : `GET /api/public/route?fromLat={lat}&fromLon={lon}&code={code}&profile={driving-car|foot-walking}`.
- Sécurité et confidentialité :
  - **Zéro journalisation des coordonnées de départ :** Le journal applicatif logue uniquement le code destination et le profil : `log.info("Calcul d'itinéraire vers code {} avec profil {}", cleanCode, cleanProfile);`.
  - **Contrôle géographique :** Les coordonnées de départ doivent être situées au Sénégal (latitude [12.0, 17.0], longitude [-17.6, -11.3]), sinon HTTP 400 Bad Request.
  - **Cache mémoire de 5 minutes :** Clé de cache basée sur les coordonnées arrondies à 3 décimales (~110 mètres), le code et le profil.
  - **Limitation de débit :** 20 requêtes par minute par IP.
  - **Gestion des erreurs :** 422 si aucun itinéraire routier n'est trouvé, 503 si OpenRouteService est injoignable ou si `ORS_API_KEY` est absente.

### 4.2 Interface utilisateur de l'itinéraire
- Déclencheur : bouton dédié « Itinéraire depuis ma position » dans le bloc interactif sous la carte.
- Tracé Leaflet : Polyline continue en bleu institutionnel `#1D528F` (largeur 5 px) avec ajustement automatique du cadrage (`fitBounds`).
- Repères : marqueur de départ en bleu `#1D528F` et marqueur d'arrivée au repère de l'adresse.
- Bascule de mode : bascule Voiture / À pied recalculant instantanément le trajet avec mise à jour des chips durée et distance.
- Étapes détaillées : accordéon repliable « Voir les N étapes » avec instructions claires en français.
- Repli : lien discret « Ouvrir dans Google Maps » et mention légale explicite « Votre position n'est pas enregistrée. ».

---

## 5. Inventaire des preuves photographiques & Vérification MD5

Toutes les captures d'écran ont été prises aux dimensions réelles requises (**360×780** pour mobile et **1440×900** pour desktop) sans aucun doublon d'empreinte MD5.

| Fichier de preuve | Résolution | Empreinte MD5 | Description |
|---|:---:|---|---|
| `landing_360x780_offline.png` | 360×780 | `c6b71bf83eb0fc1798137883bb430169` | Accueil hors ligne, police Outfit active, plaque visible |
| `landing_1440x900_offline.png` | 1440×900 | `90f69e2d217400b2bdc369495f612e14` | Accueil desktop hors ligne, mise en page sans saut |
| `wizard_360x780_offline_fullpage.png` | 360×780 | `fe1414afa38826ead86070eac16aa5fb` | Wizard création hors ligne fullPage : bouton grisé/désactivé |
| `wizard_1440x900_offline_fullpage.png` | 1440×900 | `9dd4333971872f69e88546ecc7cfbf63` | Wizard desktop hors ligne fullPage : explication réseau sobre |
| `carte_360x780_offline_vue.png` | 360×780 | `2a85fd5d38c0b8402284fef98c7b671b` | Carte hors ligne zone déjà vue : tuiles en cache affichées |
| `carte_1440x900_offline_vue.png` | 1440×900 | `edcb2439276b743edac8aad62d463ab8` | Carte desktop hors ligne zone en cache avec bandeau alerte |
| `carte_360x780_offline_non_vue.png` | 360×780 | `7956bac67956132dfb7b2dd615305b0a` | Carte hors ligne zone non vue : repli « Carte indisponible » |
| `carte_1440x900_offline_non_vue.png` | 1440×900 | `8d4a9320361dc6a52882e882e128c5b0` | Carte desktop zone non vue : fond neutre et notice |
| `annuaire_360x780_recherche.png` | 360×780 | `79893579ad2bee3efcd4dca3c9815abe` | Annuaire mobile avec recherche « mosquee » et résultats |
| `annuaire_1440x900_recherche.png` | 1440×900 | `e2b89712124a8c354fe81edaeceb088d` | Annuaire desktop avec grille de résultats et filtres actifs |
| `annuaire_360x780_aucun_resultat.png` | 360×780 | `8c3c3b312715e11d49e29f0dda16197b` | Annuaire sans résultat : état vide sobre et réinitialisation |
| `annuaire_1440x900_aucun_resultat.png` | 1440×900 | `ae0e771f2a2769b098487da3eb6d9e93` | Annuaire desktop sans résultat avec aide de recherche |
| `annuaire_360x780_offline.png` | 360×780 | `f68c2bc29e30a1f8fb9b7abaf8410f70` | Annuaire hors ligne : repli avec liens vers fiches en cache |
| `annuaire_1440x900_offline.png` | 1440×900 | `ab5b4e578feefaaeb4a081ced25ddf77` | Annuaire desktop hors ligne |
| `wizard_360x780_etape2_visibilite.png` | 360×780 | `f0989148bee3a712df1b913758d9b307` | Wizard Étape 2 : section Visibilité repliable dépliée |
| `wizard_1440x900_etape2_visibilite.png` | 1440×900 | `1c9992c54ea7be79967bf693644b954d` | Wizard desktop Étape 2 avec les 2 cases de consentement |
| `mes_adresses_360x780_pill_annuaire.png` | 360×780 | `e3556d734fa26baa93d6e1db842139fd` | Mes adresses : badge « Dans l'annuaire » visible |
| `mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `542599440397409599040ab9b5c10a94` | Mes adresses desktop avec pastilles de visibilité |
| `fiche_360x780_itineraire_voiture.png` | 360×780 | `6fd77d1e87c39de540cca5217f36e4e0` | Fiche avec tracé itinéraire voiture `#1D528F` et étapes |
| `fiche_1440x900_itineraire_voiture.png` | 1440×900 | `5c0993db31f97c6450a6c5226d0d50d8` | Fiche desktop avec tracé Leaflet, chips et étapes dépliées |
| `fiche_360x780_itineraire_pied.png` | 360×780 | `cfd6a45affcdb13cdb1026b1196d806b` | Fiche mobile mode À pied activé avec recalcul de durée |
| `fiche_1440x900_itineraire_pied.png` | 1440×900 | `5e308cfdb2287ae5b682a73a6cc48a43` | Fiche desktop mode À pied avec chips et instructions piétonnes |

**Validation d'unicité MD5 :**
```bash
$ md5sum docs/audit/lot6/*.png | sort | uniq -w32 -d
# 0 doublon détecté (22 fichiers uniques).
```

---

## 6. Synthèse des suites de tests automatisés

### A. Tests unitaires et d'intégration Backend (Spring Boot 3.4.3 / JUnit 5)
- **Total :** 89 tests exécutés via `./mvnw test`.
- **Résultat :** **89 passés, 0 échec, 0 erreur** (`BUILD SUCCESS`).
- **Couverture nouvelle :**
  - `DirectoryAndVisibilityTest` : 12 tests validant la normalisation sans accent, l'isolation du nom de propriétaire, le tri exact-first, et les droits de mise à jour.
  - `RouteServiceTest` : 8 tests avec `MockRestServiceServer` validant la validation des frontières du Sénégal, le cache 5 minutes, le parsing GeoJSON, et l'absence de coordonnées dans les logs.

### B. Tests unitaires Frontend (Vitest)
- **Total :** 34 tests exécutés via `npm test`.
- **Résultat :** **34 passés, 0 échec** (`4 test files passed`).
- **Couverture :** `lot3.test.ts` (20 tests), `lot4.test.ts` (4 tests), `lot5.test.ts` (4 tests), `lot6.test.ts` (6 tests couvrant le formatage de distance/durée et la transformation de coordonnées).

### C. Tests End-to-End (Playwright)
- **Total :** 8 tests exécutés via `npx playwright test e2e/lot6.spec.ts`.
- **Résultat :** **8 passés (18.4s)**.
- **Scénarios vérifiés :**
  1. Landing hors ligne avec Outfit woff2 actif et visibilité immédiate du code.
  2. Inventaire complet du Cache Storage (precache, adresses, tuiles).
  3. Annuaire public : recherche avec debounce, filtres quartier/type, URL synchronisée.
  4. Annuaire public : comportement hors ligne sobre.
  5. Wizard de création : section repliable « Visibilité dans l'annuaire ».
  6. Mes adresses : affichage du pill « Dans l'annuaire ».
  7. Fiche publique : affichage du bloc itinéraire, bascule Voiture / À pied et mention de confidentialité.
  8. Wizard hors ligne pleine page avec bouton désactivé.

---

## 7. Conclusion

Toutes les exigences du **LOT 6 — ANNUAIRE + ITINÉRAIRE OPENROUTESERVICE + CORRECTIFS DU LOT 5** sont intégralement satisfaites, prouvées par des tests automatisés au vert, des audits Lighthouse réels extraits directement des fichiers JSON, et 22 captures d'écran conformes aux résolutions requises sans aucun doublon MD5.
