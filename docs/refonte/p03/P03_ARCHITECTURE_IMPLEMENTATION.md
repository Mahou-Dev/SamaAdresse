# P03 — Architecture et implémentation de l'expérience des adresses

**Branche :** `feature/p03-address-experience`  
**Stack :** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Design System « SamaAdresse Clarté » (P01).  
**Invariants respectés :** aucune modification de `backend/`, `frontend/package.json`, `frontend/vite.config.ts`, `AuthContext.tsx`, `offlineDb.ts`, `syncManager.ts`, `geoGrid.ts` ni `imageCompressor.ts`.

---

## 1. Architecture des dossiers et fichiers créés / modifiés

### 1.1 Routage, performance & fiabilité cartographique
- `frontend/src/App.tsx` : conversion de `PublicAddressPage` en import `lazy` (`publicAddressPreload`), retirant le code spécifique de la fiche publique du chunk d'entrée `index-*.js` tout en le gardant précaché par Workbox pour l'accès hors ligne.
- `frontend/src/features/directory/DirectoryMapCanvas.tsx` : correctif chirurgical de non-régression (3 lignes) empêchant le timer différé `syncBounds` (150 ms) d'écraser le centrage/zoom sur un repère déjà sélectionné (`selectedCodeRef`) lorsque l'utilisateur clique rapidement sur « Localiser » grâce au chargement accéléré du bundle.

### 1.2 Composants partagés modernisés (Clarté)
- `frontend/src/components/SegmentedPicker.tsx` : habillage Clarté (`role="radiogroup"`), support des touches `Home` / `End` en plus des flèches directionnelles, et prop `disabled?: boolean` pour le mode lecture seule.
- `frontend/src/components/LeafletMapInner.tsx` : marqueurs Clarté Terracotta `#C2410C` (`.custom-leaflet-marker`) et Bleu fleuve `#0369A1` (`.custom-leaflet-start-marker`), écouteur `tileerror` sur `TileLayer` avec bannière d'avertissement non bloquante, gestion de redimensionnement et itinéraire géodésique bleu fleuve `#0369A1`.
- `frontend/src/components/AddressMap.tsx` : utilisation du contexte `useOnlineStatus()`, validation stricte des coordonnées via `hasValidCoordinates()`, état explicite `data-testid="map-missing-coords"` sans marqueur fabriqué si coordonnées absentes/invalides, état hors ligne préservant `"Carte indisponible hors ligne"` et chargement `lazy` de `LeafletMapInner`.
- `frontend/src/components/SmsShareForm.tsx` : habillage Clarté, garde-fou anti-double soumission par `inFlightRef`, détection hors ligne, conservation de `#sms-phone-input`, validation mobile sénégalais (rejet fixe `33`) et gestion complète `400`/`401`/`429`/`502`.
- `frontend/src/components/ShareAddress.tsx` : habillage Clarté, prop optionnelle `showQrCode?: boolean` affichant le QR Code officiel (`/api/addresses/{code}/qrcode`) avec téléchargement PNG et impression, conservation des identifiants `#share-copy-code-btn`, `#share-copy-link-btn`, `#share-whatsapp-btn`, `#share-native-btn`, `#share-sms-toggle-btn`, `#sms-share-panel`.

### 1.3 Utilitaires et formulaires partagés (`frontend/src/features/addresses/`)
- `frontend/src/features/addresses/utils.ts` : source unique pour `REPORT_REASONS` (4 raisons backend), `formatDistance`, `formatDuration`, `hasValidCoordinates`, `resolvePhotoSrc` et `readVisitedAddressCodes`.
- `frontend/src/features/addresses/components/AddressDetailsFields.tsx` : bloc réutilisable (Création Étape 2 + Modification) combinant `SegmentedPicker` (`MAISON` / `COMMERCE` / `INSTITUTION`) et champ description limité à 500 caractères avec compteur dynamique.
- `frontend/src/features/addresses/components/DirectoryVisibilitySection.tsx` : accordéon `<details>` réutilisable gérant `listed` et l'option conditionnelle `showOwnerName` (visible uniquement si `listed === true`).

### 1.4 Fiche publique, itinéraire ORS et signalement (`frontend/src/features/addresses/public/`)
- `usePublicAddress.ts` : chargement annulable de `GET /api/addresses/{code}`, gestion `410 Gone`, `404`, `5xx`, `reload()`, lecture des métadonnées hors ligne (`cached_date_<code>`, `visited_address_codes`) et mise en mémoire des fiches visitées.
- `useAddressRoute.ts` : calcul d'itinéraire ORS (`driving-car` / `foot-walking`), acquisition GPS avec classification fine des erreurs (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`), recalcul automatique lors du changement de mode, gestion explicite `400`, `422`, `429`, `503`, `resetRoute()`.
- `PublicAddressRoutePanel.tsx` : carte Clarté d'itinéraire avec sélecteur Voiture / À pied, synthèse temps/distance (`data-testid="ors-route-summary"`), accordéon d'étapes numérotées, mention vie privée, lien fallback Google Maps et repli hors ligne.
- `AddressReportModal.tsx` : modale de signalement construite sur le composant P01 `Modal` (piégeage de focus, fermeture `Échap`, restitution du focus au déclencheur), 4 raisons radio réelles, commentaire limité à 500 caractères (`#report-comment`), garde-fou anti-double soumission par `submittingRef`, blocage hors ligne et gestion `429`.
- `frontend/src/pages/PublicAddressPage.tsx` : orchestrateur Clarté en 2 colonnes desktop (`7/12` plaque + photo + informations + actions ; `5/12` carte sticky + itinéraire) dans `PublicLayout`, gestion `410 Gone` / `404` / `500` / hors ligne non visité, panneau de partage ouvrable à la demande (montant `ShareAddress` avec `showQrCode` uniquement lorsqu'ouvert pour compatibilité `lot12b-offline`), ré-export rétrocompatible de `REPORT_REASONS`, `formatDistance` et `formatDuration` pour `lot4.test.ts` et `lot6.test.ts`.

### 1.5 Parcours de création en 4 étapes (`frontend/src/features/addresses/creation/`)
- `WizardStepper.tsx` : indicateur visuel numéroté des 4 étapes (`Position`, `Détails`, `Photo`, `Plaque`), barre de progression accessible (`role="progressbar"`), navigation clavier/clic vers toute étape antérieure déjà franchie.
- `WizardStepLocation.tsx` : capture GPS avec badge de précision (`± X m`), prévisualisation temps réel du quartier et de la zone couverte (`resolveQuartier`, `data-testid="detected-quartier-badge"` ou `data-testid="outside-zone-hint"`), carte interactive `AddressMap` avec repère déplaçable, saisie manuelle dépliable (`#manual-lat`, `#manual-lng`).
- `WizardStepDetails.tsx` : encapsule `AddressDetailsFields` (`#address-desc`) et `DirectoryVisibilitySection` (`#directory-listed`, `#directory-show-owner`) avec récapitulatif compact des coordonnées.
- `WizardStepPhoto.tsx` : sélection caméra/galerie avec validation (`validateStep3Photo`), compression client (`compressImage`) + affichage des statistiques avant/après et taux de réduction, aperçu plein cadre avec remplacement/suppression, résumé de l'adresse et actions `Passer cette étape` / `Valider et créer l'adresse`.
- `WizardStepResult.tsx` : confirmation distinguant strictement création confirmée serveur (`Adresse créée et enregistrée` + QR Code + téléchargement/impression + partage complet) et création locale hors ligne (`Enregistrée sur cet appareil · en attente d'envoi` + code réservé ou `????` + absence totale de QR Code), avec abonnement en direct à `syncManager.subscribe()` permettant la mise à jour automatique vers le statut confirmé dès la reconnexion.
- `frontend/src/pages/NewAddressPage.tsx` : orchestrateur conservant intégralement le flux hors ligne IndexedDB (`offlineDb.consumeReservedCode`, `offlineDb.addDraft`), le timeout 8 s de bascule hors ligne, le garde-fou anti-double soumission par `submittingRef`, les marqueurs `performance.mark`, la libération des URLs Blob (`URL.revokeObjectURL`) et le fil d'Ariane `"Nouvelle adresse"`.

### 1.6 Modification d'adresse (`frontend/src/pages/EditAddressPage.tsx`)
- Intégration dans `ConnectedLayout` avec mise en page 2 colonnes desktop (`7/12` formulaire éditable + `5/12` bloc identité immuable & gestionnaire de photo).
- Réutilisation de `AddressDetailsFields` (`#edit-description`) et `DirectoryVisibilitySection` (`#edit-directory-listed`, `#edit-directory-show-owner`).
- Bloc identité en lecture seule explicitant l'immuabilité du code (`AddressPlate`), de la zone/quartier et des coordonnées GPS.
- Garde-fou `isDirty` : badge `"Modifications non enregistrées"`, `ConfirmDialog` accessible sur clic « Annuler » et événement natif `beforeunload`.
- Gestionnaire de photo : téléversement avec compression client et stats, conservation de la photo en cas d'échec de `PATCH`, suppression protégée par `ConfirmDialog` accessible.
- Protection lecture seule explicite si l'adresse est `ARCHIVED` ou `SUSPENDED` (bandeau d'alerte + champs et soumission désactivés) ainsi que blocage hors ligne.

---

## 2. Performance, code splitting et impact PWA

### 2.1 Découpage des bundles JS (sortie réelle `npm run check:size`)
- **Chunk d'entrée `index-DUGPGS0X.js` :** `308.89 Ko` brut / **`88.55 Ko` gzip** (objectif `<= 105.00 Ko` gzip — marge disponible **`16.45 Ko` gzip** ; baisse de **`-8.34 Ko` gzip** par rapport à P02 `96.89 Ko`).
- **Chunk fiche publique `PublicAddressPage-DIY0WWjk.js` :** `27.41 Ko` brut / **`7.54 Ko` gzip** (lazy-loaded).
- **Chunk création `NewAddressPage-BoNVN3EG.js` :** `32.44 Ko` brut / **`8.34 Ko` gzip** (lazy-loaded).
- **Chunk modification `EditAddressPage-C-MRRaCr.js` :** `13.29 Ko` brut / **`3.99 Ko` gzip** (lazy-loaded).
- **Chunk partage `ShareAddress-ClFOfDmv.js` :** `15.61 Ko` brut / **`4.70 Ko` gzip** (partagé entre `/a/:code`, `/addresses/new` étape 4 et espaces connectés).
- **Chunks cartographiques isolés :** `AddressMap` (`1.78 Ko` gzip), `LeafletMapInner` (`2.52 Ko` gzip), `DirectoryMapCanvas` (`1.97 Ko` gzip), `leaflet` (`43.50 Ko` gzip — jamais chargé dans le bundle initial).
- **Chunk formulaire partagé `DirectoryVisibilitySection-DynyKUVn.js` :** `8.17 Ko` brut / **`3.25 Ko` gzip** (partagé entre Création et Modification).

### 2.2 Manifeste Workbox / PWA (`dist/sw.js`)
- Aucune modification de `vite.config.ts`.
- Le précaching généré automatiquement par `vite-plugin-pwa` passe de `61` entrées (`959.98 KiB` en P02) à **`71` entrées (`987.26 KiB`)** en raison des nouveaux chunks découpés en lazy (`PublicAddressPage`, `DirectoryVisibilitySection`, `utils`, `Modal`, `Breadcrumb`, `Spinner`, et micro-chunks d'icônes Lucide).
- Le rechargement complet hors ligne de `/a/:code` via le Service Worker Workbox est vérifié par test Playwright réel (fiche consultée en cache et fiche jamais visitée).
