# P04 — Architecture et implémentation des espaces connectés et finalisation

**Branche :** `feature/p04-connected-experience`  
**Stack :** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Design System « SamaAdresse Clarté » (P01).  
**Invariants strictement préservés :** aucune modification de `backend/`, `frontend/package.json`, `frontend/vite.config.ts`, `AuthContext.tsx`, `apiClient.ts`, `addressApi.ts`, `offlineDb.ts`, `syncManager.ts`, `geoGrid.ts` ni `imageCompressor.ts`.

---

## 1. Architecture des fichiers créés et modifiés

### 1.1 Enveloppe connectée, routage, sécurité UI et harmonisation globale
- `frontend/src/components/ConnectedLayout.tsx` : refonte intégrale sur les tokens **SamaAdresse Clarté** (`bg-surface`, barre latérale desktop `bg-surface-elevated border-border`, composant `Avatar`, bouton Terracotta `bg-brand`, lien actif Bleu rivière `bg-institution-soft text-institution`, compteur temps réel de brouillons IndexedDB synchronisé via `syncManager.subscribe`, lien vers `/annuaire`, garde-fou `ConfirmDialog` à la déconnexion).
- `frontend/src/components/ProtectedRoute.tsx` : habillage Clarté pour le chargement de session et l'écran `Accès réservé` (conservation stricte du titre et message attendus par `lot4b`, liens vers `/tableau-de-bord` et `/`).
- `frontend/src/components/ReloadPrompt.tsx` : notification de mise à jour PWA Clarté (`role="alert"`, boutons `Actualiser` et `Plus tard`, préservation de `window.__triggerPwaRefreshPrompt`).
- `frontend/src/pages/LoginPage.tsx` et `frontend/src/pages/RegisterPage.tsx` : refonte sur le layout P01 `AuthLayout` (suppression du `<main>` imbriqué), garde-fou anti-double soumission par `useRef`, bandeau `Session expirée` après redirection `401`, indicateur de force du mot de passe Vert baobab (`#15803D`), préservation de tous les identifiants de champs (`#email`, `#password`, `#fullName`, `#phoneNumber`, `#confirmPassword`).
- `frontend/src/pages/NotFoundPage.tsx` : harmonisation Clarté avec liens directs vers `/` et `/annuaire`.
- `frontend/src/App.tsx` : passage de `LoginPage` et `RegisterPage` en chargement différé (`lazy` avec préchargement conditionnel), abaissant encore le chunk d'entrée initial à **`86.01 Ko` gzip**.

### 1.2 Axe 1 — Tableau de bord (`frontend/src/features/dashboard/` + `DashboardPage.tsx`)
- `frontend/src/features/dashboard/useDashboardData.ts` : hook dédié séparant le chargement IndexedDB (brouillons + stock réel de codes réservés actifs) du chargement serveur `getMyAddresses()`, avec gestion explicite des erreurs API (`401` session expirée vs erreur serveur `5xx`) sans jamais maquiller une panne en état vide « 0 adresse », abonnement `syncManager.subscribe` et verrou `syncingRef` anti-double clic.
- `frontend/src/pages/DashboardPage.tsx` : présentation Clarté centrée sur les données réelles — salutation personnalisée, badge hors ligne contextuel, 4 `StatTile` cliquables (`stat-active`, `stat-suspended`, `stat-archived`, `stat-pending`), bloc « À traiter » (brouillons en attente + synchro directe, adresses suspendues avec motif réel, adresses actives sans photo), 3 adresses récentes avec `AddressPlate` et badge visibilité (`Annuaire` / `Privée`), `EmptyState` illustré si 0 adresse, et cartes d'accès rapide réelles (stock codes réservés hors ligne + raccourci `/admin` réservé au rôle `ADMIN`).

### 1.3 Axe 2 — Gestion des adresses personnelles (`frontend/src/features/my-addresses/` + `MyAddressesPage.tsx`)
- `frontend/src/features/my-addresses/useMyAddresses.ts` : gestion unifiée des adresses serveur, brouillons IndexedDB, événements `syncManager`, erreurs `401`/`5xx`, et actions mutantes protégées par `actionInFlightRef` : archivage (`archiveAddress`), restauration (`restoreAddress`), changement de visibilité annuaire (`updateAddressVisibility` pour les adresses `ACTIVE` en ligne uniquement), et mise à jour photo compressée (`validateStep3Photo` + `compressImage` + `uploadAddressPhoto`). Aucune mise à jour optimiste trompeuse : l'interface reflète exclusivement les réponses positives de l'API.
- `frontend/src/features/my-addresses/OfflineDraftsQueue.tsx` : file d'attente IndexedDB Clarté préservant `span.font-mono.whitespace-nowrap` à 360 px, l'affichage des erreurs de synchronisation par brouillon (`draft.lastError`) et la désactivation du bouton `Envoyer maintenant` hors ligne.
- `frontend/src/features/my-addresses/MyAddressCard.tsx` : carte Clarté réutilisant `AddressPlate` (P01/P03), `StatusBadge`, `NeighborhoodTag` et `ShareAddress` (P03), menu contextuel accessible (fermeture `Échap` + restitution focus), actions adaptées strictement au statut (`ACTIVE`, `ARCHIVED`, `SUSPENDED`), garantie sans débordement horizontal dès `320 px`.
- `frontend/src/features/my-addresses/MyAddressesTable.tsx` : tableau desktop (`hidden lg:block`, `data-testid="addresses-list-view"`) avec bascule propre en cartes sur `< 1024 px` sans dépendre de `window.innerWidth` pendant le rendu.
- `frontend/src/pages/MyAddressesPage.tsx` : orchestrateur avec synchronisation URL dérivée (`?status=`, `?filter=pending`), filtres combinables, `ConfirmDialog` pour l'archivage ET pour le changement de visibilité dans l'annuaire public, et correction du `srcSet` état vide (`/images/etat-vide-320w.webp`).

### 1.4 Axe 3 — Compte et profil utilisateur (`frontend/src/pages/AccountPage.tsx`)
- Synchronisation d'onglets (`profil`, `offline`, `preferences`, `aide`) directement dérivée de `searchParams` (zéro `useEffect` redondant, 0 avertissement `oxlint`).
- **Profil & Sécurité :** identité serveur en lecture seule (`Avatar`, `StatusBadge`, rôle, date d'inscription, e-mail, téléphone avec libellé honnête en mode `isOfflineAuth`), carte dédiée « Sécurité et session active » explicitant la conservation du JWT en mémoire et du refresh token en cookie HttpOnly, bouton de déconnexion protégé par `ConfirmDialog` dès qu'un brouillon IndexedDB existe.
- **Application & hors ligne :** installation PWA (`usePwaInstall`), compteurs réels (codes pré-réservés actifs, brouillons en attente), bouton `Recharger le stock` protégé contre les doubles clics, nettoyage IndexedDB protégé par `ConfirmDialog` danger précisant le nombre exact de brouillons en attente.
- **Préférences locales :** options par défaut pour la création sur l'appareil (`sa_pref_default_listed`, `sa_pref_default_show_owner` dépendant de `listed`), indicateur `Non enregistré` et confirmation toast.
- **Aide & guide :** correction du libellé `KBG` vers `Boucotte - Kangourou` (fidèle à `geo-grid.json`) et lien vers la fiche publique de démonstration.

### 1.5 Axe 4 — Administration et modération (`frontend/src/features/admin/` + `AdminPage.tsx`)
- `frontend/src/features/admin/types.ts` : `REASON_LABELS` et `LocalAuditAction`.
- `frontend/src/features/admin/useAdminModeration.ts` : pagination réelle `GET /api/admin/reports` (`size=20`), compteurs temps réel par statut (`OPEN`, `RESOLVED`, `DISMISSED`), gestion distincte `401` / `403` / `5xx`, verrou `inFlightRef` anti-double soumission sur `suspendAddress`, `reinstateAddress` et `updateReportStatus`, journal d'audit de session alimenté exclusivement après réponse positive de l'API.
- `frontend/src/features/admin/ReportDetailPanel.tsx` : `SidePanel` Clarté affichant uniquement les données de modération sans aucune PII propriétaire, photo avec repli sur erreur `onError`, formulaire direct de suspension (`#suspend-reason-input`, unique dans le DOM) et pied de panneau avec actions de modération.
- `frontend/src/features/admin/ModerationAuditTab.tsx` : onglet Journal d'audit filtrable avec tableau desktop et cartes mobiles adaptées.
- `frontend/src/pages/AdminPage.tsx` : orchestrateur dans `ConnectedLayout` (`maxWidth="wide"`), 4 `StatTile` réels, `DataTable` desktop + cartes mobiles complètes `< 768 px`, pagination serveur, modales P01 accessibles `Modal` pour suspension (`#modal-suspend-reason-input`) et rétablissement (`#reinstate-reason-input`), et `ConfirmDialog` pour « Marquer traité » et « Classer sans suite ».

---

## 2. Sécurité, gestion des états et budget de performance

- **Zéro couleur héritée Lot 9 :** audit `grep` confirmant `0` occurrence des anciens codes couleur dans `frontend/src/{pages,components,features}`.
- **Chunk initial (`check:size`) :** `index-C1fAIJgL.js` = `295.07 Ko` brut / **`86.02 Ko` gzip** (objectif `<= 105.00 Ko` gzip — marge **`18.98 Ko` gzip**, gain cumulé de `-10.87 Ko` depuis P02).
- **Découpage lazy de toutes les routes secondaires :** `LoginPage` (`2.37 Ko`), `RegisterPage` (`3.14 Ko`), `DashboardPage` (`4.67 Ko`), `MyAddressesPage` (`9.06 Ko`), `AccountPage` (`6.38 Ko`), `AdminPage` (`8.32 Ko`), `PublicAddressPage` (`7.49 Ko`), `DirectoryPage` (`8.63 Ko`), `NewAddressPage` (`8.35 Ko`), `EditAddressPage` (`4.02 Ko`), `leaflet` (`43.50 Ko`).
- **Précache Workbox (`dist/sw.js`) :** `82 entries (1019.65 KiB)` — `vite.config.ts` strictement inchangé ; aucune route `/api/auth/`, `/api/addresses/mine` ou `/api/admin/` n'est mise en cache dans Workbox.
