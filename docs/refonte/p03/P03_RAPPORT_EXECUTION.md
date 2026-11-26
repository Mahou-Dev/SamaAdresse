# P03 — Rapport final d'exécution

**Mission :** P03 — Expérience des adresses et parcours de création  
**Branche active :** `feature/p03-address-experience`  
**Branche de base :** `feature/p02-public-experience` (`0f8cec3272a7ed305702257a32bdee26619687ee`)  
**Statut :** Implémentation, vérifications et rapports terminés — **en attente de validation humaine avant P04**.

---

## 1. Livrables réalisés sur les 5 axes P03

### 1.1 Fiche publique d'une adresse (`/a/:code`)
- Refonte complète de `PublicAddressPage.tsx` dans `PublicLayout` en grille 2 colonnes responsive Clarté (`7/12` plaque officielle + photo de façade + informations publiques + partage/signalement ; `5/12` carte sticky + itinéraire ORS).
- Gestion exhaustive et honnête des états : photo avec chargement / repli sur erreur / état vide sans fausse image, `410 Gone` sans plaque, `404` et `500` avec bouton `Réessayer`, mode hors ligne avec date de mise en cache (`Version enregistrée le …`) et écran dédié pour une fiche jamais visitée hors ligne.
- Passage en chargement différé (`lazy` avec `publicAddressPreload` dans `App.tsx`) tout en restant précaché par Workbox.

### 1.2 Carte, géolocalisation et itinéraire (Leaflet + OpenRouteService)
- Harmonisation Clarté de `AddressMap.tsx` et `LeafletMapInner.tsx` (repères Terracotta `#C2410C` et Bleu fleuve `#0369A1`, conservation des classes `.custom-leaflet-marker` / `.custom-leaflet-start-marker`, bannière `tileerror` non bloquante, utilisation de `useOnlineStatus()`).
- Validation stricte des coordonnées géographiques (`hasValidCoordinates`) avec état explicite `data-testid="map-missing-coords"` sans jamais fabriquer de marqueur fictif.
- Nouveau module d'itinéraire `useAddressRoute.ts` + `PublicAddressRoutePanel.tsx` : bascule Voiture / À pied avec recalcul automatique, étapes numérotées dépliables, classification fine des erreurs GPS et API (`400`/`422`/`429`/`503`), mention vie privée, lien fallback Google Maps et repli hors ligne.

### 1.3 Partage et signalement
- Modernisation Clarté de `ShareAddress.tsx` et `SmsShareForm.tsx` : copie code/lien, WhatsApp, partage natif, QR Code officiel téléchargeable et imprimable dans le panneau Partager (`showQrCode`), SMS serveur pour les utilisateurs connectés (validation mobile sénégalais + protection anti-double soumission par `inFlightRef`) et lien `sms:` natif pour les visiteurs anonymes.
- Nouvelle modale `AddressReportModal.tsx` reposant sur le composant P01 `Modal` (piégeage clavier, fermeture `Échap`, restitution du focus au déclencheur), exposant exactement les 4 motifs backend réels (`POSITION_INCORRECTE`, `CONTENU_INAPPROPRIE`, `PHOTO_INAPPROPRIEE`, `AUTRE`), protection anti-double soumission par `submittingRef`, blocage hors ligne et gestion `429`.

### 1.4 Parcours de création d'adresse en 4 étapes (`/addresses/new`)
- Découpage modulaire dans `frontend/src/features/addresses/creation/` (`WizardStepper`, `WizardStepLocation`, `WizardStepDetails`, `WizardStepPhoto`, `WizardStepResult`) orchestré par `NewAddressPage.tsx`.
- Étape 1 : capture GPS avec badge de précision, détection temps réel du quartier et de la zone couverte (`resolveQuartier`), carte interactive avec repère déplaçable et saisie manuelle dépliable (`#manual-lat`, `#manual-lng`).
- Étape 2 : composants réutilisables `AddressDetailsFields` et `DirectoryVisibilitySection` avec visibilité annuaire conditionnelle et conservation complète des saisies entre étapes.
- Étape 3 : validation photo, compression client avec aperçu et statistiques avant/après, remplacement/suppression, soumission avec ou sans photo.
- Étape 4 : séparation stricte entre confirmation serveur (avec QR Code, téléchargement, impression et partage) et enregistrement hors ligne IndexedDB (code réservé ou code temporaire `????`, sans QR Code), avec abonnement en direct à `syncManager.subscribe()` faisant évoluer l'écran dès la reconnexion.

### 1.5 Modification d'adresse (`/addresses/:id/edit`)
- Refonte Clarté dans `ConnectedLayout` en 2 colonnes desktop réutilisant `AddressDetailsFields` et `DirectoryVisibilitySection`.
- Carte d'identité immuable (plaque, quartier, zone, coordonnées GPS en lecture seule) + protection lecture seule explicite pour les statuts non actifs (`ARCHIVED`, `SUSPENDED`) et le mode hors ligne.
- Garde-fou de perte de saisies (`isDirty` + badge + `ConfirmDialog` sur « Annuler » + `beforeunload`) et suppression de photo sécurisée par `ConfirmDialog` accessible.

### 1.6 Documentation et tests dédiés
- 4 rapports produits dans le dossier dédié `docs/refonte/p03/` sans modifier ni écraser aucun rapport P00/P01/P02 :
  - `docs/refonte/p03/P03_AUDIT_EXPERIENCE_ADRESSES.md`
  - `docs/refonte/p03/P03_ARCHITECTURE_IMPLEMENTATION.md`
  - `docs/refonte/p03/P03_RAPPORT_EXECUTION.md`
  - `docs/refonte/p03/P03_RAPPORT_TESTS.md`
- Tests ajoutés et exécutés : `frontend/src/features/addresses/__tests__/addresses.test.tsx` (6 tests Vitest) et `frontend/e2e-p03/` (8 scénarios E2E Playwright Chromium sur `dist/`).

---

## 2. Chiffres clés vérifiés

- **TypeScript (`tsc --noEmit`) :** `0` erreur.
- **Lint (`oxlint`) :** `0` erreur (`16` avertissements au total, dont `0` sur les nouveaux modules `features/addresses/*`, en baisse par rapport aux `18` de P02).
- **Build (`tsc -b && vite build`) :** succès en `765 ms` ; Service Worker `dist/sw.js` généré (`71 entries`, `987.26 KiB`).
- **Chunk d'entrée initial (`check:size`) :** `index-DUGPGS0X.js` = **`88.55 Ko` gzip** (`<= 105.00 Ko` gzip, marge **`16.45 Ko`**, gain de **`-8.34 Ko` gzip** par rapport à P02 `96.89 Ko`).
- **Tests unitaires (`vitest run`) :** **`192 / 192` PASS** (15 fichiers, `1.40 s`).
- **Tests E2E Playwright Chromium :**
  - Suite P03 (`e2e-p03`) : **`8 / 8` PASS** (`29.2 s`).
  - Non-régression P02 (`e2e-p02`) : **`12 / 12` PASS** (`19.8 s`).
  - Non-régression P01 (`e2e-p01`) : **`6 / 6` PASS** (`5.5 s`).
- **Web Vitals mesurés sur `dist/` (1440×900) :** `/a/ZIG-KBG-4271` → **`CLS = 0.0181`**, **`LCP = 208 ms`**.
- **Responsive :** **`0` débordement horizontal** mesuré sur les 7 viewports obligatoires (`320×568` à `1440×900`) × 3 pages (`21 / 21`).

---

## 3. Limites, périmètre et intégrité Git

- **Stack Docker live indisponible dans le sandbox :** les suites E2E Playwright ont été exécutées contre le build de production `dist/` avec mocks d'API conformes aux DTO backend et Service Worker Workbox réel ; les suites historiques contre Docker (`lot4b`, `lot5`, `lot6`, `lot7`, `lot11a`, `lot12b-offline`) n'ont pas pu être lancées faute de démon Docker dans l'environnement.
- **Périmètre strict respecté :** aucune modification de `backend/`, `frontend/package.json`, `frontend/vite.config.ts`, `AuthContext.tsx`, `offlineDb.ts`, `syncManager.ts`, `geoGrid.ts`, `imageCompressor.ts`, ni des pages relevant de P04 (`DashboardPage`, `MyAddressesPage`, `AccountPage`, `AdminPage`, `LoginPage`, `RegisterPage`). Un unique correctif chirurgical de non-régression (3 lignes) a été appliqué dans `DirectoryMapCanvas.tsx` pour éliminer une condition de course de 150 ms révélée par l'accélération du bundle initial.
- **Intégrité Git & fichiers préexistants :** `feature/p02-public-experience` (`0f8cec3272a7ed305702257a32bdee26619687ee`), `feature/p01-design-system` (`c9f886406f815a7b88fd328702f5b6c73491065b`), `feature/lot12-corrections`, `develop` et `main` sont strictement inchangées ; les 4 modifications préexistantes (`docs/audit/VERIFY.md`, `docs/audit/newman.json`, `docs/audit/smoke-prod.md`, `frontend/test-results/.last-run.json`) demeurent intactes et non incluses dans les commits P03.

---

## 4. Prochaine étape

Mission P03 terminée. **En attente de validation humaine explicite avant d'engager P04.**
