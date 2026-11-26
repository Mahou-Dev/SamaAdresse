# P04 — Audit des espaces connectés, comptes et modération

**Branche :** `feature/p04-connected-experience`  
**Base validée :** P03 (`feature/p03-address-experience`, commit `0483bffb7cad40a9a47602261d96fde52c3fb44e`)  
**Périmètre :** Tableau de bord (`/tableau-de-bord`), gestion des adresses personnelles (`/addresses/mine`), compte et profil (`/account`), administration et modération (`/admin`), authentification (`/login`, `/register`), garde de routes (`ProtectedRoute`), layout connecté (`ConnectedLayout`), invite de mise à jour PWA (`ReloadPrompt`) et page `404` (`NotFoundPage`).

---

## 1. Constat initial avant refonte P04

### 1.1 Incohérence visuelle résiduelle avec P01/P02/P03
Alors que l'expérience publique (`/` et `/annuaire`) et les parcours adresses (`/a/:code`, `/addresses/new`, `/addresses/:id/edit`) avaient basculé sur la direction artistique **SamaAdresse 2.0 « Clarté »**, l'ensemble de l'enveloppe connectée et des pages restantes conservait encore l'ancienne charte Lot 9 (fond sable `#EADFC8`, cartes `#FBF7EF`, surfaces `#F2ECE1`, bordures brunes `#766B5B`, accents `#B84A24` / `#12304F`) :
- `ConnectedLayout.tsx` (qui enveloppait même `EditAddressPage.tsx` dans un fond `#EADFC8`) ;
- `DashboardPage.tsx`, `MyAddressesPage.tsx`, `AccountPage.tsx`, `AdminPage.tsx` ;
- `LoginPage.tsx`, `RegisterPage.tsx`, `NotFoundPage.tsx`, `ProtectedRoute.tsx` et `ReloadPrompt.tsx`.

### 1.2 Défauts fonctionnels, UX et accessibilité relevés lors de l'audit
1. **Tableau de bord (`DashboardPage.tsx`) :**
   - **Étouffement silencieux des erreurs API :** `getMyAddresses().catch(() => [])` avalait silencieusement toute erreur `500` ou `401` et affichait à tort un état vide « Vous n'avez pas encore créé d'adresse » (faux positif trompeur).
   - **Action trompeuse sur les adresses suspendues :** un bouton « Corriger l'adresse » pointait vers `/addresses/:id/edit`, alors que le backend interdit toute modification d'une adresse `SUSPENDED` (`400 Adresse inactive`).
   - **Avertissement lint :** `set-state-in-effect` sur le chargement initial.
2. **Gestion des adresses personnelles (`MyAddressesPage.tsx`, 1 056 lignes monolithiques) :**
   - **Changement de visibilité annuaire absent :** l'endpoint réel `PATCH /api/addresses/{id}/visibility` (`updateAddressVisibility`) existait dans `AddressController.java` et `addressApi.ts` mais n'était pas exposé dans la page.
   - **Défaut asset état vide :** `srcSet` référençait `/images/etat-vide-288w.webp` (fichier inexistant dans `frontend/public/images/` ; les variantes réelles sont `144w`, `320w`, `480w`).
   - **Rendu dépendant de `window.innerWidth < 1024` :** bascule Grille/Liste non réactive au redimensionnement et risquée hors DOM navigateur.
   - **Upload photo non compressé et non gardé hors ligne :** `handlePhotoUpload` n'utilisait ni `compressImage` ni de contrôle `!isOnline`.
   - **3 avertissements lint** (`set-state-in-effect`, `exhaustive-deps`).
3. **Compte et profil (`AccountPage.tsx`) :**
   - **Confusion hors ligne sur le profil :** lorsque `isOfflineAuth` est actif (`email === ''`), l'écran affichait « Non renseignée » au lieu d'expliquer que la donnée complète est disponible en ligne.
   - **Absence de visibilité claire sur l'état de session et de sécurité.**
   - **Inexactitude factuelle dans la FAQ :** le trigramme `KBG` était libellé « Kandé Baneto Gare » au lieu de « Boucotte - Kangourou » tel que défini dans `frontend/src/data/geo-grid.json`.
   - **2 avertissements lint** (`set-state-in-effect`).
4. **Administration et modération (`AdminPage.tsx`, 1 060 lignes monolithiques) :**
   - **ID DOM dupliqué `#suspend-reason-input` :** présent simultanément dans le panneau latéral (`SidePanel`) et dans la modale de suspension (violation HTML/WCAG).
   - **Modales brutes sans focus trap :** les modales de suspension et de rétablissement étaient des `div[role="dialog"]` manuels au lieu du composant P01 `Modal`.
   - **Absence de confirmation sur « Marquer traité » et « Classer sans suite », et absence de verrou `useRef` anti-double clic** sur les mutations sensibles.
   - **Absence de pagination** malgré l'endpoint réellement paginé `GET /api/admin/reports?page=&size=`.
   - **Aucune distinction explicite entre HTTP `401` (session expirée), `403` (droits admin refusés) et `500`.**
5. **Authentification (`LoginPage.tsx`, `RegisterPage.tsx`) :**
   - **Landmark `<main>` imbriqué :** les deux pages rendaient leur propre `<main>` à l'intérieur du `<main id="main-content">` de `App.tsx` (violation WCAG).
   - **Absence de message clair après redirection suite à expiration de session (`401`).**
   - **Import eager dans `App.tsx` :** alourdissait le chunk initial `index-*.js` même sur la page d'accueil.

---

## 2. Analyse des endpoints backend réels et frontières de sécurité

L'inspection directe de `AuthController.java`, `AddressController.java`, `AdminModerationController.java` et `ReservedCodeController.java` a confirmé les contrats exacts suivants :

| Contrôleur / Endpoint | Contrat vérifié | Conséquence directe P04 |
| --- | --- | --- |
| `AuthController` (`/api/auth/login`, `/register`, `/refresh`, `/logout`, `/me`) | JWT en mémoire (`accessToken`), Refresh Token en cookie `HttpOnly` `SameSite=Strict`, rotation + révocation au `/logout`. **Aucun endpoint de modification de profil ou de mot de passe.** | `AuthContext.tsx` et `apiClient.ts` strictement intacts. `AccountPage` affiche le profil réel en lecture seule sans formulaire factice. |
| `AddressController` (`/api/addresses/mine`, `PATCH /{id}`, `PATCH /{id}/visibility`, `POST /{id}/archive`, `POST /{id}/restore`, `POST/DELETE /{id}/photo`) | `@PreAuthorize("hasAnyRole('PROPRIETAIRE', 'ADMIN')")` + contrôle strict du propriétaire côté service ; archivage → `410 Gone` public ; adresse suspendue non éditable (`400`). | Exposition sécurisée de `PATCH /{id}/visibility` avec confirmation ; aucune action d'édition/archivage/restauration proposée sur une adresse `SUSPENDED` ; gestion explicite `401` et erreurs API sans faux succès. |
| `AdminModerationController` (`/api/admin/reports`, `POST /addresses/{id}/suspend`, `POST /addresses/{id}/reinstate`, `PATCH /reports/{id}`) | `@PreAuthorize("hasRole('ADMIN')")` imposé côté serveur. Pagination réelle `Page<AdminReportResponse>` sans PII propriétaire (aucun email/téléphone propriétaire dans `AdminReportResponse`). **Aucun CRUD utilisateurs.** | Pagination serveur ajoutée, zéro PII propriétaire affichée, aucun CRUD utilisateurs inventé, gestion explicite `403`/`401`/`500`, confirmations + protection anti-double soumission par `useRef`. |
| `ReservedCodeController` (`/api/address-codes/reservations`) | `GET` stock actif, `POST ?zone=...` réapprovisionnement (5 appels/h). | Stock pré-réservé réel affiché sur le Tableau de bord et dans l'onglet Hors ligne de `AccountPage`. |

---

## 3. Sécurité frontend et risques identifiés

1. **Frontière de sécurité :** le masquage d'interface (`ProtectedRoute`, boutons conditionnels) ne constitue jamais une frontière de sécurité ; tous les appels `/api/addresses/**` et `/api/admin/**` restent validés par Spring Security (`@PreAuthorize`) et les erreurs `401`/`403` sont traitées explicitement côté UI.
2. **Stockage local et vie privée :** aucun jeton secret ni refresh token n'est jamais écrit dans `localStorage`. Le Service Worker Workbox ne met jamais en cache `/api/auth/`, `/api/addresses/mine` ni `/api/admin/` (vérifié par inspection programmatique du `Cache Storage` en E2E).
3. **Préservation des données locales à la déconnexion :** toute tentative de déconnexion (depuis `PublicHeader`, `ConnectedLayout` ou `AccountPage`) interroge IndexedDB (`getDraftsCount()`) et ouvre un `ConfirmDialog` d'avertissement si des brouillons hors ligne sont en attente, sans jamais supprimer silencieusement ces brouillons.
