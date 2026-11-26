# P01 — Rapport de Clôture Technique Finale

**Date :** 26 novembre 2026  
**Branche active :** `feature/p01-design-system`  
**Périmètre :** Clôture technique finale de P01 uniquement (preuves Git, clarification Workbox, vérification Playwright interactive de l'accessibilité).

---

## 1. Preuves Git & Préservation de l'Existant

### Vérification des branches de référence
```bash
git branch --show-current
git rev-parse main origin/main develop origin/develop feature/lot12-corrections origin/feature/lot12-corrections HEAD
git diff --stat feature/lot12-corrections..HEAD -- \
  backend/ frontend/package.json frontend/vite.config.ts \
  frontend/src/api/ frontend/src/context/ \
  frontend/src/utils/offlineDb.ts frontend/src/utils/syncManager.ts
```

| Branche | Hash local | Hash `origin/*` | Statut |
|---|---|---|---|
| `main` | `2361b14004b05a4fa197e913ada2a02a9a0c6d5b` | `2361b14004b05a4fa197e913ada2a02a9a0c6d5b` | **Intacte (0 modification)** |
| `develop` | `09d35e02cca4a4868bd26da91a03dea9bd35c928` | `09d35e02cca4a4868bd26da91a03dea9bd35c928` | **Intacte (0 modification)** |
| `feature/lot12-corrections` (`v1.1.0`) | `d2f7e04623a58540edaf55dc7f74aa4f461696c2` | `d2f7e04623a58540edaf55dc7f74aa4f461696c2` | **Intacte (0 modification)** |
| `feature/p01-design-system` | Commits P01 (`e9a7ff6`, `428da20`, `792321e`, `c10fbdc` + présent commit de clôture) | Branche locale dédiée | **Active, non fusionnée** |

### Préservation des 4 modifications préexistantes
Les 4 fichiers non commités présents avant P01 sont restés intacts dans l'arbre de travail (et non écrasés par Playwright grâce à `outputDir: '/tmp/p01-pw-results'`) :
- `docs/audit/VERIFY.md`
- `docs/audit/newman.json`
- `docs/audit/smoke-prod.md`
- `frontend/test-results/.last-run.json` *(diff strictement inchangé avant/après exécution Playwright)*

### Préservation du backend, des API, des dépendances et de la PWA
- `backend/`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/api/`, `frontend/src/context/`, `frontend/src/utils/offlineDb.ts`, `frontend/src/utils/syncManager.ts` : **0 ligne modifiée** depuis `d2f7e04`.

---

## 2. Clarification Exhaustive du Manifeste Workbox (53 → 51 Entrées)

### Commande d'analyse exécutée sur `frontend/dist/sw.js`
```bash
python3 -c '
import re, pathlib
from collections import Counter
sw = pathlib.Path("frontend/dist/sw.js").read_text(encoding="utf-8")
m = re.search(r"precacheAndRoute\(\[(.*?)\]", sw, re.S)
raw_items = re.findall(r"\{url:\"([^\"]+)\",revision:(null|\"[^\"]+\")\}", m.group(1))
counts = Counter(u for u, _ in raw_items)
print("Total raw entries:", len(raw_items))
print("Distinct URLs:", len(counts))
print("Duplicate entries:", len(raw_items) - len(counts))
'
```

### Décompte exact : entrées brutes vs ressources distinctes
| Indicateur | Avant P01 (`d2f7e04`) | Après P01 | Écart |
|---|---:|---:|---:|
| **Entrées brutes** dans `precacheAndRoute([...])` | **53** | **51** | **-2** |
| **Ressources distinctes** (URLs uniques) | **41** | **39** | **-2** |
| **Entrées dupliquées** (URL + révision identiques ×2) | **12** | **12** | **0** |

### Décomposition exacte des 39 ressources distinctes après P01
- **22 chunks JS** (contre **24** avant P01) — *seule source de l'écart `-2`*
- **2 feuilles CSS** (`assets/index-BDtzvwVH.css`, `assets/LeafletMapInner-vh-t_kPv.css`) — *inchangé*
- **3 actifs statiques uniques (singletons)** : `index.html`, `icons.svg`, `images/hero-accueil-800w.webp` — *inchangé*
- **12 actifs statiques/manifest apparaissant ×2** dans le tableau brut — *inchangé*

### Origine exacte des 2 entrées JS disparues en tant que fichiers autonomes
1. **`assets/chevron-right-iz8meur6.js` (`0.15 kB`)** : avant P01, `ChevronRight` (Lucide) n'était partagé qu'entre routes lazy (`AccountPage`, `AdminPage`). En P01, `PageHeader.tsx` importe `Breadcrumb.tsx` (qui utilise `ChevronRight`), amenant Rollup à intégrer cette icône directement dans `assets/ui-Dg2lUyw8.js`.
2. **`assets/triangle-alert-B77fhVlt.js` (`0.31 kB`)** : avant P01, `AlertTriangle` (Lucide) n'était importée que dans des chunks lazy (`ConfirmDialog`, `NewAddressPage`). En P01, `Toast.tsx` (monté à la racine via `ToastProvider` dans `App.tsx`) prend en charge la variante `'warning'` avec `AlertTriangle`, intégrant cette icône directement dans `assets/index-Do3a0zRH.js`.

### Rôle des 12 entrées présentes ×2 dans le manifeste brut (héritage `vite.config.ts` non modifié)
Dans `frontend/vite.config.ts` (strictement non modifié en P01) :
- **11 actifs de `includeAssets` (lignes 15–26)** : `apple-touch-icon.png`, `favicon.ico`, `favicon.svg`, `fonts/jetbrains-mono-latin.woff2`, `fonts/outfit-latin.woff2`, `icons/icon-192.png`, `icons/icon-512.png`, `pwa-192x192.png`, `pwa-512x512-maskable.png`, `pwa-512x512.png`, `pwa-icon.svg`. Leur extension (`.png`, `.ico`, `.svg`, `.woff2`) est **aussi** couverte par `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']` (ligne 89). VitePWA injecte d'abord les entrées `includeAssets`, puis Workbox ajoute les fichiers trouvés par `globPatterns`, chacun avec le **même hash MD5 de révision**.
- **1 manifeste PWA** : `manifest.webmanifest`, généré par VitePWA et également capturé par l'extension `webmanifest` dans `globPatterns` (`11 + 1 = 12` doublons exacts).
- **Cas particulier de `images/hero-accueil-800w.webp` (ligne 27 de `includeAssets`) :** apparaît **1 seule fois** (singleton) car `.webp` est volontairement absent de `globPatterns` afin de ne précacher que le héros mobile 800w et laisser les 20 autres images WebP à la règle `runtimeCaching` `CacheFirst` (`samaadresse-images-cache`, 30 j / 12 entrées).
- **Comportement à l'exécution :** Workbox déduplique les clés identiques dans Cache Storage (chaque ressource n'est stockée qu'une seule fois). Aucune configuration PWA n'a été modifiée dans cette mission.

---

## 3. Vérification Interactive de l'Accessibilité (Playwright + Chromium Réel)

### Dispositif isolé (impact zéro sur le bundle de production et sur `frontend/e2e/`)
Pour tester interactivement les composants P01 dans un véritable navigateur Chromium **sans** modifier `App.tsx`, `vite.config.ts`, `playwright.config.ts` ni les routes de production, un harnais isolé a été créé dans `frontend/e2e-p01/` :
- `frontend/e2e-p01/p01-a11y-harness.html` + `p01-a11y-entry.tsx` + `p01-a11y-harness.tsx`
- `frontend/e2e-p01/p01-a11y.spec.ts`
- `frontend/e2e-p01/playwright.p01.config.ts` (`webServer` Vite éphémère sur `127.0.0.1:5179`, `outputDir: '/tmp/p01-pw-results'` pour préserver `frontend/test-results/.last-run.json`)

### Commandes exécutées et résultats exacts
```bash
cd frontend
./node_modules/.bin/oxlint e2e-p01
./node_modules/.bin/playwright test --config=e2e-p01/playwright.p01.config.ts --reporter=list
npm run test
npm run build
npm run check:size
```

| Vérification | Résultat exact |
|---|---|
| **Oxlint (`e2e-p01/`)** | **PASS — 0 warning, 0 error** (`16 ms`, 4 fichiers) |
| **Playwright Chromium (6 scénarios interactifs)** | **PASS — 6/6 passés en `4.6 s`** (détail ci-dessous) |
| **Vitest (unitaires + WCAG)** | **PASS — 11/11 fichiers, 173/173 tests passés** (`823 ms`) |
| **Build de production (`tsc -b && vite build`)** | **PASS — 0 erreur**, `2004` modules en `616 ms`, `dist/sw.js` (`51 entries`, `904.58 KiB`) — hashes strictement identiques (`index-Do3a0zRH.js`, `index-BDtzvwVH.css`) |
| **Budget de bundle (`check:size`)** | **PASS — `index-Do3a0zRH.js` : `93.38 Ko` gzip** (objectif ≤ `105.00 Ko` gzip, **0 octet ajouté** par `e2e-p01/`) |

### Détail des 6 scénarios Playwright vérifiés en Chromium réel
| # | Scénario exécuté | Comportements prouvés dans le DOM réel | Durée | Statut |
|:---:|---|---|---:|:---:|
| 1 | **Modal (`Modal` + `useFocusTrap` + `Input`)** | Ouverture clavier (`Enter`) et souris ; focus initial dans la modale ; saisie de `'Boucotte'` dans `<Input>` avec `onClose` inline sans perte de focus (preuve navigateur de A-01) ; boucle `Tab` et `Shift+Tab` ; fermeture `Escape` et bouton Fermer avec **restitution exacte du focus sur le déclencheur**. | `947 ms` | **PASS** |
| 2 | **DropdownMenu** | Ouverture par `ArrowDown` focalisant le premier item actif (`Modifier`, saut de l'item `disabled`) ; navigation `ArrowDown`, `End`, `Home`, `ArrowUp` ; fermeture `Escape` avec **restitution du focus au bouton déclencheur**. | `456 ms` | **PASS** |
| 3 | **RadioGroup** | Présence du repli `tabindex="0"` sur le premier radio actif sans sélection initiale (`value=""`) ; navigation `ArrowRight`, `ArrowDown`, `ArrowLeft` avec mise à jour réelle de `aria-checked="true"` et du focus. | `522 ms` | **PASS** |
| 4 | **Tabs & TabPanel** | Navigation `ArrowRight`, `End`, `Home`, `ArrowLeft` ; bascule effective de `aria-selected="true"` et visibilité réelle des panneaux associés. | `506 ms` | **PASS** |
| 5 | **Checkbox indéterminé** | Propriété DOM réelle `(el as HTMLInputElement).indeterminate === true` + attribut `aria-checked="mixed"` ; bascule vers `indeterminate === false` et `checked === true` au clic sur le libellé. | `481 ms` | **PASS** |
| 6 | **SearchBar sur mobile (`375×812`)** | Bouton submit identifiable via rôle/nom accessible `getByRole('button', { name: 'Rechercher' })` ; boîte englobante mesurée ≥ `44 × 44 px` ; parcours clavier complet (`searchbox` → saisie `'ZIG-KBG'` → `Tab` vers `Effacer la recherche` → `Tab` vers `Rechercher` → `Enter` soumet la recherche). | `525 ms` | **PASS** |

---

## 4. Limites explicitement documentées

- **Tests E2E applicatifs existants (`frontend/e2e/*.spec.ts`) & Lighthouse sur conteneur Docker :** non exécutés dans cette clôture P01 car le conteneur Docker de production n'a pas été reconstruit dans P01 (aucune page métier refondue). Ils seront exécutés à la fin de P02 sur l'image reconstruite.
- **`scripts/check-contrast.py` :** non exécuté (liste blanche Lot 9 à aligner en P04 lors du retrait définitif des hexadécimaux legacy). La conformité WCAG 2.2 AA de Clarté reste verrouillée par les 23 assertions de `frontend/src/styles/__tests__/tokens.test.ts`.
- **Harnais `frontend/e2e-p01/` :** isolé de `frontend/e2e/` et exclu de `tsconfig.app.json` et `vite build`, afin de n'interférer ni avec le build de production ni avec `npm run test:e2e`.

---

**Clôture technique finale de P01 terminée. Branche `feature/p01-design-system` prête pour validation explicite (non fusionnée, P02 non démarré).**
