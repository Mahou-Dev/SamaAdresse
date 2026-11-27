# 06 — AUDIT DES TESTS ET DE LA QUALITÉ LOGICIELLE

- **Seuil contractuel exigé :** `60 %` minimum de couverture mesurée.
- **Principe d'audit :** distinction stricte entre nombre de tests, réussite, couverture des lignes, couverture des branches et couverture fonctionnelle réelle des 15 parcours critiques.

---

## 1. Inventaire et résultats des suites de tests

| Suite | Outil / Environnement | Fichiers | Tests exécutés | Résultat | Preuve |
|---|---|---:|---:|---|---|
| **Backend (unitaires + MockMvc + intégration)** | JUnit 5 + JaCoCo `0.8.12` (local H2 + CI PostgreSQL 16) | 18 | **141** | **141 / 141 réussis** | `backend/target/site/jacoco/jacoco.xml`, CI run #18 & #20 (`140496384030`) |
| **Frontend (unitaires + composants)** | Vitest `2.1.9` + `@vitest/coverage-v8` + jsdom | 10 | **61** | **61 / 61 réussis** | Exécution locale `vitest run --coverage`, CI run #18 & #20 (`140496383662`) |
| **TypeScript & Lint** | `tsc -b --noEmit` + ESLint `9.25.0` | Tout `frontend/` | — | **0 erreur, 0 warning** | CI run #18 & #20 |
| **Tests API (collection Postman)** | Newman (`Parcours démo`, 6 requêtes) sur Docker prod + PG 16 | 1 | 6 scénarios | **Réussi** | CI run #18 & #20 (`140496878078`) |
| **Tests E2E navigateur** | Playwright `1.64.1` Chromium (`frontend/e2e/app.spec.ts`) | 1 | **3** | **3 / 3 réussis** | CI run #18 & #20 (`140496878078`) |
| **Smoke production & QR** | `scripts/smoke-prod.sh` + `scripts/test-qr-decode.mjs` | 2 | **20 contrôles** | **20 / 20 réussis** | CI run #18 & #20 (`140496878078`) |
| **Audit live & Chromium (présent audit)** | Sondes HTTP + Playwright read-only (`audit_playwright.mjs`) | 1 | 18 sondes + 36 checks VP + offline + QR | **17/18 sondes OK** *(route ORS 503)* ; offline & QR OK | `/tmp/samaadresse-audit-playwright.json` |

---

## 2. Couverture de code réellement mesurée

### A. Backend — JaCoCo (`backend/target/site/jacoco/jacoco.xml`)

| Métrique globale | Couverts / Total | Taux mesuré | Seuil 60 % |
|---|---:|---:|:---:|
| **Lignes (`LINE`)** | `1 722 / 2 264` | **76,06 %** | **ATTEINT** |
| **Instructions (`INSTRUCTION`)** | `7 537 / 9 937` | **75,85 %** | **ATTEINT** |
| **Méthodes (`METHOD`)** | `256 / 340` | **75,29 %** | **ATTEINT** |
| **Classes (`CLASS`)** | `82 / 91` | **90,11 %** | **ATTEINT** |
| **Branches (`BRANCH`)** | `541 / 926` | **58,42 %** | **NON ATTEINT (-1,58 pt)** |
| **Complexité (`COMPLEXITY`)** | `399 / 803` | **49,69 %** | Faible |

#### Détail par package backend (points faibles exposés)

| Package | Lignes | Branches | Analyse |
|---|---:|---:|---|
| `sn.samaadresse.config` | 87,3 % | 62,1 % | Bien couvert (`ProductionFeaturesTest`). |
| `sn.samaadresse.sms` | 81,6 % | 54,2 % | `TwilioSmsProvider` testé sur mock HTTP ; `SendFlashSmsProvider` squelette. |
| `sn.samaadresse.security` | 79,9 % | **50,0 %** | Plusieurs branches d'erreurs JWT/IP/rate-limit non exercées. |
| `sn.samaadresse.service` | 79,5 % | 61,7 % | Cœur métier correctement testé. |
| `sn.samaadresse.exception` | 61,8 % | 58,3 % | Gestionnaires d'erreurs génériques partiellement couverts. |
| **`sn.samaadresse.controller`** | **40,3 %** | **28,0 %** | **Angle mort majeur** : plusieurs endpoints non couverts en MockMvc (`AddressController` partiel, `RouteController`, `ReservedCodeController`, `CustomErrorController`). |
| **`sn.samaadresse.domain.entity`** | **32,3 %** | **16,7 %** | Hooks `@PrePersist`/`@PreUpdate` peu exercés hors tests JPA. |

> **Constat critique :** la règle JaCoCo dans `backend/pom.xml:175-179` vérifie uniquement `LINE >= 0.60` et ne contrôle pas `BRANCH`, masquant le déficit de couverture des branches (`58,42 %`) et des contrôleurs (`40,3 %`).

### B. Frontend — Vitest v8 (`/tmp/samaadresse-audit-fe-coverage/coverage-summary.json`)

| Métrique globale | Couverts / Total | Taux mesuré | Seuil 60 % |
|---|---:|---:|:---:|
| **Lignes (`lines`)** | `3 016 / 4 542` | **66,40 %** | **ATTEINT** |
| **Instructions (`statements`)** | `3 016 / 4 542` | **66,40 %** | **ATTEINT** |
| **Fonctions (`functions`)** | `200 / 299` | **66,88 %** | **ATTEINT** |
| **Branches (`branches`)** | `682 / 926` | **73,65 %** | **ATTEINT** |

#### Angles morts majeurs du frontend (modules non testés ou quasi non testés)

| Fichier / Dossier | Lignes | Branches | Fonctions | Risque |
|---|---:|---:|---:|---|
| **`src/components/map/*`** (`AddressMap`, `BaseMap`, `LocationPicker`, `pins`) | **0,00 %** | **0,00 %** | **0,00 %** | Totalement mocké dans tous les tests Vitest ! |
| **`src/pages/MapPage.tsx`** | **0,00 %** | **0,00 %** | **0,00 %** | Logique N+1, filtres et centrage GPS non testés unitairement. |
| **`src/pages/admin/AdminAddressesPage.tsx`** | **0,00 %** | **0,00 %** | **0,00 %** | Fusion annuaire/signalements et suspension non testées. |
| **`src/pages/admin/AdminUsersPage.tsx`** | **0,00 %** | **0,00 %** | **0,00 %** | Page informative non testée. |
| **`src/pages/AccountPage.tsx`** | **3,17 %** | 100 % | **0,00 %** | Affichage profil, logout et install prompt non testés. |
| **`src/hooks/useInstallPrompt.ts`** | **8,69 %** | 100 % | **0,00 %** | Événement `beforeinstallprompt` non testé. |
| **`src/lib/drafts.ts`** | **11,34 %** | 66,66 % | **22,22 %** | Persistance IndexedDB et `syncDrafts()` quasi non testés ! |
| **`src/lib/photo.ts`** | **14,70 %** | 100 % | **0,00 %** | Validation/compression client des photos non testée ! |
| **`src/pages/SearchPage.tsx`** | **28,16 %** | 66,66 % | **25,00 %** | Modes quartier/type et pagination non testés en Vitest (d'où le bug de recherche par nom de quartier passé inaperçu !). |
| **`src/pages/MyAddressesPage.tsx`** | **45,45 %** | 40,00 % | **25,00 %** | Affichage des brouillons et filtres peu testés. |

---

## 3. Matrice de couverture des 15 parcours critiques

| # | Parcours critique | Unitaire Backend | Unitaire Frontend | API / Newman | E2E Playwright | Verdict couverture |
|---|---|---|---|---|---|---|
| 1 | Création d'un compte | Oui (`AuthAndSecurityTest`) | Oui (validation client) | Non (`Parcours démo` saute register) | Non | **Partielle** (manque E2E) |
| 2 | Connexion | Oui (`AuthAndSecurityTest`, `LoginRateLimiterIntegrationTest`) | Oui (`AccountFlow.test.tsx`) | Oui | Oui (`app.spec.ts`) | **Bonne** |
| 3 | Création d'une adresse | Oui (`AddressServiceTest`) | Oui (`AccountFlow.test.tsx`) | Oui | Oui (`app.spec.ts`) | **Bonne** |
| 4 | Capture GPS | N/A | Oui (`geolocation.test.ts`, `CodeShareGeolocation.test.tsx`) | N/A | Non (saisie manuelle en E2E) | **Partielle** |
| 5 | Génération du code | Oui (`AddressServiceTest`, `ReservedCodeAndIdempotenceTest`) | Oui (`addressCode.test.ts`, `geoGrid.test.ts`) | Oui | Oui | **Bonne** *(manque sync code réservé)* |
| 6 | Ajout d'une photo | Oui (`AddressPhotoTest`, `AddressPhotoMaxUploadSizeTest`, `ProductionFeaturesTest`) | Non (`photo.ts` 14,7 %) | Non (testé dans `smoke-prod.sh`) | Non (étape 3 sautée en E2E) | **Partielle** |
| 7 | Génération & lecture QR Code | Oui (`QrCodeServiceTest`) | Oui (`CodeShareGeolocation.test.tsx` + `jsQR`) | Non (`smoke-prod.sh` + `test-qr-decode.mjs`) | Oui (`app.spec.ts`) | **Excellente** |
| 8 | Consultation publique | Oui (`AddressServiceTest`) | Oui (`PublicAndAdmin.test.tsx`) | Oui | Oui (`app.spec.ts`) | **Excellente** |
| 9 | Recherche par code | Oui | Oui (`App.test.tsx`, `PublicAndAdmin.test.tsx`) | Oui | Oui (`app.spec.ts`) | **Excellente** |
| 10 | Recherche par quartier | Oui (`DirectoryAndVisibilityTest` sur code `KBG` uniquement) | Non (`SearchPage.tsx` 28 %) | Oui (`KBG` uniquement) | Non (onglet Type seulement) | **Insuffisante** *(bug `Boucotte` non détecté)* |
| 11 | Partage (lien + SMS) | Oui (`AddressShareServiceTest`, `ProductionFeaturesTest` mock HTTP) | Oui (`OwnerAndPublicActions.test.tsx`, `SharePage`) | Non | Partiel (SharePage sans SMS) | **Partielle** *(aucun sandbox réel)* |
| 12 | Signalement public | Oui (`AdminAndReportControllerTest`, `AddressLifecycleAndModerationTest`) | Oui (`OwnerAndPublicActions.test.tsx`) | Oui | Non | **Partielle** |
| 13 | Validation administrative | Oui (`AdminAndReportControllerTest`, `AddressLifecycleAndModerationTest`) | Oui (`PublicAndAdmin.test.tsx`) | Non | Non | **Partielle** |
| 14 | Consultation hors ligne | N/A | Partiel (`OwnerAndPublicActions` simulé) | N/A | Non en CI *(prouvé par présent audit Chromium)* | **Insuffisante en CI** |
| 15 | Résolution API publique | Oui (`AddressServiceTest`) | Oui (`api.test.ts`) | Oui + `smoke-prod.sh` | Oui | **Excellente** |

---

## 4. Effet de bord notable des tests backend

- Exécuter `mvn verify` localement **modifie l'arbre de travail Git** via deux tests qui écrivent directement dans le dépôt :
  - `OpenApiCompletenessTest.java:75-76` réécrit `docs/api/openapi.json` et `docs/api/openapi.yaml` (avec ordre non déterministe des clés Springdoc).
  - `GeoGridFixtureTest.java:140` crée `frontend/src/data/geo-grid-fixture.json` (fichier non suivi par Git).
- Recommandation : écrire ces artefacts dans `target/` et comparer contre les fichiers suivis au lieu de muter l'arbre de travail pendant un simple `mvn test`.
