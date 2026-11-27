# 02 — COLLABORATEURS GITHUB ET ACCESSIBILITÉ DES DONNÉES

- **Dépôt examiné :** `https://github.com/Mahou-Dev/SamaAdresse` (`public`)
- **Date d'interrogation :** 27 novembre 2026 (UTC)
- **Sources officielles consultées :**
  1. API REST GitHub publique (`/repos/Mahou-Dev/SamaAdresse`, `/events`, `/contributors?anon=true`, `/pulls?state=all`, `/branches`, `/users/{login}`, `/repos/{login}/{repo}/commits`).
  2. Inspection en lecture seule via navigateur interne sur `github.com/Mahou-Dev/SamaAdresse` (`/settings/access`, `/graphs/contributors`, `/branches`, `/pulls`).

---

## 1. Limites d'accès constatées (transparence obligatoire)

Conformément aux règles de sécurité et de confidentialité GitHub (aucun contournement effectué) :

1. **Endpoint `/repos/Mahou-Dev/SamaAdresse/collaborators` :** retourne **`HTTP 401 Requires authentication`** sans jeton personnel GitHub (`gh` CLI non installé sur la machine locale).
2. **Page `https://github.com/Mahou-Dev/SamaAdresse/settings/access` :** retourne **`HTTP 404 Page not found`** dans le navigateur interne en session non authentifiée Admin (le navigateur interne n'était plus connecté à GitHub après le redémarrage du serveur).
3. **Conséquence sur la visibilité :**
   - Les **5 comptes** listés ci-dessous ont été récupérés **automatiquement** depuis les métadonnées publiques officielles du dépôt (`owner` + événements `MemberEvent` de `/repos/Mahou-Dev/SamaAdresse/events`).
   - Les **permissions exactes** (`Admin`, `Write`, `Read`) des 4 collaborateurs invités ne sont **pas exposées publiquement** par GitHub ; seule la qualité de **Propriétaire (`Owner` / `Admin`)** de `Mahou-Dev` est formellement vérifiable sans authentification.
   - Si d'autres collaborateurs ont été invités **en attente d'acceptation** (invitation non encore acceptée) ou ajoutés **hors de la fenêtre des événements publics**, ils ne peuvent apparaître qu'une fois authentifié en Admin sur `/settings/access`.
4. **Graphique `/graphs/contributors` :** retourne **`HTTP 400`** (*« We need at least one non-empty commit with an email to generate this graph »*) à cause des 53 commits attribués à l'adresse générique non liée `dev@samaadresse.sn`.

---

## 2. Matrice des collaborateurs identifiés depuis GitHub

| Nom public | Username GitHub | ID GitHub | Permission | Date d'ajout / rôle sur le dépôt | Contributions identifiées | Preuves |
|---|---|---|---|---|---|---|
| *(non renseigné — `Mahou-Dev`)* | **`Mahou-Dev`** | `324137805` | **Owner / Admin** *(vérifié)* | Propriétaire depuis la création (`2026-09-17T20:45:26Z`) | Création du dépôt, tous les `PushEvent` recensés, ouverture et fusion des PR #1 (`aaf8bf8`) et PR #2 (`9bccbe38`), développement et intégration backend/CI/CD/audits/refontes depuis le poste local `/home/mahou-dev/Documents/SamaAdresse`. | API `/repos/Mahou-Dev/SamaAdresse` (`owner`), `/pulls/1`, `/pulls/2`, `/events`, merge commits `aaf8bf8` & `9bccbe38` (`ndourmahoul2i@gmail.com`). |
| **`AndreBampoky`** | **`Andrebampoky`** | `221836630` | **Collaborateur** *(niveau exact Write/Admin/Read à confirmer sur `/settings/access`)* | Ajouté via `MemberEvent` le `2026-11-27T19:20:52Z` | **Auteur de la base complète du frontend actuel (`sama-AdresseWeb`)** importée dans le commit `b905b81e` (`114 / 117` fichiers soit `97,4 %` de correspondance exacte de chemins) + prototype backend indépendant `sama-Adresseback`. **0 commit direct** encore attribué sur `Mahou-Dev/SamaAdresse`. | `MemberEvent` (`2026-11-27T19:20:52Z`), dépôt public `https://github.com/Andrebampoky/sama-AdresseWeb` (commit `4d47a411` du `2026-10-20T01:39:17Z` par `AndreBampoky <a.b255@zig.univ.sn>`), mention explicite `sama-AdresseWeb.git` dans `frontend/docs/PROGRESS.md` ligne 5 et `"name": "sama-adresseweb"` dans `frontend/package.json`. |
| *(non renseigné)* | **`Gallatsar`** | `166870001` | **Collaborateur** *(niveau exact à confirmer sur `/settings/access`)* | Ajouté via `MemberEvent` le `2026-11-27T10:36:03Z` | **Aucune contribution démontrable sur GitHub** (`0` commit, `0` PR, `0` review, `0` fork, `0` dépôt public). | `MemberEvent` (`2026-11-27T10:36:03Z`), `/users/Gallatsar` (créé le `2024-04-12T20:25:52Z`), `/users/Gallatsar/repos` (`[]`). |
| *(non renseigné)* | **`deguenef87-ai`** | `361915937` | **Collaborateur** *(niveau exact à confirmer sur `/settings/access`)* | Ajouté via `MemberEvent` le `2026-11-27T10:56:04Z` *(compte créé 30 min avant, à `10:26:16Z`)* | **Aucune contribution démontrable sur GitHub** (`0` commit, `0` PR, `0` review, `0` fork, `0` dépôt public). | `MemberEvent` (`2026-11-27T10:56:04Z`), `/users/deguenef87-ai` (créé le `2026-11-27T10:26:16Z`), `/users/deguenef87-ai/repos` (`[]`). |
| *(non renseigné)* | **`wague-freres-immo`** | `321158247` | **Collaborateur** *(niveau exact à confirmer sur `/settings/access`)* | Ajouté via `MemberEvent` le `2026-11-27T14:22:13Z` | **Aucune contribution démontrable sur GitHub** pour SamaAdresse (`0` commit, `0` PR, `0` review, `0` fork ; dépôts publics `immosenegal` et `wague-immo` sans lien avec SamaAdresse). | `MemberEvent` (`2026-11-27T14:22:13Z`), `/users/wague-freres-immo` (créé le `2026-08-25T20:13:54Z`), commits publics sur `wague-immo` (`khady05.sall@gmail.com`). |

---

## 3. Identités Git disponibles (vérifiées sur sources publiques, aucune adresse inventée)

| Username GitHub | Nom Git observé | E-mail associé vérifié | Source de l'e-mail | Statut pour attribution Git |
|---|---|---|---|---|
| **`Mahou-Dev`** | `Mahou-Dev` (ou `mahou@Dev` local) | `ndourmahoul2i@gmail.com` *(prouvé lié au compte GitHub)* ; `mahoul2i2026@gmail.com` *(config locale `~/.gitconfig`)* | Merge commits GitHub `aaf8bf87` et `9bccbe38` (`author.login = Mahou-Dev`) | **Vérifié et lié au compte GitHub** (`ndourmahoul2i@gmail.com` recommandé pour liaison automatique sur GitHub) |
| **`Andrebampoky`** | `AndreBampoky` | `a.b255@zig.univ.sn` | Commits publics `4d47a411` (`sama-AdresseWeb`) et `6da1e49d` (`sama-Adresseback`), où GitHub lie automatiquement `author.login = Andrebampoky` | **Vérifié et lié au compte GitHub** |
| **`wague-freres-immo`** | `wague-freres-immo` | `khady05.sall@gmail.com` | Commits publics `2fbeac28` (`immosenegal`) et `c172f600` (`wague-immo`), où GitHub lie `author.login = wague-freres-immo` | **E-mail vérifié**, mais nom civil complet et éventuelles contributions réelles à confirmer en TEMPS 2 |
| **`Gallatsar`** | *(inconnu publiquement)* | *(inaccessible publiquement — `email: null`, `0` dépôt public)* | API `/users/Gallatsar` | **À confirmer en TEMPS 2** si des commits doivent lui être attribués (sinon documentation hors commits) |
| **`deguenef87-ai`** | *(inconnu publiquement)* | *(inaccessible publiquement — `email: null`, `0` dépôt public)* | API `/users/deguenef87-ai` | **À confirmer en TEMPS 2** si des commits doivent lui être attribués (sinon documentation hors commits) |

> **Point de vigilance important :** La présence d'un utilisateur comme collaborateur GitHub (notamment ajouté le `2026-11-27`) **ne constitue pas en soi une preuve de contribution au code**. Conformément aux règles de la mission, aucun commit ne sera attribué artificiellement à `Gallatsar`, `deguenef87-ai` ou `wague-freres-immo` sans preuve et confirmation explicite du responsable de projet en TEMPS 2.

---

## 4. Activité sur les Pull Requests et revues GitHub

| PR | Titre | Auteur | Base ← Head | Statut | Créée le | Fusionnée le | Merge SHA | Revues / Commentaires |
|---|---|---|---|---|---|---|---|---|
| **#1** | `Feature/frontend migration` | `Mahou-Dev` | `main` ← `feature/frontend-migration` | `merged` | `2026-11-27T12:18:25Z` | `2026-11-27T12:25:51Z` | `aaf8bf87` | `0` review, `0` commentaire |
| **#2** | `Fix/audit remediation` | `Mahou-Dev` | `main` ← `fix/audit-remediation` | `merged` | `2026-11-27T19:14:15Z` | `2026-11-27T19:14:36Z` | `9bccbe38` | `0` review, `0` commentaire |

Aucune autre Pull Request (ouverte ou fermée), aucune Issue, aucun fork (`[]`) et aucun commentaire de revue n'existent sur le dépôt.
