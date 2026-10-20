# Rapport de Vérification Automatique SamaAdresse (Lot 12c)

**Date d'exécution :** 2026-10-20 09:23:39 UTC
**Branche / Commit :** feature/lot12-corrections / d0a455b
**Mode d'exécution :** Conteneur Docker de production (`--with-docker`, `http://localhost:8082`)

## 0. Sécurité Git & Clé ORS hors du dépôt

- **Fichier `.env` suivi par Git (`git ls-files .env`) :** Aucun (0 fichier) — **Atteint**
- **Fichier `.env.example` ne contenant que des placeholders vides (`KEY=`) :** 0 valeur pré-remplie — **Atteint**
- **Scan ciblé (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) pour préfixe ORS et `eyJ...` (> 60 car.) :** 0 occurrence — **Atteint**
- **Historique Git (`git log --all -S"<8 premiers caractères de ORS_API_KEY>"`) :** 0 commit trouvé — **Atteint**

## 0b. Cohérence des Variables d'Environnement & Liens README

- **Cohérence des variables d'environnement (`.env.example`, README, `render.yaml`, `docker-compose.prod-test.yml`, Spring) :** 37 variables strictement alignées (0 divergence) — **Atteint**
- **Liens internes du `README.md` :** 36 liens relatifs, aucun lien absolu ou `file://`, tous pointant vers des fichiers existants — **Atteint**

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
- **Chunk JS d'entrée (`index-RG2zlHoF.js`) :** **91.13 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-Crb25dBG.js                        19.72 Ko        5.36 Ko
AdminPage-DqZYKlZx.js                          27.44 Ko        6.57 Ko
ConnectedLayout-M11rQ87J.js                    10.61 Ko        3.45 Ko
DashboardPage-C7HmJsId.js                      12.20 Ko        3.30 Ko
DirectoryPage-ChEJb9Yg.js                      12.23 Ko        3.73 Ko
EditAddressPage-CmshiwA0.js                    10.54 Ko        3.21 Ko
LeafletMapInner-B67BmzdX.js                   154.77 Ko       45.31 Ko
MyAddressesPage-D1suPURh.js                    26.16 Ko        7.13 Ko
NewAddressPage-D_4EbLA5.js                     26.26 Ko        7.05 Ko
arrow-right-DSI94n68.js                         0.19 Ko        0.17 Ko
camera-fzzKfyoa.js                              0.35 Ko        0.26 Ko
chevron-right-iz8meur6.js                       0.15 Ko        0.15 Ko
download-077YBLp6.js                            0.25 Ko        0.20 Ko
formValidation-BXOQHJ57.js                      3.94 Ko        2.03 Ko
index-RG2zlHoF.js                             327.04 Ko       91.13 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-DiqQR2nY.js                          0.22 Ko        0.19 Ko
search-DkWC-zs1.js                              0.19 Ko        0.18 Ko
trash-DJaVwN9b.js                               0.36 Ko        0.24 Ko
triangle-alert-B77fhVlt.js                      0.31 Ko        0.23 Ko
ui-BVT3oPr4.js                                 12.54 Ko        3.96 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x-BlsJ82s3.js                                  48.93 Ko       17.41 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-RG2zlHoF.js
Taille gzip : 91.13 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (91.13 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **393.6 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`) :** 21/21 vérifications réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 33 (Réussis : 33, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [114, 67.6, 62.9, 53.7, 55.4] (médiane **62.9 ms**) ; Sans code réservé : [76.1, 58.7, 61.6, 54.4, 53.1] (médiane **58.7 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 11 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | Profil | URL finale (`finalUrl`) | Titre vérifié | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | Froid (anonyme) | `http://localhost:8082/` | *(public)* | **91** | **100** | **100** | **100** | 2.6 s | 0 | 230 ms | `first-contentful-paint`, `largest-contentful-paint`, `speed-index`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | Froid (anonyme) | `http://localhost:8082/login` | *(public)* | **95** | **100** | **100** | **100** | 2.5 s | 0 | 110 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | Froid (anonyme) | `http://localhost:8082/register` | *(public)* | **95** | **100** | **100** | **100** | 2.5 s | 0 | 130 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | Froid (anonyme) | `http://localhost:8082/a/ZIG-KBG-4271` | *(public)* | **88** | **100** | **100** | **100** | 2.9 s | 0 | 300 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `mainthread-work-breakdown`, `unused-javascript`, `cache-insight`, `forced-reflow-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | Froid (anonyme) | `http://localhost:8082/annuaire` | *(public)* | **96** | **100** | **100** | **100** | 2.5 s | 0 | 80 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `image-delivery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **dashboard** | **Chaud (connecté)** | `http://localhost:8082/tableau-de-bord` | « Tableau de bord — Bonjour, Fatou ! » | **96** | **100** | **100** | **100** | 0.8 s | 0 | 210 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | **Chaud (connecté)** | `http://localhost:8082/addresses/mine` | « Mes adresses » | **96** | **100** | **100** | **100** | 0.8 s | 0.007 | 240 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | **Chaud (connecté)** | `http://localhost:8082/addresses/new` | « Où se situe votre lieu ? » | **95** | **100** | **100** | **100** | 0.9 s | 0 | 250 ms | `total-blocking-time`, `max-potential-fid`, `cache-insight`, `forced-reflow-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **account** | **Chaud (connecté)** | `http://localhost:8082/account` | « Mon compte — Espace personnel » | **98** | **100** | **100** | **100** | 0.9 s | 0 | 160 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **admin** | **Chaud (connecté)** | `http://localhost:8082/admin` | « Administration & Modération des signalements » | **98** | **100** | **100** | **100** | 0.9 s | 0 | 160 ms | `total-blocking-time`, `max-potential-fid`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | **Chaud (connecté)** | `http://localhost:8082/addresses/mine` | « Mes adresses » | **94** | **100** | **100** | **100** | 1.8 s | 0.007 | 280 ms | `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `network-dependency-tree-insight`, `render-blocking-insight` |

### Comparaison automatique aux cibles Lighthouse

- **`landing`** : Perf=91 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`login`** : Perf=95 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`register`** : Perf=95 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`public_address`** : Perf=88 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`directory`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`dashboard`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_mine`** : Perf=96 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0.007 (0.0067 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_new`** : Perf=95 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`account`** : Perf=98 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`admin`** : Perf=98 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0 (0.0000 < 0,1 : **Atteint**) | Console : **Atteint**
- **`addresses_mine_offline`** : Perf=94 | A11y=100 (**Atteint**) | BP=100 (**Atteint**) | CLS=0.007 (0.0067 < 0,1 : **Atteint**) | Console : **Atteint**
- **Étape 0a — `/annuaire` (Performance ≥ 92 et CLS < 0,1) :** Performance = **96**, CLS = **0** (0.0000) — **Atteint**
- **`/addresses/new` — Performance ≥ 85 :** 95 — **Atteint**
- **`/addresses/new` — LCP < 3 s :** 0.9 s (948 ms) — **Atteint**
- **Règle générale CLS < 0,1 sur les 11 pages auditées :** **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=1 (Atteint), score new=1 (Atteint) — **Atteint**

## 5. Captures d'écran et Unicité MD5 (Lot 6 & Lot 7)

Toutes les 38 captures requises existent, respectent les dimensions attendues (360×780 ou 1440×900) et possèdent une empreinte MD5 strictement unique (0 doublon) :

| Capture | Dimensions réelles | MD5 | Statut |
|---|:---:|---|:---:|
| `docs/audit/lot6/landing_360x780_offline.png` | 360×780 | `5b7654dd7c0a08ad7f7fd2b68802fff2` | **Atteint** |
| `docs/audit/lot6/landing_1440x900_offline.png` | 1440×900 | `158982b893f941cf53ceab1b817e134a` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_vue.png` | 360×780 | `2a85fd5d38c0b8402284fef98c7b671b` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_vue.png` | 1440×900 | `edcb2439276b743edac8aad62d463ab8` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_non_vue.png` | 360×780 | `7956bac67956132dfb7b2dd615305b0a` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_non_vue.png` | 1440×900 | `8d4a9320361dc6a52882e882e128c5b0` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_offline_fullpage.png` | 360×1229 | `f5e99c30018e369bb9fd1227e6b6f07c` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_offline_fullpage.png` | 1440×1151 | `1161f5287284a39951779b314d703538` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_recherche.png` | 360×780 | `f61de0bc14365c02d536b3543660fec8` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_recherche.png` | 1440×900 | `5dae5762ed3396591f6f14bcb09866ca` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_aucun_resultat.png` | 360×780 | `bab5630401fcabeb756de312f5bc3d67` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_aucun_resultat.png` | 1440×900 | `67cfe4216dc4ffe9346baa2e6a84e5d2` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_offline.png` | 360×780 | `39633a42e0bbb027fd3b597e5bef063b` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_offline.png` | 1440×900 | `59f2e28d831e29959783e164a3de7c30` | **Atteint** |
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
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `7407f875b10eaa50eee510d30920d8d8` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `8f8d322862942097cfdf3758d1bbe622` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `242f2fb5fdc85848d3429e44d9b773a1` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `3389d4b5dc876f863c6297c2ea8fc47b` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `83a9751805104516c7011235b7d75372` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `910fa62f723aa4555d414af48efe30d7` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `c16e0464f2c2ca46b92d0d950766621d` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `5c36fc4961fbecd386d653654b849b35` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `c1bfa7773acd0118e3cf34ebebb3389c` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `6b75c1f1ad1395aac0fabddbab310b4f` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `35fd56439ce7ca74b05a2a42d60fc92b` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `e0485bc9ff3186279cd86aadf7aac3a8` | **Atteint** |
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

- **Calcul automatisé (`scripts/check-contrast.py`) :** 32 paires texte/fond analysées (`docs/audit/contrastes.md`) — **Atteint**
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

