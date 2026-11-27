# DÉCISIONS RESTANTES ET COMMANDES PRÉVUES — MISSION GIT-01 (FIN TEMPS 2)

- **Statut :** **PAUSE OBLIGATOIRE DE VALIDATION HUMAINE.**
- Conformément aux instructions de TEMPS 2 : aucune réécriture d'historique, aucune création/fusion de PR, aucun push et aucun redéploiement n'ont été réalisés.

---

## 1. Liste explicite des décisions nécessitant une validation humaine

| ID | Décision à valider | Options | Impact | Validation requise de |
|---|---|---|---|---|
| **D-01** | **Permissions GitHub des 4 collaborateurs** (`Andrebampoky`, `Gallatsar`, `deguenef87-ai`, `wague-freres-immo`) | Vérifier sur `https://github.com/Mahou-Dev/SamaAdresse/settings/access` que les 4 comptes ont la permission **`Write`** (et qu'aucune invitation n'est en attente). | Indispensable pour qu'ils poussent leurs branches `feature/git01-*` et ouvrent leurs PR directement. | `Mahou-Dev` *(Owner)* |
| **D-02** | **Synchronisation non destructive de `develop` et des 5 branches `feature/*` locales** | Autoriser `git fetch origin`, l'alignement fast-forward de `develop` sur `origin/main` (`9bccbe38`), et le push des 5 branches locales historiques (`feature/p01-design-system`, `p02`, `p03`, `lot11a`, `lot10`) — **sans aucun force-push et sans toucher `origin/main`**. | Rétablit un GitFlow sain et fournit une base propre `develop` pour les 3 missions collaboratives, avec **0 impact sur Render**. | `Mahou-Dev` |
| **D-03** | **Lancement des 3 missions collaboratives réelles** (`feature/git01-gallatsar-qa`, `feature/git01-deguenef87-api-docs`, `feature/git01-wague-user-guide`) | Valider le plan `PLAN_MISSIONS_COLLABORATIVES.md` et décider si `Mahou-Dev` pré-crée les 3 branches vides depuis `develop` sur `origin` (ou si chaque membre crée sa propre branche en local depuis `develop`). | Garantit que chaque membre commit avec son propre compte GitHub authentifié vers `develop`. | `Mahou-Dev` + les 3 membres |
| **D-04** | **Validation des contributions historiques passées des 3 membres** | Confirmer par écrit (ou par compte rendu d'équipe) quelles tâches passées hors-Git (ex. spécifications, maquettes, tests manuels, documentation, recettes) ont été réalisées par `Gallatsar`, `deguenef87-ai` et `wague-freres-immo`, pour les inscrire au niveau **`FORTEMENT ÉTAYÉE`** dans `MATRICE_CONTRIBUTIONS_CINQ_MEMBRES.md` (sans fabriquer de commits). | Assure une transparence complète devant le jury universitaire. | `Mahou-Dev` + équipe |
| **D-05** | **Activation (ou report) de la Stratégie A — Réécriture contrôlée des 53 commits `dev@samaadresse.sn`** | **Choix 1 :** Exécuter la Stratégie A (avec sauvegarde `backup/pre-git01` + bundle) pour réattribuer les 52 commits à `Mahou-Dev <ndourmahoul2i@gmail.com>` et `b905b81e` à `AndreBampoky <a.b255@zig.univ.sn>` + `Mahou-Dev`.<br>**Choix 2 :** Reporter ou abandonner la réécriture historique et s'appuyer uniquement sur les nouvelles PR réelles + le dossier de preuve SHA-1. | Le Choix 1 répare GitHub `/graphs/contributors` (actuellement HTTP 400), mais modifie les SHA historiques et exige un `--force-with-lease` autorisé séparément. | `Mahou-Dev` + accord `Andrebampoky` |
| **D-06** | **Si Stratégie A validée : choix A1 vs A2 sur le commit `b905b81e`** | **Option A1 (recommandée) :** scission cryptographiquement exacte en 2 commits (`2026-10-20` import `sama-AdresseWeb` par `Andrebampoky` + `2026-11-27` intégration Spring Boot par `Mahou-Dev`).<br>**Option A2 :** commit unique `Author: AndreBampoky` + `Co-authored-by: Mahou-Dev`. | Voir `ETUDE_SCISSION_A1_B905B81E.md`. Arbre final 100 % identique dans les deux cas. | `Mahou-Dev` + `Andrebampoky` |
| **D-07** | **Autorisation explicite distincte pour tout `--force-with-lease` sur `origin`** | **Requise séparément** après vérification locale complète (`git diff backup/pre-git01..main` vide + tests verts), uniquement si D-05 = Choix 1. | Déclenchera un redéploiement CD Render sur `main` (même code, zéro changement fonctionnel). | `Mahou-Dev` |
| **D-08** | **Gestion des 4 fichiers locaux préexistants et des rapports `docs/audit/` de TEMPS 1 & 2** | Confirmer que les 4 fichiers locaux (`VERIFY.md`, `newman.json`, `smoke-prod.md`, `.last-run.json`) restent exclus des commits et valider la branche sur laquelle committer les documents d'audit GIT-01 (ex. branche dédiée `docs/git01-audit-plan` → `develop`). | Protège l'arbre de travail local avant tout `git checkout`. | `Mahou-Dev` |

---

## 2. Commandes exactes prévues pour la phase suivante (NON EXÉCUTÉES)

### Phase 3A — Sauvegarde obligatoire et préparation non destructive (après validation D-01, D-02, D-03, D-08)

> **Aucun force-push, aucune réécriture d'historique, aucun redéploiement Render.**

```bash
# 1. Sauvegarde complète vérifiable (hors dépôt applicatif) + récupération lecture de origin/main (9bccbe38)
git fetch origin
git bundle create /tmp/samaadresse-backup-pre-git01.bundle --all
git bundle verify /tmp/samaadresse-backup-pre-git01.bundle

# 2. Création du tag d'archive immuable sur l'état exact actuel de origin/main (9bccbe38)
git tag -a backup/pre-git01 origin/main -m "Sauvegarde intégrale pré-normalisation GIT-01 (9bccbe38)"

# 3. Correction de l'identité locale générique dans .git/config (pour les futurs commits de Mahou-Dev)
git config --local user.name "Mahou-Dev"
git config --local user.email "ndourmahoul2i@gmail.com"

# 4. Alignement fast-forward de main local et de develop sur origin/main (9bccbe38) sans toucher à l'arbre de travail
git branch -f main origin/main
git branch -f develop origin/main

# 5. Publication non destructive sur origin (develop + 5 branches feature historiques locales + tag backup)
#    (NE déclenche PAS cd.yml ni Render auto-deploy car main n'est pas poussée)
git push origin develop
git push origin feature/p01-design-system feature/p02-public-experience feature/p03-address-experience feature/lot11a-espaces feature/lot10-finitions
git push origin backup/pre-git01

# 6. (Optionnel selon D-03) Pré-création des 3 branches de missions collaboratives depuis develop (9bccbe38)
git branch feature/git01-gallatsar-qa develop
git branch feature/git01-deguenef87-api-docs develop
git branch feature/git01-wague-user-guide develop
git push -u origin feature/git01-gallatsar-qa feature/git01-deguenef87-api-docs feature/git01-wague-user-guide
```

### Phase 3B — Réécriture contrôlée Stratégie A (UNIQUEMENT si D-05, D-06 et D-07 sont explicitement autorisés)

> **EXÉCUTION STRICTEMENT INTERDITE SANS AUTORISATION EXPLICITE SÉPARÉE.**
> Travail préalable dans un clone temporaire isolé `/tmp/samaadresse-rewrite-sandbox` (jamais directement sur le dépôt principal tant que la vérification bit-à-bit n'est pas validée) :

```bash
# 1. Clone isolé depuis le bundle de sauvegarde
git clone /tmp/samaadresse-backup-pre-git01.bundle /tmp/samaadresse-rewrite-sandbox
cd /tmp/samaadresse-rewrite-sandbox

# 2. Réattribution contrôlée des auteurs (dates auteur originales préservées, CommitterDate = date de normalisation)
#    - 52 commits dev@samaadresse.sn -> Author: Mahou-Dev <ndourmahoul2i@gmail.com>
#    - Commit b905b81e -> Option A1 (2 commits: AndreBampoky 2026-10-20 + Mahou-Dev 2026-11-27) ou Option A2
#    (via git-filter-repo ou script Python/git-fast-export vérifié)

# 3. Contrôles d'intégrité obligatoires AVANT toute synchronisation distante
git diff backup/pre-git01..main --stat   # DOIT ÊTRE STRICTEMENT VIDE (0 octet de différence)
git fsck --strict
git shortlog -sne --all

# 4. Génération de docs/audit/CORRESPONDANCE_COMMITS.md et docs/audit/RAPPORT_FINAL_CONFORMITE_GIT.md

# 5. Publication contrôlée (UNIQUEMENT après nouvelle confirmation humaine explicite) :
#    git push --force-with-lease origin main develop feature/...
```

> **Recommandation d'ordre d'exécution :** si la Stratégie A est retenue (D-05), il est **préférable de l'exécuter AVANT** que les 3 membres ne créent leurs commits sur `feature/git01-*` (afin que leurs nouvelles branches partent directement de la nouvelle base `develop` sans avoir à rebaser). Sinon, lancer immédiatement la **Phase 3A** (sans réécriture) et conserver l'historique existant intact.
