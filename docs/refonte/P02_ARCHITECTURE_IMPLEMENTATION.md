# P02 — Architecture et implémentation de l'expérience publique

**Branche :** `feature/p02-public-experience`  
**Stack :** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Design System « SamaAdresse Clarté » (P01).  
**Contraintes respectées :** aucune modification du backend (`backend/`), aucune dépendance ajoutée (`package.json`), aucune modification de la configuration Vite/PWA (`vite.config.ts`), ni des mécanismes hors ligne (`offlineDb.ts`, `syncManager.ts`, `AuthContext.tsx`).

---

## 1. Architecture des dossiers et fichiers créés / modifiés

### 1.1 Socle global & navigation unifiée
- `frontend/src/index.css` : passage de `body` sur `var(--color-canvas)` (`#FFFFFF`) et `var(--color-ink)` (`#0F172A`), sélection Terracotta, focus Bleu fleuve, rendu Leaflet net ; conservation intégrale des alias `@theme` hérités pour la compatibilité P03/P04.
- `frontend/src/App.tsx` : ajout du lien d'évitement clavier (`#main-content`), conteneur `bg-canvas text-ink`, squelette `RouteLoadingFallback` en palette Clarté.
- `frontend/src/components/navigation/PublicHeader.tsx` : navigation publique unifiée desktop + mobile (4 destinations max en barre basse, zéro doublon, indicateur `OfflineStatusIndicator` affiché uniquement hors ligne ou en présence de brouillons, chargement différé de `UserProfileMenu` et `ConfirmDialog`).
- `frontend/src/components/AppNavigation.tsx` : délègue vers `PublicHeader`.
- `frontend/src/components/OfflineBanner.tsx` : habillage Clarté (`bg-warning-soft`, `border-warning-border`, `text-warning`) avec conservation des messages attendus.
- `frontend/src/components/AppFooter.tsx` : pied de page Clarté exposant dynamiquement les zones couvertes (`getCoveredZoneNames()`) et les liens publics/connectés réels.

### 1.2 Évolutions rétrocompatibles de composants partagés P01
- `frontend/src/components/shared/SearchBar.tsx` : ajout de la prop optionnelle `inputId?: string` (préserve `#directory-search-input` dans `/annuaire` sans altérer les appels existants).
- `frontend/src/components/shared/AddressCard.tsx` : ajout de la prop optionnelle `isSelected?: boolean` et de l'attribut `data-address-code={address.code}` pour la synchronisation visuelle et le défilement avec la carte.

### 1.3 Module Accueil (`frontend/src/features/home/`)
- `useHomeDiscovery.ts` : chargement asynchrone des adresses publiques réelles via `searchDirectory({ page: 0, size: 6 })`, gestion propre des états chargement / erreur + `reload` / hors ligne (lecture réactive de `visited_address_codes`).
- `HomeHero.tsx` : hero lumineux en deux colonnes — H1, `SearchBar` centrale redirigeant vers `/annuaire?q=...`, raccourcis quartiers réels, CTA directs, visuel `hero-accueil-800w.webp` (`fetchPriority="high"`, dimensions explicites) et `AddressPlate` `ZIG-KBG-4271`.
- `HomeDiscoverySection.tsx` : 3 cartes de catégories (`MAISON`, `COMMERCE`, `INSTITUTION`), 3 cartes de zones et 8 quartiers issus de `geo-grid.json`, grille des adresses publiées réelles (`AddressCard`) avec états skeleton / hors ligne / erreur / vide.
- `HomeHowItWorks.tsx` : 3 étapes illustrées (`etape-1/2/3` WebP `loading="lazy"`), bloc Avant / Après, anatomie du code `ZIG-KBG-4271`, mention hors ligne fidèle au fonctionnement réel.
- `HomeCtaSection.tsx` : bandeau CTA final haut contraste (`bg-surface-inverse`) vers `/addresses/new`, `/annuaire` et `/login`.
- `HomeConnectedView.tsx` : vue connectée utilitaire (chargée en lazy par `HomePage.tsx`), avec recherche annuaire rapide, accès tableau de bord et 3 dernières adresses personnelles via `AddressCard`.
- `frontend/src/pages/HomePage.tsx` : orchestrateur concis routant entre `PublicHomeView` et `HomeConnectedView` (lazy).

### 1.4 Module Annuaire & Carte (`frontend/src/features/directory/`)
- `types.ts` : types `DirectoryViewMode`, `ResolvedCoordinates`, `MappedDirectoryItem` et helper `parseDirectoryView`.
- `useDirectorySearch.ts` : synchronisation URL (`q`, `quartier`, `type`, `view`), debounce 300 ms + soumission immédiate `Entrée`, protection anti-race-condition (`requestSeqRef`), pagination par lots de 12 avec déduplication par `code`, décompte HTTP 429, gestion WAF HTTP 403, mode hors ligne avec `visited_address_codes`, annonce `aria-live="polite"`. Le changement de vue ne relance jamais `/api/public/directory`.
- `useDirectoryCoordinates.ts` : hydratation à la demande des coordonnées GPS réelles (`enabled === (view === 'map')`), en cascade : cache mémoire inter-vues → `localStorage` (`cached_addr_<code>`) → `GET /api/addresses/{code}` (concurrence bornée à 4, arrêt propre sur HTTP 429). Sépare strictement `mappedItems` et `unmappedItems` sans jamais fabriquer de coordonnées fictives.
- `DirectoryFiltersBar.tsx` : `SearchBar` (`#directory-search-input`, placeholder concis vérifié non tronqué à 360 px), pilules `SearchFilter` par `LocationType`, sélecteur `#filter-quartier` alimenté par les 8 quartiers de `geo-grid.json`, tiroir mobile bottom `Drawer` (`#mobile-filter-quartier`), sélecteur segmenté `Grille / Liste / Carte`, bandeau de chips filtres actifs supprimables individuellement + réinitialisation globale.
- `DirectoryResultsGrid.tsx` : affichage Grille (`1/2/3` colonnes) ou Liste (`layout="horizontal"`), squelettes proportionnés, `EmptyState` avec `/images/etat-vide-{144,320,480}w.webp`, pagination discrète.
- `DirectoryMapCanvas.tsx` : composant Leaflet strictement lazy-loaded (seul fichier du module à importer `leaflet`, `react-leaflet` et `leaflet/dist/leaflet.css`), repères personnalisés Bleu fleuve `#0369A1` / sélectionné Terracotta `#C2410C`, `fitBounds` automatique, zoom modéré sur sélection (`Math.max(zoom, 14)`), gestion `ResizeObserver`, bannière non bloquante sur événement `tileerror`.
- `DirectoryMapSection.tsx` : layout split-view desktop (liste synchronisée + carte fixe sticky) et mobile (carte prioritaire + aperçu flottant de l'adresse sélectionnée + liste), repli hors ligne dédié (`directory-map-offline`), indicateur d'hydratation progressif, avis explicite pour les adresses non localisées.
- `frontend/src/pages/DirectoryPage.tsx` : orchestrateur dans `PublicLayout` avec zone résultats à hauteur réservée (`min-h-[540px]`, CLS maîtrisé).

---

## 2. Performance, code splitting et impact PWA

### 2.1 Découpage des bundles (sortie réelle `npm run check:size`)
- **Chunk d'entrée `index-Bhm5VvkZ.js` :** `344.81 Ko` brut / **`96.89 Ko` gzip** (objectif <= `105.00 Ko` gzip, marge restante de **`8.11 Ko` gzip** ; seuil dur `125.00 Ko`).
- **Chunk annuaire `DirectoryPage-bLApCDWR.js` :** `32.52 Ko` brut / **`8.85 Ko` gzip** (ne contient PAS Leaflet).
- **Chunk carte annuaire `DirectoryMapCanvas-DRV3WHjq.js` :** `4.05 Ko` brut / **`1.94 Ko` gzip** (chargé uniquement en vue Carte).
- **Chunk Leaflet partagé `leaflet-DQ6oQifS.js` :** `149.49 Ko` brut / **`43.50 Ko` gzip** (strictement hors chargement initial de `/` et de `/annuaire` Grille/Liste, vérifié par test Playwright réseau).
- **Chunks différés navigation/accueil connecté :** `HomeConnectedView` (`1.95 Ko` gzip), `UserProfileMenu` (`1.03 Ko` gzip), `ConfirmDialog` (`1.49 Ko` gzip), `DropdownMenu` (`1.86 Ko` gzip).

### 2.2 Manifeste Workbox / PWA (`dist/sw.js`)
- Aucune modification apportée à `vite.config.ts`.
- Le précaching généré par `vite-plugin-pwa` passe de `51` entrées (P01) à **`61` entrées (`959.98 KiB`)** uniquement en raison des 10 nouveaux chunks JS issus du découpage lazy (`DirectoryMapCanvas`, `HomeConnectedView`, `UserProfileMenu`, `ConfirmDialog`, `DropdownMenu`, `useFocusTrap` et 4 micro-chunks d'icônes).
- La navigation hors ligne SPA depuis `/` vers `/annuaire` (Grille/Liste et Vue Carte) fonctionne intégralement grâce au précaching Workbox, vérifié par test Playwright avec Service Worker actif.
