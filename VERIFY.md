# Rapport de Vérification Automatique SamaAdresse (Lots 8b, 9 et 10)

**Date d'exécution :** 2026-10-19 12:06:06 UTC
**Branche / Commit :** feature/lot11a-espaces / 09d35e0
**Mode d'exécution :** Conteneur Docker de production (`--with-docker`, `http://localhost:8082`)

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
- **Couverture JaCoCo (Instructions) :** 76.38% (7300/9557 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 76.86% (1661/2161 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 124 / 124 tests passés (32 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-Bf0OdLOM.js`) :** **90.93 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-DPQB03yE.js                        19.71 Ko        5.38 Ko
AdminPage-gUC2jycy.js                          27.31 Ko        6.59 Ko
ConnectedLayout-CNLfI9Xy.js                    10.56 Ko        3.47 Ko
DashboardPage-Dhwf2Gsu.js                      12.15 Ko        3.32 Ko
DirectoryPage-C_LumWzZ.js                      12.04 Ko        3.64 Ko
EditAddressPage-s89KWFK5.js                    10.54 Ko        3.21 Ko
LeafletMapInner-DkQUCvUH.js                   154.77 Ko       45.31 Ko
MyAddressesPage-Cp_7g9JB.js                    26.09 Ko        7.13 Ko
NewAddressPage-Cbc-XW4_.js                     26.24 Ko        7.05 Ko
arrow-right-U2pWqWUh.js                         0.19 Ko        0.17 Ko
camera-cBA6JqpU.js                              0.35 Ko        0.26 Ko
chevron-right-CAMSskJ1.js                       0.15 Ko        0.15 Ko
download-BEUsQY22.js                            0.25 Ko        0.21 Ko
formValidation-Cw-c9F7w.js                      3.94 Ko        2.03 Ko
index-Bf0OdLOM.js                             325.65 Ko       90.93 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-b1YdTdh-.js                          0.22 Ko        0.19 Ko
search-C1QuSIuE.js                              0.19 Ko        0.18 Ko
trash-BQsE36s4.js                               0.36 Ko        0.24 Ko
triangle-alert-DNgG1oik.js                      0.31 Ko        0.24 Ko
ui-Dod4ZjHt.js                                 12.50 Ko        3.98 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x-Bx-QJuu-.js                                  48.72 Ko       17.36 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-Bf0OdLOM.js
Taille gzip : 90.93 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (90.93 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **393.6 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`) :** 20/20 vérifications réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 30 (Réussis : 30, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [47, 30.9, 29.4, 36.2, 18] (médiane **30.9 ms**) ; Sans code réservé : [17.1, 26.7, 37.2, 24, 15.8] (médiane **24 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 8 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | `http://localhost:8082/` | **97** | **100** | **100** | **100** | 2.4 s | 0 | 50 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | `http://localhost:8082/login` | **97** | **100** | **100** | **100** | 2.3 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | `http://localhost:8082/register` | **97** | **100** | **100** | **100** | 2.3 s | 0 | 30 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | `http://localhost:8082/a/ZIG-KBG-4271` | **94** | **100** | **100** | **100** | 2.9 s | 0 | 80 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `cache-insight`, `forced-reflow-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | `http://localhost:8082/annuaire` | **96** | **100** | **100** | **100** | 2.5 s | 0 | 20 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | `http://localhost:8082/addresses/mine` | **91** | **100** | **100** | **100** | 2.8 s | 0 | 210 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | `http://localhost:8082/addresses/new` | **95** | **100** | **100** | **100** | 2.5 s | 0 | 150 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `cache-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | `http://localhost:8082/addresses/mine` | **99** | **100** | **100** | **100** | 2.0 s | 0.007 | 20 ms | `largest-contentful-paint`, `interactive`, `network-dependency-tree-insight`, `render-blocking-insight` |

### Comparaison automatique aux cibles Lighthouse

- **`landing` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`login` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`register` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`public_address` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`directory` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`addresses_mine` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`addresses_new` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0 (0.0000 < 0,1 : **Atteint**)
- **`addresses_mine_offline` — Bonnes pratiques = 100 :** 100 (**Atteint**) | `errors-in-console` : **Atteint** | CLS = 0.007 (0.0067 < 0,1 : **Atteint**)
- **Étape 0a — `/annuaire` (Performance ≥ 92 et CLS < 0,1) :** Performance = **96**, CLS = **0** (0.0000) — **Atteint**
- **Règle générale CLS < 0,1 sur les 8 pages auditées :** **Atteint**
- **`/addresses/mine` — CLS < 0,1 :** 0 (valeur brute : 0.0000) — **Atteint**
- **`/addresses/new` — Performance ≥ 85 :** 95 — **Atteint**
- **`/addresses/new` — LCP < 3 s :** 2.5 s (2453 ms) — **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=1, score new=1 — **Atteint**

## 5. Captures d'écran et Unicité MD5 (Lot 6 & Lot 7)

Toutes les 38 captures requises existent, respectent les dimensions attendues (360×780 ou 1440×900) et possèdent une empreinte MD5 strictement unique (0 doublon) :

| Capture | Dimensions réelles | MD5 | Statut |
|---|:---:|---|:---:|
| `docs/audit/lot6/landing_360x780_offline.png` | 360×780 | `4a72d485b4cb37acc22d5bcf0c387c86` | **Atteint** |
| `docs/audit/lot6/landing_1440x900_offline.png` | 1440×900 | `3169f6f4a35bb96803152a1fe4be60de` | **Atteint** |
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
| `docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png` | 360×780 | `a3264000c6375a6ba68dd687939225a8` | **Atteint** |
| `docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `56ac667a1b405e74cf4ceaa992aeec0d` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_voiture.png` | 360×780 | `9aeeb3c15abc325e6c49531c48926cd0` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_voiture.png` | 1440×900 | `f51c81ebfe2ccdd0ed5a9f86918d166a` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_pied.png` | 360×780 | `5370edb9ea58b9e162114d9275fe531d` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_pied.png` | 1440×900 | `abc37b018c6b2d067c34cc83477e172e` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_360x780.png` | 360×780 | `340e5de4ca8d7534c53e1dab9b7d5a91` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png` | 1440×900 | `3bf8ba69b127f6e7fbbd1a1ca78e1d9f` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `1a06da26244c5b2f0b8be5ca2c166135` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `76aa6b1e60c797b9347d915c72b36929` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `0786eef91c17c3e48bbab13d6224b8fa` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `0470eb0b6569a8585cd8e254d37e6b45` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `79fbb71a0bbb268d874cc2b7a4bb4cf4` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `5733f7375fb31f0fc5c6ba85d3536a46` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `06a496286a769be1ac6d2fe7d0224e41` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `4d55dcb74a036d4fdaaa4bf777e07521` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `deb4f14ef5692acdc8f87612723ff004` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `9ccb38ffc51c143bf7617e5805c451c4` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `4e169e96e9a6affd97e91f90e8011a3a` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `4eff248c45679450698d9b6c4f18d138` | **Atteint** |
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

- **Voiture (`docs/audit/ors-real-car.json`) :** code=`ZIG-KBG-4271`, distance=1589.1 m, durée=163.5 s, étapes=3 — **Atteint**
- **À pied (`docs/audit/ors-real-foot.json`) :** code=`ZIG-KBG-4271`, distance=1589.1 m, durée=1271.3 s, étapes=3 — **Atteint**

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

