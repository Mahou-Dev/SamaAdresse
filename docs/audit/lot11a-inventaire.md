# Inventaire Frontend et Cartographie des Endpoints — Lot 11A

**Date :** 19 octobre 2026  
**Branche :** `feature/lot11a-espaces`  
**Contexte :** Refonte des espaces personnels (Propriétaire et Administrateur) de SamaAdresse, front uniquement.

---

## 1. Routes Frontend Actuelles

| Route | Composant | Rôle / Accès | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Page d'accueil, recherche directe par code et présentation du service |
| `/login` | `LoginPage` | Public | Formulaire de connexion (Email + Mot de passe) |
| `/register` | `RegisterPage` | Public | Formulaire d'inscription (Nom, Email, Téléphone, Mot de passe) |
| `/annuaire` | `DirectoryPage` | Public | Annuaire public des adresses référencées |
| `/a/:code` | `PublicAddressPage` | Public | Fiche publique d'une adresse géolocalisée avec plaque et itinéraire |
| `/account` | `AccountPage` | Authentifié | Espace personnel (profil, installation PWA, déconnexion) |
| `/addresses/mine` | `MyAddressesPage` | Authentifié | Liste et gestion des adresses créées par l'utilisateur connecté |
| `/addresses/new` | `NewAddressPage` | Authentifié | Assistant de création d'adresse en 2 étapes |
| `/addresses/:id/edit` | `EditAddressPage` | Authentifié | Modification d'une adresse existante (description, type, visibilité) |
| `/admin` | `AdminPage` | `ADMIN` uniquement | Modération des signalements publics et gestion des adresses |
| `*` | `NotFoundPage` | Public | Page d'erreur 404 sobre |

### Nouvelles routes introduites au Lot 11A :
- `/tableau-de-bord` : Tableau de bord connecté (Propriétaire & Admin), chargé en lazy-loading (`DashboardPage`).

---

## 2. Endpoints Réellement Disponibles dans le Backend

### 2.1. Profil Utilisateur
- `GET /api/auth/me` (Authentifié Bearer)
  - **Réponse :** `UserProfileResponse`
    - `id` (UUID)
    - `fullName` (string)
    - `email` (string)
    - `phoneNumber` (string)
    - `role` (`PROPRIETAIRE` | `ADMIN`)
    - `enabled` (boolean)
    - `createdAt` (ISO-8601 string)
  - **Remarque :** Aucun endpoint de mise à jour du profil (`PATCH /api/auth/me`), de changement de mot de passe, ou de suppression de compte n'existe dans le backend actuel. Le profil est affiché en **lecture seule**.

### 2.2. Mes Adresses
- `GET /api/addresses/mine` (Authentifié Bearer)
  - **Réponse :** `List<AddressResponse>`
    - `id` (UUID)
    - `code` (string, ex: `ZIG-KBG-4271`)
    - `latitude` (number)
    - `longitude` (number)
    - `zone` (string, ex: `ZIG`)
    - `quartier` (string, ex: `KBG`)
    - `description` (string)
    - `photoUrl` (string optionnel)
    - `locationType` (`MAISON` | `COMMERCE` | `INSTITUTION`)
    - `status` (`ACTIVE` | `ARCHIVED` | `SUSPENDED`)
    - `listed` (boolean, visibilité dans l'annuaire)
    - `showOwnerName` (boolean, visibilité du nom dans l'annuaire)
    - `moderationNotice` (string optionnel, motif de suspension ou avis de modération)
    - `createdAt` (ISO-8601 string)
    - `codeChanged` (boolean)
    - `previousCode` (string optionnel)
    - `clientRequestId` (string optionnel)
    - `owner` (`{ id, fullName, email, phoneNumber, role }`)
- `PATCH /api/addresses/{id}` (Authentifié Bearer, Propriétaire ou Admin)
  - **Corps :** `{ description?: string, locationType?: LocationType }`
- `PATCH /api/addresses/{id}/visibility` (Authentifié Bearer, Propriétaire ou Admin)
  - **Corps :** `{ listed: boolean, showOwnerName: boolean }`
- `POST /api/addresses/{id}/photo` (Multipart, Propriétaire ou Admin)
  - **Fichier :** `file` (JPEG/PNG/WebP, max 5 Mo)
- `DELETE /api/addresses/{id}/photo` (Authentifié Bearer, Propriétaire ou Admin)
- `POST /api/addresses/{id}/archive` (Authentifié Bearer, Propriétaire ou Admin)
- `POST /api/addresses/{id}/restore` (Authentifié Bearer, Propriétaire ou Admin)
- `GET /api/addresses/{code}/qrcode` (Public, retourne image PNG 300x300)
- `POST /api/addresses/{code}/share/sms` (Public, limitation horaire/quotidienne)

### 2.3. Signalements Reçus (Côté Propriétaire)
- **Constat :** Il n'existe **aucun endpoint** dédié permettant au propriétaire de requêter les signalements émis par des tiers sur ses adresses (`GET /api/addresses/mine/reports` n'existe pas).
- **Données réelles exploitables :** Chaque adresse retournée par `GET /api/addresses/mine` comporte son `status` (`ACTIVE`, `ARCHIVED`, `SUSPENDED`) et `moderationNotice` (contenant le motif de suspension saisi par l'administrateur).
- **Source des tuiles et listes :** Les adresses signalées/suspendues sont calculées via `addresses.filter(a => a.status === 'SUSPENDED')`.
- **Statut :** L'ajout d'une API dédiée propriétaire pour lister l'historique complet des signalements reçus est **reporté au lot 11B**.

### 2.4. File de Modération Administrateur
- `GET /api/admin/reports` (Authentifié Admin Bearer)
  - **Paramètres :** `status` (`OPEN` | `RESOLVED` | `DISMISSED`), `page` (défaut 0), `size` (défaut 20)
  - **Réponse :** `Page<AdminReportResponse>`
    - `content`: tableau de signalements
      - `id` (UUID)
      - `reason` (`POSITION_INCORRECTE` | `CONTENU_INAPPROPRIE` | `PHOTO_INAPPROPRIEE` | `AUTRE`)
      - `comment` (string optionnel)
      - `status` (`OPEN` | `RESOLVED` | `DISMISSED`)
      - `createdAt` (ISO-8601 string)
      - `resolvedAt` (ISO-8601 string optionnel)
      - `addressId` (UUID)
      - `addressCode` (string)
      - `addressZone` (string)
      - `addressQuartier` (string)
      - `addressLocationType` (string)
      - `addressDescription` (string)
      - `addressPhotoUrl` (string optionnel)
      - `addressStatus` (`ACTIVE` | `ARCHIVED` | `SUSPENDED`)
    - `totalElements` (number)
    - `totalPages` (number)
    - `number` (number)
    - `size` (number)
- `POST /api/admin/addresses/{id}/suspend` (Authentifié Admin Bearer)
  - **Corps :** `{ reason: string }` (obligatoire)
  - **Effet :** Passe l'adresse en statut `SUSPENDED`, enregistre une ligne d'audit dans la table PostgreSQL `admin_actions`.
- `POST /api/admin/addresses/{id}/reinstate` (Authentifié Admin Bearer)
  - **Corps :** `{ reason?: string }` (optionnel)
  - **Effet :** Rétablit l'adresse en statut `ACTIVE`, enregistre une ligne d'audit dans `admin_actions`.
- `PATCH /api/admin/reports/{id}` (Authentifié Admin Bearer)
  - **Corps :** `{ status: 'RESOLVED' | 'DISMISSED', reason?: string }`
  - **Effet :** Met à jour le signalement, enregistre une ligne d'audit dans `admin_actions`.

### 2.5. Journal d'Audit Administrateur
- **Constat :** Bien que le service `ModerationService` écrive chaque action dans la table PostgreSQL `admin_actions` (colonnes : `id`, `action_type`, `admin_email`, `address_id`, `report_id`, `reason`, `created_at`), il n'existe **aucun endpoint GET** exposé par Spring Boot (`GET /api/admin/audit-actions` est inexistant).
- **Comportement front retenu :** Le tableau du journal d'audit affiche l'historique des actions d'administration exécutées pendant la session en cours, accompagné d'une mention transparente expliquant la persistance serveur et le report de l'API de consultation historique au lot 11B.

### 2.6. Réservations de Codes
- `GET /api/address-codes/reservations` (Authentifié Bearer)
  - **Réponse :** `List<ReservedCodeResponse>` (`id`, `code`, `zone`, `quartier`, `status`, `createdAt`, `expiresAt`)
- `POST /api/address-codes/reservations?zone={ZIG|DKR}` (Authentifié Bearer)
  - **Réponse :** Liste actualisée des réservations actives (limite de 40 par utilisateur, 3 par quartier).

### 2.7. File d'Attente Hors Ligne (IndexedDB locale)
- **Base IndexedDB :** `samaadresse_offline` (version 1)
  - Object store `drafts` : stocke les brouillons créés hors ligne (`OfflineDraft`).
    - Statuts : `PENDING`, `SYNCING`, `FAILED`.
    - Méthodes d'accès : `getDrafts()`, `getDraftsCount()`, `saveDraft()`, `deleteDraft()`, `clearDrafts()`.
  - Object store `reservedCodes` : stocke les codes pré-réservés disponibles hors ligne (`OfflineReservedCode`).
    - Méthodes d'accès : `getReservedCodes()`, `saveReservedCodes()`, `clearReservedCodes()`.
  - Nettoyage complet : `clearAllOfflineData()`.

---

## 3. Matrice de Traçabilité des Données Affichées (Zéro Donnée Inventée)

| Écran | Élément affiché | Source de données réelle | Traitement / Formule |
|---|---|---|---|
| **Tableau de bord** | Prénom de l'utilisateur | `user.fullName` (`AuthContext` via `GET /api/auth/me`) | `user.fullName.trim().split(' ')[0]` |
| **Tableau de bord** | Tuile « Adresses actives » | `GET /api/addresses/mine` | `addresses.filter(a => a.status === 'ACTIVE').length` |
| **Tableau de bord** | Tuile « Adresses signalées » | `GET /api/addresses/mine` | `addresses.filter(a => a.status === 'SUSPENDED').length` |
| **Tableau de bord** | Tuile « Adresses archivées » | `GET /api/addresses/mine` | `addresses.filter(a => a.status === 'ARCHIVED').length` |
| **Tableau de bord** | Tuile « En attente de synchro » | IndexedDB `drafts` | `drafts.filter(d => d.status === 'PENDING').length` |
| **Tableau de bord** | Bloc « À traiter » | `GET /api/addresses/mine` + IndexedDB | Adresses `SUSPENDED`, adresses actives sans photo (`!photoUrl`), brouillons hors ligne |
| **Tableau de bord** | « Adresses récentes » | `GET /api/addresses/mine` | 3 adresses les plus récentes triées par `createdAt` descendant |
| **Mes adresses** | Compteur de résultats | Données filtrées locales | `filteredAddresses.length` / `totalAddresses.length` |
| **Mes adresses** | Filtres Quartier / Type / Statut | Champs de `AddressResponse` | Filtrage direct sur les propriétés réelles de l'API |
| **Compte** | Profil | `GET /api/auth/me` | `user.fullName`, `user.email`, `user.phoneNumber`, `user.role` |
| **Compte** | Codes réservés restants | IndexedDB `reservedCodes` | `reservedCodes.filter(c => c.status === 'RESERVED' && c.expiresAt > now).length` |
| **Compte** | Préférences de création | `localStorage` | Clés `sa_pref_default_listed` et `sa_pref_default_show_owner` |
| **Admin** | Compteurs de modération | `GET /api/admin/reports` | `totalElements` par statut (`OPEN`, `RESOLVED`, `DISMISSED`) |
| **Admin** | File de signalements | `GET /api/admin/reports` | Liste paginée réelle de l'API |
| **Admin** | Journal d'audit de session | Actions administratives session | Tableau local des suspensions/rétablissements/classements exécutés |

---

## 4. Fonctionnalités Reportées au Lot 11B

Les fonctionnalités suivantes ne disposent d'aucun endpoint backend dans la version actuelle et sont strictement reportées au Lot 11B sans implémentation de données factices :

1. **Mise à jour du profil utilisateur** :
   - Requiert `PATCH /api/auth/me` (nom, prénom, numéro de téléphone, préférences de communication).
   - *Statut Lot 11A :* Affichage en lecture seule, aucune mention trompeuse.
2. **Changement de mot de passe & Sécurité du compte** :
   - Requiert `POST /api/auth/change-password` et `POST /api/auth/revoke-sessions`.
   - *Statut Lot 11A :* Déconnexion locale assurée via `POST /api/auth/logout`.
3. **Suppression de compte & Export RGPD** :
   - Requiert `DELETE /api/auth/me` et `GET /api/auth/export-data`.
   - *Statut Lot 11A :* Non affiché.
4. **API de signalements reçus côté propriétaire** :
   - Requiert `GET /api/addresses/mine/reports`.
   - *Statut Lot 11A :* Les adresses sous le coup d'une modération sont présentées via leur statut `SUSPENDED` et leur `moderationNotice`.
5. **API de consultation de l'historique d'audit administrateur** :
   - Requiert `GET /api/admin/audit-actions` (pagination, filtres par admin/date/action).
   - *Statut Lot 11A :* Journal de session immédiat avec traçabilité claire.
