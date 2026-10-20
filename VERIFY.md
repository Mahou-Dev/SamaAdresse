# Rapport de Vérification Automatique SamaAdresse (Lots 8b, 9 et 10)

**Date d'exécution :** 2026-10-20 00:14:45 UTC
**Branche / Commit :** feature/lot12-corrections / 1e5686b
**Mode d'exécution :** Local (`--with-docker` non activé)

## 0. Sécurité Git & Clé ORS hors du dépôt

- **Fichier `.env` suivi par Git (`git ls-files .env`) :** Aucun (0 fichier) — **Atteint**
- **Fichier `.env.example` ne contenant que des placeholders vides (`KEY=`) :** 0 valeur pré-remplie — **Atteint**
- **Scan ciblé (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) pour préfixe ORS et `eyJ...` (> 60 car.) :** 0 occurrence — **Atteint**
- **Historique Git (`git log --all -S"<8 premiers caractères de ORS_API_KEY>"`) :** 0 commit trouvé — **Atteint**

## 0b. Cohérence des Variables d'Environnement & Liens README

- **Cohérence des variables d'environnement (`.env.example`, README, `render.yaml`, `docker-compose.prod-test.yml`, Spring) :** 36 variables strictement alignées (0 divergence) — **Atteint**
- **Liens internes du `README.md` :** 33 liens relatifs, aucun lien absolu ou `file://`, tous pointant vers des fichiers existants — **Atteint**

## 1. Backend (Spring Boot 3.4 & Java 21)

- **Nombre de tests exécutés :** 131 (Échecs : 0, Erreurs : 0, Ignorés : 0) — **Atteint**
- **Couverture JaCoCo (Instructions) :** 74.95% (7279/9712 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 74.80% (1653/2210 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 124 / 124 tests passés (32 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-BzsbKpFf.js`) :** **90.94 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-D1O8HMgT.js                        19.71 Ko        5.36 Ko
AdminPage-CDGrK43w.js                          27.37 Ko        6.58 Ko
ConnectedLayout-CNkxWDnj.js                    10.58 Ko        3.45 Ko
DashboardPage-CE3hPiml.js                      12.17 Ko        3.30 Ko
DirectoryPage-BA01XfV_.js                      12.04 Ko        3.64 Ko
EditAddressPage-CMuBnie0.js                    10.54 Ko        3.21 Ko
LeafletMapInner-BZ4aLIIG.js                   154.77 Ko       45.31 Ko
MyAddressesPage-CW3IplPV.js                    26.16 Ko        7.13 Ko
NewAddressPage-Ci07auOD.js                     26.24 Ko        7.05 Ko
arrow-right-DSI94n68.js                         0.19 Ko        0.17 Ko
camera-fzzKfyoa.js                              0.35 Ko        0.26 Ko
chevron-right-iz8meur6.js                       0.15 Ko        0.15 Ko
download-077YBLp6.js                            0.25 Ko        0.20 Ko
formValidation-tqUU6DHL.js                      3.94 Ko        2.03 Ko
index-BzsbKpFf.js                             325.70 Ko       90.94 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-DiqQR2nY.js                          0.22 Ko        0.19 Ko
search-DkWC-zs1.js                              0.19 Ko        0.18 Ko
trash-DJaVwN9b.js                               0.36 Ko        0.24 Ko
triangle-alert-B77fhVlt.js                      0.31 Ko        0.23 Ko
ui-eFpeqnD_.js                                 12.50 Ko        3.95 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x-BlsJ82s3.js                                  48.93 Ko       17.41 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-BzsbKpFf.js
Taille gzip : 90.94 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (90.94 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **393.6 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`) :** 20/20 vérifications réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 32 (Réussis : 32, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [47.3, 22.1, 29.1, 29.8, 25.3] (médiane **29.1 ms**) ; Sans code réservé : [28.4, 23.6, 15.1, 17.9, 19.4] (médiane **19.4 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 8 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | `http://localhost:8082/` | **96** | **100** | **100** | **100** | 2.5 s | 0 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | `http://localhost:8082/login` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | `http://localhost:8082/register` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | `http://localhost:8082/a/ZIG-KBG-4271` | **94** | **100** | **100** | **100** | 2.9 s | 0 | 110 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `cache-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | `http://localhost:8082/annuaire` | **96** | **100** | **100** | **100** | 2.5 s | 0.038 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **dashboard** | `http://localhost:8082/tableau-de-bord` | **92** | **100** | **100** | **100** | 2.6 s | 0.121 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `layout-shifts`, `unused-javascript`, `cls-culprits-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | `http://localhost:8082/addresses/mine` | **92** | **100** | **100** | **100** | 2.6 s | 0.121 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `layout-shifts`, `unused-javascript`, `cls-culprits-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | `http://localhost:8082/addresses/new` | **92** | **100** | **100** | **100** | 2.6 s | 0.121 | 20 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `cumulative-layout-shift`, `interactive`, `layout-shifts`, `unused-javascript`, `cls-culprits-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **account** | `http://localhost:8082/account` | **95** | **100** | **100** | **100** | 2.6 s | 0.017 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **admin** | `http://localhost:8082/admin` | **93** | **100** | **100** | **100** | 2.5 s | 0.121 | 0 ms | `first-contentful-paint`, `largest-contentful-paint`, `cumulative-layout-shift`, `interactive`, `layout-shifts`, `unused-javascript`, `cls-culprits-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | `http://localhost:8082/addresses/mine` | **96** | **100** | **100** | **100** | 0.4 s | 0.121 | 0 ms | `cumulative-layout-shift`, `layout-shifts`, `cls-culprits-insight`, `render-blocking-insight` |

### Comparaison automatique aux cibles Lighthouse

- **`landing` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`login` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`register` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`public_address` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`directory` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0.038 (0.0377 < 0,1 : **Atteint**)
- **`addresses_mine` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0.121 (0.1214 < 0,1 : **NON ATTEINT (0.1214)**)
- **`addresses_new` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0.121 (0.1214 < 0,1 : **NON ATTEINT (0.1214)**)
- **`addresses_mine_offline` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0.121 (0.1214 < 0,1 : **NON ATTEINT (0.1214)**)
- **Étape 0a — `/annuaire` (Performance ≥ 92 et CLS < 0,1) :** Performance = **96**, CLS = **0.038** (0.0377) — **Atteint**
- **Règle générale CLS < 0,1 sur les 8 pages auditées :** **NON ATTEINT**
- **`/addresses/mine` — CLS < 0,1 :** 0.121 (valeur brute : 0.1214) — **NON ATTEINT**
- **`/addresses/new` — Performance ≥ 85 :** 92 — **Atteint**
- **`/addresses/new` — LCP < 3 s :** 2.6 s (2590 ms) — **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=None, score new=None — **NON ATTEINT**

## 5. Captures d'écran et Unicité MD5 (Lot 6 & Lot 7)

Toutes les 38 captures requises existent, respectent les dimensions attendues (360×780 ou 1440×900) et possèdent une empreinte MD5 strictement unique (0 doublon) :

| Capture | Dimensions réelles | MD5 | Statut |
|---|:---:|---|:---:|
| `docs/audit/lot6/landing_360x780_offline.png` | 360×780 | `4a72d485b4cb37acc22d5bcf0c387c86` | **Atteint** |
| `docs/audit/lot6/landing_1440x900_offline.png` | 1440×900 | `d62e968f2c760a4cc3a76c990aabaa25` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_vue.png` | 360×780 | `2a85fd5d38c0b8402284fef98c7b671b` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_vue.png` | 1440×900 | `edcb2439276b743edac8aad62d463ab8` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_non_vue.png` | 360×780 | `7956bac67956132dfb7b2dd615305b0a` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_non_vue.png` | 1440×900 | `8d4a9320361dc6a52882e882e128c5b0` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_offline_fullpage.png` | 360×1228 | `afbf905087702bc7e3bafc48d67807ae` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_offline_fullpage.png` | 1440×1151 | `3ebcd182f7434152906f6fdb20f6ad87` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_recherche.png` | 360×780 | `ee2e300b3784c8797633a378551d92c1` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_recherche.png` | 1440×900 | `5dae5762ed3396591f6f14bcb09866ca` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_aucun_resultat.png` | 360×780 | `47ae886d925042d21bed3201aa757e3c` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_aucun_resultat.png` | 1440×900 | `67cfe4216dc4ffe9346baa2e6a84e5d2` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_offline.png` | 360×780 | `1f446254e734ce9af389be9420fd93cf` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_offline.png` | 1440×900 | `59f2e28d831e29959783e164a3de7c30` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_etape2_visibilite.png` | 360×780 | `c4213ca93f7be92322727579bb4c4855` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_etape2_visibilite.png` | 1440×900 | `2e5e9f3aa06fcd2e456d3db036b3bba8` | **Atteint** |
| `docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png` | 360×780 | `c1d4daec04b00b873ee8591a872ba447` | **Atteint** |
| `docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `a381d2c1fca482bda991ec105b4d3511` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_voiture.png` | 360×780 | `2a5e0248b725dbb6b6d6231e87aebde6` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_voiture.png` | 1440×900 | `c76ed84a61a6906acdb09e18828495ae` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_pied.png` | 360×780 | `fc1fcea1595e0d5c58a558232f8e042d` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_pied.png` | 1440×900 | `c4fd5369da44571c9a59b163880b3156` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_360x780.png` | 360×780 | `340e5de4ca8d7534c53e1dab9b7d5a91` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png` | 1440×900 | `3bf8ba69b127f6e7fbbd1a1ca78e1d9f` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `d0f05e29cf94dfabd38ac86f4f395d6e` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `42ae9799d4aeb90f4f0f250331aa29d1` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `0786eef91c17c3e48bbab13d6224b8fa` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `0470eb0b6569a8585cd8e254d37e6b45` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `aa5fa386d3eb51a80c5614dd4f215895` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `39df9fd7ead4aca7467da7c77ec82639` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `98d91fb920fb9124ab85f0797da6e34c` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `ef84c2b9f90d000893c126ba89539f03` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `deb4f14ef5692acdc8f87612723ff004` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `f4ea20859067abc3f931a367bf636aa1` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `7adf45c25450572e78ec9d0d26d06a9b` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `f0eb1906e19ee3274d842b77678e9e5e` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_360x780.png` | 360×780 | `d01ef8bd101267024f68ce2b38460bee` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_1440x900.png` | 1440×900 | `ff43931242510a9c0f287a50e3681d10` | **Atteint** |

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

## 9. Jetons de Design & Ratios de Contraste WCAG (Lot 9 — Palette Plus Forte)

- **Calcul automatisé (`scripts/check-contrast.py`) :** 25 paires texte/fond analysées (`docs/audit/contrastes.md`) — **Atteint**
- **Seuils WCAG 2.1 :** Texte standard ≥ 4,5:1 (ou AAA ≥ 7:1) ; Grands textes et composants d'interface ≥ 3:1 — **Atteint**
- **Validation binaire :** 0 échec de contraste, aucun blanc pur hors QR code réglementaire et texte des boutons ocre — **Atteint**

## 10. Captures Palette Plus Forte (Lot 9) & Comparatif `avant-apres.md`

- **Captures 8 vues × 2 résolutions (`docs/audit/palette/*.png`) :** Atteint (16/16 captures conformes, MD5 uniques)
- **Page comparative Avant/Après (`docs/audit/palette/avant-apres.md`) :** Générée automatiquement — **Atteint**

## 11. Finitions d'Interface & Captures 360 px (Lot 10)

- **Captures des écrans modifiés (`docs/audit/lot10/*.png`) :** Atteint (5/5 captures conformes, dimensions 360×780, MD5 uniques)
- **Pied de page étudiant sans mention Dakar fictive :** Validé dans `AppFooter.tsx` — **Atteint**
- **Création d'adresse étape 2 (volet visibilité ouvert par défaut) :** Validé dans `NewAddressPage.tsx` — **Atteint**
- **Toast au-dessus de la barre de navigation basse (hauteur 4.5rem + safe-area) :** Validé dans `Toast.tsx` — **Atteint**
- **Illustrations architecturales distinctes pour l'annuaire (4 visuels sans photo privée) :** Validé dans `backend/src/main/resources/demo-photos/` — **Atteint**

