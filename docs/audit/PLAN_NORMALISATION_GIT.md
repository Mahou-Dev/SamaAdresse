# 04 — PLAN DE NORMALISATION DU DÉPÔT GIT SAMAADRESSE

- **Statut :** **PROPOSITION EN ATTENTE DE VALIDATION HUMAINE (TEMPS 2)**
- **Avertissement :** Conformément aux règles de la mission GIT-01, **aucune réécriture d'historique, aucune modification de branche et aucun push n'ont été exécutés** à ce stade.

---

## 1. Objectifs de la normalisation

Mettre le dépôt `Mahou-Dev/SamaAdresse` en pleine conformité avec le livrable académique 1 (*code source complet, branches `feature/*`, branche `develop`, branche `main`, historique de commits attribué aux vrais membres*) tout en garantissant :

1. **Intégrité bit-à-bit du code source final** (`git diff` strictement vide entre l'arbre actuel de `origin/main` `9bccbe38` et l'arbre final après normalisation ; aucune modification du code applicatif, des migrations, ni des 4 fichiers locaux préexistants).
2. **Traçabilité intégrale de l'ancien historique** grâce à une sauvegarde vérifiable (`git bundle` + branche/tag d'archive `archive/pre-git01-main`) et à une table complète de correspondance `Ancien SHA ↔ Nouveau SHA`.
3. **Authenticité stricte des attributions** : zéro contribution inventée, zéro date falsifiée, séparation claire entre `Author` (auteur réel + date historique originale) et `Committer` (intégrateur + date de normalisation).

---

## 2. Architecture cible des branches

### 2.1 Branches à conserver et synchroniser

| Catégorie | Branche | État actuel | Action proposée (après validation TEMPS 2) | Justification |
|---|---|---|---|---|
| **Principale** | `main` | Local `34450534` / Distant `9bccbe38` | Synchroniser localement avec le dernier état validé (`9bccbe38` ou version réécrite si Option B choisie) ; activer la protection de branche sur GitHub (`require PR`, bloquer force-push). | Version stable de livraison et de déploiement production Render. |
| **Intégration** | `develop` | Obsolète (`09d35e02`, `-39` commits) | Mettre à jour `develop` en fast-forward / intégration propre pour refléter l'ensemble des fonctionnalités validées (lots 10–12, P01–P04, migration frontend, remédiation audit), alignée avec `main`. | Rétablit un flux GitFlow cohérent (`feature/*` → `develop` → `main`). |
| **Feature (existantes sur `origin`)** | `feature/lot8-deploiement`, `feature/palette`, `feature/lot8b-correctifs`, `feature/lot12-corrections`, `feature/p04-connected-experience`, `feature/frontend-migration`, `fix/audit-remediation` | Existantes sur `origin` et en local | **Conserver intégralement** (aucune suppression). Mettre à jour leurs pointeurs si réécriture d'historique approuvée (Option B). | Historique réel et traçable des jalons majeurs du projet. |
| **Feature (locales non poussées)** | `feature/p01-design-system`, `feature/p02-public-experience`, `feature/p03-address-experience`, `feature/lot11a-espaces`, `feature/lot10-finitions` | Présentes en local uniquement | **Pousser sur `origin`** (sans réécriture destructrice) afin que toute l'arborescence `feature/*` du programme de refonte et des lots soit visible sur GitHub pour le jury. | Comble l'écart local/distant sans créer de branche artificielle. |
| **Archive de sécurité** | `archive/pre-git01-snapshot` *(ou tag `backup/pre-git01`)* | À créer en TEMPS 3 avant toute réécriture | Créer un tag/branche d'archive pointant sur l'historique original intact (`9bccbe38`) + exporter un fichier `git bundle` vérifiable hors zone applicative. | Garantit zéro perte d'objet et prouve la transparence complète de la régularisation. |

> **Aucune branche existante ne sera supprimée.** Aucune branche artificielle vide ne sera créée.

---

## 3. Deux scénarios de réattribution d'historique (décision humaine requise)

### Scénario A — Réécriture contrôlée complète (recommandé pour conformité GitHub `/graphs/contributors` à 100 %)

**Principe :** Remplacer l'auteur générique `SamaAdresse Developer <dev@samaadresse.sn>` dans les 53 commits concernés par les véritables auteurs vérifiés (en conservant **exactement les dates auteur originales** et en gardant `Committer = Mahou-Dev` à la date de normalisation), via `git filter-repo` (ou script contrôlé sur une copie sauvegardée), **sans modifier un seul octet de code source** :

1. **Correction `.git/config` local :** retirer `user.name = SamaAdresse Developer` / `user.email = dev@samaadresse.sn` afin que tout futur commit utilise l'identité réelle du développeur.
2. **Attribution prouvée dès maintenant (`CERTAIN` / `PROBABLE`) :**
   - **Commit `b905b81e`** (*import `sama-AdresseWeb` + connexion Spring Boot*) :
     - **Option A1 (scission logique recommandée) :**
       - Commit 1 : `feat(frontend): import sama-AdresseWeb React 19 application` → `Author: AndreBampoky <a.b255@zig.univ.sn>`, `AuthorDate: 2026-10-20 01:39:17 +0000` (date authentique de `4d47a411`), `Committer: Mahou-Dev <ndourmahoul2i@gmail.com>`.
       - Commit 2 : `feat(frontend): connect sama-AdresseWeb to Spring Boot API and geo-grid` → `Author: Mahou-Dev <ndourmahoul2i@gmail.com>`, `AuthorDate: 2026-11-27 10:08:01 +0000`, trailer `Co-authored-by: AndreBampoky <a.b255@zig.univ.sn>`.
     - **Option A2 (sans scission) :** conserver le commit unique avec `Author: AndreBampoky <a.b255@zig.univ.sn>` et `Co-authored-by: Mahou-Dev <ndourmahoul2i@gmail.com>`.
   - **Autres commits sous `dev@samaadresse.sn` (`03141908` → `34450534`, `aeb54539` → `8fe7ce94`, `a953b160` → `ad6e9f97`) :**
     - Par défaut attribués à **`Mahou-Dev <ndourmahoul2i@gmail.com>`** (date auteur originale préservée).
     - **ET** pour toute fonctionnalité/commit dont le responsable confirme en **TEMPS 2** qu'il a été réalisé ou co-réalisé par **`Gallatsar`**, **`deguenef87-ai`**, **`wague-freres-immo`** ou **`Andrebampoky`** (avec preuve/confirmation et e-mail GitHub valide) : attribution en `Author` ou `Co-authored-by` selon la réalité du travail.
   - **Nettoyage optionnel des 2 messages vagues** (`78323fac` *Modification du 16 oct* et `061682cc` *modif du 18oct*) en messages descriptifs explicites reflétant leur contenu réel, tout en conservant le mapping complet dans `CORRESPONDANCE_COMMITS.md`.
3. **Impact GitHub et précautions :**
   - Réécrire les auteurs modifie les SHA des commits à partir de `03141908`.
   - **Opération distante sensible :** la mise à jour de `origin/main`, `origin/develop` et des branches `origin/feature/*` nécessite un **`git push --force-with-lease` ciblé** (strictement interdit sans **autorisation explicite dédiée** après vérification locale).
   - **Avantages majeurs :** GitHub `/graphs/contributors` et `/contributors` redeviennent 100 % fonctionnels et affichent les vrais comptes GitHub (`@Mahou-Dev`, `@Andrebampoky`, et les autres membres validés) ; disparition des 53 commits `Anonymous`.
   - **Effet de bord à anticiper :** les anciens liens vers les SHA dans les PR #1 et #2 fermées resteront lisibles grâce à la conservation de la référence d'archive `backup/pre-git01` ; le workflow CD Render se déclenchera si `main` est mis à jour (sans changement de code, déploiement identique).

### Scénario B — Normalisation sans réécriture d'historique existant (zéro force-push)

**Principe :** Ne modifier aucun SHA existant sur `origin` ; uniquement :
1. Faire `git fetch origin` et avancer `main` local sur `9bccbe38`.
2. Mettre à jour `develop` en fast-forward sur `9bccbe38` et pousser `develop`.
3. Pousser les 5 branches `feature/*` locales manquantes (`p01`, `p02`, `p03`, `lot11a`, `lot10`).
4. Corriger `.git/config` local et documenter les contributions réelles dans un fichier `.mailmap` + dans le rapport académique.
- **Limite majeure du Scénario B :** `.mailmap` fonctionne avec `git shortlog` en local, mais **GitHub n'applique pas `.mailmap` sur `/graphs/contributors` ni sur l'historique web** — les 53 commits resteront donc affichés sous `SamaAdresse Developer` (`Anonymous`) sur GitHub, et la contribution d'`Andrebampoky` n'apparaîtra pas dans l'interface GitHub.

---

## 4. Plan d'exécution sécurisé en TEMPS 3 (après autorisation)

1. **Sauvegarde préalable obligatoire :**
   - Vérification de `HEAD`, des 4 fichiers locaux préexistants et de l'état `git status`.
   - Création d'un bundle complet hors dossier applicatif (`/tmp/samaadresse-backup-pre-git01.bundle`) + vérification `git bundle verify`.
   - Création du tag d'archive local `backup/pre-git01` sur `9bccbe38` (préservant l'intégralité de l'ancien graphe d'objets).
2. **Synchronisation locale non destructive :**
   - `git fetch origin` pour rapatrier `9bccbe38` (merge PR #2).
   - Correction de `.git/config` (suppression de l'identité générique `dev@samaadresse.sn`).
3. **Application du scénario retenu (A ou B) :**
   - Si **Scénario A** validé : réattribution contrôlée des auteurs/co-auteurs validés (dates auteur originales préservées, `CommitterDate` = date de normalisation), mise à jour des branches `main`, `develop`, `feature/*`, vérification `git diff backup/pre-git01..main` **strictement vide** (code 100 % identique) + vérification `mvn test` / `vitest` / `git fsck`.
   - Génération des rapports finaux `docs/audit/CORRESPONDANCE_COMMITS.md` et `docs/audit/RAPPORT_FINAL_CONFORMITE_GIT.md`.
4. **Synchronisation GitHub (sur autorisation explicite séparée pour tout `--force-with-lease`) :**
   - Push des branches manquantes (`develop`, `feature/p01..p03`, `feature/lot11a`, `backup/pre-git01`).
   - Publication contrôlée de l'historique normalisé si autorisée explicitement.
   - Vérification finale sur GitHub (accessibilité des collaborateurs, `/graphs/contributors`, CI verte, déploiement Render intact).

---

## 5. Décisions attendues du responsable de projet (TEMPS 2 — Validation humaine)

Avant de passer au TEMPS 3, merci de valider explicitement les 6 points suivants :

1. **Liste complète des collaborateurs :** Les 5 comptes identifiés (`Mahou-Dev`, `Andrebampoky`, `Gallatsar`, `deguenef87-ai`, `wague-freres-immo`) correspondent-ils à toute l'équipe (ou y a-t-il une invitation en attente / un autre membre visible uniquement dans `/settings/access`) ? Quelles sont leurs permissions exactes ?
2. **Contributions réelles de chaque membre :**
   - Confirmez-vous l'attribution du frontend `sama-AdresseWeb` (importé dans `b905b81e`) à **`AndreBampoky <a.b255@zig.univ.sn>`** (avec Option A1 scission en 2 commits ou Option A2 co-auteur) ?
   - **`Gallatsar`**, **`deguenef87-ai`** et **`wague-freres-immo`** ont-ils réellement développé des modules ou commits précis actuellement sous `dev@samaadresse.sn` ? Si oui, **lesquels exactement** (fonctionnalités/fichiers) ? Sinon, confirmez-vous qu'ils seront documentés dans le tableau de répartition des tâches sans création de commits artificiels ?
3. **Identités Git (noms & e-mails GitHub) :**
   - Pour `Mahou-Dev` : confirmez-vous `Mahou-Dev <ndourmahoul2i@gmail.com>` ?
   - Pour `Andrebampoky` : confirmez-vous `AndreBampoky <a.b255@zig.univ.sn>` ?
   - Pour `Gallatsar`, `deguenef87-ai` et `wague-freres-immo` *(uniquement s'ils ont des commits/co-auteurs à réattribuer)* : quels noms publics et adresses e-mail liées à leurs comptes GitHub utiliser ?
4. **Scénario de normalisation :** Choisissez-vous le **Scénario A** (réécriture contrôlée avec sauvegarde `backup/pre-git01` pour un historique GitHub 100 % attribué) ou le **Scénario B** (mise à jour des branches `develop` + `feature/*` sans réécriture de SHA) ?
5. **Réorganisation des branches :** Confirmez-vous la mise à jour de `develop` au niveau de `main` et la publication sur `origin` des 5 branches `feature/*` locales manquantes (`p01`, `p02`, `p03`, `lot11a`, `lot10`) ?
6. **Autorisation distante :** Autorisez-vous explicitement, **après vérification locale**, la mise à jour distante des branches concernées sur GitHub (y compris `--force-with-lease` ciblé si le Scénario A est retenu) ? *(Un simple accord sur le présent rapport ne sera pas interprété comme une autorisation de force push.)*
