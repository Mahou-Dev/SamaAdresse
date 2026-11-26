# P01 — Rapport de Vérification Complémentaire

**Date :** 26 novembre 2026  
**Périmètre :** Vérification finale strictement limitée à P01 (aucune action de P02 engagée)  
**Branche active :** `feature/p01-design-system`

---

## 1. Vérification Git & Intégrité des Branches

### Commandes exécutées
```bash
git branch --show-current
git rev-parse main origin/main develop origin/develop feature/lot12-corrections origin/feature/lot12-corrections HEAD
git log --oneline feature/lot12-corrections..HEAD
git status
git diff --stat feature/lot12-corrections..HEAD -- \
  backend/ frontend/package.json frontend/vite.config.ts \
  frontend/src/api/ frontend/src/context/ \
  frontend/src/utils/offlineDb.ts frontend/src/utils/syncManager.ts
```

### Résultats exacts
- **Branche active :** `feature/p01-design-system`
- **Commit de base (`feature/lot12-corrections`, tag `v1.1.0`) :** `d2f7e04623a58540edaf55dc7f74aa4f461696c2` (strictement identique à `origin/feature/lot12-corrections`).
- **Branche `main` :** `2361b14004b05a4fa197e913ada2a02a9a0c6d5b` (strictement identique à `origin/main` — **0 modification**).
- **Branche `develop` :** `09d35e02cca4a4868bd26da91a03dea9bd35c928` (strictement identique à `origin/develop` — **0 modification**).
- **Commits P01 avant correction complémentaire :**
  - `e9a7ff6` — `p01(tokens): systeme de tokens Clarte WCAG AA, hooks transverses, layouts et ErrorBoundary`
  - `428da20` — `p01(design-system): 24 primitives UI, 11 composants metier SamaAdresse et tests unitaires`
  - `792321e` — `p01(docs): architecture frontend, design system, architecture UX, guide composants et rapport d'execution`
  - *(Suivi du commit de clôture de la présente vérification complémentaire sur `feature/p01-design-system`.)*
- **Modifications préexistantes préservées intactes (`git status`) :**
  - `docs/audit/VERIFY.md`
  - `docs/audit/newman.json`
  - `docs/audit/smoke-prod.md`
  - `frontend/test-results/.last-run.json`
- **Preuve d'intégrité Backend, Dépendances, PWA & API :** `git diff --stat feature/lot12-corrections..HEAD -- backend/ frontend/package.json frontend/vite.config.ts frontend/src/api/ frontend/src/context/ frontend/src/utils/offlineDb.ts frontend/src/utils/syncManager.ts` retourne une **sortie vide (0 ligne modifiée)**.

---

## 2. Vérification PWA & Mode Hors Ligne — Explication Exacte du Passage de 53 à 51 Entrées Workbox

### Origine exacte des 2 entrées de différence
L'extraction directe du manifeste `precacheAndRoute(...)` généré dans `frontend/dist/sw.js` et la comparaison avec le build de référence `d2f7e04` montrent que :
- **Actifs statiques et CSS : strictement inchangés** (`27` entrées statiques : `index.html`, `manifest.webmanifest`, polices WOFF2 `outfit-latin.woff2` / `jetbrains-mono-latin.woff2`, icônes PWA, `images/hero-accueil-800w.webp`, `favicon.*`, `apple-touch-icon.png` + `2` feuilles CSS = **29 entrées non-JS** avant et après P01).
- **Chunks JS générés par Vite/Rollup :** **24 chunks avant P01 (`d2f7e04`) → 22 chunks après P01** (`24 - 22 = 2` entrées, d'où `53 - 2 = 51`).

Les **deux fichiers disparus** ne sont **pas** des ressources PWA ni des fonctionnalités supprimées, mais deux micro-chunks d'icônes Lucide réabsorbés par le découpage Rollup :

| Fichier présent avant P01 (`d2f7e04`) | Taille avant P01 | Devenir après P01 | Cause technique exacte |
|---|---:|---|---|
| `assets/chevron-right-iz8meur6.js` | `0.15 kB` (`0.15 kB` gzip) | **Réintégré dans `assets/ui-*.js`** | Avant P01, l'icône `ChevronRight` n'était partagée qu'entre pages lazy (`AccountPage`, `AdminPage`). En P01, `PageHeader.tsx` importe `Breadcrumb.tsx` (qui utilise `ChevronRight`), plaçant l'icône dans le chunk partagé `ui-*.js`. |
| `assets/triangle-alert-B77fhVlt.js` | `0.31 kB` (`0.24 kB` gzip) | **Réintégré dans `assets/index-*.js`** | Avant P01, `AlertTriangle` n'était utilisée que dans des chunks lazy (`ConfirmDialog`, `NewAddressPage`). En P01, `Toast.tsx` (monté à la racine via `ToastProvider` dans `App.tsx`) prend en charge la variante `'warning'` avec `AlertTriangle`, intégrant l'icône dans le chunk d'entrée. |

*(Remarque complémentaire d'audit : dans `frontend/vite.config.ts` préexistant et non modifié en P01, 12 actifs statiques déclarés dans `includeAssets` sont également capturés par `globPatterns`, ce qui explique leur double présence dans le décompte historique 53/51 — mécanisme hérité volontairement non touché en P01.)*

### Vérification des 5 piliers hors ligne & PWA
| Pilier vérifié | Preuve concrète | Statut |
|---|---|---|
| **Règles Workbox `runtimeCaching` dans `dist/sw.js`** | Inspection directe de `frontend/dist/sw.js` : présence confirmée de `samaadresse-addresses-cache` (NetworkFirst 3 s / 30 j / 50 entrées), `samaadresse-photos-cache` (CacheFirst 30 j / 60 entrées), `samaadresse-map-tiles-cache` (CacheFirst 14 j / 300 entrées), `samaadresse-images-cache` (CacheFirst 30 j / 12 entrées), `navigateFallback: '/index.html'` et `denylist` `/api/` + `/uploads/`. | **Vérifié** |
| **Accès hors ligne aux fiches publiques mises en cache** | `getPublicAddress()` (`frontend/src/api/addressApi.ts`, inchangé) conserve le repli Cache Storage → `localStorage` (`cached_addr_<code>`). Couvert par un nouveau test unitaire ciblé dans `p01-verification.test.tsx`. | **Vérifié (test unitaire)** |
| **Brouillons IndexedDB** | `frontend/src/utils/offlineDb.ts` (store `drafts`, `MAX_DRAFTS = 20`, index `clientRequestId` unique) strictement inchangé (`0` ligne modifiée). | **Vérifié (code intact)** |
| **Codes réservés** | Store `reservedCodes` (`offlineDb.ts`), `topUpReservedCodes` / `getActiveReservedCodes` (`addressApi.ts`) et réapprovisionnement dans `AuthContext.tsx` strictement inchangés (`0` ligne modifiée). | **Vérifié (code intact)** |
| **Synchronisation au retour du réseau** | `frontend/src/utils/syncManager.ts` et `OnlineStatusContext.tsx` inchangés ; les 4 tests existants de `syncManager.test.ts` (cycle d'événements, `CODE_CHANGED`, gestion d'échec réseau, idempotence `clientRequestId`) passent intégralement. | **Vérifié (4/4 tests)** |
| **Ressources cartographiques et états de repli** | `AddressMap.tsx` et `LeafletMapInner.tsx` inchangés (`LeafletMapInner` toujours isolé en chunk lazy `45.31 Ko` gzip) ; `MapPreview` hors ligne vérifié par test unitaire (masque le lien externe Google Maps et conserve les coordonnées locales + message « Carte indisponible hors ligne »). | **Vérifié (test unitaire)** |

---

## 3. Revue du Design System & Anomalies Détectées / Corrigées

La revue ligne par ligne des composants implémentés (`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Modal`, `Drawer`, `DropdownMenu`, `Toast`, `ErrorState`, `EmptyState`, `AddressCard`, `AddressPlate`, `SearchBar`, `SearchFilter`) a mis au jour **8 anomalies concrètes**, toutes corrigées dans le périmètre strict de P01 :

| ID | Fichier concerné | Anomalie détectée | Sévérité | Correction appliquée |
|---|---|---|:---:|---|
| **A-01** | `frontend/src/hooks/useFocusTrap.ts` | `onEscape` dans le tableau de dépendances du `useEffect` provoquait la réinitialisation du focus clavier sur le premier bouton à chaque re-rendu parent avec `onClose={() => ...}` en ligne (ex. saisie dans une modale). | **Élevée** | Mémorisation de `onEscape` dans un `useRef` mis à jour dans un effet dédié ; le piège de focus ne se réinitialise plus lors des re-rendus. |
| **A-02** | `frontend/src/components/ui/Button.tsx`, `ErrorState.tsx`, `ErrorBoundary.tsx` | En mode `to`/`href`, `Button` ne transmettait pas `onClick`, `id`, `title`, `aria-label` ni `data-testid` à `<Link>`/`<a>`. En conséquence, cliquer sur « Retour à l'accueil » dans `ErrorBoundary` naviguait vers `/` sans réinitialiser `hasError`. | **Élevée** | Transmission propre de ces props sur `<Link>`/`<a>`, ajout de `onHomeClick` dans `ErrorState`, et liaison `onHomeClick={this.handleReset}` dans `ErrorBoundary`. |
| **A-03** | `frontend/src/components/ui/Checkbox.tsx` | L'état `indeterminate={true}` affichait l'icône `<Minus />` sans synchroniser `inputRef.current.indeterminate = true` ni `aria-checked="mixed"` pour les lecteurs d'écran. | **Moyenne** | Ajout de `inputRef` + `useEffect` synchronisant `.indeterminate` et ajout de `aria-checked={indeterminate ? 'mixed' : undefined}`. |
| **A-04** | `frontend/src/components/ui/RadioGroup.tsx` & `Tabs.tsx` | Si `value` ou `activeTab` ne correspondait à aucune option activée, tous les boutons avaient `tabIndex={-1}`, rendant le composant inatteignable via la touche `Tab` (non-conforme WAI-ARIA APG). | **Moyenne** | Calcul d'un repli `firstEnabledIndex` garantissant toujours un `tabIndex={0}` sur le premier élément actif. |
| **A-05** | `frontend/src/components/ui/DropdownMenu.tsx` | `Escape` dans le menu ne restituait pas le focus sur le bouton déclencheur ; `ArrowDown` sur le bouton déclencheur ouvrait le menu sans déplacer le focus vers le premier item actif. | **Moyenne** | Ajout de `triggerRef`, restauration explicite du focus sur `Escape` et focus automatique du premier item actif sur ouverture via `ArrowDown`. |
| **A-06** | `frontend/src/components/ui/ConfirmDialog.tsx` | `onClose={isLoading ? () => {} : onClose}` passait une fonction anonyme instable pendant `isLoading`. | **Faible** | Passage direct de `onClose={onClose}` (la désactivation de fermeture pendant `isLoading` étant déjà gérée par `closeOnBackdrop={!isLoading}` et `closeOnEscape={!isLoading}` dans `Modal`). |
| **A-07** | `frontend/src/components/shared/AddressCard.tsx` & `ui/Avatar.tsx` | L'état booléen `imgError` / `imgFailed` restait bloqué à `true` si l'URL d'image changeait sur une instance réutilisée (ex. après upload de photo de façade). | **Faible** | Remplacement par `failedPhotoUrl` / `failedSrc` comparé à l'URL courante (récupération automatique sans `useEffect`). |
| **A-08** | `frontend/src/components/shared/SearchBar.tsx` & `SearchFilter.tsx` | Dans `SearchBar`, le libellé `<span className="hidden sm:inline">` masqué sur mobile laissait le bouton `type="submit"` sans nom accessible (violation WCAG 2.2 SC 4.1.2). Dans `SearchFilter`, les pilules faisaient `38 px` sur mobile. | **Moyenne** | Ajout de `aria-label={submitLabel}` et `min-w-[44px]` sur le bouton submit de `SearchBar` ; cible tactile mobile portée à `min-h-[44px] sm:min-h-[38px]` dans `SearchFilter`. |

---

## 4. Vérification des Layouts, du Routage et des Rôles (`PROPRIETAIRE` / `ADMIN`)

1. **Absence de conflits HTML / Navigation :**
   - Aucun des 4 layouts P01 (`PublicLayout`, `AuthenticatedLayout`, `AdminLayout`, `AuthLayout`) n'introduit de balise `<main>` ou `<header>` imbriquée susceptible d'entrer en conflit avec `<AppNavigation>` (`<header>`) ou `<main>` dans `App.tsx` (vérifié par test unitaire).
   - Aucun layout P01 n'est encore branché de force sur les pages legacy (prévu en P02–P04), garantissant 0 régression sur la navigation actuelle.
2. **Cohérence stricte avec les routes réelles de `App.tsx` :**
   - Toutes les routes ciblées par `UserProfileMenu`, `AddressCard` et `ErrorBoundary` existent réellement dans `frontend/src/App.tsx` : `/`, `/annuaire`, `/a/:code`, `/login`, `/register`, `/tableau-de-bord`, `/account`, `/account?tab=aide`, `/addresses/mine`, `/addresses/new`, `/admin`.
   - Aucune route inventée (pas de favoris, pas de messagerie, pas de CRUD utilisateurs).
3. **Isolation des rôles `PROPRIETAIRE` et `ADMIN` :**
   - `ProtectedRoute.tsx` (inchangé) continue de protéger `/admin` par `allowedRoles={['ADMIN']}` et d'afficher l'écran « Accès réservé » pour tout compte `PROPRIETAIRE`, tout en redirigeant les anonymes vers `/login`.
   - `UserProfileMenu.tsx` n'expose le lien `/admin` (« Modération admin ») que lorsque `user.role === 'ADMIN'`.
   - Les sélecteurs E2E existants de `frontend/e2e/lot11a.spec.ts` (`[data-testid="stat-active"]`, `#tab-profil`, `#tab-offline`, `#tab-preferences`, `#tab-aide`, `#tab-audit`, `#tab-moderation`, `div[role="dialog"]`, `table[aria-label="Tableau de données"]`) ont tous été vérifiés intacts dans les composants UI évolués.

---

## 5. Tests Exécutés, Nouveaux Tests Ajoutés et Métriques Exactes

### Nouveau fichier de tests ajouté
- `frontend/src/components/shared/__tests__/p01-verification.test.tsx` (**12 tests ciblés**) couvrant :
  - transmission des attributs et blocage `disabled` sur `Button` en mode lien + `rel="noopener noreferrer"` ;
  - `Checkbox` `indeterminate` (`aria-checked="mixed"`) ;
  - repli `tabIndex="0"` sur `RadioGroup` et `Tabs` sans sélection active ;
  - nom accessible mobile du bouton submit de `SearchBar` ;
  - absence de `<main>` / `<header>` imbriqués dans les 4 layouts ;
  - dérivation d'état `ErrorBoundary.getDerivedStateFromError` ;
  - distinction visiteur anonyme / `PROPRIETAIRE` / `ADMIN` dans `UserProfileMenu` ;
  - repli visuel sans photo de `AddressCard`, 4 états d'`OfflineStatusIndicator`, repli hors ligne de `MapPreview` ;
  - repli `localStorage` hors ligne de `getPublicAddress` lors d'une coupure réseau simulée.

### Commandes exécutées et résultats exacts
| Commande | Résultat exact |
|---|---|
| `npm --prefix frontend run test` | **PASS — 11/11 fichiers de test, 173/173 tests passés** en `916 ms` (`tokens.test.ts` 23, `components.test.tsx` 20, `shared.test.tsx` 5, `p01-verification.test.tsx` 12, `geoGrid.test.ts` 73, `lot3.test.ts` 20, `lot4.test.ts` 4, `lot5.test.ts` 4, `lot6.test.ts` 6, `lot12c.test.ts` 2, `syncManager.test.ts` 4). |
| `npm --prefix frontend run build` | **PASS — `tsc -b` 0 erreur · `vite build` 2004 modules en `747 ms`** · PWA Workbox `dist/sw.js` généré (`51 entries`, `904.58 KiB`). |
| `npm --prefix frontend run check:size` | **PASS — Chunk d'entrée `index-Do3a0zRH.js` : `93.38 Ko` gzip** (`336.09 Ko` brut), objectif ≤ `105.00 Ko` gzip (marge : **`11.62 Ko`**). |
| `./node_modules/.bin/oxlint` (64 fichiers périmètre P01) | **PASS — 0 erreur**, 0 avertissement sur les 63 fichiers nouveaux/évolués, 1 avertissement hérité sur la façade `src/components/Toast.tsx`. |

### Tests explicitement NON exécutés dans cette session (transparence QA)
- **Playwright E2E (`frontend/e2e/*.spec.ts`)** : non exécuté (nécessite le conteneur Docker reconstruit et la base PostgreSQL de recette ; planifié à la fin de P02).
- **Lighthouse sur conteneur Docker** : non exécuté (planifié à la fin de P02).
- **Tests backend Maven (`./mvnw test`)** : non relancés car 0 ligne de `backend/` n'a été modifiée.
- **`scripts/check-contrast.py`** : non relancé en tant que passe globale (sa liste blanche hexadécimale est encore celle du Lot 9 ; alignement prévu en P04).

---

## 6. Risques Restants

1. **Tests DOM interactifs réels (clavier/focus en navigateur) :** Vitest tourne en environnement Node (`renderToStaticMarkup` sans `jsdom`). Les comportements DOM dynamiques (`useFocusTrap`, `DropdownMenu` flèches/Échap, `Checkbox.indeterminate` DOM) sont vérifiés par revue de code stricte et tests SSR/statiques ; ils devront faire l'objet d'une vérification interactive dans Playwright dès leur intégration sur les pages P02.
2. **Coexistence transitoire visuelle :** Le fond sable `#EADFC8` de `App.tsx` cohabite temporairement avec les composants `src/components/ui/` en palette Clarté jusqu'à la bascule du Header et du fond racine en P02.
3. **Doublons Workbox `includeAssets` / `globPatterns` préexistants :** 12 fichiers statiques apparaissent deux fois dans `precacheAndRoute` (héritage de `vite.config.ts` avant P01). Sans impact fonctionnel (Workbox déduplique par clé de cache), à nettoyer éventuellement en P04 lors de la passe de finition PWA.
4. **Alignement `scripts/check-contrast.py` :** À mettre à jour en P04 lorsque les anciens codes hexadécimaux Lot 9 auront été retirés des pages.

---

**Fin de la vérification complémentaire P01 — aucune action de P02 engagée. En attente de validation explicite.**
