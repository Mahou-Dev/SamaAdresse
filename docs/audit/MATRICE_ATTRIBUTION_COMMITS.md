# MATRICE D'ATTRIBUTION DES 55 COMMITS EXISTANTS — MISSION GIT-01 (TEMPS 2)

- **Périmètre :** Intégralité des **54 commits locaux** + **1 commit de merge distant** (`9bccbe38`, PR #2 sur `origin/main`) = **55 commits**.
- **Règle absolue TEMPS 2 :** **Aucune réécriture n'est effectuée.** Ce document établit l'analyse factuelle commit par commit, avec classification stricte du niveau de confiance (**`CERTAINE`**, **`FORTEMENT ÉTAYÉE`**, **`À CONFIRMER`**, **`INCONNUE`**).
- **Rappel sur la Stratégie A :** La Stratégie A (réattribution contrôlée avec sauvegarde `backup/pre-git01`) reste retenue sur le principe, mais **suspendue** à une validation humaine explicite distincte en fin de TEMPS 2.

---

## 1. Synthèse statistique des 55 commits

| Catégorie d'attribution actuelle | Nb commits | Auteur réel analysé | Niveau de confiance |
|---|---:|---|---|
| Merges Web PR #1 (`aaf8bf87`) et PR #2 (`9bccbe38`) | **2** | **`Mahou-Dev`** (`ndourmahoul2i@gmail.com`) | **`CERTAINE`** |
| Commit d'import/intégration frontend (`b905b81e`) | **1** | **Collaboratif prouvé :** socle par **`Andrebampoky`** (`a.b255@zig.univ.sn`, `62/117` blobs SHA-1 identiques + `52` adaptés) + intégration Spring Boot par **`Mahou-Dev`** | **`CERTAINE`** *(provenance `Andrebampoky` prouvée par SHA-1)* |
| Commits backend, CI/CD, audits, remédiation et refontes P01–P04 / Lots 1–12 sous `dev@samaadresse.sn` | **52** | Poussés depuis le poste de **`Mahou-Dev`** (`/home/mahou-dev/Documents/SamaAdresse`) ; éventuelle part de travail hors-Git des autres membres non tracée dans les métadonnées Git | **`FORTEMENT ÉTAYÉE`** pour `Mahou-Dev` *(sous réserve de confirmation des éventuelles contributions hors-Git des 3 autres membres)* |
| **TOTAL** | **55** | — | — |

---

## 2. Inventaire exhaustif des 55 commits (ordre chronologique)

| # | SHA court | Date auteur (UTC) | Auteur actuel enregistré | Domaine / Fichiers principaux | Message original | Attribution analytique | Confiance | Action envisagée (si Stratégie A validée) |
|---:|---|---|---|---|---|---|---|---|
| 01 | `03141908` | `2026-09-17 11:18` | `SamaAdresse Developer <dev@samaadresse.sn>` | Commit racine vide (`0` fichier) | `chore: initial monorepo skeleton setup for backend, frontend and docs` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` (date conservée) |
| 02 | `4717c156` | `2026-09-17 11:24` | `SamaAdresse Developer <dev@samaadresse.sn>` | Socle backend/frontend (`3` f.) | `feat: complete monorepo skeleton setup with Temurin Java 21, Spring Boot 3.4, React PWA, Tailwind CSS, and healthcheck endpoint` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 03 | `1e2375db` | `2026-09-17 11:39` | `SamaAdresse Developer <dev@samaadresse.sn>` | Auth JWT/RBAC + UI (`36` f.) | `feat(auth): complete Phase 2 User & Address entities, JWT dual-token (SHA-256 refresh hash), RBAC, Rate-Limiting, and React Auth UI (Dark Glassmorphism)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 04 | `ee553198` | `2026-09-17 12:05` | `SamaAdresse Developer <dev@samaadresse.sn>` | Identité visuelle initiale + profil PG (`8` f.) | `feat(ui): implement 'Terre & Enseigne de Ziguinchor' visual identity redesign and dev PostgreSQL profile` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 05 | `e62a3f51` | `2026-09-17 12:20` | `SamaAdresse Developer <dev@samaadresse.sn>` | Génération codes + geo-grid (`24` f.) | `feat(address): implement address code generation algorithm, geo grid resolution, REST endpoints, and frontend UI` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 06 | `72deef3c` | `2026-09-17 12:36` | `SamaAdresse Developer <dev@samaadresse.sn>` | Geo-grid overlaps (`2` f.) | `fix(geo): resolve bounding box overlaps deterministically by choosing the closest neighborhood center` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 07 | `ea8c5d58` | `2026-09-17 16:24` | `SamaAdresse Developer <dev@samaadresse.sn>` | Upload photo façade (`19` f.) | `feat: phase 4 - facade photo upload and integration into public address details` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 08 | `400b1355` | `2026-09-18 15:03` | `SamaAdresse Developer <dev@samaadresse.sn>` | Limite upload 5 Mo (`3` f.) | `fix: handle MaxUploadSizeExceededException with HTTP 400 Bad Request and configure tomcat max-swallow-size` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 09 | `78323fac` | `2026-10-17 00:11` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lots 5–7, UML, PWA, annuaire, audits (`354` f.) | `Modification du 16 oct` *(message vague)* | `Mahou-Dev` *(vérifier si UML/tests produits hors-Git par un autre membre)* | `FORTEMENT ÉTAYÉE` / `À CONFIRMER` | Réattribuer `Author` → `Mahou-Dev` (conserver intact, ne pas fabriquer de co-auteurs sans preuve) |
| 10 | `d9f516b4` | `2026-10-17 19:32` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 8 Docker/Render/CI/audits (`274` f.) | `feat(lot8): deploiement production, audit complet et solde des lots 6 et 7` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 11 | `7be529c2` | `2026-10-17 19:33` | `SamaAdresse Developer <dev@samaadresse.sn>` | Rapports audit (`4` f.) | `docs(audit): synchronisation finale des rapports et empreintes de verification` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 12 | `8b3e1e1a` | `2026-10-17 19:37` | `SamaAdresse Developer <dev@samaadresse.sn>` | Merge `lot8` → `develop` | `Merge branch 'feature/lot8-deploiement' into develop` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 13 | `ddc8818e` | `2026-10-17 19:37` | `SamaAdresse Developer <dev@samaadresse.sn>` | Merge `develop` → `main` (`v1.0.0`) | `Merge branch 'develop' into main` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 14 | `b9e3cb66` | `2026-10-17 21:35` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 9 palette Tailwind (`32` f.) | `feat(palette): Lot 9 - Palette plus forte et jetons de design Tailwind` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 15 | `061682cc` | `2026-10-18 09:49` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 8b correctifs & audits (`121` f.) | `modif du 18oct` *(message vague)* | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 16 | `b560b953` | `2026-10-18 10:28` | `SamaAdresse Developer <dev@samaadresse.sn>` | Merge `lot8b` → `develop` | `Merge feature/lot8b-correctifs into develop (lots 8b + 9)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 17 | `2361b140` | `2026-10-18 10:28` | `SamaAdresse Developer <dev@samaadresse.sn>` | Merge `develop` → `main` | `Merge develop into main (lots 8b + 9)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 18 | `09d35e02` | `2026-10-19 10:38` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 10 recette live & `docs/DEMO.md` (`144` f.) | `feat(lot10): finitions avant soutenance et recette live Render` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 19 | `1e5686bb` | `2026-10-19 12:20` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 11A espaces perso/admin (`113` f.) | `feat(lot11a): refonte des espaces personnels proprietaire et admin` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 20 | `d0a455b4` | `2026-10-20 00:23` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 12 WCAG/offline/recette (`122` f.) | `feat(lot12): corrections avant fusion, contrastes WCAG, libelles honnetes, captures liste/grille, mode hors ligne et points A-I recette live` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 21 | `e66c0292` | `2026-10-20 09:38` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 12C correctifs (`164` f.) | `12c: corrections du lot 12b (recherche apostrophe, lighthouse connecte, erreurs http, csv, purge, critere 4)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 22 | `d2f7e046` | `2026-10-20 09:54` | `SamaAdresse Developer <dev@samaadresse.sn>` | Lot 11C images d'ambiance (`108` f., `v1.1.0`) | `11C: integration des images d'ambiance et optimisations webp` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 23–27 | `e9a7ff6b` → `c9f88640` (`5` commits) | `2026-11-26 17:41–18:02` | `SamaAdresse Developer <dev@samaadresse.sn>` | Programme refonte P01 Design System (`frontend/`, `docs/refonte/`) | `p01(tokens)` → `p01(close)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 28–31 | `460718a2` → `0f8cec32` (`4` commits) | `2026-11-26 18:34–18:35` | `SamaAdresse Developer <dev@samaadresse.sn>` | Programme refonte P02 Public (`frontend/`, `docs/refonte/`) | `p02: socle Clarté` → `p02: tests/rapports` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 32–35 | `6cef84f4` → `0483bffb` (`4` commits) | `2026-11-26 19:51` | `SamaAdresse Developer <dev@samaadresse.sn>` | Programme refonte P03 Adresses (`frontend/`, `docs/refonte/`) | `p03: composants` → `p03: tests/rapports` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 36–39 | `f85f8c3b` → `36f7fe85` (`4` commits) | `2026-11-26 23:44` | `SamaAdresse Developer <dev@samaadresse.sn>` | Programme refonte P04 Espace connecté (`frontend/`, `docs/refonte/`) | `p04: harmonisation` → `p04: tests/rapports` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 40 | `34450534` | `2026-11-26 23:58` | `SamaAdresse Developer <dev@samaadresse.sn>` | Merge `feature/p04-connected-experience` → `main` | `Merge branch 'feature/p04-connected-experience' into main (lots 10-12 + refonte P01-P04)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| **41** | **`b905b81e`** | **`2026-11-27 10:08`** | `SamaAdresse Developer <dev@samaadresse.sn>` | **Remplacement complet `frontend/` (`307` f., `0` fichier hors `frontend/`)** | **`feat(frontend): remplace le frontend par samaadresse_frontend connecté au backend Spring Boot`** | **Socle `sama-AdresseWeb` : `Andrebampoky` (`CERTAINE`) + Intégration Spring Boot : `Mahou-Dev` (`CERTAINE`)** | **`CERTAINE`** | **Voir étude dédiée `ETUDE_SCISSION_A1_B905B81E.md` (Option A1 scission 2 commits ou Option A2 co-authored)** |
| 42–48 | `aeb54539` → `8fe7ce94` (`7` commits) | `2026-11-27 10:28–12:09` | `SamaAdresse Developer <dev@samaadresse.sn>` | CD Render, CI, Dockerfile Maven, Playwright E2E, fix focus wizard | `ci(cd): ...` → `fix(frontend): évite que le focus rAF...` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| **49** | **`aaf8bf87`** | **`2026-11-27 12:25`** | **`Mahou-Dev <ndourmahoul2i@gmail.com>`** *(Committer: `GitHub`)* | Merge PR #1 (`feature/frontend-migration` → `main`) | `Merge pull request #1 from Mahou-Dev/feature/frontend-migration` | **`Mahou-Dev`** | **`CERTAINE`** | **Conserver intact** (déjà correctement attribué) |
| 50 | `a953b160` | `2026-11-27 13:30` | `SamaAdresse Developer <dev@samaadresse.sn>` | 8 rapports d'audit complet (`docs/audit/`) | `docs(audit): ajoute les 8 rapports de l'audit technique et fonctionnel complet` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 51 | `3689f6c0` | `2026-11-27 14:32` | `SamaAdresse Developer <dev@samaadresse.sn>` | Remédiation backend + OpenAPI + `smoke-prod.sh` (`27` f.) | `fix(backend): remédiation audit sécurité, SIG, API admin/compte et couverture JaCoCo >= 60%` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 52 | `be3e2cd9` | `2026-11-27 14:32` | `SamaAdresse Developer <dev@samaadresse.sn>` | Remédiation frontend + CI `npm audit` (`25` f.) | `fix(frontend,ci): remédiation audit sécurité, WCAG AA, perf N+1, PWA, compte/admin et tests` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 53 | `019bf5d8` | `2026-11-27 14:42` | `SamaAdresse Developer <dev@samaadresse.sn>` | Tests couverture branches backend (`1` f.) | `test(backend): porte la couverture JaCoCo branches à 65,68% (lignes 82,21%, 154 tests)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| 54 | `ad6e9f97` | `2026-11-27 14:49` | `SamaAdresse Developer <dev@samaadresse.sn>` | Rapport post-remédiation (`docs/audit/`) | `docs(audit): ajoute le rapport post-remédiation et de non-régression (93,00/100, CI verte)` | `Mahou-Dev` | `FORTEMENT ÉTAYÉE` | Réattribuer `Author` → `Mahou-Dev` |
| **55** | **`9bccbe38`** | **`2026-11-27 19:14`** | **`Mahou-Dev <ndourmahoul2i@gmail.com>`** *(Committer: `GitHub`)* | Merge PR #2 (`fix/audit-remediation` → `main`, déployé CD #2) | `Merge pull request #2 from Mahou-Dev/fix/audit-remediation` | **`Mahou-Dev`** | **`CERTAINE`** | **Conserver intact** (déjà correctement attribué) |

---

## 3. Règle stricte sur les trois autres membres (`Gallatsar`, `deguenef87-ai`, `wague-freres-immo`)

- **Aucun des 55 commits existants** ne contient de trace technique directe (auteur, e-mail, message, référence externe ou dépôt source) reliant un commit passé à `Gallatsar`, `deguenef87-ai` ou `wague-freres-immo`.
- Conformément aux règles absolues de TEMPS 2 :
  - **Aucun ancien commit ne leur est réattribué artificiellement** ;
  - **Aucun co-auteur n'est inventé** ;
  - Leurs contributions passées hors-Git sont reconnues honnêtement dans la matrice globale (`MATRICE_CONTRIBUTIONS_CINQ_MEMBRES.md`) et leurs contributions GitHub vérifiables seront produites de manière authentique via les **3 missions complémentaires réelles** (`PLAN_MISSIONS_COLLABORATIVES.md`).
