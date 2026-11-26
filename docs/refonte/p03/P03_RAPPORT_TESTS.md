# P03 — Rapport de tests et vérifications

**Branche :** `feature/p03-address-experience`  
**Date d'exécution :** 2026-11-26  
**Environnement :** Node / Vite 8.3.0 / TypeScript 6 / Vitest 5.0.5 / Playwright Chromium headless (contre le build de production `dist/` servi via `vite preview`).

---

## 1. Synthèse globale des vérifications exécutées

| Contrôle | Commande exécutée | Résultat réel | Détails clés |
| --- | --- | --- | --- |
| Typage TypeScript | `cd frontend && npx tsc --noEmit` | **PASS** | 0 erreur de typage strict. |
| Lint statique | `cd frontend && npm run lint` | **PASS (0 erreur)** | 157 fichiers analysés en 187 ms ; `0` erreur ; `16` avertissements au total (en baisse vs `18` en P02 : 0 avertissement sur tous les nouveaux modules `features/addresses/*`, uniquement les 2 ré-exports `formatDistance`/`formatDuration` conservés sur `PublicAddressPage.tsx` pour `lot4.test.ts` et `lot6.test.ts`, plus 14 avertissements préexistants hors périmètre P03). |
| Tests unitaires & composants | `cd frontend && npm run test` | **PASS (192 / 192)** | 15 fichiers de tests (dont `src/features/addresses/__tests__/addresses.test.tsx` + toutes les suites héritées `lot3`, `lot4`, `lot5`, `lot6`, `lot12c`, `geoGrid`, `syncManager`, P01, P02), 192 tests réussis en 1.40 s. |
| Build production + PWA | `cd frontend && npm run build` | **PASS** | `tsc -b` sans erreur ; `vite build` en 765 ms ; `dist/sw.js` généré (`71 entries`, `987.26 KiB`). |
| Budget bundle JS | `cd frontend && npm run check:size` | **PASS** | `index-DUGPGS0X.js` = **`88.55 Ko` gzip** (`<= 105.00 Ko` gzip, marge **`16.45 Ko`**, baisse de `-8.34 Ko` vs P02 `96.89 Ko`). Leaflet (`43.50 Ko` gzip), `PublicAddressPage` (`7.54 Ko`), `NewAddressPage` (`8.34 Ko`) et `EditAddressPage` (`3.99 Ko`) sont isolés en chunks lazy. |
| E2E Playwright P03 (Chromium) | `cd frontend && npx playwright test --config=e2e-p03/playwright.p03.config.ts` | **PASS (8 / 8)** | 8 scénarios complets sur `dist/` en 29.2 s (fiche publique, carte/ORS, partage/signalement, création 4 étapes en ligne et hors ligne + sync, modification, 7 viewports responsive, Web Vitals, Service Worker hors ligne réel). |
| Non-régression E2E P02 (Chromium) | `cd frontend && npx playwright test --config=e2e-p02/playwright.p02.config.ts` | **PASS (12 / 12)** | 12/12 scénarios P02 réussis en 19.8 s (`/` `CLS=0`, `LCP=156 ms` ; `/annuaire` `CLS=0.0669`, `LCP=452 ms`). |
| Non-régression E2E P01 (Chromium) | `cd frontend && npx playwright test --config=e2e-p01/playwright.p01.config.ts` | **PASS (6 / 6)** | 6/6 tests d'accessibilité interactive P01 réussis en 5.5 s. |
| Stack Docker live (`lot4b`, `lot5`, `lot6`, `lot7`, `lot11a`, `lot12b-offline`) | Non exécutable dans le sandbox | **NON EXÉCUTÉ (indisponible)** | Démon Docker absent dans le sandbox (`/var/run/docker.sock` indisponible). Aucune prétention d'exécution contre un backend Docker live ; les contrats d'API, sélecteurs critiques (`lot12b-offline`, `lot4`, `lot6`) et le Service Worker Workbox réel ont été vérifiés contre `dist/` via la suite Playwright P03 et les tests unitaires Vitest. |

---

## 2. Détail des nouveaux tests P03

### 2.1 Tests unitaires & rendu statique Vitest (`frontend/src/features/addresses/__tests__/addresses.test.tsx` — 6/6 PASS)
1. **Utilitaires & validation (`utils.ts`) :** `hasValidCoordinates` (valide, `null`, `undefined`, `NaN`, bornes `> 90` / `< -180`), `formatDistance`, `formatDuration`, `resolvePhotoSrc` et exactitude des 4 `REPORT_REASONS` backend (`POSITION_INCORRECTE`, `CONTENU_INAPPROPRIE`, `PHOTO_INAPPROPRIEE`, `AUTRE`).
2. **`AddressMap` :** état explicite `data-testid="map-missing-coords"` sans marqueur si coordonnées absentes, et repli hors ligne `"Carte indisponible hors ligne"` avec coordonnées textuelles.
3. **`ShareAddress` :** boutons de copie, WhatsApp, QR Code conditionnel (`showQrCode={false}` vs `showQrCode={true}`), lien natif `sms:` en anonyme vs `#share-sms-toggle-btn` en utilisateur authentifié.
4. **`PublicAddressRoutePanel` :** contrôles Voiture / À pied, synthèse distance/durée, étapes dépliées, mention vie privée et lien Google Maps.
5. **`AddressReportModal` :** titre `#report-modal-title`, les 4 motifs radio backend exacts, champ `#report-comment` et bouton de soumission.
6. **Composants du wizard de création (`WizardStepper`, `WizardStepLocation`, `WizardStepDetails`, `WizardStepPhoto`, `WizardStepResult`) :** progression `role="progressbar"`, détection quartier couvert vs hors zone, visibilité conditionnelle `#directory-show-owner`, compression/skip étape 3, et distinction stricte confirmation en ligne (avec QR) vs brouillon hors ligne (sans QR).

### 2.2 Suite E2E Playwright Chromium P03 (`frontend/e2e-p03/address-experience.spec.ts` — 8/8 PASS)
1. **Fiche publique (`/a/:code`) :**
   - Adresse existante avec photo (`ZIG-KBG-4271`) : plaque, description, façade visible, absence totale d'informations privées propriétaire (`email`/`téléphone`), absence de QR Code dans le flux fermé initial (compatibilité `lot12b-offline`).
   - Adresse sans photo (`ZIG-NOPHOTO-0001`) : état vide honnête (`Pas de photo pour ce lieu`).
   - Adresse archivée/suspendue `410 Gone` (`ZIG-GONE-4100`) : message dédié sans plaque.
   - Adresse inexistante `404` (`ZIG-INCONNU-9999`) : état d'erreur explicite.
   - Erreur serveur `500` (`ZIG-RETRY-5000`) puis clic sur `Réessayer` : récupération complète de la fiche.
2. **Carte et itinéraire ORS :**
   - Coordonnées absentes (`ZIG-NOCOORD-0001`) : affichage de `data-testid="map-missing-coords"` et `0` marqueur `.custom-leaflet-marker` fabriqué.
   - Erreur de tuiles `503` : bannière d'avertissement non bloquante visible et marqueur fonctionnel.
   - Calcul d'itinéraire Voiture (`4 min (1,2 km)`), dépliage des 2 étapes, bascule `À pied` avec recalcul automatique (`11 min (850 m)`), puis gestion d'une erreur ORS `503`.
3. **Partage et signalement :**
   - Panneau Partager : chargement du QR Code, lien WhatsApp (`wa.me`), validation SMS connecté (rejet du numéro fixe `33`, envoi réussi sur mobile `77` avec numéro masqué).
   - Modale de signalement : gestion HTTP `429`, protection anti-double soumission prouvée par double clic synchrone (un seul appel réseau supplémentaire), confirmation de succès, puis fermeture au clavier (`Échap`) avec restitution vérifiée du focus au déclencheur.
4. **Création en 4 étapes en ligne (`/addresses/new`) :**
   - Refus GPS (`clearPermissions`) → message explicite sans blocage ; autorisation GPS → badge `Précision : ± 18 m` et détection automatique `Boucotte`.
   - Coordonnées hors zone couverte (`13.7700, -13.6700`) → alerte `outside-zone-hint` et blocage à la validation.
   - Étape 2 : type `Commerce`, description, visibilité conditionnelle (`#directory-show-owner` masqué tant que `#directory-listed` est décoché), aller-retour Étape 2 → Étape 1 → Étape 2 avec conservation intégrale des saisies.
   - Étape 3 : rejet d'un fichier `document.pdf`, acceptation et compression d'un `facade.png` avec aperçu et stats `Poids optimisé`.
   - Étape 4 : confirmation serveur `Adresse créée et enregistrée`, plaque `ZIG-KBG-7742` et QR Code chargé.
5. **Création hors ligne (IndexedDB + code réservé + code temporaire `????`) et synchronisation :**
   - Passage hors ligne avec 1 code réservé `ZIG-KBG-9001` en IndexedDB → bandeau hors ligne → soumission locale → mention unique `Enregistrée sur cet appareil · en attente d'envoi`, plaque `ZIG-KBG-9001`, `0` QR Code, `1` brouillon persisté dans IndexedDB.
   - Reconnexion (`window.dispatchEvent(new Event('online'))`) → synchronisation automatique par `syncManager` → transition en direct sur l'étape 4 vers `Adresse créée et enregistrée`, lien `Voir la fiche publique`, `0` brouillon résiduel dans IndexedDB.
   - Seconde création hors ligne sans code réservé → attribution du code temporaire `ZIG-KBG-????`, mention explicite `Code temporaire attribué hors ligne.` et `0` QR Code.
6. **Modification d'adresse (`/addresses/:id/edit`) :**
   - Préremplissage fidèle, bloc identité immuable (`Le code et la position ne peuvent pas changer.`), badge `Modifications non enregistrées`.
   - Garde-fou `Annuler` → modale `Quitter sans enregistrer ?` → retour édition conservant la saisie.
   - Erreur serveur `500` sur `PATCH` : conservation de la saisie et photo intacte (`0` appel photo).
   - Suppression de photo protégée par `ConfirmDialog` (`Supprimer la photo de façade ?`), puis `PATCH` réussi et redirection vers `/addresses/mine`.
   - Adresse au statut `ARCHIVED` (`addr-archived-2`) : bandeau lecture seule explicite et bouton de soumission désactivé.
7. **Audit responsive 7 viewports, Web Vitals et contrôle visuel :**
   - **0 débordement horizontal** (`scrollWidth - clientWidth <= 1`) sur les **21 combinaisons** (`7` viewports × `3` routes `/a/ZIG-KBG-4271`, `/addresses/new`, `/addresses/addr-1001/edit`) :
     - `320×568` : **0 débordement**
     - `360×800` : **0 débordement**
     - `390×844` : **0 débordement**
     - `768×1024` : **0 débordement**
     - `1024×768` : **0 débordement**
     - `1280×800` : **0 débordement**
     - `1440×900` : **0 débordement**
   - **Web Vitals mesurés par `PerformanceObserver` Chromium (1440×900 sur `dist/`) :**
     - `/a/ZIG-KBG-4271` : **`CLS = 0.0181`** (`< 0.1`), **`LCP = 208 ms`** (`<= 2500 ms`).
   - Inspection visuelle directe effectuée sur les 4 captures générées dans `/tmp/p03-visual/` (`public-address-1440.png`, `public-address-mobile-390.png`, `new-address-step1-1440.png`, `edit-address-1440.png`).
8. **Mode hors ligne PWA réel avec Service Worker Workbox actif :**
   - Activation réelle de `dist/sw.js`, coupure réseau `context.setOffline(true)`, rechargement complet de `/a/ZIG-KBG-4271` → plaque visible, mention `Version enregistrée le 26/11/2026`, repli `Carte indisponible hors ligne`.
   - Navigation vers une fiche jamais visitée `/a/ZIG-INCONNU-0000` → écran `Cette page n'est pas disponible hors ligne` proposant le lien direct vers la fiche en cache `ZIG-KBG-4271`.

---

## 3. Incidents détectés et corrigés pendant la vérification

1. **Condition de course `syncBounds` (150 ms) sur `DirectoryMapCanvas.tsx` révélée par la non-régression P02 :** l'allègement du bundle initial (`-8.34 Ko` gzip) a accéléré l'affichage de `/annuaire?view=map`, permettant au clic « Localiser » de survenir avant l'échéance du `setTimeout(syncBounds, 150)` au montage, qui recadrait alors la carte au zoom national et masquait le marqueur cible sous l'aperçu flottant. Correctif chirurgical (3 lignes via `selectedCodeRef`) empêchant `syncBounds` d'écraser une sélection déjà active → `e2e-p02` repasse intégralement au vert (`12/12`, Test 5 en `1.0 s`).
2. **Stabilité anti-lint (`oxlint`) :** suppression de toute mutation de `ref` pendant le rendu (`AddressReportModal.tsx`) et privatisation de `WIZARD_STEPS` (`WizardStepper.tsx`) → `0` erreur et `0` avertissement sur tous les nouveaux modules P03.
3. **Compatibilité `lot12b-offline` sur le QR Code :** montage conditionnel du bloc QR Code dans `ShareAddress` (`showQrCode={true}`) uniquement lorsque le panneau Partager est ouvert sur `/a/:code`, maintenant `0` image QR dans le flux fermé initial.
