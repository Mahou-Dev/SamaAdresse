# ÉTUDE TECHNIQUE APPROFONDIE — SCISSION A1 DU COMMIT `b905b81e`

- **Commit étudié :** `b905b81e` (`2026-11-27 10:08:01 +0000`) — *`feat(frontend): remplace le frontend par samaadresse_frontend connecté au backend Spring Boot`*
- **Parent direct :** `34450534` (`main` post-refonte P04)
- **Dépôt source externe identifié :** `https://github.com/Andrebampoky/sama-AdresseWeb` au commit public **`4d47a411`** (`2026-10-20T01:39:17Z`, auteur `AndreBampoky <a.b255@zig.univ.sn>`, compte GitHub `@Andrebampoky`)
- **Statut TEMPS 2 :** **ÉTUDE UNIQUEMENT — AUCUNE SCISSION EXÉCUTÉE.**

---

## 1. Preuve cryptographique de provenance (comparaison des SHA-1 Git blob par blob)

La comparaison directe de l'arbre Git de **`Andrebampoky/sama-AdresseWeb@4d47a411`** (via l'API GitHub `/git/trees/4d47a411?recursive=1`) avec l'arbre `frontend/` du commit **`b905b81e`** (via `git ls-tree -r b905b81e -- frontend/`) établit les faits mesurables suivants :

| Catégorie de fichiers | Nombre | Proportion | Interprétation technique |
|---|---:|---:|---|
| Fichiers dans `Andrebampoky/sama-AdresseWeb@4d47a411` | **117** | 100,0 % | Source originale développée par `AndreBampoky` |
| Fichiers dans `b905b81e:frontend/` | **119** | — | État final dans `Mahou-Dev/SamaAdresse` |
| **Fichiers rigoureusement identiques octet pour octet (même SHA-1 Git !)** | **62 / 117** | **53,0 %** | **Preuve cryptographique irréfutable** que `frontend/` est issu directement de `Andrebampoky/sama-AdresseWeb@4d47a411` |
| **Fichiers au même chemin, adaptés lors de l'intégration Spring Boot** | **52 / 117** | **44,4 %** | Socle de `AndreBampoky` adapté par `Mahou-Dev` au contrat API Spring Boot de `SamaAdresse` |
| **Recouvrement total des chemins de `sama-AdresseWeb`** | **114 / 117** | **97,4 %** | Quasi-totalité du projet `sama-AdresseWeb` présente dans `b905b81e` |
| Fichiers de `sama-AdresseWeb` volontairement omis | **3** | 2,6 % | `.github/workflows/ci.yml` (CI racine existante), `src/hooks/useProtectedPhoto.ts` (photos servies publiquement sur `/uploads/`), `src/pages/admin/AdminModerationPage.tsx` (remplacée par `AdminReportsPage.tsx`) |
| Fichiers conservés à l'identique de l'ancien `frontend/` (`34450534`) | **3** | — | `scripts/check-size.mjs`, `src/data/geo-grid.json`, `test-results/.last-run.json` |
| Nouveaux fichiers ajoutés uniquement pour l'intégration Spring Boot | **2** | — | `src/lib/geoGrid.ts`, `src/lib/geoGrid.test.ts` (miroir de `GeoGridService.java`) |
| Anciens fichiers frontend P01–P04 supprimés | **193** | — | Remplacement complet de l'ancien frontend |
| Fichiers hors `frontend/` modifiés par `b905b81e` | **0** | 0 % | Isolation parfaite du périmètre frontend |

### Preuves documentaires complémentaires présentes dans le dépôt
1. `frontend/package.json` conserve le nom de paquet d'origine : `"name": "sama-adresseweb"`.
2. `frontend/docs/PROGRESS.md` (ligne 5) mentionne explicitement : *« Dépôt identifié par son remote `sama-AdresseWeb.git` »*.
3. Le dépôt parallèle `Andrebampoky/sama-Adresseback@6da1e49d` (`2026-10-20T01:35:27Z`, 109 fichiers, architecture de packages distincte `sn.samaadresse.address.domain.*`) explique exactement pourquoi `52` fichiers frontend ont dû être adaptés dans `b905b81e` pour s'aligner sur les DTOs/endpoints du backend de `Mahou-Dev/SamaAdresse` (`sn.samaadresse.domain.entity.*`).

---

## 2. Liste vérifiée des 52 fichiers adaptés lors de l'intégration backend

- **Configuration & outillage (4) :** `.env.example`, `package.json`, `vite.config.ts`, `docs/API.md`
- **Service Worker & Authentification (3) :** `public/sw.js`, `src/auth/AuthProvider.tsx`, `src/auth/authContext.ts`
- **Couche API, données & utilitaires (7) :** `src/lib/api.ts`, `src/lib/api.test.ts`, `src/lib/addressViews.ts`, `src/lib/drafts.ts`, `src/lib/labels.ts`, `src/lib/placeIcons.ts`, `src/hooks/useApiResource.ts`, `src/hooks/usePublicAddress.ts` *(8 fichiers)*
- **Routage & composants (13) :** `src/App.tsx`, `src/App.test.tsx`, `src/components/CodeLookup.tsx`, `src/components/OwnerManagePanel.tsx`, `src/components/OwnerPhotoPanel.tsx`, `src/components/PublicStates.tsx`, `src/components/ReportForm.tsx`, `src/components/RouteControls.tsx`, `src/components/StatusTimeline.tsx`, `src/components/layout/AdminLayout.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/map/AddressMap.tsx`, `src/components/map/BaseMap.tsx`
- **Pages & Administration (19) :** `HomePage.tsx`, `SearchPage.tsx`, `MapPage.tsx`, `PublicAddressPage.tsx`, `RegisterPage.tsx`, `DashboardPage.tsx`, `MyAddressesPage.tsx`, `NewAddressPage.tsx`, `MyAddressDetailPage.tsx`, `AccountPage.tsx`, `admin/AdminAddressesPage.tsx`, `admin/AdminDashboardPage.tsx`, `admin/AdminReportsPage.tsx`, `admin/AdminUsersPage.tsx`, `admin/adminData.ts`, `admin/charts.tsx`, `AccountFlow.test.tsx`, `CodeShareGeolocation.test.tsx`, `OwnerAndPublicActions.test.tsx`, `PublicAndAdmin.test.tsx` *(20 fichiers)*
- **Styles & Tests (4) :** `src/styles/admin.css`, `src/styles/app.css`, `src/styles/components.css`, `src/test/setup.ts`

*(Total : 4 + 3 + 8 + 13 + 20 + 4 = 52 fichiers exactement.)*

---

## 3. Faisabilité et comparaison des options (A1 vs A2 vs Statu quo)

### Option A1 — Scission logique en 2 commits distincts (Techniquement 100 % démontrable)
1. **Commit A1-1 (Import pur `sama-AdresseWeb`) :**
   - `Author:` `AndreBampoky <a.b255@zig.univ.sn>`
   - `AuthorDate:` `2026-10-20 01:39:17 +0000` *(date historique réelle de `4d47a411`)*
   - `Committer:` `Mahou-Dev <ndourmahoul2i@gmail.com>` *(date de normalisation)*
   - Contenu : exactement les `114` fichiers d'origine de `Andrebampoky/sama-AdresseWeb@4d47a411` placés dans `frontend/` (en conservant les `3` fichiers monorepo `scripts/check-size.mjs`, `src/data/geo-grid.json`, `test-results/.last-run.json`).
   - Message : `feat(frontend): import sama-AdresseWeb React 19 application`
2. **Commit A1-2 (Intégration au backend Spring Boot) :**
   - `Author:` `Mahou-Dev <ndourmahoul2i@gmail.com>`
   - `AuthorDate:` `2026-11-27 10:08:01 +0000` *(date réelle de `b905b81e`)*
   - `Committer:` `Mahou-Dev <ndourmahoul2i@gmail.com>`
   - Trailer : `Co-authored-by: AndreBampoky <a.b255@zig.univ.sn>`
   - Contenu : application exacte des modifications sur les `52` fichiers + ajout de `src/lib/geoGrid.ts` et `src/lib/geoGrid.test.ts`.
   - Message : `feat(frontend): connect sama-AdresseWeb to Spring Boot API and geo-grid`
   - **Propriété mathématique garantie :** l'arbre Git (`tree SHA`) du Commit A1-2 est **rigoureusement identique octet pour octet** à celui de `b905b81e` (`git diff b905b81e A1-2` = **0 octet**).

- **Avantages A1 :** séparation irréfutable et vérifiable devant un jury ; date historique authentique du 20 octobre préservée pour `Andrebampoky` ; distinction exacte entre la création du frontend et son raccordement au backend Spring Boot.
- **Inconvénient mineur A1 :** le commit intermédiaire A1-1 cible les endpoints de `sama-Adresseback` et ne passerait pas les tests E2E du monorepo avant A1-2 (il reste toutefois compilable en standalone `vite build`). Nécessite un `--force-with-lease` si appliqué sur `origin/main` (déclenchant un redéploiement CD Render).

### Option A2 — Commit unique co-attribué (Sans scission)
- Conserver `b905b81e` comme un seul commit atomique avec :
  - `Author: AndreBampoky <a.b255@zig.univ.sn>` (date `2026-11-27 10:08:01 +0000` ou `2026-10-20 01:39:17 +0000`)
  - Trailer : `Co-authored-by: Mahou-Dev <ndourmahoul2i@gmail.com>`
- **Avantage A2 :** chaque commit de l'historique reste 100 % intégré au monorepo.
- **Inconvénient A2 :** mélange visuellement les 62 fichiers originaux et les 52 adaptations d'intégration ; nécessite également un `--force-with-lease` si appliqué sur `origin/main`.

### Option Conservatrice — Ne pas réécrire `b905b81e` (Option B / Préservation absolue de `main`)
- Garder `b905b81e` tel quel sur `main` (zéro force push, zéro risque sur les PR #1/#2 et sur Render) et reconnaître formellement `Andrebampoky` via :
  1. Le présent dossier de preuve cryptographique SHA-1 (`62/117` blobs identiques + lien `https://github.com/Andrebampoky/sama-AdresseWeb`), et
  2. Une contribution directe d'`Andrebampoky` (revue de PR ou amélioration frontend ciblée) sur une branche `feature/` dédiée si souhaité.

---

## 4. Recommandation technique de l'équipe d'audit

- **Démonstrabilité technique de A1 :** **OUI, 100 % démontrable et reproductible cryptographiquement** (ce n'est pas une séparation arbitraire : les deux états exacts existent dans Git).
- **Recommandation conditionnelle :**
  - Si le responsable de projet valide explicitement la **réécriture contrôlée de l'historique (Stratégie A)** avec autorisation de `--force-with-lease` : retenir **Option A1** (scission en 2 commits rigoureusement prouvés par SHA-1, avec `backup/pre-git01` conservé).
  - Si le responsable de projet préfère **zéro réécriture de `main` en production** : conserver `b905b81e` intact, joindre cette preuve SHA-1 au rapport académique et faire intervenir `Andrebampoky` en revue/PR authentique sur `develop`.
