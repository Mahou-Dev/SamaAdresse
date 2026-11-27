# VALIDATION DE L'ÉQUIPE ET DES IDENTITÉS GITHUB — MISSION GIT-01 (TEMPS 2)

- **Dépôt :** `https://github.com/Mahou-Dev/SamaAdresse` (`public`)
- **Date de vérification :** 27 novembre 2026 (UTC)
- **Méthode :** Interrogation directe des endpoints publics de l'API REST GitHub (`/repos/Mahou-Dev/SamaAdresse`, `/events`, `/pulls`, `/contributors?anon=true`, `/users/{login}`, `/users/{login}/repos`, `/users/{login}/events/public`) complétée par un contrôle en lecture seule dans le navigateur interne.

---

## 1. État réel des cinq comptes GitHub de l'équipe

Les cinq comptes membres de l'équipe SamaAdresse ont tous été vérifiés sur GitHub :

| # | Username GitHub | ID GitHub | Nom public GitHub | Date création compte | Date d'ajout sur `SamaAdresse` | URL Profil | Statut compte |
|---|---|---|---|---|---|---|---|
| 1 | **`Mahou-Dev`** | `324137805` | *(non renseigné — affiche `Mahou-Dev`)* | `2026-09-02T16:29:05Z` | Propriétaire depuis `2026-09-17T20:45:26Z` | `https://github.com/Mahou-Dev` | **VÉRIFIÉ (Actif)** |
| 2 | **`Andrebampoky`** | `221836630` | **`AndreBampoky`** | `2025-07-20T11:34:09Z` | `2026-11-27T19:20:52Z` (`MemberEvent`) | `https://github.com/Andrebampoky` | **VÉRIFIÉ (Actif)** |
| 3 | **`Gallatsar`** | `166870001` | *(non renseigné)* | `2024-04-12T20:25:52Z` | `2026-11-27T10:36:03Z` (`MemberEvent`) | `https://github.com/Gallatsar` | **VÉRIFIÉ (Actif, 0 dépôt public)** |
| 4 | **`deguenef87-ai`** | `361915937` | *(non renseigné)* | `2026-11-27T10:26:16Z` | `2026-11-27T10:56:04Z` (`MemberEvent`) | `https://github.com/deguenef87-ai` | **VÉRIFIÉ (Nouveau compte, 0 dépôt public)** |
| 5 | **`wague-freres-immo`** | `321158247` | *(non renseigné)* | `2026-08-25T20:13:54Z` | `2026-11-27T14:22:13Z` (`MemberEvent`) | `https://github.com/wague-freres-immo` | **VÉRIFIÉ (Actif, 2 dépôts publics hors SamaAdresse)** |

> **Point de vigilance orthographique :** le nom d'utilisateur exact sur GitHub est **`deguenef87-ai`** (avec un **`e`** après le `u`, ID `361915937`), et non `degunef87-ai`. Toutes les commandes Git, branches (`feature/git01-deguenef87-api-docs`) et attributions doivent impérativement utiliser l'identifiant réel **`deguenef87-ai`**.

---

## 2. Situation exacte des permissions sur le dépôt GitHub

| Membre | Rôle constaté | Niveau de permission (`Admin` / `Write` / `Read`) | Vérification technique | Action requise avant les missions collaboratives |
|---|---|---|---|---|
| **`Mahou-Dev`** | Propriétaire (`Owner`) | **`Admin`** *(confirmé)* | Prouvé par `/repos/Mahou-Dev/SamaAdresse` (`owner.login`), fusions PR #1 (`aaf8bf8`) et PR #2 (`9bccbe38`). | Aucune. |
| **`Andrebampoky`** | Collaborateur accepté | **Non lisible sans authentification Admin** *(probablement `Write` par défaut GitHub)* | `/collaborators` retourne `HTTP 401` ; `/settings/access` retourne `HTTP 404` hors session Admin. | Vérifier dans **Settings → Collaborators** que la permission est **`Write`** (suffisant pour pousser une branche et ouvrir/relire des PR). |
| **`Gallatsar`** | Collaborateur accepté | **Non lisible sans authentification Admin** | Idem (`MemberEvent` confirmé le `2026-11-27T10:36:03Z`). | Vérifier permission **`Write`** dans **Settings → Collaborators** avant démarrage de `feature/git01-gallatsar-qa`. |
| **`deguenef87-ai`** | Collaborateur accepté | **Non lisible sans authentification Admin** | Idem (`MemberEvent` confirmé le `2026-11-27T10:56:04Z`). | Vérifier permission **`Write`** dans **Settings → Collaborators** avant démarrage de `feature/git01-deguenef87-api-docs`. |
| **`wague-freres-immo`** | Collaborateur accepté | **Non lisible sans authentification Admin** | Idem (`MemberEvent` confirmé le `2026-11-27T14:22:13Z`). | Vérifier permission **`Write`** dans **Settings → Collaborators** avant démarrage de `feature/git01-wague-user-guide`. |

### Limites d'accès assumées (aucun contournement)
- Sans jeton personnel authentifié (`gh auth`) ni session Admin active dans le navigateur interne, il est impossible de lire automatiquement :
  1. Le niveau exact de permission (`Read` / `Triage` / `Write` / `Maintain` / `Admin`) attribué à chacun des 4 collaborateurs dans `/settings/access`.
  2. La présence éventuelle d'invitations en attente non encore acceptées.
- **Contrôle manuel de 30 secondes demandé à `Mahou-Dev` :** ouvrir `https://github.com/Mahou-Dev/SamaAdresse/settings/access` et vérifier que les 4 collaborateurs disposent bien du rôle **`Write`** (pour pouvoir créer/pousser leurs branches `feature/git01-*` et ouvrir leurs Pull Requests sans devoir passer par un fork externe).

---

## 3. Traces d'activité publique GitHub liées à SamaAdresse

| Membre | Commits liés sur `SamaAdresse` | Pull Requests | Revues / Commentaires | Dépôts publics connexes vérifiés |
|---|---:|---:|---:|---|
| **`Mahou-Dev`** | `2` merges Web (`aaf8bf8`, `9bccbe38`) + `53` commits locaux non liés (`dev@samaadresse.sn`) | `2` ouvertes et fusionnées (#1, #2) | `0` review | `Mahou-Dev/SamaAdresse` |
| **`Andrebampoky`** | `0` commit direct sur `SamaAdresse` | `0` | `0` | **`Andrebampoky/sama-AdresseWeb`** (`4d47a411`, `2026-10-20`, **`97,4 %`** des chemins de `frontend/` et **`62/117`** blobs SHA-1 identiques octet pour octet) + `Andrebampoky/sama-Adresseback` (`6da1e49d`, prototype backend parallèle) |
| **`Gallatsar`** | `0` | `0` | `0` | Aucun dépôt public (`[]`) |
| **`deguenef87-ai`** | `0` | `0` | `0` | Aucun dépôt public (`[]`) |
| **`wague-freres-immo`** | `0` | `0` | `0` | `immosenegal`, `wague-immo` (sans lien avec SamaAdresse) |

---

## 4. Recommandation de gouvernance d'équipe pour la soutenance

1. **Compléter les profils GitHub publics (recommandé) :** inviter les 4 membres sans nom public affiché (`Mahou-Dev`, `Gallatsar`, `deguenef87-ai`, `wague-freres-immo`) à renseigner leur **Prénom Nom** dans *GitHub Settings → Public profile → Name* afin que le jury identifie immédiatement chaque étudiant sur les PR, commits et l'onglet Contributors.
2. **Garantir la permission `Write`** pour `Andrebampoky`, `Gallatsar`, `deguenef87-ai` et `wague-freres-immo` sur `Mahou-Dev/SamaAdresse`, tout en activant ultérieurement une règle de protection sur `main` (pour empêcher tout push direct non relu sur la production).
3. **Ne jamais committer au nom d'un autre membre :** chaque mission complémentaire (`Gallatsar`, `deguenef87-ai`, `wague-freres-immo`) doit être poussée et ouverte en Pull Request depuis le compte GitHub authentifié de son auteur réel.
