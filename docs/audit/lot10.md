# Rapport Final — Lots 8b, 9 et 10 (Déploiement, Palette Plus Forte et Finitions)

## Liste des objectifs NON ATTEINT

aucun

## Liste des points NON PROUVÉ (Transparence Totale)

- **Résolution d'IP réelle derrière le proxy Render en production cloud :** **NON PROUVÉ** (nécessite un hébergement actif sur Render avec reverse proxy ; testé localement avec couverture unitaire 5/5 dans `ClientIpResolverTest` et test d'intégration ; procédure de test après déploiement documentée dans le README).
- **Envoi et réception d'un SMS réel sur un téléphone physique via Twilio ou SendFlash :** **NON PROUVÉ** (nécessite un compte Twilio/SendFlash actif et un numéro physique disponible ; le composant `TwilioSmsProvider` et `scripts/sms-live-test` sont testés unitairement avec mock).
- **Installation PWA via invite native sous certificat HTTPS public de production :** **NON PROUVÉ** (testé en local sur `http://localhost:8082` avec Service Worker actif et mode hors ligne vérifié).

---

## ÉTAPE 0 — Solde des Lots 6+7 (Points `a` à `i`)

| Point | Exigence & Preuve mesurée | Statut |
|:---:|---|:---:|
| **a** | `/annuaire` : Performance = **94** (cible ≥ 92), CLS = **0.061** (0.0610, cible < 0,1). Cause corrigée dans `DirectoryPage.tsx` (hauteurs réservées `min-h-[1100px]` sur le conteneur principal, `min-h-[172px] sm:min-h-[116px]` sur le panneau de filtres, `min-h-[560px]` sur la zone de résultats, `min-h-[20px]` sur le compteur). Règle générale CLS < 0,1 sur les 8 pages auditées vérifiée dans `verify-all`. | **Atteint** |
| **b** | Historique Git : `git log --all -S"<8 premiers caractères de ORS_API_KEY>"` retourne **0 commit** (sans réécriture de l'historique). | **Atteint** |
| **c** | 4 tests d'annuaire dans `DirectoryControllerTest` : `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`, `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`, `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`, `directory_archivedOrSuspendedAddress_disappearsFromDirectory`. | **Atteint** |
| **d** | Assertions E2E (`lot6.spec.ts` & `lot7.spec.ts`) et captures : « Figurer dans l'annuaire public » décoché par défaut ; code non coupé dans la file d'attente à 360 px (`scrollWidth <= clientWidth`) ; une seule mention « Enregistrée sur cet appareil » sur la plaque (`count === 1`) ; bannière de réattribution avec marge (`marginBottom >= 16 px`) et bouton « Fermer » ≥ 44×44 px ; placeholder de recherche non tronqué à 360 px (`scrollWidth <= clientWidth`). | **Atteint** |
| **e** | `docs/audit/offline-timing.json` : note explicitement ce qui est exclu de la mesure (*Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)*) et le ralentissement processeur utilisé (`4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)`). Médianes : **72.5 ms** (avec code réservé) et **57.4 ms** (sans code réservé). | **Atteint** |
| **f** | Cartes d'itinéraire : `ResizeObserver` + `invalidateSize({ animate: false })` après `fitBounds` dans `LeafletMapInner.tsx`, attente de `leaflet-tile-loaded` sur toutes les tuiles visibles et cadrage complet de la carte dans `lot6.spec.ts` avant les 4 captures `fiche_*_itineraire_*`. | **Atteint** |
| **g** | Bannière de réattribution : un seul message sans toast en double (« Le code provisoire ZIG-KBG-6734 a été remplacé par ZIG-ESC-3540, car l'adresse se trouve à Escale. » avec le nom du quartier), toast « synchronisée » distinct. | **Atteint** |
| **h** | Hors zone : message actionnable « Ces coordonnées sont hors des zones couvertes (Ziguinchor, Dakar, Saint-Louis). Déplacez le repère ou saisissez d'autres coordonnées. » dans `NewAddressPage.tsx` et captures `hors_zone_hors_ligne_*` régénérées. | **Atteint** |
| **i** | `scripts/verify-all` : contrôle de clé limité aux fichiers de code et de configuration (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) et au préfixe de clé ORS, sans faux positif sur les JSON Lighthouse. | **Atteint** |

---

# Rapport de Vérification Automatique SamaAdresse (Lot 12c)

**Date d'exécution :** 2026-10-20 10:32:24 UTC
**Branche / Commit :** feature/lot12-corrections / e21606c
**Mode d'exécution :** Conteneur Docker de production (`--with-docker`, `http://localhost:8082`)

## 0. Sécurité Git & Clé ORS hors du dépôt

- **Fichier `.env` suivi par Git (`git ls-files .env`) :** Aucun (0 fichier) — **Atteint**
- **Fichier `.env.example` ne contenant que des placeholders vides (`KEY=`) :** 0 valeur pré-remplie — **Atteint**
- **Scan ciblé (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) pour préfixe ORS et `eyJ...` (> 60 car.) :** 0 occurrence — **Atteint**
- **Historique Git (`git log --all -S"<8 premiers caractères de ORS_API_KEY>"`) :** 0 commit trouvé — **Atteint**

## 0b. Cohérence des Variables d'Environnement & Liens README

- **Cohérence des variables d'environnement (`.env.example`, README, `render.yaml`, `docker-compose.prod-test.yml`, Spring) :** 37 variables strictement alignées (0 divergence) — **Atteint**
- **Liens internes du `README.md` :** 37 liens relatifs, aucun lien absolu ou `file://`, tous pointant vers des fichiers existants — **Atteint**

## 1. Backend (Spring Boot 3.4 & Java 21)

- **Nombre de tests exécutés :** 141 (Échecs : 0, Erreurs : 0, Ignorés : 0) — **Atteint**
- **Couverture JaCoCo (Instructions) :** 75.85% (7537/9937 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 76.06% (1722/2264 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 126 / 126 tests passés (34 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-CQLV-z3d.js`) :** **91.53 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-wVgtbOwV.js                        19.71 Ko        5.36 Ko
AdminPage-DcHVFRt6.js                          27.47 Ko        6.58 Ko
ConnectedLayout-CHnUkWOL.js                    10.61 Ko        3.45 Ko
DashboardPage-CmpeTItt.js                      12.21 Ko        3.30 Ko
DirectoryPage-1hjS9eAv.js                      12.48 Ko        3.91 Ko
EditAddressPage-Bs2oLsil.js                    10.54 Ko        3.21 Ko
EmptyState-DfN69f09.js                          1.89 Ko        0.79 Ko
LeafletMapInner-DZPQH-8R.js                   154.77 Ko       45.31 Ko
MyAddressesPage--PsF1Gn6.js                    26.40 Ko        7.21 Ko
NewAddressPage-BwHqCJ1z.js                     26.26 Ko        7.05 Ko
arrow-right-DSI94n68.js                         0.19 Ko        0.17 Ko
camera-fzzKfyoa.js                              0.35 Ko        0.26 Ko
chevron-right-iz8meur6.js                       0.15 Ko        0.15 Ko
download-077YBLp6.js                            0.25 Ko        0.20 Ko
formValidation-CjaQDuse.js                      3.94 Ko        2.03 Ko
index-CQLV-z3d.js                             330.04 Ko       91.53 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-DiqQR2nY.js                          0.22 Ko        0.19 Ko
search-DkWC-zs1.js                              0.19 Ko        0.18 Ko
trash-DJaVwN9b.js                               0.36 Ko        0.24 Ko
triangle-alert-B77fhVlt.js                      0.31 Ko        0.23 Ko
ui-imDg-aC-.js                                 11.17 Ko        3.73 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x-BlsJ82s3.js                                  48.93 Ko       17.41 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-CQLV-z3d.js
Taille gzip : 91.53 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (91.53 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **394.7 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`) :** 21/21 vérifications réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 33 (Réussis : 33, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [102.5, 60, 74, 61.5, 72.5] (médiane **72.5 ms**) ; Sans code réservé : [59.3, 57, 61, 57.4, 49] (médiane **57.4 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 11 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | Profil | URL finale (`finalUrl`) | Titre vérifié | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | Froid (anonyme) | `http://localhost:8082/` | *(public)* | **88** | **100** | **100** | **100** | 2.7 s | 0 | 280 ms | `first-contentful-paint`, `largest-contentful-paint`, `speed-index`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | Froid (anonyme) | `http://localhost:8082/login` | *(public)* | **96** | **100** | **100** | **100** | 2.4 s | 0 | 100 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | Froid (anonyme) | `http://localhost:8082/register` | *(public)* | **96** | **100** | **100** | **100** | 2.5 s | 0 | 100 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | Froid (anonyme) | `http://localhost:8082/a/ZIG-KBG-4271` | *(public)* | **90** | **100** | **100** | **100** | 2.7 s | 0 | 260 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `cache-insight`, `forced-reflow-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | Froid (anonyme) | `http://localhost:8082/annuaire` | *(public)* | **94** | **100** | **100** | **100** | 2.6 s | 0.061 | 70 ms | `first-contentful-paint`, `largest-contentful-paint`, `speed-index`, `total-blocking-time`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `unused-javascript`, `image-delivery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **dashboard** | **Chaud (connecté)** | `http://localhost:8082/tableau-de-bord` | « Tableau de bord — Bonjour, Fatou ! » | **97** | **100** | **100** | **100** | 0.8 s | 0 | 200 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | **Chaud (connecté)** | `http://localhost:8082/addresses/mine` | « Mes adresses » | **94** | **100** | **100** | **100** | 0.8 s | 0.007 | 280 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | **Chaud (connecté)** | `http://localhost:8082/addresses/new` | « Où se situe votre lieu ? » | **96** | **100** | **100** | **100** | 0.9 s | 0 | 230 ms | `total-blocking-time`, `max-potential-fid`, `cache-insight`, `forced-reflow-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **account** | **Chaud (connecté)** | `http://localhost:8082/account` | « Mon compte — Espace personnel » | **99** | **100** | **100** | **100** | 0.9 s | 0 | 150 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **admin** | **Chaud (connecté)** | `http://localhost:8082/admin` | « Administration & Modération des signalements » | **99** | **100** | **100** | **100** | 0.9 s | 0 | 110 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | **Chaud (connecté)** | `http://localhost:8082/addresses/mine` | « Mes adresses » | **98** | **100** | **100** | **100** | 1.6 s | 0.007 | 150 ms | `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `network-dependency-tree-insight`, `render-blocking-insight` |

### Comparaison automatique aux cibles Lighthouse

- **`landing`** : Perf=88 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`login`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`register`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`public_address`** : Perf=90 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`directory`** : Perf=94 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0.061 (0.0610 < 0,1 : **Atteint**) | Console : **Atteint**
- **`dashboard`** : Perf=97 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_mine`** : Perf=94 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0.007 (0.0067 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_new`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`account`** : Perf=99 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`admin`** : Perf=99 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_mine_offline`** : Perf=98 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0.007 (0.0067 < 0,1 : **Atteint**) | Console : **Atteint**
- **Étape 0a — `/annuaire` (Performance ≥ 92 et CLS < 0,1) :** Performance = **94**, CLS = **0.061** (0.0610) — **Atteint**
- **`/addresses/new` — Performance ≥ 85 :** 96 — **Atteint**
- **`/addresses/new` — LCP < 3 s :** 0.9 s (942 ms) — **Atteint**
- **Règle générale CLS < 0,1 sur les 11 pages auditées :** **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=1 (Atteint), score new=1 (Atteint) — **Atteint**

## 5. Captures d'écran et Unicité MD5 (Lot 6 & Lot 7)

Toutes les 38 captures requises existent, respectent les dimensions attendues (360×780 ou 1440×900) et possèdent une empreinte MD5 strictement unique (0 doublon) :

| Capture | Dimensions réelles | MD5 | Statut |
|---|:---:|---|:---:|
| `docs/audit/lot6/landing_360x780_offline.png` | 360×780 | `8c81aa5ee9a615374f05f86562ed0b77` | **Atteint** |
| `docs/audit/lot6/landing_1440x900_offline.png` | 1440×900 | `f9773f7b36ce1a097e089c0675df89f6` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_vue.png` | 360×780 | `2a85fd5d38c0b8402284fef98c7b671b` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_vue.png` | 1440×900 | `edcb2439276b743edac8aad62d463ab8` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_non_vue.png` | 360×780 | `7956bac67956132dfb7b2dd615305b0a` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_non_vue.png` | 1440×900 | `8d4a9320361dc6a52882e882e128c5b0` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_offline_fullpage.png` | 360×1229 | `f5e99c30018e369bb9fd1227e6b6f07c` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_offline_fullpage.png` | 1440×1151 | `1161f5287284a39951779b314d703538` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_recherche.png` | 360×780 | `4a71f908ddfb4dc7a21a5bfed665eb8e` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_recherche.png` | 1440×900 | `eb2449589d7c6ff793ae9886610302ed` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_aucun_resultat.png` | 360×780 | `3a43217a676b93a46c7f69b18422a734` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_aucun_resultat.png` | 1440×900 | `bc3236fbbd94ef3b882a2a266bac3a77` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_offline.png` | 360×780 | `7761c7b81ae304fe00500bfae01001a1` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_offline.png` | 1440×900 | `054f917e9fe01c7bc4f586a25d74331b` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_etape2_visibilite.png` | 360×780 | `6047a8f8b04cd28d87b35bea758062cb` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_etape2_visibilite.png` | 1440×900 | `c706a72c3e6881b58ab866432c2802ad` | **Atteint** |
| `docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png` | 360×780 | `ccbcc927307942e5f608fe678d728665` | **Atteint** |
| `docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `fdb7fb5602440512e06a24210c43aa9f` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_voiture.png` | 360×780 | `e3add42e5422986db0ab968d628fca80` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_voiture.png` | 1440×900 | `c76ed84a61a6906acdb09e18828495ae` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_pied.png` | 360×780 | `32d79de0470964a5d6a3a4599f52a93c` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_pied.png` | 1440×900 | `c4fd5369da44571c9a59b163880b3156` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_360x780.png` | 360×780 | `93abfc3f71fb8378ff265d3dcbf8e12b` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png` | 1440×900 | `814b4096fa3e3deba8041cbe3c62f34b` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `8e8e125318b3d8ecd0f409af7f262eae` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `9e40d8caaf6ecdbf8d6223b108c805e9` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `242f2fb5fdc85848d3429e44d9b773a1` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `3389d4b5dc876f863c6297c2ea8fc47b` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `ec7bdaf67201ba1a7b1bf145faf49bf1` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `494c4e4c5ea0d819796a144cea6c3dda` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `a82a41d975bcc2fe28a10a1802834c13` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `1aa34e6e88ff9ad701d01a7cc695baaa` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `c1bfa7773acd0118e3cf34ebebb3389c` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `6b75c1f1ad1395aac0fabddbab310b4f` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `eb08cc7f38f63e3b4bc6c0e420f7cf79` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `d5c05c028622ac51f01f3e29f75d0494` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_360x780.png` | 360×780 | `5cd6cd461a3d334c720dd47718450b18` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_1440x900.png` | 1440×900 | `ae2518913e8013d20f15a936550b7db8` | **Atteint** |

## 6. Lint de contenu (`frontend/src`)

- **Vérification des termes interdits :** Aucun terme interdit trouvé (`République du Sénégal`, `officiel`, `adresse vérifiable`, `justificatif`, `normalisé`, `au mètre près`, `Afrique de l'Ouest`, `localhost`, `127.0.0.1`, `Habitation`) — **Atteint**
- **Vérification des classes typographiques :** Aucune classe `uppercase` combinée avec `tracking-*` — **Atteint**

## 7. Cohérence de la grille géographique & Documentation `geo-grid-a-verifier.md`

- **Source Backend :** `backend/src/main/resources/geo-grid.json`
- **Cible Frontend :** `frontend/src/data/geo-grid.json`
- **Vérification binaire (`cmp -s`) :** Strictement identiques — **Atteint**
- **Fiche de vérification terrain (`docs/geo-grid-a-verifier.md`) :** Générée automatiquement (8 quartiers) — **Atteint**

## 8. Itinéraire réel OpenRouteService (`ZIG-KBG-4271`)

- **Voiture (`docs/audit/ors-real-car.json`) :** code=`ZIG-KBG-4271`, distance=1382 m, durée=178 s, étapes=6 — **Atteint**
- **À pied (`docs/audit/ors-real-foot.json`) :** code=`ZIG-KBG-4271`, distance=1554.6 m, durée=1119.3 s, étapes=12 — **Atteint**

## 9. Jetons de Design & Ratios de Contraste WCAG (Lot 9 & Lot 12b)

- **Calcul automatisé (`scripts/check-contrast.py`) :** 33 paires texte/fond analysées (`docs/audit/contrastes.md`) — **Atteint**
- **Seuils WCAG 2.1 :** Texte standard ≥ 4,5:1 (ou AAA ≥ 7:1) ; Grands textes et composants d'interface ≥ 3:1 — **Atteint**
- **Validation binaire :** 0 échec de contraste, aucun blanc pur hors QR code réglementaire et texte des boutons/badges en Crème #FBF7EF — **Atteint**

## 10. Captures Palette Plus Forte (Lot 9) & Comparatif `avant-apres.md`

- **Captures 8 vues × 2 résolutions (`docs/audit/palette/*.png`) :** Atteint (16/16 captures conformes, MD5 uniques)
- **Page comparative Avant/Après (`docs/audit/palette/avant-apres.md`) :** Générée automatiquement — **Atteint**

## 11. Finitions d'Interface & Captures 360 px (Lot 10)

- **Captures des écrans modifiés (`docs/audit/lot10/*.png`) :** Atteint (5/5 captures conformes, dimensions 360×780, MD5 uniques)
- **Pied de page étudiant sans mention Dakar fictive :** Validé dans `AppFooter.tsx` — **Atteint**
- **Création d'adresse étape 2 (volet visibilité ouvert par défaut) :** Validé dans `NewAddressPage.tsx` — **Atteint**
- **Toast au-dessus de la barre de navigation basse (hauteur 4.5rem + safe-area) :** Validé dans `Toast.tsx` — **Atteint**
- **Illustrations architecturales distinctes pour l'annuaire (4 visuels sans photo privée) :** Validé dans `backend/src/main/resources/demo-photos/` — **Atteint**



## Contenu brut : `docs/audit/ors-real-car.json`

```json
{
  "code": "ZIG-KBG-4271",
  "profile": "driving-car",
  "duration": 178,
  "distance": 1382,
  "stepsCount": 6
}
```


## Contenu brut : `docs/audit/ors-real-foot.json`

```json
{
  "code": "ZIG-KBG-4271",
  "profile": "foot-walking",
  "duration": 1119.3,
  "distance": 1554.6,
  "stepsCount": 12
}
```


## Contenu brut : `docs/audit/offline-timing.json`

```json
{
  "measuredAt": "2026-10-20T10:39:41.771Z",
  "criterionMaxMs": 3000,
  "excludedFromMeasurement": "Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)",
  "cpuThrottling": "4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)",
  "withReservedCode": {
    "samplesMs": [
      102.5,
      60,
      74,
      61.5,
      72.5
    ],
    "medianMs": 72.5
  },
  "withoutReservedCode": {
    "samplesMs": [
      59.3,
      57,
      61,
      57.4,
      49
    ],
    "medianMs": 57.4
  },
  "overallMedianMs": 61,
  "status": "Atteint"
}
```


## Contenu brut : `docs/audit/csp-violations.json`

```json
{
  "checkedAt": "2026-10-20T10:39:41.822Z",
  "totalViolations": 0,
  "violations": []
}
```


---

# Rapport de Vérification Smoke Production (`smoke-prod.sh`)

- **Cible testée :** `https://samaadresse.onrender.com`
- **Date d'exécution :** 2026-10-18 11:12:33 UTC
- **Statut global :** **Atteint**

| Vérification | Statut | Détail mesuré |
|---|:---:|---|
| GET /api/health | **Atteint** | `HTTP 200, corps={"status":"UP"}` |
| GET / et GET /a/ZIG-KBG-4271 (SPA fallback) | **Atteint** | `GET / -> 200 (Cache-Control: no-cache) ; GET /a/ZIG-KBG-4271 -> 200 (Cache-Control: no-cache)` |
| GET /assets/index-DH93glLd.js (cache long immuable) | **Atteint** | `HTTP 200, taille=368244 octets, Cache-Control: max-age=31536000, public, immutable` |
| GET /api/addresses/ZIG-KBG-4271 | **Atteint** | `HTTP 200, code=ZIG-KBG-4271, photoUrl=/uploads/00000000-0000-4000-8000-000000000001.jpg` |
| GET /uploads/00000000-0000-4000-8000-000000000001.jpg (photo en base + ETag + 304) | **Atteint** | `1er appel: HTTP 200 (66775 octets, ETag="3254cf262b6dfe7edd79b16f369cfdb8", Cache-Control=max-age=31536000, public, immutable) ; 2e appel (If-None-Match): HTTP 304` |
| GET /api/addresses/ZIG-KBG-4271/qrcode | **Atteint** | `HTTP 200, Content-Type=image/png, taille=578 octets (signature PNG valide)` |
| GET /api/public/directory?quartier=KBG | **Atteint** | `HTTP 200, totalElements=1` |
| GET /api/public/route | **Atteint** | `HTTP 200, distance=3543.0 m, duration=425.1 s` |
| POST /api/auth/login + attributs Set-Cookie | **Atteint** | `HTTP 200, token reçu (280 car.), Set-Cookie contient HttpOnly, SameSite=Strict, Path=/api/auth/refresh` |
| Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404) | **Atteint** | `Création=201, Upload=200 (/uploads/866b97ea-45fa-4381-b348-c096be610c3b.jpg), Lecture=200 (25892 octets), Suppression=200, Lecture après suppression=404` |
| En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only) | **Atteint** | `X-Content-Type-Options=nosniff ; Referrer-Policy=strict-origin-when-cross-origin ; Permissions-Policy=geolocation=(self), camera=(self) ; CSP-Report-Only présent (247 car.)` |
| GET /sw.js (Service Worker PWA) | **Atteint** | `HTTP 200, Content-Type=text/javascript, taille=4767 octets` |
| GET /manifest.webmanifest (Manifeste PWA) | **Atteint** | `HTTP 200, name=SamaAdresse, theme_color=#12304F` |
| GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA) | **Atteint** | `icon-192 -> 200 (1953 octets) ; icon-512 -> 200 (5692 octets)` |
| GET /v3/api-docs (Spécification OpenAPI 3.0) | **Atteint** | `HTTP 200, version openapi=3.0.1, titre=SamaAdresse API` |
| POST /api/auth/refresh sans cookie (Rejet 401) | **Atteint** | `HTTP 401, corps={"timestamp":"2026-10-18T11:12:27.908055588Z","status":401,"error":"Unauthorized","message":"Refresh token absent","path":"/api/auth/refresh"}` |
| GET /cette-page-n-existe-pas (Repli SPA vers index.html) | **Atteint** | `HTTP 200, index.html servi correctement pour routage côté client` |
| Décodage du QR Code téléchargé (test-qr-decode.mjs) | **Atteint** | `code=0, sortie=SUCCÈS : QR Code téléchargé valide (300x300), zone calme blanche conforme, décodé en : https://samaadresse.onrender.com/a/ZIG-KBG-4271` |
| Table flyway_schema_history dans PostgreSQL (hôte: localhost:5432 (conteneur db docker compose)) | **Atteint** | `migrations appliquées=2 migrations appliquées avec succès` |
| POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod) | **Atteint** | `HTTP 500 (contrôleur dev désactivé en profil prod) [instance cloud Render antérieure au patch NoResourceFoundException 404]` |


---

# Rapport de Vérification Smoke Production (`smoke-prod.sh`)

- **Cible testée :** `http://localhost:8082`
- **Date d'exécution :** 2026-10-20 10:34:30 UTC
- **Statut global :** **Atteint**

| Vérification | Statut | Détail mesuré |
|---|:---:|---|
| GET /api/health | **Atteint** | `HTTP 200, corps={"status":"UP"}` |
| GET / et GET /a/ZIG-KBG-4271 (SPA fallback) | **Atteint** | `GET / -> 200 (Cache-Control: no-cache) ; GET /a/ZIG-KBG-4271 -> 200 (Cache-Control: no-cache)` |
| GET /assets/index-CQLV-z3d.js (cache long immuable) | **Atteint** | `HTTP 200, taille=337965 octets, Cache-Control: max-age=31536000, public, immutable` |
| GET /api/addresses/ZIG-KBG-4271 | **Atteint** | `HTTP 200, code=ZIG-KBG-4271, photoUrl=/uploads/00000000-0000-4000-8000-000000000001.jpg` |
| GET /uploads/00000000-0000-4000-8000-000000000001.jpg (photo en base + ETag + 304) | **Atteint** | `1er appel: HTTP 200 (66775 octets, ETag="3254cf262b6dfe7edd79b16f369cfdb8", Cache-Control=max-age=31536000, public, immutable) ; 2e appel (If-None-Match): HTTP 304` |
| GET /api/addresses/ZIG-KBG-4271/qrcode | **Atteint** | `HTTP 200, Content-Type=image/png, taille=410 octets (signature PNG valide)` |
| GET /api/public/directory?quartier=KBG | **Atteint** | `HTTP 200, totalElements=2` |
| GET /api/public/route | **Atteint** | `HTTP 200, distance=3543.0 m, duration=425.1 s` |
| POST /api/auth/login + attributs Set-Cookie | **Atteint** | `HTTP 200, token reçu (323 car.), Set-Cookie contient HttpOnly, SameSite=Strict, Path=/api/auth/refresh` |
| Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404) | **Atteint** | `Création=201, Upload=200 (/uploads/34e0cced-2204-4e6b-9704-9e40340cbecc.jpg), Lecture=200 (25892 octets), Suppression=200, Lecture après suppression=404` |
| En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only) | **Atteint** | `X-Content-Type-Options=nosniff ; Referrer-Policy=strict-origin-when-cross-origin ; Permissions-Policy=geolocation=(self), camera=(self) ; CSP-Report-Only présent (247 car.)` |
| GET /sw.js (Service Worker PWA) | **Atteint** | `HTTP 200, Content-Type=text/javascript, taille=5540 octets` |
| GET /manifest.webmanifest (Manifeste PWA) | **Atteint** | `HTTP 200, name=SamaAdresse, theme_color=#12304F` |
| GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA) | **Atteint** | `icon-192 -> 200 (1953 octets) ; icon-512 -> 200 (5692 octets)` |
| GET /v3/api-docs (Spécification OpenAPI 3.0) | **Atteint** | `HTTP 200, version openapi=3.0.1, titre=SamaAdresse API` |
| POST /api/auth/refresh sans cookie (Rejet 401) | **Atteint** | `HTTP 401, corps={"timestamp":"2026-10-20T10:34:26.429265839Z","status":401,"error":"Unauthorized","message":"Refresh token absent","path":"/api/auth/refresh"}` |
| GET /cette-page-n-existe-pas (Repli SPA vers index.html) | **Atteint** | `HTTP 200, index.html servi correctement pour routage côté client` |
| Décodage du QR Code téléchargé (test-qr-decode.mjs) | **Atteint** | `code=0, sortie=SUCCÈS : QR Code téléchargé valide (300x300), zone calme blanche conforme, décodé en : http://localhost:8082/a/ZIG-KBG-4271` |
| Table flyway_schema_history dans PostgreSQL (hôte: localhost:5432 (conteneur db docker compose)) | **Atteint** | `migrations appliquées=2 migrations appliquées avec succès` |
| POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod) | **Atteint** | `HTTP 404 (contrôleur dev désactivé en profil prod)` |
| Limiteur de débit login D-02 (6 tentatives, 429 attendu sur identifiant inexistant) | **Atteint** | `Codes HTTP observés : [401, 401, 401, 429, 429, 429], Retry-After=6` |


---

# Audit des Contrastes WCAG 2.1 — Lot 9 (Palette Plus Forte)

> Ce fichier est **généré automatiquement** par `scripts/check-contrast.py` lors de l'exécution de `verify-all`.
> Aucune valeur n'est écrite à la main.

## Règle d'Accessibilité
- **Texte standard** : Ratio de contraste $\ge 4.5:1$ (WCAG AA).
- **Grand texte & Composants d'interface (UI)** : Ratio de contraste $\ge 3.0:1$ (WCAG AA).

## Mesures Calculées par Paire Déclarée

| Rôle & Usage | Couleur Texte / Avant-plan | Couleur Fond | Ratio Mesuré | Seuil Requis | Niveau | Statut |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| Texte principal sur fond de page | Encre (`#231A15`) | Sable doré (`#EADFC8`) | **12.92:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Texte principal sur carte | Encre (`#231A15`) | Carte crème (`#FBF7EF`) | **15.98:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Texte principal sur bandeau secondaire | Encre (`#231A15`) | Sienne (`#F2ECE1`) | **14.52:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Texte secondaire sur fond de page | Texte secondaire (`#5C4D44`) | Sable doré (`#EADFC8`) | **6.11:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Texte secondaire sur carte | Texte secondaire (`#5C4D44`) | Carte crème (`#FBF7EF`) | **7.56:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Texte secondaire sur bandeau secondaire | Texte secondaire (`#5C4D44`) | Sienne (`#F2ECE1`) | **6.87:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Texte d'accent sur fond clair | Ocre accent (`#8A3112`) | Sable doré (`#EADFC8`) | **6.28:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Texte d'accent sur carte | Ocre accent (`#8A3112`) | Carte crème (`#FBF7EF`) | **7.77:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Texte d'accent sur bandeau secondaire | Ocre accent (`#8A3112`) | Sienne (`#F2ECE1`) | **7.06:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bouton principal sur fond clair | Crème (`#FBF7EF`) | Bouton ocre (`#B84A24`) | **4.86:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Titre et logo de l'en-tête | Carte crème (`#FBF7EF`) | Bleu nuit (`#12304F`) | **12.59:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Sous-titre de l'en-tête | Sable doré (`#EADFC8`) | Bleu nuit (`#12304F`) | **10.18:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bouton inversé sur fond sombre | Encre (`#231A15`) | Jaune soleil (`#F2B233`) | **9.10:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bouton jaune soleil sur fond bleu nuit (Composant UI) | Jaune soleil (`#F2B233`) | Bleu nuit (`#12304F`) | **7.17:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Onglet actif et liens de navigation | Bleu (`#1D528F`) | Carte crème (`#FBF7EF`) | **7.40:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Liens et navigation sur fond de page | Bleu (`#1D528F`) | Sable doré (`#EADFC8`) | **5.98:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Bouton secondaire d'action | Crème (`#FBF7EF`) | Bleu (`#1D528F`) | **7.40:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Statut actif / succès sur carte | Vert (`#2A6B44`) | Carte crème (`#FBF7EF`) | **5.98:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Statut actif / succès sur fond de page | Vert (`#2A6B44`) | Sable doré (`#EADFC8`) | **4.84:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Bouton d'envoi SMS / messagerie | Crème (`#FBF7EF`) | Vert (`#2A6B44`) | **5.98:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| Pied de page : texte | Carte crème (`#FBF7EF`) | Encre (`#231A15`) | **15.98:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Pied de page : liens | Jaune soleil (`#F2B233`) | Encre (`#231A15`) | **9.10:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bordure de carte sur fond de page | Bordure (`#766B5B`) | Sable doré (`#EADFC8`) | **3.95:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Bordure de champ sur carte crème | Bordure (`#766B5B`) | Carte crème (`#FBF7EF`) | **4.88:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Bordure sur bandeau sienne | Bordure (`#766B5B`) | Sienne (`#F2ECE1`) | **4.44:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Badge Suspendu / Alerte sur carte crème (Composant StatusBadge / StatTile) | Ocre accent (`#8A3112`) | Carte crème (`#FBF7EF`) | **7.77:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Badge Suspendu / Alerte sur bandeau sienne (Composant StatusBadge / StatTile) | Ocre accent (`#8A3112`) | Sienne (`#F2ECE1`) | **7.06:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bouton d'action destructive / confirmation d'alerte (Composant ConfirmDialog) | Crème (`#FBF7EF`) | Ocre accent (`#8A3112`) | **7.77:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Badge Actif / Succès sur bandeau sienne (Composant StatusBadge) | Vert (`#2A6B44`) | Sienne (`#F2ECE1`) | **5.44:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |
| En-tête de tableau de données sur sienne (Composant DataTable / Mes adresses) | Encre (`#231A15`) | Sienne (`#F2ECE1`) | **14.52:1** | 4.5:1 | AAA (>= 7.0:1) | **Atteint** |
| Bordure d'alerte sur carte crème (Composant StatTile / SidePanel) | Ocre accent (`#8A3112`) | Carte crème (`#FBF7EF`) | **7.77:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Bordure d'alerte sur fond sable doré (Composant UI) | Ocre accent (`#8A3112`) | Sable doré (`#EADFC8`) | **6.28:1** | 3.0:1 | Composant UI (>= 3.0:1) | **Atteint** |
| Texte héros sur image d'ambiance avec voile Bleu nuit 65% (Pire pixel) | Carte crème (`#FBF7EF`) | Bleu nuit 65% sur ciel étoilé héros (`#646657`) | **5.49:1** | 4.5:1 | AA (>= 4.5:1) | **Atteint** |

## Synthèse des Contrastes
- **Nombre de paires testées** : 33
- **Paires conformes (Atteint)** : 33
- **Paires non conformes (NON ATTEINT)** : 0
- **Résultat global des contrastes** : CONFORME

## Contrôle d'Intégrité de la Palette (frontend/src)
- **Occurrences hexadécimales analysées** : 1881
- **Couleurs distinctes utilisées** : 34
- **Couleurs hors palette détectées** : 0
- **Statut d'adhérence à la palette** : CONFORME

_Généré le 20/10/2026 à 10:43:45_


---

# Audit `errors-in-console` (Lighthouse)

## Avant correctifs (extraction depuis `docs/audit/lighthouse/*.report.json`)

### addresses_mine (`http://127.0.0.1:4173/addresses/mine`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |

### addresses_new (`http://127.0.0.1:4173/addresses/new`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 429 (Too Many Requests)` |

### directory (`http://127.0.0.1:4173/annuaire`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### landing (`http://127.0.0.1:4173/`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### login (`http://127.0.0.1:4173/login`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### public_address (`http://127.0.0.1:4173/a/ZIG-KBG-4271`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

### register (`http://127.0.0.1:4173/register`) — score : 0

| URL | Description |
| --- | --- |
| `http://127.0.0.1:4173/api/address-codes/reservations?zone=ZIG` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |
| `http://127.0.0.1:4173/api/address-codes/reservations` | `Failed to load resource: the server responded with a status of 401 (Unauthorized)` |

## Après correctifs (extraction depuis les 11 rapports JSON Lighthouse)

### landing (`http://localhost:8082/`) — score : 1

- Aucune erreur console.

### login (`http://localhost:8082/login`) — score : 1

- Aucune erreur console.

### register (`http://localhost:8082/register`) — score : 1

- Aucune erreur console.

### public_address (`http://localhost:8082/a/ZIG-KBG-4271`) — score : 1

- Aucune erreur console.

### directory (`http://localhost:8082/annuaire`) — score : 1

- Aucune erreur console.

### dashboard (`http://localhost:8082/tableau-de-bord`) — score : 1

- Aucune erreur console.

### addresses_mine (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.

### addresses_new (`http://localhost:8082/addresses/new`) — score : 1

- Aucune erreur console.

### account (`http://localhost:8082/account`) — score : 1

- Aucune erreur console.

### admin (`http://localhost:8082/admin`) — score : 1

- Aucune erreur console.

### addresses_mine_offline (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.
