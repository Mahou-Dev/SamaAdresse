# P02 — Rapport de tests et vérifications

**Branche :** `feature/p02-public-experience`  
**Date d'exécution :** 2026-11-26  
**Environnement :** Node / Vite 8.3.0 / TypeScript 6 / Vitest 5.0.5 / Playwright Chromium headless (contre le build de production `dist/` servi via `vite preview`).

---

## 1. Synthèse globale des vérifications exécutées

| Contrôle | Commande exécutée | Résultat réel | Détails clés |
| --- | --- | --- | --- |
| Lint statique | `cd frontend && npm run lint` | **PASS (0 erreur)** | 142 fichiers analysés en 232 ms ; 0 erreur et 0 avertissement sur le code P02 (18 avertissements préexistants uniquement dans des fichiers hérités non modifiés). |
| TypeScript + Build | `cd frontend && npm run build` | **PASS** | `tsc -b` sans erreur ; `vite build` en 638 ms ; `dist/sw.js` généré (`61 entries`, `959.98 KiB`). |
| Budget bundle JS | `cd frontend && npm run check:size` | **PASS** | `index-Bhm5VvkZ.js` = **`96.89 Ko` gzip** (`<= 105.00 Ko`, marge `8.11 Ko`). Leaflet (`43.50 Ko` gzip) et `DirectoryMapCanvas` (`1.94 Ko` gzip) isolés en lazy. |
| Tests unitaires & composants | `cd frontend && npx vitest run` | **PASS (186 / 186)** | 14 fichiers de tests (dont 3 nouvelles suites P02 : `home.test.tsx`, `directory.test.tsx`, `PublicHeader.test.tsx`), 186 tests réussis en 1.11 s. |
| E2E Playwright P02 (Chromium) | `cd frontend && npx playwright test --config=e2e-p02/playwright.p02.config.ts` | **PASS (12 / 12)** | 12 scénarios complets sur `dist/` en 15.9 s (recherche, filtres, 3 vues, carte interactive, erreurs 403/500/429, hors ligne SW réel, clavier, 7 viewports, Web Vitals). |
| Non-régression E2E P01 (Chromium) | `cd frontend && npx playwright test --config=e2e-p01/playwright.p01.config.ts` | **PASS (6 / 6)** | 6/6 tests d'accessibilité interactive P01 réussis en 3.8 s (Modal, DropdownMenu, RadioGroup, Tabs, Checkbox, SearchBar mobile). |
| Stack Docker live / Lighthouse CLI | `docker ps` | **NON EXÉCUTÉ (indisponible)** | Démon Docker non accessible dans le sandbox (`dial unix /var/run/docker.sock: no such file or directory`). Aucune prétention d'exécution des suites `lot6`/`lot11a`/`lot12b-offline` contre le backend live ; les contrats correspondants ont été vérifiés par la suite Playwright P02 et par inspection des sélecteurs. |

---

## 2. Détail des nouvelles suites de tests P02

### 2.1 Tests unitaires et rendu statique Vitest (13 nouveaux tests)
- `frontend/src/features/home/__tests__/home.test.tsx` (5 tests) :
  - Rendu `HomeHero` (H1, `SearchBar`, plaque `ZIG-KBG-4271`, image LCP `fetchPriority="high"`, zones `geo-grid.json`, raccourcis).
  - Rendu `HomeDiscoverySection` (3 catégories `MAISON`/`COMMERCE`/`INSTITUTION`, 3 zones / 8 quartiers, cartes d'adresses publiées).
  - États `HomeDiscoverySection` : hors ligne avec `visited_address_codes`, erreur avec bouton `Réessayer`, état vide.
  - Rendu `HomeHowItWorks` (visuels `etape-1/2/3`, anatomie `ZIG-KBG-4271`) et `HomeCtaSection`.
  - Rendu `HomeConnectedView` (salutation, recherche annuaire, liens espace personnel).
- `frontend/src/features/directory/__tests__/directory.test.tsx` (5 tests) :
  - Normalisation `parseDirectoryView`.
  - Rendu `DirectoryFiltersBar` (`#directory-search-input`, placeholder 360 px, `#filter-quartier` 8 quartiers, sélecteur 3 vues, chips actifs).
  - Rendu `DirectoryResultsGrid` (Grille, Liste, pagination, état vide avec `/images/etat-vide-{144,320,480}w.webp`).
  - Rendu `DirectoryMapSection` hors ligne (`directory-map-offline` + liens en cache) et état vide.
- `frontend/src/components/navigation/__tests__/PublicHeader.test.tsx` (3 tests) :
  - Visiteur anonyme : `aria-current="page"`, barre mobile strictement limitée à 4 liens sans doublon `Connexion`/`Se connecter`.
  - Utilisateur authentifié : absence totale de `Connexion`/`Se connecter` dans `<header>`, 4 liens mobiles.
  - Masquage automatique sur `/login` et `/register`.

### 2.2 Tests Playwright Chromium E2E (`frontend/e2e-p02/public-experience.spec.ts` — 12/12 PASS)
1. **Accueil complet (`/`) :** H1, plaque `ZIG-KBG-4271`, chargement effectif de l'image hero (`naturalWidth > 0`), catégories, quartiers, adresses publiées, Comment ça marche, CTA final, 0 `pageerror`.
2. **Recherche depuis l'accueil :** soumission `mosquee` → redirection `/annuaire?q=mosquee` → résultat filtré `ZIG-KBG-4271` (`1 adresse trouvée`).
3. **Annuaire, filtres & réinitialisation :** vérification mathématique de non-troncature du placeholder `#directory-search-input` à `360×780`, filtrage mobile via tiroir `Drawer` (`#mobile-filter-quartier`), filtrage desktop via `#filter-quartier` et pilule `Commerce`, synchronisation URL et réinitialisation `Tout effacer`.
4. **Bascule Grille ↔ Liste ↔ Carte & lazy-loading Leaflet :** vérification réseau que basculer entre les 3 vues conserve les filtres (`type=COMMERCE`), ne déclenche **aucune** nouvelle requête `/api/public/directory`, ne charge aucun chunk `leaflet` avant `view=map`, puis charge `leaflet` et hydrate uniquement les 2 adresses filtrées à l'ouverture de la carte.
5. **Vue Carte interactive :** hydratation réelle sur 5 adresses (4 localisées → 4 marqueurs exacts, 1 adresse en 404 → avis explicite sans coordonnée fictive), gestion non bloquante d'erreur de tuiles (`503` → bannière avertissement), synchronisation bidirectionnelle carte→marqueur (`Localiser` + zoom quartier) et marqueur→aperçu flottant, navigation vers `/a/ZIG-KBG-4271`.
6. **Navigation vers fiche publique :** vérification des liens depuis une carte de l'accueil (`/` → `/a/ZIG-ESC-1042`) et depuis l'annuaire (`/annuaire` → `/a/ZIG-TIL-3015`).
7. **Pagination :** clic sur `Afficher plus d'adresses` cumulant la page suivante (`2` → `4` articles).
8. **États d'erreur et état vide :** gestion séquentielle `403` WAF (message exact), `500` + `Réessayer`, `429` avec décompte (`45s`), puis état vide (`Aucune adresse ne correspond à votre recherche.`).
9. **Accessibilité clavier :** skip-link `Aller au contenu principal` focusable au premier `Tab`, ouverture au clavier du tiroir mobile `Filtres`, fermeture par `Échap` et restitution vérifiée du focus au bouton déclencheur.
10. **Audit responsive 7 viewports :** vérification `documentElement.scrollWidth - clientWidth <= 1` sur `/` et `/annuaire` pour les 7 résolutions :
    - `320×568` : **0 débordement**
    - `375×812` : **0 débordement**
    - `390×844` : **0 débordement**
    - `768×1024` : **0 débordement**
    - `1024×768` : **0 débordement**
    - `1366×768` : **0 débordement**
    - `1440×900` : **0 débordement**
11. **Web Vitals mesurés par `PerformanceObserver` Chromium (sur `dist/` desktop 1440×900) :**
    - Page d'accueil (`/`) : **`CLS = 0`**, **`LCP = 108 ms`** (objectifs : `CLS < 0.1`, `LCP <= 2500 ms`).
    - Annuaire (`/annuaire`) : **`CLS = 0.0669`**, **`LCP = 384 ms`** (objectifs : `CLS < 0.1`, `LCP <= 2500 ms`).
    - Contrôle visuel effectué sur 5 captures générées dans `/tmp/p02-visual/` (`home-desktop-1440`, `home-mobile-390`, `directory-grid-1440`, `directory-map-1440`, `directory-mobile-390`).
12. **Mode hors ligne réel avec Service Worker Workbox actif :** activation de `dist/sw.js`, coupure réseau `context.setOffline(true)`, vérification de l'état hors ligne sur `/`, navigation SPA hors ligne vers `/annuaire` (Grille/Liste) puis vers la Vue Carte (`directory-map-offline`) avec liens vers les fiches en cache (`visited_address_codes`).

---

## 3. Corrections identifiées et résolues pendant les tests

1. **Réactivité des fiches en cache hors ligne sur l'accueil (`useHomeDiscovery.ts`) :** remplacement d'un état initial statique `useState` par `useMemo` dépendant de `isOnline`, permettant d'afficher immédiatement les codes visités durant la session lors d'une perte de réseau sans rechargement.
2. **Séparation des repères proches sur la carte (`DirectoryMapCanvas.tsx`) :** ajustement du centrage sur sélection (`Math.max(map.getZoom(), 14)`) afin qu'un clic sur « Localiser » lorsque la carte englobe plusieurs villes (ex. Ziguinchor + Dakar) zoome automatiquement au niveau quartier et rende tous les marqueurs voisins cliquables individuellement.
3. **Ergonomie de la carte desktop (`DirectoryMapSection.tsx`) :** calibrage de la hauteur sticky (`lg:h-[min(600px,calc(100vh-11rem))]`) pour garder la carte et son aperçu flottant visibles dans un écran 1440×900.
4. **Correction du `srcSet` d'état vide :** remplacement de `/images/etat-vide-288w.webp` (inexistant) par `/images/etat-vide-320w.webp` (existant dans `frontend/public/images/`).
