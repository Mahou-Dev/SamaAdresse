# Rapport de Vérification Automatique SamaAdresse (Lot 8)

**Date d'exécution :** 2026-10-18 06:38:39 UTC
**Branche / Commit :** feature/lot8b-correctifs / b9e3cb6
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

- **Nombre de tests exécutés :** 130 (Échecs : 0, Erreurs : 0, Ignorés : 0) — **Atteint**
- **Couverture JaCoCo (Instructions) :** 76.51% (7286/9523 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 77.13% (1659/2151 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 111 / 111 tests passés (22 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-DH93glLd.js`) :** **102.66 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-Dc84hCew.js                        12.10 Ko        3.58 Ko
AdminPage-Ui11U0fI.js                          12.38 Ko        3.40 Ko
DirectoryPage-DbBbnjC6.js                      12.16 Ko        3.73 Ko
EditAddressPage-DJc7TxY3.js                    11.05 Ko        3.28 Ko
LeafletMapInner-BzJ9-rQX.js                   154.77 Ko       45.31 Ko
MyAddressesPage-DuANGHM3.js                    24.04 Ko        6.57 Ko
NewAddressPage-B2JOv1q_.js                     26.23 Ko        7.06 Ko
Toast-Dv5CPMqz.js                               4.71 Ko        2.06 Ko
camera-DCVw_uJR.js                              0.35 Ko        0.26 Ko
download-3fWtNpuy.js                            0.38 Ko        0.26 Ko
formValidation-BLCIxKs3.js                      4.25 Ko        2.13 Ko
index-DH93glLd.js                             359.61 Ko      102.66 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-Cj3P-hR9.js                          0.22 Ko        0.19 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x--UhefRsv.js                                   8.63 Ko        3.36 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-DH93glLd.js
Taille gzip : 102.66 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (102.66 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **393.5 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`, 11 vérifications HTTP/headers/caches/SPA/API/Flyway) :** 11/11 réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 25 (Réussis : 25, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [46.1, 24.8, 28.4, 18.7, 17.2] (médiane **24.8 ms**) ; Sans code réservé : [18.9, 20.8, 16, 15.2, 16.2] (médiane **16.2 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 8 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | `http://localhost:8082/` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 20 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | `http://localhost:8082/login` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | `http://localhost:8082/register` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | `http://localhost:8082/a/ZIG-KBG-4271` | **93** | **100** | **100** | **100** | 2.9 s | 0 | 160 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `cache-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | `http://localhost:8082/annuaire` | **96** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | `http://localhost:8082/addresses/mine` | **95** | **100** | **100** | **100** | 2.7 s | 0 | 0 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | `http://localhost:8082/addresses/new` | **96** | **100** | **100** | **100** | 2.6 s | 0 | 40 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `cache-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | `http://localhost:8082/addresses/mine` | **100** | **100** | **100** | **100** | 1.8 s | 0 | 0 ms | `largest-contentful-paint`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |

### Comparaison automatique aux cibles Lighthouse

- **`landing` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`login` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`register` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`public_address` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`directory` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`addresses_mine` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0001 < 0,1 : **Atteint**)
- **`addresses_new` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`addresses_mine_offline` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0001 < 0,1 : **Atteint**)
- **Étape 0a — `/annuaire` (Performance ≥ 92 et CLS < 0,1) :** Performance = **96**, CLS = **0** (0.0000) — **Atteint**
- **Règle générale CLS < 0,1 sur les 8 pages auditées :** **Atteint**
- **`/addresses/mine` — CLS < 0,1 :** 0 (valeur brute : 0.0001) — **Atteint**
- **`/addresses/new` — Performance ≥ 85 :** 96 — **Atteint**
- **`/addresses/new` — LCP < 3 s :** 2.6 s (2581 ms) — **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=1, score new=1 — **Atteint**

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
| `docs/audit/lot6/wizard_360x780_offline_fullpage.png` | 360×1228 | `680829714d8cce0e38f06297441e72c5` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_offline_fullpage.png` | 1440×1151 | `e5ae1b5c5031e456c1bb1558d5870eda` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_recherche.png` | 360×780 | `ee2e300b3784c8797633a378551d92c1` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_recherche.png` | 1440×900 | `5dae5762ed3396591f6f14bcb09866ca` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_aucun_resultat.png` | 360×780 | `47ae886d925042d21bed3201aa757e3c` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_aucun_resultat.png` | 1440×900 | `67cfe4216dc4ffe9346baa2e6a84e5d2` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_offline.png` | 360×780 | `1f446254e734ce9af389be9420fd93cf` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_offline.png` | 1440×900 | `59f2e28d831e29959783e164a3de7c30` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_etape2_visibilite.png` | 360×780 | `671d704d7ab3f7235149c09d0f9e4f4a` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_etape2_visibilite.png` | 1440×900 | `a798441f2b25368c86d7c26bec5eb4f2` | **Atteint** |
| `docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png` | 360×780 | `c3932fda35d88bacc07e5999de04a505` | **Atteint** |
| `docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `0489e441f3f22f0e0a3620cf936d1202` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_voiture.png` | 360×780 | `9aeeb3c15abc325e6c49531c48926cd0` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_voiture.png` | 1440×900 | `8698bb94fe3f38e08ef482c8b28f4e29` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_pied.png` | 360×780 | `5370edb9ea58b9e162114d9275fe531d` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_pied.png` | 1440×900 | `9cf1cf9c72a8fb9d62a4fc7f7336918d` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_360x780.png` | 360×780 | `340e5de4ca8d7534c53e1dab9b7d5a91` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png` | 1440×900 | `9e2b59bca02a12d71a6ac9dfa5f54d02` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `318ec8a7a2cc3e7633b86e8aa55a94fa` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `7701fa9f0da8b5a6e389f9c01495d830` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `29a8e4e346162f830393201e499f426b` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `0b681433e0272b590d948150e03fa265` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `77b48c77f457e7e2aa365231463df700` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `91333610bc21315e2d34673049ab412b` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `6db6c3102e81c7d70589052c7c9da563` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `6c678eb9f7e4b3b2de8ca828cd538bda` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `d3e1ee4dad19846a25405d9b18aa836f` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `25a2d5efd5f38bcc639fee47a39df29a` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `de707307b4da9db47f35ab6f61429acd` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `e9b39b78aa9c723ba814fd3884e571ad` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_360x780.png` | 360×780 | `d01ef8bd101267024f68ce2b38460bee` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_1440x900.png` | 1440×900 | `84c04b36c14e6aa50c4e444860413404` | **Atteint** |

## 6. Lint de contenu (`frontend/src`)

- **Vérification des termes interdits :** Aucun terme interdit trouvé (`République du Sénégal`, `officiel`, `adresse vérifiable`, `justificatif`, `normalisé`, `au mètre près`, `Afrique de l'Ouest`, `localhost`, `127.0.0.1`, `Habitation`) — **Atteint**
- **Vérification des classes typographiques :** Aucune classe `uppercase` combinée avec `tracking-*` — **Atteint**

## 7. Cohérence de la grille géographique & Documentation `geo-grid-a-verifier.md`

- **Source Backend :** `backend/src/main/resources/geo-grid.json`
- **Cible Frontend :** `frontend/src/data/geo-grid.json`
- **Vérification binaire (`cmp -s`) :** Strictement identiques — **Atteint**
- **Fiche de vérification terrain (`docs/geo-grid-a-verifier.md`) :** Générée automatiquement (8 quartiers) — **Atteint**

## 8. Itinéraire réel OpenRouteService (`ZIG-KBG-4271`)

- **Voiture (`docs/audit/ors-real-car.json`) :** code=`ZIG-KBG-4271`, distance=1589.1 m, durée=163.5 s, étapes=3 — **Atteint**
- **À pied (`docs/audit/ors-real-foot.json`) :** code=`ZIG-KBG-4271`, distance=1589.1 m, durée=1271.3 s, étapes=3 — **Atteint**

## 9. Jetons de Design & Ratios de Contraste WCAG (Lot 9 — Palette Plus Forte)

- **Calcul automatisé (`scripts/check-contrast.py`) :** 25 paires texte/fond analysées (`docs/audit/contrastes.md`) — **Atteint**
- **Seuils WCAG 2.1 :** Texte standard ≥ 4,5:1 (ou AAA ≥ 7:1) ; Grands textes et composants d'interface ≥ 3:1 — **Atteint**
- **Validation binaire :** 0 échec de contraste, aucun blanc pur hors QR code réglementaire et texte des boutons ocre — **Atteint**

## 10. Captures Palette Plus Forte (Lot 9) & Comparatif `avant-apres.md`

- **Captures 8 vues × 2 résolutions (`docs/audit/palette/*.png`) :** Atteint (16/16 captures conformes, MD5 uniques)
- **Page comparative Avant/Après (`docs/audit/palette/avant-apres.md`) :** Générée automatiquement — **Atteint**

