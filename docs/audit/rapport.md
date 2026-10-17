# Rapport Final — Lot 8 (Déploiement, Livrables et Solde des Lots 6+7)

## ÉTAPE 0 — Solde des Lots 6+7 (Points `a` à `i`)

| Point | Exigence & Preuve mesurée | Statut |
|:---:|---|:---:|
| **a** | `/annuaire` : Performance = **96** (cible ≥ 92), CLS = **0** (0.0000, cible < 0,1). Cause corrigée dans `DirectoryPage.tsx` (hauteurs réservées `min-h-[1100px]` sur le conteneur principal, `min-h-[172px] sm:min-h-[116px]` sur le panneau de filtres, `min-h-[560px]` sur la zone de résultats, `min-h-[20px]` sur le compteur). Règle générale CLS < 0,1 sur les 8 pages auditées vérifiée dans `verify-all`. | **Atteint** |
| **b** | Historique Git : `git log --all -p -S"<8 premiers caractères de ORS_API_KEY>"` retourne **0 commit** (sans réécriture de l'historique). | **Atteint** |
| **c** | 4 tests d'annuaire dans `DirectoryControllerTest` : `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`, `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`, `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`, `directory_archivedOrSuspendedAddress_disappearsFromDirectory`. | **Atteint** |
| **d** | Assertions E2E (`lot6.spec.ts` & `lot7.spec.ts`) et captures : « Figurer dans l'annuaire public » décoché par défaut ; code non coupé dans la file d'attente à 360 px (`scrollWidth <= clientWidth`) ; une seule mention « Enregistrée sur cet appareil » sur la plaque (`count === 1`) ; bannière de réattribution avec marge (`marginBottom >= 16 px`) et bouton « Fermer » ≥ 44×44 px ; placeholder de recherche non tronqué à 360 px (`scrollWidth <= clientWidth`). | **Atteint** |
| **e** | `docs/audit/offline-timing.json` : note explicitement ce qui est exclu de la mesure (*Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)*) et le ralentissement processeur utilisé (`4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)`). Médianes : **27.6 ms** (avec code réservé) et **24.9 ms** (sans code réservé). | **Atteint** |
| **f** | Cartes d'itinéraire : `ResizeObserver` + `invalidateSize({ animate: false })` après `fitBounds` dans `LeafletMapInner.tsx`, attente de `leaflet-tile-loaded` sur toutes les tuiles visibles et cadrage complet de la carte dans `lot6.spec.ts` avant les 4 captures `fiche_*_itineraire_*`. | **Atteint** |
| **g** | Bannière de réattribution : un seul message sans toast en double (« Le code provisoire ZIG-KBG-6734 a été remplacé par ZIG-ESC-3540, car l'adresse se trouve à Escale. » avec le nom du quartier), toast « synchronisée » distinct. | **Atteint** |
| **h** | Hors zone : message actionnable « Ces coordonnées sont hors des zones couvertes (Ziguinchor, Dakar). Déplacez le repère ou saisissez d'autres coordonnées. » dans `NewAddressPage.tsx` et captures `hors_zone_hors_ligne_*` régénérées. | **Atteint** |
| **i** | `scripts/verify-all` : contrôle de clé limité aux fichiers de code et de configuration (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) et au préfixe de clé ORS, sans faux positif sur les JSON Lighthouse. | **Atteint** |

## Points NON PROUVÉ ou NON ATTEINT (Transparence Totale)

- **Envoi et réception d'un SMS réel via Twilio ou SendFlash sur un téléphone physique :** **NON PROUVÉ** (aucun compte Twilio/SendFlash ni numéro de téléphone de test disponible dans cet environnement ; le fournisseur `TwilioSmsProvider` et le script `scripts/sms-live-test` sont prêts et testés unitairement avec serveur mock, tandis que `ConsoleSmsProvider` est actif par défaut via `SMS_PROVIDER=console`).
- **Déploiement effectif sur les infrastructures cloud distantes (GitHub Actions distant, Neon PostgreSQL cloud, Render Web Service cloud) :** **NON PROUVÉ** (aucun compte GitHub, Neon ou Render connecté dans cet environnement ; l'image Docker de production `samaadresse:prod-test` est construite et validée localement avec PostgreSQL 16 via `docker-compose.prod-test.yml`, `smoke-prod.sh`, Playwright, Newman et Lighthouse).
- **Installation PWA via invite native navigateur sous certificat HTTPS public de production :** **NON PROUVÉ** (testé en local sur `http://localhost:8082` avec Service Worker actif et mode hors ligne vérifié).

---

# Rapport de Vérification Automatique SamaAdresse (Lot 8)

**Date d'exécution :** 2026-10-17 19:22:57 UTC
**Branche / Commit :** feature/lot8-deploiement / 78323fa
**Mode d'exécution :** Conteneur Docker de production (`--with-docker`, `http://localhost:8082`)

## 0. Sécurité Git & Clé ORS hors du dépôt

- **Fichier `.env` suivi par Git (`git ls-files .env`) :** Aucun (0 fichier) — **Atteint**
- **Fichier `.env.example` ne contenant que des placeholders vides (`KEY=`) :** 0 valeur pré-remplie — **Atteint**
- **Scan ciblé (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) pour préfixe ORS et `eyJ...` (> 60 car.) :** 0 occurrence — **Atteint**
- **Historique Git (`git log --all -p -S"<8 premiers caractères de ORS_API_KEY>"`) :** 0 commit trouvé — **Atteint**

## 1. Backend (Spring Boot 3.4 & Java 21)

- **Nombre de tests exécutés :** 124 (Échecs : 0, Erreurs : 0, Ignorés : 0) — **Atteint**
- **Couverture JaCoCo (Instructions) :** 79.16% (7131/9008 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 78.90% (1623/2057 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 111 / 111 tests passés (22 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-DQcISaDZ.js`) :** **102.45 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-CSTO3Wnw.js                        12.08 Ko        3.60 Ko
AdminPage-DQAuTa2T.js                          12.38 Ko        3.43 Ko
DirectoryPage-_1PfZcUz.js                      12.30 Ko        3.79 Ko
EditAddressPage-KhuV-vE_.js                    11.05 Ko        3.32 Ko
LeafletMapInner-DsoeCNL_.js                   154.77 Ko       45.32 Ko
MyAddressesPage-CSTnKC6_.js                    24.27 Ko        6.63 Ko
NewAddressPage-BAr1DXgg.js                     26.51 Ko        7.15 Ko
Toast-B-0QRtZY.js                               4.51 Ko        1.97 Ko
camera-DCVw_uJR.js                              0.35 Ko        0.26 Ko
download-3fWtNpuy.js                            0.38 Ko        0.26 Ko
formValidation-8SSYDlED.js                      4.25 Ko        2.13 Ko
index-DQcISaDZ.js                             357.84 Ko      102.45 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-Cj3P-hR9.js                          0.22 Ko        0.19 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x--UhefRsv.js                                   8.63 Ko        3.36 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-DQcISaDZ.js
Taille gzip : 102.45 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (102.45 Ko <= 105 Ko) !
```

## 2b. Image Docker de Production (`samaadresse:prod-test`), Smoke-Test & Newman

- **Image Docker finale (`samaadresse:prod-test`, Temurin 21 JRE Alpine, non-root) :** **393.5 Mo** — **Atteint**
- **Smoke-test de production (`scripts/smoke-prod.sh`, 11 vérifications HTTP/headers/caches/SPA/API/Flyway) :** 11/11 réussies (`docs/audit/smoke-prod.md`) — **Atteint**
- **Collection Postman & Exécution Newman (`Parcours démo` contre `http://localhost:8082`) :** 6 requêtes (0 échec), 6/6 assertions réussies — **Atteint**

## 3. Tests E2E Playwright, Mesure Hors Ligne (`offline-timing.json`) & CSP (`csp-violations.json`)

- **Total des tests exécutés contre `http://localhost:8082` :** 25 (Réussis : 25, Échoués : 0) — **Atteint**
- **Délai d'affichage de la plaque hors ligne (`performance.now()`, 5 mesures) :** Avec code réservé : [44.9, 19.5, 27.6, 28.6, 27] (médiane **27.6 ms**) ; Sans code réservé : [17.8, 24.9, 25.6, 29.9, 17.2] (médiane **24.9 ms**) | Ralenti CPU : `4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)` | Exclu : *Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)* — Cible < 3000 ms : **Atteint**
- **Enregistrement des violations CSP (`Content-Security-Policy-Report-Only`) :** 0 violation CSP détectée sur l'ensemble des parcours E2E (`docs/audit/csp-violations.json`) — **Atteint**

## 4. Audits Lighthouse (Image Docker de Production — 8 pages)

Les scores ci-dessous sont extraits directement des rapports JSON Lighthouse générés pour chaque page contre `http://localhost:8082` :

| Page | URL finale (`finalUrl`) | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | Audits < 1 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **landing** | `http://localhost:8082/` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 20 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **login** | `http://localhost:8082/login` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **register** | `http://localhost:8082/register` | **97** | **100** | **100** | **100** | 2.5 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **public_address** | `http://localhost:8082/a/ZIG-KBG-4271` | **90** | **100** | **100** | **100** | 2.9 s | 0 | 240 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `cache-insight`, `image-delivery-insight`, `lcp-discovery-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **directory** | `http://localhost:8082/annuaire` | **96** | **100** | **100** | **100** | 2.6 s | 0 | 10 ms | `first-contentful-paint`, `largest-contentful-paint`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine** | `http://localhost:8082/addresses/mine` | **92** | **100** | **100** | **100** | 2.7 s | 0 | 210 ms | `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_new** | `http://localhost:8082/addresses/new` | **96** | **100** | **100** | **100** | 2.6 s | 0 | 40 ms | `first-contentful-paint`, `largest-contentful-paint`, `max-potential-fid`, `interactive`, `unused-javascript`, `llms-txt`, `cache-insight`, `network-dependency-tree-insight`, `render-blocking-insight` |
| **addresses_mine_offline** | `http://localhost:8082/addresses/mine` | **100** | **100** | **100** | **100** | 1.9 s | 0 | 0 ms | `largest-contentful-paint`, `llms-txt`, `network-dependency-tree-insight`, `render-blocking-insight` |

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
- **`/addresses/new` — LCP < 3 s :** 2.6 s (2585 ms) — **Atteint**
- **`label-content-name-mismatch` (`mine` & `new`) :** score mine=1, score new=1 — **Atteint**

## 5. Captures d'écran et Unicité MD5 (Lot 6 & Lot 7)

Toutes les 38 captures requises existent, respectent les dimensions attendues (360×780 ou 1440×900) et possèdent une empreinte MD5 strictement unique (0 doublon) :

| Capture | Dimensions réelles | MD5 | Statut |
|---|:---:|---|:---:|
| `docs/audit/lot6/landing_360x780_offline.png` | 360×780 | `c2ca0d0bb16dac7356040ba0e7320e28` | **Atteint** |
| `docs/audit/lot6/landing_1440x900_offline.png` | 1440×900 | `9e32feb804faa37654d37eb2f654f2a1` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_vue.png` | 360×780 | `2a85fd5d38c0b8402284fef98c7b671b` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_vue.png` | 1440×900 | `edcb2439276b743edac8aad62d463ab8` | **Atteint** |
| `docs/audit/lot6/carte_360x780_offline_non_vue.png` | 360×780 | `7956bac67956132dfb7b2dd615305b0a` | **Atteint** |
| `docs/audit/lot6/carte_1440x900_offline_non_vue.png` | 1440×900 | `8d4a9320361dc6a52882e882e128c5b0` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_offline_fullpage.png` | 360×1228 | `821fd0701c43cb752c065d27f297444b` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_offline_fullpage.png` | 1440×1151 | `65bbbbc66c77ec0149fa3394efaf5c21` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_recherche.png` | 360×780 | `0f455da19df4d5c8cb15b623e4056acb` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_recherche.png` | 1440×900 | `351fe40ec846959219c948a28aea628d` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_aucun_resultat.png` | 360×780 | `85fe8d2a08371f701281752f001a6ca2` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_aucun_resultat.png` | 1440×900 | `14d8091c198bef30a6aec15becaac469` | **Atteint** |
| `docs/audit/lot6/annuaire_360x780_offline.png` | 360×780 | `c1c31e81dd0a4bdf71f4d3069ff4ab81` | **Atteint** |
| `docs/audit/lot6/annuaire_1440x900_offline.png` | 1440×900 | `33aeeeeb36987256cd0d62cea8ec4e0d` | **Atteint** |
| `docs/audit/lot6/wizard_360x780_etape2_visibilite.png` | 360×780 | `4014136012029b3e94a469de74e6204e` | **Atteint** |
| `docs/audit/lot6/wizard_1440x900_etape2_visibilite.png` | 1440×900 | `04df8e5397e0cbaf6a576d9a64c98651` | **Atteint** |
| `docs/audit/lot6/mes_adresses_360x780_pill_annuaire.png` | 360×780 | `5fa23d783b563e5f91cb3bd281f235cc` | **Atteint** |
| `docs/audit/lot6/mes_adresses_1440x900_pill_annuaire.png` | 1440×900 | `3fde85379719b93deec0b82a16282620` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_voiture.png` | 360×780 | `110d0d1856dcea67916dbe3d751bf3e5` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_voiture.png` | 1440×900 | `55abddfdc7cf145f7a3d41c0d2e2f4b3` | **Atteint** |
| `docs/audit/lot6/fiche_360x780_itineraire_pied.png` | 360×780 | `497b6434753ad6a0f70cc8e72cadc499` | **Atteint** |
| `docs/audit/lot6/fiche_1440x900_itineraire_pied.png` | 1440×900 | `78a33c4db70d677b7e1d20538f5220d3` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_360x780.png` | 360×780 | `7f82ca9c8c485fabb96a33101a5cedee` | **Atteint** |
| `docs/audit/lot7/wizard_hors_ligne_validation_1440x900.png` | 1440×900 | `6d4ad73e7ec38bd262ff53388c55d0ac` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_360x780.png` | 360×780 | `22b9ad36748c689aa9dd6ef9fd05a149` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_avec_code_reserve_1440x900.png` | 1440×900 | `6e8c70a350c6f96bc4b9109be580b3f2` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_360x780.png` | 360×780 | `964000efc1fd08499397fbf9085ef14a` | **Atteint** |
| `docs/audit/lot7/plaque_hors_ligne_sans_code_reserve_1440x900.png` | 1440×900 | `e89c6dc7ef38e5a07cff2aad8536e25c` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_360x780.png` | 360×780 | `feae8503d989349eede02d7e2e1737fe` | **Atteint** |
| `docs/audit/lot7/file_attente_adresses_mine_1440x900.png` | 1440×900 | `fb7b474217c3c914613835ced8e2dde5` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_360x780.png` | 360×780 | `3f4ee0bbade30054a2ddb2711a24a9b4` | **Atteint** |
| `docs/audit/lot7/adresse_apres_synchronisation_1440x900.png` | 1440×900 | `f8ccb6445e30961780b021756f78b5cf` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_360x780.png` | 360×780 | `a38bf02e6854d7fa125f650953f618fc` | **Atteint** |
| `docs/audit/lot7/modale_avertissement_deconnexion_1440x900.png` | 1440×900 | `93bdc69b6582daab7af7eb763726e440` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_360x780.png` | 360×780 | `340a52c9fe4bb111e8f035acd3ada2d4` | **Atteint** |
| `docs/audit/lot7/notification_reassignation_code_1440x900.png` | 1440×900 | `66de57cb5fa9d6cd6d026cbafbfed369` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_360x780.png` | 360×780 | `22d8e4bad3e7fa7e277584dcb88f4536` | **Atteint** |
| `docs/audit/lot7/hors_zone_hors_ligne_1440x900.png` | 1440×900 | `7b845c87a4af9766ed087e55e1fed38e` | **Atteint** |

## 6. Lint de contenu (`frontend/src`)

- **Vérification des termes interdits :** Aucun terme interdit trouvé (`République du Sénégal`, `officiel`, `adresse vérifiable`, `justificatif`, `normalisé`, `au mètre près`, `Afrique de l'Ouest`, `localhost`, `127.0.0.1`, `Habitation`) — **Atteint**
- **Vérification des classes typographiques :** Aucune classe `uppercase` combinée avec `tracking-*` — **Atteint**

## 7. Cohérence de la grille géographique & Documentation `geo-grid-a-verifier.md`

- **Source Backend :** `backend/src/main/resources/geo-grid.json`
- **Cible Frontend :** `frontend/src/data/geo-grid.json`
- **Vérification binaire (`cmp -s`) :** Strictement identiques — **Atteint**
- **Fiche de vérification terrain (`docs/geo-grid-a-verifier.md`) :** Générée automatiquement (16 quartiers) — **Atteint**

## 8. Itinéraire réel OpenRouteService (`ZIG-KBG-4271`)

- **Voiture (`docs/audit/ors-real-car.json`) :** code=`ZIG-KBG-4271`, distance=1382 m, durée=178 s, étapes=6 — **Atteint**
- **À pied (`docs/audit/ors-real-foot.json`) :** code=`ZIG-KBG-4271`, distance=1554.6 m, durée=1119.3 s, étapes=12 — **Atteint**



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
  "measuredAt": "2026-10-17T19:28:10.511Z",
  "criterionMaxMs": 3000,
  "excludedFromMeasurement": "Acquisition matérielle du signal GPS et saisie préalable des étapes 1 et 2 (la mesure chronomètre avec performance.now() le délai entre le clic final d'enregistrement et l'affichage de la plaque d'adresse hors ligne après résolution locale de la grille et écriture dans IndexedDB)",
  "cpuThrottling": "4x slowdown (CDP Emulation.setCPUThrottlingRate rate=4)",
  "withReservedCode": {
    "samplesMs": [
      44.9,
      19.5,
      27.6,
      28.6,
      27
    ],
    "medianMs": 27.6
  },
  "withoutReservedCode": {
    "samplesMs": [
      17.8,
      24.9,
      25.6,
      29.9,
      17.2
    ],
    "medianMs": 24.9
  },
  "overallMedianMs": 27,
  "status": "Atteint"
}
```


## Contenu brut : `docs/audit/csp-violations.json`

```json
{
  "checkedAt": "2026-10-17T19:28:10.533Z",
  "totalViolations": 0,
  "violations": []
}
```


---

# Rapport de Vérification Smoke Production (`smoke-prod.sh`)

- **Cible testée :** `http://localhost:8082`
- **Date d'exécution :** 2026-10-17 19:26:34 UTC
- **Statut global :** **Atteint**

| Vérification | Statut | Détail mesuré |
|---|:---:|---|
| GET /api/health | **Atteint** | `HTTP 200, corps={"status":"UP"}` |
| GET / et GET /a/ZIG-KBG-4271 (SPA fallback) | **Atteint** | `GET / -> 200 (Cache-Control: no-cache) ; GET /a/ZIG-KBG-4271 -> 200 (Cache-Control: no-cache)` |
| GET /assets/index-DQcISaDZ.js (cache long immuable) | **Atteint** | `HTTP 200, taille=366432 octets, Cache-Control: max-age=31536000, public, immutable` |
| GET /api/addresses/ZIG-KBG-4271 | **Atteint** | `HTTP 200, code=ZIG-KBG-4271, photoUrl=/uploads/00000000-0000-4000-8000-000000000001.jpg` |
| GET /uploads/00000000-0000-4000-8000-000000000001.jpg (photo en base + ETag + 304) | **Atteint** | `1er appel: HTTP 200 (66775 octets, ETag="3254cf262b6dfe7edd79b16f369cfdb8", Cache-Control=max-age=31536000, public, immutable) ; 2e appel (If-None-Match): HTTP 304` |
| GET /api/addresses/ZIG-KBG-4271/qrcode | **Atteint** | `HTTP 200, Content-Type=image/png, taille=410 octets (signature PNG valide)` |
| GET /api/public/directory?quartier=KBG | **Atteint** | `HTTP 200, totalElements=1` |
| GET /api/public/route | **Atteint** | `HTTP 200, distance=3543.0 m, duration=425.1 s` |
| POST /api/auth/login + attributs Set-Cookie | **Atteint** | `HTTP 200, token reçu (323 car.), Set-Cookie contient HttpOnly, SameSite=Strict, Path=/api/auth/refresh` |
| Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404) | **Atteint** | `Création=201, Upload=200 (/uploads/ef041924-f4f8-47ac-9f5b-52b6ed27980b.jpg), Lecture=200 (24308 octets), Suppression=200, Lecture après suppression=404` |
| En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only) | **Atteint** | `X-Content-Type-Options=nosniff ; Referrer-Policy=strict-origin-when-cross-origin ; Permissions-Policy=geolocation=(self), camera=(self) ; CSP-Report-Only présent (247 car.)` |


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

## Après correctifs (extraction depuis les 8 rapports JSON Lighthouse)

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

### addresses_mine (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.

### addresses_new (`http://localhost:8082/addresses/new`) — score : 1

- Aucune erreur console.

### addresses_mine_offline (`http://localhost:8082/addresses/mine`) — score : 1

- Aucune erreur console.
