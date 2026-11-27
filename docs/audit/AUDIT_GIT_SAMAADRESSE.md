# 01 — AUDIT COMPLET DU DÉPÔT GIT SAMAADRESSE

- **Mission :** GIT-01 — Audit et normalisation du dépôt GitHub SamaAdresse (TEMPS 1 — Audit en lecture seule de l'historique)
- **Date de l'audit :** 27 novembre 2026 (UTC)
- **Référentiel académique :** *Rapport technique des projets et livrables* — Livrable 1 (Code source complet, branches `feature`, branche `develop`, branche `main`, historique de commits de chaque membre)

---

## 1. Présentation du dépôt et état initial de référence

### 1.1 Identité du dépôt local et distant

| Paramètre | Valeur constatée |
|---|---|
| **Chemin local** | `/home/mahou-dev/Documents/SamaAdresse` |
| **Remote `origin`** | `git@github.com:Mahou-Dev/SamaAdresse.git` |
| **URL GitHub** | `https://github.com/Mahou-Dev/SamaAdresse` |
| **Propriétaire GitHub** | `Mahou-Dev` (ID `324137805`) |
| **Visibilité** | Public (`private: false`) |
| **Branche par défaut GitHub** | `main` (`protected: false`) |
| **Date de création GitHub** | `2026-09-17T20:45:26Z` |
| **Dernier push GitHub** | `2026-11-27T19:14:36Z` (fusion PR #2 sur `main`) |
| **Branche locale active** | `fix/audit-remediation` (suit `origin/fix/audit-remediation`) |
| **SHA initial de `HEAD`** | `ad6e9f973e84b1ed12a41411dd85a02693b4ffd5` |
| **Nombre de commits locaux atteignables (`--all`)** | `54` commits (plus `1` commit de merge distant `9bccbe38` sur `origin/main` non encore récupéré localement = `55` au total sur GitHub) |
| **Tags existants** | `v1.0.0` (annoté `85b5a922` → `ddc8818e`), `v1.1.0` (léger `d2f7e046`) |
| **Configuration `.git/config` locale** | `user.name = SamaAdresse Developer`, `user.email = dev@samaadresse.sn` *(écrase `~/.gitconfig` : `mahou@Dev <mahoul2i2026@gmail.com>`)* |

### 1.2 Modifications locales non commitées (préservées intégralement)

Quatre fichiers préexistants présentent des modifications locales dans l'arbre de travail et n'ont été ni modifiés, ni indexés, ni supprimés :

| Fichier | Statut Git | Diff constaté |
|---|---|---|
| `docs/audit/VERIFY.md` | `M` (modifié non indexé) | `128` lignes modifiées |
| `docs/audit/newman.json` | `M` (modifié non indexé) | `614` lignes modifiées |
| `docs/audit/smoke-prod.md` | `M` (modifié non indexé) | `8` lignes modifiées |
| `frontend/test-results/.last-run.json` | `M` (modifié non indexé) | `8` lignes modifiées |

Aucun fichier applicatif (`backend/`, `frontend/src/`, migrations, configurations) n'est modifié.

---

## 2. Inventaire complet des références (branches locales, distantes et tags)

### 2.1 Comparaison local vs distant (`git show-ref` et `git ls-remote origin`)

| Branche / Référence | SHA local | SHA distant (`origin`) | Date du dernier commit | Écart vs `origin/main` en cache (`aaf8bf8`) | Écart vs `develop` (`09d35e0`) | État |
|---|---|---|---|---|---|---|
| **`main`** | `34450534` | **`9bccbe38`** *(cache local `origin/main` = `aaf8bf87`)* | Local `2026-11-26 23:58Z` / Distant `2026-11-27 19:14Z` | Local en retard de `9` commits sur `aaf8bf8` (et de `15` commits sur `9bccbe38` réel) | Local en avance de `24` ; distant réel en avance de `39` | **DÉSYNCHRONISÉE** (local en retard, PR #1 et PR #2 fusionnées sur GitHub) |
| **`develop`** | `09d35e02` | `09d35e02` | `2026-10-19 10:38Z` | En retard de `33` (`39` vs `9bccbe38`) | `0 / 0` | **OBSOLÈTE** (figée au lot 10) |
| `feature/lot8-deploiement` | `7be529c2` | `7be529c2` | `2026-10-17 19:33Z` | Ancêtre (`-38 / 0`) | Fusionnée (`-5 / 0`) | Fusionnée dans `develop` (`8b3e1e1`) et `main` (`ddc8818`) |
| `feature/palette` | `b9e3cb66` | `b9e3cb66` | `2026-10-17 21:35Z` | Ancêtre (`-36 / 0`) | Fusionnée (`-3 / 0`) | Fusionnée via `feature/lot8b-correctifs` (`b560b95`) |
| `feature/lot8b-correctifs` | `061682cc` | `061682cc` | `2026-10-18 09:49Z` | Ancêtre (`-35 / 0`) | Fusionnée (`-2 / 0`) | Fusionnée dans `develop` (`b560b95`) et `main` (`2361b14`) |
| `feature/lot10-finitions` | `09d35e02` | *(absente sur origin)* | `2026-10-19 10:38Z` | Ancêtre (`-33 / 0`) | Identique (`0 / 0`) | Locale uniquement (pointe au même SHA que `develop`) |
| `feature/lot11a-espaces` | `1e5686bb` | *(absente sur origin)* | `2026-10-19 12:20Z` | Ancêtre (`-32 / 0`) | En avance (`0 / +1`) | Locale uniquement ; ancêtre de `main` (`3445053`) |
| `feature/lot12-corrections` | `d2f7e046` | `d2f7e046` | `2026-10-20 09:54Z` | Ancêtre (`-29 / 0`) | En avance (`0 / +4`) | Taguée `v1.1.0` ; ancêtre de `main` (`3445053`) |
| `feature/p01-design-system` | `c9f88640` | *(absente sur origin)* | `2026-11-26 18:02Z` | Ancêtre (`-24 / 0`) | En avance (`0 / +9`) | Locale uniquement ; ancêtre de `p04` et `main` |
| `feature/p02-public-experience` | `0f8cec32` | *(absente sur origin)* | `2026-11-26 18:35Z` | Ancêtre (`-20 / 0`) | En avance (`0 / +13`) | Locale uniquement ; ancêtre de `p04` et `main` |
| `feature/p03-address-experience` | `0483bffb` | *(absente sur origin)* | `2026-11-26 19:51Z` | Ancêtre (`-16 / 0`) | En avance (`0 / +17`) | Locale uniquement ; ancêtre de `p04` et `main` |
| `feature/p04-connected-experience` | `36f7fe85` | `36f7fe85` | `2026-11-26 23:44Z` | Ancêtre (`-12 / 0`) | En avance (`0 / +21`) | Vérifié exact (`36f7fe85231735397fdb74588e955dd0b3360520`) ; fusionnée dans `main` (`3445053`) |
| `feature/frontend-migration` | `8fe7ce94` | `8fe7ce94` | `2026-11-27 12:09Z` | Ancêtre (`-4 / 0`) | En avance (`0 / +29`) | Fusionnée dans `main` via PR #1 (`aaf8bf8`) |
| `fix/audit-remediation` *(HEAD)* | `ad6e9f97` | `ad6e9f97` | `2026-11-27 14:49Z` | En avance de `5` sur `aaf8bf8` (déjà fusionnée sur `9bccbe38`) | En avance (`0 / +38`) | Fusionnée dans `main` via PR #2 (`9bccbe38`) à `19:14Z` |

> **Vérification de la référence historique communiquée :** la branche `feature/p04-connected-experience` existe bien localement et sur `origin` exactement au commit `36f7fe85231735397fdb74588e955dd0b3360520`. En revanche, les branches historiques P01–P03 se nomment réellement `feature/p01-design-system`, `feature/p02-public-experience` et `feature/p03-address-experience` (et non `p01-architecture-foundations` / `p02-security-rbac`). De plus, le projet a poursuivi son évolution après `36f7fe85` avec `feature/frontend-migration` (PR #1) et `fix/audit-remediation` (PR #2).

### 2.2 Tags et objets inatteignables (`git fsck`)

- **Tags :**
  - `v1.0.0` (tag annoté `85b5a922` pointant sur `ddc8818e`, `2026-10-17`) : *Lot 8 — SamaAdresse v1.0.0*.
  - `v1.1.0` (tag léger pointant sur `d2f7e046`, `2026-10-20`) : *11C: integration des images d'ambiance et optimisations webp*.
- **Commits inatteignables / dangling détectés dans `.git/objects` :** `4` commits (`c530e3a6`, `54d3c22b`, `af368723`, `e21606c6`), tous datés de `2026-10-20 09:54:51 +0000` avec le même message `11C: integration des images d'ambiance et optimisations webp` (probables révisions `git commit --amend` avant le commit final `d2f7e046`). Aucun travail unique perdu détecté.

---

## 3. Analyse de l'historique des commits et des identités

### 3.1 Répartition actuelle des auteurs et commiteurs

| Auteur Git (`%an <%ae>`) | Commits locaux (`54`) | Commits sur `origin/main` réel (`55`) | Statut GitHub |
|---|---:|---:|---|
| `SamaAdresse Developer <dev@samaadresse.sn>` | **53** (`98,1 %`) | **53** (`96,4 %`) | Non lié à un compte GitHub (`Anonymous` dans l'API) |
| `Mahou-Dev <ndourmahoul2i@gmail.com>` (Committer: `GitHub`) | **1** (`aaf8bf87`) | **2** (`aaf8bf87`, `9bccbe38`) | Lié au compte `@Mahou-Dev` (merges PR #1 et PR #2 via Web UI) |

### 3.2 Chronologie fonctionnelle des 55 commits

1. **Phase initiale — Socle backend & fonctionnalités cœur (`2026-09-17` au `2026-09-18`, 8 commits `03141908` → `400b1355`) :**
   - Squelette monorepo Spring Boot 3.4 / Java 21 / React PWA, entités `User`/`Address`, JWT dual-token + RBAC + Rate-Limiting, identité visuelle initiale, génération des codes-adresses + `geo-grid`, upload photo de façade et gestion `MaxUploadSizeExceededException`.
2. **Lots 5 à 12 — Déploiement, audit, sécurité, recette live & refontes (`2026-10-17` au `2026-10-20`, 14 commits `78323fac` → `d2f7e046`) :**
   - `78323fac` (*Modification du 16 oct*, 354 fichiers) : ajout massif des lots 5–7, UML, PWA, annuaire, modération, tests, audits.
   - `d9f516b4` → `ddc8818e` (`v1.0.0`) : déploiement Docker/Render, CI, audits, merge `feature/lot8-deploiement` → `develop` → `main`.
   - `b9e3cb66` → `2361b140` : Lot 9 palette Tailwind + Lot 8b correctifs (`061682cc`, *modif du 18oct*), merge `develop` → `main`.
   - `09d35e02` → `d2f7e046` (`v1.1.0`) : Lot 10 finitions (`develop` s'arrête ici), Lot 11A espaces personnels, Lot 12 corrections WCAG/offline/recette, 12C correctifs, 11C images d'ambiance.
3. **Programme de refonte UX/UI P01–P04 (`2026-11-26`, 18 commits `e9a7ff6b` → `34450534`) :**
   - Branches chaînées `feature/p01-design-system` (5 commits) → `feature/p02-public-experience` (4 commits) → `feature/p03-address-experience` (4 commits) → `feature/p04-connected-experience` (4 commits), puis merge direct `34450534` dans `main` (en contournant `develop`).
4. **Migration vers le nouveau frontend `sama-AdresseWeb` + CD (`2026-11-27 10:08Z–12:25Z`, 9 commits `b905b81e` → `aaf8bf87`) :**
   - `b905b81e` : remplacement intégral de `frontend/` par `samaadresse_frontend` (**provenant à `97,4 %` du dépôt `Andrebampoky/sama-AdresseWeb`**) connecté au backend Spring Boot.
   - `aeb54539` → `8fe7ce94` : ajout du workflow CD Render, correctifs CI/Docker/Playwright E2E, fusionnés via **PR #1** (`aaf8bf87`) directement dans `main`.
5. **Audit complet et plan de remédiation (`2026-11-27 13:30Z–19:14Z`, 6 commits `a953b160` → `9bccbe38`) :**
   - 8 rapports d'audit (`a953b160`), corrections backend (`3689f6c0`), frontend/CI (`be3e2cd9`), couverture JaCoCo branches `65,68 %` (`019bf5d8`), rapport post-remédiation (`ad6e9f97`), fusionnés via **PR #2** (`9bccbe38`) directement dans `main`.

---

## 4. Synthèse des anomalies identifiées

| # | Gravité | Anomalie constatée | Impact académique / GitHub |
|---|---|---|---|
| **A-01** | **CRITIQUE** | **53/55 commits sous identité générique `SamaAdresse Developer <dev@samaadresse.sn>`** (à cause de `.git/config` local). | Aucun contributeur attribué sur ces 53 commits ; GitHub `/graphs/contributors` échoue en HTTP 400 ; contributions individuelles invisibles pour le jury. |
| **A-02** | **CRITIQUE** | **Contribution avérée d'`Andrebampoky` (`sama-AdresseWeb`, 114/117 fichiers du `frontend/` actuel) non attribuée dans l'historique Git** (commit `b905b81e` attribué à `SamaAdresse Developer`). | Sous-représentation manifeste d'un membre ayant réalisé l'application frontend en production. |
| **A-03** | **ÉLEVÉE** | **Branche `develop` figée au `2026-10-19` (`09d35e02`) — 39 commits de retard sur `origin/main` (`9bccbe38`).** | Non-conformité au flux GitFlow attendu (`feature/*` → `develop` → `main`). |
| **A-04** | **ÉLEVÉE** | **Désynchronisation locale :** `main` local (`34450534`) en retard de `15` commits sur `origin/main` réel (`9bccbe38`), et `5` branches `feature/*` locales (`p01`, `p02`, `p03`, `lot10`, `lot11a`) jamais poussées sur `origin`. | Dépôt distant incomplet par rapport au travail local ; risque de confusion lors de la soutenance. |
| **A-05** | **MOYENNE** | **Absence totale de commits identifiables pour 3 collaborateurs ajoutés le `2026-11-27`** (`Gallatsar`, `deguenef87-ai`, `wague-freres-immo`). | Impossibilité d'attribuer des commits sans preuve (doit être clarifié en TEMPS 2 avec le responsable du projet). |
| **A-06** | **MOYENNE** | **Messages de commits non conventionnels / monolithiques** (`Modification du 16 oct`, `modif du 18oct`, commit racine vide `03141908`) et `0` revue de PR (PR #1 et #2 auto-fusionnées sans review). | Lisibilité réduite de l'historique lors d'un examen détaillé. |
| **A-07** | **FAIBLE** | **Aucune protection de branche** (`protected: false`) sur `main` et `develop` sur GitHub. | Risque d'écrasement accidentel sans règle de protection. |

---

## 5. Verdict initial (avant normalisation)

**VERDICT INITIAL : `NON CONFORME` (sur le critère d'historique collaboratif et de cohérence des branches)**

- **Code source complet :** Présent et fonctionnel (`CI 4/4` verte, déployé en production).
- **Branche `main` :** Présente, mais locale désynchronisée et non protégée.
- **Branche `develop` :** Présente, mais **obsolète de 39 commits** (non alignée avec `main`).
- **Branches `feature/*` :** Existantes, mais incomplètes sur `origin` (`p01`–`p03` locales uniquement).
- **Historique de commits de chaque membre :** **Non conforme** — 96,4 % des commits sont attribués au compte fictif `SamaAdresse Developer <dev@samaadresse.sn>` et aucune attribution individuelle (y compris la contribution prouvée d'`Andrebampoky`) n'apparaît dans l'historique GitHub.
