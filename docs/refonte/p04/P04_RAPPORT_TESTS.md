# P04 — Rapport de tests, audits et vérifications finales

**Branche :** `feature/p04-connected-experience`  
**Date d'exécution :** 2026-11-26  
**Environnement :** Node / Vite 8.3.0 / TypeScript 6 / Vitest 5.0.5 / Playwright Chromium headless / Lighthouse 13.6.0 (sur build de production `dist/` servi via `vite preview`).

---

## 1. Synthèse globale des vérifications exécutées

| Contrôle | Commande exécutée | Résultat réel | Détails vérifiés |
| --- | --- | --- | --- |
| Typage strict TypeScript | `cd frontend && npx tsc --noEmit` | **PASS** | `0` erreur. |
| Lint statique | `cd frontend && npm run lint` | **PASS (0 erreur)** | 169 fichiers analysés en `173 ms` ; `0` erreur ; `8` avertissements préexistants uniquement dans des fichiers hors P04 (en baisse constante : `23` avant P01 → `22` P01 → `18` P02 → `16` P03 → **`8`** P04 ; `0` avertissement sur l'ensemble du code P04). |
| Tests unitaires & composants | `cd frontend && npm run test` | **PASS (198 / 198)** | 16 fichiers de tests (dont la nouvelle suite P04 `src/features/admin/__tests__/connected.test.tsx`), 198 tests réussis en `1.41 s`. |
| Build production + PWA | `cd frontend && npm run build` | **PASS** | `tsc -b` sans erreur ; `vite build` (`2 051` modules) en `898 ms` ; `dist/sw.js` généré (`82 entries`, `1019.65 KiB`). |
| Budget bundle JS | `cd frontend && npm run check:size` | **PASS** | Chunk d'entrée `index-C1fAIJgL.js` = `295.07 Ko` brut / **`86.02 Ko` gzip** (`<= 105.00 Ko` gzip, marge **`18.98 Ko`**, baisse de `-10.87 Ko` depuis P02). Leaflet isolé en lazy (`43.50 Ko` gzip). |
| E2E Playwright P04 | `cd frontend && npx playwright test --config=e2e-p04/playwright.p04.config.ts` | **PASS (8 / 8)** | 8 scénarios complets en `53.9 s` (Tableau de bord, Mes adresses, Compte/Déconnexion/Session expirée, Admin/Modération, Auth/404, 7 viewports responsive + Web Vitals, PWA/Cache Storage hors ligne réel). |
| Non-régression Playwright P03 | `cd frontend && npx playwright test --config=e2e-p03/playwright.p03.config.ts` | **PASS (8 / 8)** | 8/8 scénarios réussis en `29.5 s` (`PublicAddress CLS=0.0181`, `LCP=244 ms`). |
| Non-régression Playwright P02 | `cd frontend && npx playwright test --config=e2e-p02/playwright.p02.config.ts` | **PASS (12 / 12)** | 12/12 scénarios réussis en `20.5 s` (`/` `CLS=0`, `LCP=208 ms` ; `/annuaire` `CLS=0.0669`, `LCP=420 ms`). |
| Non-régression Playwright P01 | `cd frontend && npx playwright test --config=e2e-p01/playwright.p01.config.ts` | **PASS (6 / 6)** | 6/6 tests d'accessibilité interactive P01 réussis en `5.6 s`. |
| Audits Lighthouse 13.6.0 | `lighthouse` (Chromium 1248, desktop & mobile) sur `vite preview` | **EXÉCUTÉ (6/6)** | Accessibilité **`100`** et SEO **`100`** sur les 6 audits ; détails complets en Section 5. |
| Audit sécurité statique & assets | `grep` puits dangereux, `localStorage`, assets WebP, diff protégé | **PASS** | `0` `dangerouslySetInnerHTML`/`eval`/`innerHTML`, `0` secret en `localStorage`, `0` couleur héritée Lot 9, `0` image manquante, `0` diff sur `backend/` et fichiers critiques. |
| Stack Docker live (`lot4b`, `lot5`, `lot6`, `lot7`, `lot11a`, `lot12b-offline`) | Non exécutable dans le sandbox | **NON EXÉCUTÉ (indisponible)** | Démon Docker absent (`/var/run/docker.sock` indisponible). Aucune prétention d'exécution contre un backend Spring Boot/PostgreSQL live ; les contrats et sélecteurs correspondants ont été validés contre `dist/` via les 34 scénarios Playwright P01–P04. |

---

## 2. Matrice de couverture des 20 exigences de test P04 (Section 13)

| # | Scénario obligatoire | Preuve d'exécution | Statut |
| --- | --- | --- | --- |
| 1 | Tableau de bord chargé avec données | `e2e-p04` Test 1c (`stat-active`, `stat-suspended`, `stat-archived`, `stat-pending`, « À traiter », lien vers `/addresses/mine?status=ACTIVE`) | **PASS** |
| 2 | Tableau de bord sans données | `e2e-p04` Test 1b (`0` adresse → `EmptyState` + `Créer ma première adresse`) | **PASS** |
| 3 | Erreur API | `e2e-p04` Test 1a (`500` → `ErrorState` + `Réessayer`, jamais maquillé en état vide) + Test 2c (`500` visibilité) + Test 4c (`500` suspension) | **PASS** |
| 4 | Gestion des adresses | `e2e-p04` Test 2a–2c (compteur, Grille↔Liste, visibilité annuaire `PATCH /visibility`, adresse suspendue protégée) + Vitest `connected.test.tsx` | **PASS** |
| 5 | Archivage et restauration | `e2e-p04` Test 2d (`Actions` → `Archiver` → `ConfirmDialog` → onglet `Archivées` → `Restaurer`) | **PASS** |
| 6 | Modification et retour | `e2e-p04` Test 2e (`Modifier` → `/addresses/addr-1001/edit` → `Retour à mes adresses` → `/addresses/mine`) + `e2e-p03` Test 6 | **PASS** |
| 7 | Profil | `e2e-p04` Test 3a–3b (`#tab-profil`, identité lecture seule, état session, `#tab-offline`, `#tab-preferences`, `#tab-aide`) | **PASS** |
| 8 | Session expirée | `e2e-p04` Test 3b (HTTP `401` → écran `Session expirée` → clic `Se reconnecter` → `/login` avec bandeau explicite) | **PASS** |
| 9 | Déconnexion | `e2e-p04` Test 3c (`POST /api/auth/logout`, suppression `sa_session`, redirection `/`) | **PASS** |
| 10 | Brouillon hors ligne avant déconnexion | `e2e-p04` Test 3c (`ConfirmDialog` avertissement, `Annuler` conserve session, `Confirmer` déconnecte tout en préservant le brouillon IndexedDB) | **PASS** |
| 11 | Accès administrateur autorisé | `e2e-p04` Test 4c (`ADMIN` sur `/admin`, 4 tuiles réelles, tableau + tiroir `SidePanel`) | **PASS** |
| 12 | Accès non autorisé | `e2e-p04` Test 4a (visiteur → `/login`) & Test 4b (`PROPRIETAIRE` → `Accès réservé`) + Vitest `ProtectedRoute` | **PASS** |
| 13 | Validation / traitement d'un signalement & rétablissement d'adresse | `e2e-p04` Test 4c (`Rétablir l'adresse` via `Modal` → `POST /reinstate`, `Marquer traité` via `ConfirmDialog` → `PATCH /reports` `RESOLVED`) | **PASS** |
| 14 | Refus / suspension & classement sans suite | `e2e-p04` Test 4c (validation motif obligatoire, `Suspendre l'adresse` anti-double clic → `POST /suspend`, `Classer sans suite` via `ConfirmDialog` → `DISMISSED`) | **PASS** |
| 15 | Erreur de modération | `e2e-p04` Test 4c (HTTP `500` sur suspension → message d'erreur sans faux changement de statut) | **PASS** |
| 16 | Responsive (7 viewports) | `e2e-p04` Test 6 (`320×568` à `1440×900` × 5 routes = 35 combinaisons, `0` débordement + contrôle géométrique boutons cartes à `360 px`) | **PASS** |
| 17 | Régression P01 | `e2e-p01` (`6 / 6` PASS) + Vitest P01 (`37` tests PASS) | **PASS** |
| 18 | Régression P02 | `e2e-p02` (`12 / 12` PASS) + Vitest P02 (`13` tests PASS) | **PASS** |
| 19 | Régression P03 | `e2e-p03` (`8 / 8` PASS) + Vitest P03 (`6` tests PASS) | **PASS** |
| 20 | Fonctionnement PWA hors ligne | `e2e-p04` Test 7 (Service Worker réel, 0 route sensible en `Cache Storage`, `ReloadPrompt`, repli hors ligne Dashboard/Account/Admin) + `e2e-p03` Test 8 + `e2e-p02` Test 12 | **PASS** |

---

## 3. Audit Responsive (7 viewports obligatoires)

Aucun débordement horizontal (`documentElement.scrollWidth - clientWidth <= 1`) détecté sur l'ensemble des **35 combinaisons** testées dans `e2e-p04` Test 6 (`/tableau-de-bord`, `/addresses/mine`, `/account`, `/admin`, `/login`) :
- `320×568` : **0 débordement** (et boutons des cartes `/addresses/mine` strictement contenus dans chaque carte).
- `360×800` : **0 débordement** (présentation mobile en cartes sur `/admin` et `/addresses/mine`).
- `390×844` : **0 débordement** (contrôle visuel sur `admin-mobile-390.png`).
- `768×1024` : **0 débordement**.
- `1024×768` : **0 débordement**.
- `1280×800` : **0 débordement**.
- `1440×900` : **0 débordement** (contrôle visuel sur `dashboard-1440.png`, `my-addresses-1440.png`, `account-1440.png`, `admin-1440.png`).

---

## 4. Web Vitals mesurés par Chromium (`PerformanceObserver` sur `dist/`, 1440×900)

| Route | Suite | `CLS` mesuré (seuil `< 0.1`) | `LCP` mesuré (seuil `<= 2500 ms`) |
| --- | --- | --- | --- |
| `/` (Accueil) | `e2e-p02` | **`0`** | **`208 ms`** |
| `/annuaire` (Annuaire) | `e2e-p02` | **`0.0669`** | **`420 ms`** |
| `/a/ZIG-KBG-4271` (Fiche publique) | `e2e-p03` | **`0.0181`** | **`244 ms`** |
| `/tableau-de-bord` | `e2e-p04` | **`0.0548`** | **`532 ms`** |
| `/addresses/mine` | `e2e-p04` | **`0.0303`** | **`524 ms`** |
| `/account` | `e2e-p04` | **`0.0283`** | **`448 ms`** |
| `/admin` | `e2e-p04` | **`0.0313`** | **`412 ms`** |

---

## 5. Audits Lighthouse 13.6.0 (résultats réels mesurés)

**Conditions exactes d'exécution :** build de production `frontend/dist` servi en local via `vite preview` (`http://127.0.0.1:4177`), Chromium headless `1248`, **sans serveur backend live démarré** (les appels `/api/public/directory` renvoient HTTP `500` via le proxy Vite, ce qui explique la pénalité `-4` en Best Practices sur `/` et `/annuaire` ainsi que le décalage `CLS` en erreur sur `/annuaire` mobile).

| Page | Profil | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Desktop | **100** | **100** | **96** | **100** | `0.6 s` | `0` | `0 ms` |
| `/` | Mobile | **97** | **100** | **96** | **100** | `2.5 s` | `0` | `70 ms` |
| `/annuaire` | Desktop | **99** | **100** | **96** | **100** | `0.6 s` | `0.054` | `0 ms` |
| `/annuaire` | Mobile | **74** *(API 500 hors backend)* | **100** | **96** | **100** | `2.9 s` | `0.484` *(état erreur)* | `70 ms` |
| `/login` | Desktop | **100** | **100** | **100** | **100** | `0.6 s` | `0` | `0 ms` |
| `/login` | Mobile | **95** | **100** | **100** | **100** | `2.6 s` | `0.09` | `70 ms` |

*Note de transparence :* les routes protégées (`/tableau-de-bord`, `/addresses/mine`, `/account`, `/admin`) nécessitant une session authentifiée serveur, elles ont été auditées via `PerformanceObserver` Playwright (Section 4 ci-dessus : `CLS <= 0.0548`, `LCP <= 532 ms`), et non via Lighthouse sans backend.

---

## 6. PWA & Sécurité Cache Storage

- **Manifeste Workbox (`dist/sw.js`) :** `82` entrées précachées pour **`1019.65 KiB`** au total.
- **Inventaire `Cache Storage` vérifié en E2E (`e2e-p04` Test 7) :** `0` entrée contenant `/api/auth/`, `/api/addresses/mine` ou `/api/admin/`.
- **Invite de mise à jour PWA (`ReloadPrompt`) :** vérifiée interactive (`Nouvelle version disponible`, boutons `Actualiser` et `Plus tard`).
- **Hors ligne réel :** navigation SPA et rechargement fonctionnels sur `/`, `/annuaire`, `/a/:code` (en cache & jamais visitée), `/addresses/new` (IndexedDB + codes réservés + synchronisation), `/tableau-de-bord`, `/account`, et garde-fou explicite sur `/admin`.
