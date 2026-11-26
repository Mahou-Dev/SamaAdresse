# P03 — Audit de l'expérience des adresses et des parcours de création

**Branche :** `feature/p03-address-experience`  
**Base validée :** P02 (`feature/p02-public-experience`, commit `0f8cec3272a7ed305702257a32bdee26619687ee`)  
**Périmètre :** Fiche publique d'adresse (`/a/:code`), carte et itinéraire ORS, partage et signalement, parcours de création en 4 étapes (`/addresses/new`), et modification d'adresse (`/addresses/:id/edit`).

---

## 1. Constat initial avant refonte P03

### 1.1 Fiche publique d'adresse (`/a/:code`)
- **Charte visuelle héritée et densité monotone :** `PublicAddressPage.tsx` (680+ lignes monolithiques) utilisait encore l'ancien habillage Lot 9 (`bg-canvas` sable, bordures brunes `#766B5B`, accent ocre `#C26A1B`, bloc itinéraire `bg-[#12304F]` sombre) en décalage avec le système de design « SamaAdresse Clarté » activé en P01/P02.
- **Hiérarchie desktop sous-exploitée :** une seule colonne verticale (`max-w-2xl`) contraignait la plaque, la photo, la description, la carte, l'itinéraire et le partage à s'empiler sur plusieurs hauteurs d'écran.
- **Chargement eager pénalisant le bundle initial :** `PublicAddressPage` était importée de manière synchrone dans `App.tsx`, alourdissant `index-*.js` (`96.89 Ko` gzip en P02) même lors de la consultation de `/` ou `/annuaire`.
- **Gestion de photo et d'erreurs incomplète :** aucune gestion explicite `onError` sur une image de façade cassée, aucun état visuel distinct pour les coordonnées absentes ou invalides, et modale de signalement codée manuellement sans piégeage de focus (`useFocusTrap`) ni restitution du focus au déclencheur.

### 1.2 Carte, géolocalisation et itinéraire (Leaflet + ORS)
- **Absence de validation stricte des coordonnées :** `AddressMap` transmettait directement `latitude`/`longitude` à Leaflet sans vérifier leur validité numérique (`Number.isFinite`, plages `[-90, 90]` / `[-180, 180]`), au risque d'afficher un repère erroné.
- **Aucune gestion visible d'erreur de tuiles :** une coupure partielle d'OpenStreetMap (`tileerror`) laissait une grille grise silencieuse sans explication à l'utilisateur.
- **Marqueurs hérités :** les repères Leaflet utilisaient encore les anciennes couleurs `#C26A1B` / `#12304F` au lieu de la palette Clarté Terracotta `#C2410C` et Bleu fleuve `#0369A1`.
- **État hors ligne :** `AddressMap` gérait un écouteur `navigator.onLine` local au lieu du contexte global `useOnlineStatus()`.

### 1.3 Partage et signalement
- **QR Code absent du partage sur `/a/:code` :** `ShareAddress.tsx` permettait de copier le code/lien, WhatsApp, partage natif et SMS, mais ne proposait pas l'affichage ni le téléchargement/impression du QR Code officiel (`/api/addresses/{code}/qrcode`) dans le panneau de partage.
- **Protection anti-double soumission :** `SmsShareForm.tsx` et la modale de signalement reposaient uniquement sur un état React asynchrone (`disabled={submitting}`), vulnérable aux doubles clics simultanés dans la même frame.
- **Accessibilité modale de signalement :** pas de focus trap clavier, pas de verrouillage du scroll, ni de restauration du focus au bouton déclencheur à la fermeture par `Échap`.

### 1.4 Parcours de création en 4 étapes (`/addresses/new`)
- **Page monolithique (~730 lignes) :** logique métier (GPS, IndexedDB, codes réservés, compression image, synchronisation) et UI des 4 étapes étaient mêlées dans un seul fichier `NewAddressPage.tsx`.
- **Progression peu lisible :** la barre de progression se réduisait à 4 tirets sans noms d'étapes ni possibilité de revenir directement sur une étape déjà validée.
- **Retour géographique différé à l'étape 1 :** l'utilisateur ne voyait la détection de sa zone/quartier (`resolveQuartier`) qu'au moment d'un échec ou en étape 4, au lieu d'un retour immédiat sur la carte.
- **Synchronisation en direct absente en étape 4 :** après une création hors ligne, l'écran de résultat restait figé sur « Enregistrée sur cet appareil » même après retour réseau et synchronisation automatique par `syncManager`.

### 1.5 Modification d'adresse (`/addresses/:id/edit`)
- **Absence de garde-fou contre la perte de modifications :** cliquer sur « Annuler » ou quitter la page avec des modifications non enregistrées perdait silencieusement la saisie.
- **Suppression de photo risquée :** la suppression de la photo reposait sur un `window.confirm` natif du navigateur plutôt qu'un `ConfirmDialog` accessible Clarté.
- **Statuts non actifs peu protégés :** les champs restaient éditables visuellement pour une adresse `ARCHIVED` ou `SUSPENDED` avant rejet serveur.
- **Duplication de formulaires :** le sélecteur de type de lieu, le champ description et la visibilité annuaire étaient dupliqués entre création et modification.

---

## 2. Contrats backend et invariants vérifiés

L'inspection directe des contrôleurs et DTO backend (`AddressController.java`, `PublicRouteController.java`, `ReportController.java`, `SmsShareController.java`, `AddressResponse.java`, `PublicAddressResponse.java`, `ReportReason.java`) et des utilitaires frontend (`geoGrid.ts`, `offlineDb.ts`, `syncManager.ts`, `imageCompressor.ts`, `formValidation.ts`) a établi les contrats stricts suivants :

| Endpoint / Module | Contrat vérifié | Incidence P03 |
| --- | --- | --- |
| `GET /api/addresses/{code}` | Retourne `PublicAddressResponse` (`code`, `latitude`, `longitude`, `zone`, `quartier`, `description`, `photoUrl`, `locationType`, `createdAt`, `ownerName?`). Statuts : `200`, `404`, `410` (archivée/suspendue), `5xx`. | Affichage strict des champs publics uniquement ; aucune PII propriétaire (email/téléphone) ; traitement explicite `410 Gone`, `404`, `500` + `Réessayer`, et cache hors ligne `localStorage`. |
| `GET /api/addresses/{code}/qrcode` | Retourne le PNG du QR Code officiel (uniquement pour une adresse existante côté serveur). | Monté **uniquement** lorsque le panneau de partage est ouvert sur `/a/:code` (préserve `lot12b-offline.spec.ts`) et sur l'étape 4 **uniquement** pour une adresse confirmée serveur (jamais en brouillon local). |
| `GET /api/public/route` | Paramètres `startLat`, `startLng`, `endLat`, `endLng`, `profile` (`driving-car` \| `foot-walking`). Retourne `distance`, `duration`, `profile`, `geometry`, `steps[]`. Erreurs `400`, `422`, `429`, `503`. | Bascule Voiture / À pied avec recalcul automatique si déjà calculé, étapes dépliables, notice vie privée, fallback Google Maps et repli hors ligne. |
| `POST /api/addresses/{code}/share/sms` | Authentifié uniquement (`PROPRIETAIRE` / `ADMIN`). Validation numéro mobile sénégalais (`70`, `75`, `76`, `77`, `78`). Rejet fixe `33`. Erreurs `400`, `401`, `429`, `502`. | Conservé intégralement dans `SmsShareForm.tsx` avec garde-fou anti-double soumission par `useRef` ; les visiteurs anonymes utilisent un lien natif `sms:`. |
| `POST /api/public/addresses/{code}/reports` | `reason` strictement parmi `POSITION_INCORRECTE`, `CONTENU_INAPPROPRIE`, `PHOTO_INAPPROPRIEE`, `AUTRE`, `comment` optionnel <= 500 car. Erreurs `429`, `4xx`/`5xx`. | 4 raisons réelles exactes, garde-fou anti-double soumission par `useRef`, blocage hors ligne, modale P01 `Modal` accessible. |
| `POST /api/addresses` & `offlineDb.ts` / `syncManager.ts` | Création 4 étapes en ligne (`FormData` + photo compressée + `listed` / `showOwnerName`) ou hors ligne (IndexedDB `pending_addresses` + consommation d'un code réservé `reserved_codes` si disponible pour le quartier, sinon code temporaire `ZONE-QUARTIER-????`). | Aucune modification de `offlineDb.ts`, `syncManager.ts`, `geoGrid.ts` ni `imageCompressor.ts` ; distinction stricte entre confirmation locale et serveur ; écoute `syncManager.subscribe` en direct sur l'étape 4. |
| `PATCH /api/addresses/{id}` & `/photo` (`POST`/`DELETE`) | Champs modifiables : `description`, `locationType`, `listed`, `showOwnerName`. `code`, `zone`, `quartier`, `latitude`, `longitude` sont **immuables**. | Bloc d'identité immuable clairement expliqué ; formulaire partagé avec l'étape 2 ; garde-fou `isDirty` (`ConfirmDialog` + `beforeunload`) ; protection lecture seule si statut `ARCHIVED`/`SUSPENDED`. |

---

## 3. Décisions UX / Produit retenues pour P03

1. **Cohérence intégrale avec SamaAdresse 2.0 « Clarté » :** harmonisation complète des 3 écrans majeurs (`/a/:code`, `/addresses/new`, `/addresses/:id/edit`) et des composants transverses (`AddressMap`, `LeafletMapInner`, `ShareAddress`, `SmsShareForm`, `SegmentedPicker`) sur les tokens Clarté (blanc `#FFFFFF`, surfaces `#F8FAFC`/`#FAF8F5`, Terracotta `#C2410C`, Bleu fleuve `#0369A1`).
2. **Modularisation métier dans `frontend/src/features/addresses/` :** séparation propre entre composants partagés (`AddressDetailsFields`, `DirectoryVisibilitySection`), fiche publique (`usePublicAddress`, `useAddressRoute`, `PublicAddressRoutePanel`, `AddressReportModal`) et assistant de création (`WizardStepper`, `WizardStepLocation`, `WizardStepDetails`, `WizardStepPhoto`, `WizardStepResult`).
3. **Performance et bundle initial améliorés :** passage de `PublicAddressPage` en chargement différé (`lazy` avec préchargement) dans `App.tsx`, réduisant le chunk d'entrée `index-*.js` de `96.89 Ko` gzip (P02) à **`88.56 Ko` gzip** (`-8.33 Ko` gzip), tout en conservant Leaflet isolé en lazy chunk (`43.50 Ko` gzip) et la fiche entièrement précachée par Workbox pour le mode hors ligne.
4. **Honnêteté de domaine et fiabilité hors ligne :** zéro coordonnée, code, photo ou statut inventé ; séparation visuelle sans ambiguïté entre enregistrement local hors ligne et confirmation serveur ; préservation intégrale des sélecteurs et exports attendus par les tests existants (`lot3`, `lot4`, `lot5`, `lot6`, `lot12b-offline`, `e2e-p01`, `e2e-p02`).
