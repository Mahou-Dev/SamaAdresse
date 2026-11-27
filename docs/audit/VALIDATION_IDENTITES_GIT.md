# VALIDATION DES IDENTITÉS GIT — MISSION GIT-01 (TEMPS 2)

- **Objectif :** Vérifier les identités Git (`user.name` et `user.email`) associées à chacun des cinq comptes GitHub afin de garantir que tout futur commit (et toute éventuelle réattribution autorisée en TEMPS 3) soit automatiquement rattaché au vrai compte GitHub du membre.
- **Règle absolue :** Aucune adresse e-mail n'est inventée ; aucune identité n'est configurée à la place d'un membre sans son accord et sa vérification.

---

## 1. Anomalie locale détectée dans `.git/config`

Sur le poste de travail actuel (`/home/mahou-dev/Documents/SamaAdresse`), deux configurations Git coexistent :

| Fichier de configuration | `user.name` | `user.email` | Effet observé |
|---|---|---|---|
| `/home/mahou-dev/.gitconfig` *(global)* | `mahou@Dev` | `mahoul2i2026@gmail.com` | Écrasé par le config local du dépôt |
| `.git/config` *(local au dépôt)* | **`SamaAdresse Developer`** | **`dev@samaadresse.sn`** | **Cause racine** des 53 commits `Anonymous` non reliés à un compte GitHub et de l'erreur HTTP 400 sur `/graphs/contributors` |
| Commits de merge Web GitHub (`aaf8bf87`, `9bccbe38`) | **`Mahou-Dev`** | **`ndourmahoul2i@gmail.com`** | **Prouvé lié** au compte GitHub `@Mahou-Dev` |

> **Action de correction locale recommandée (en TEMPS 3 après validation) :** supprimer les clés `user.name` et `user.email` dans `.git/config` ou y configurer l'adresse e-mail officiellement vérifiée sur le compte GitHub `@Mahou-Dev` (`ndourmahoul2i@gmail.com`).

---

## 2. Tableau de validation des 5 identités Git

| Membre (Username GitHub) | Nom Git connu | E-mail Git vérifié publiquement | Liaison compte GitHub confirmée ? | Statut de validation |
|---|---|---|---|---|
| **`Mahou-Dev`** | `Mahou-Dev` *(Web)* / `mahou@Dev` *(local)* | **`ndourmahoul2i@gmail.com`** *(prouvé sur `aaf8bf87` et `9bccbe38`)* ; `mahoul2i2026@gmail.com` *(local non testé sur GitHub)* | **OUI** pour `ndourmahoul2i@gmail.com` (`author.login = Mahou-Dev`) | **VÉRIFIÉE** *(confirmer l'usage unique de `ndourmahoul2i@gmail.com` et le nom public souhaité)* |
| **`Andrebampoky`** | **`AndreBampoky`** | **`a.b255@zig.univ.sn`** *(prouvé sur `Andrebampoky/sama-AdresseWeb@4d47a411` et `sama-Adresseback@6da1e49d`)* | **OUI** (`author.login = Andrebampoky`) | **VÉRIFIÉE** *(confirmer accord d'`Andrebampoky` avant toute réattribution A1)* |
| **`wague-freres-immo`** | `wague-freres-immo` | **`khady05.sall@gmail.com`** *(prouvé sur `wague-freres-immo/wague-immo@c172f600` et `immosenegal@2fbeac28`)* | **OUI** (`author.login = wague-freres-immo`) | **E-MAIL VÉRIFIÉ** *(confirmer nom d'affichage souhaité ; le membre configurera son poste personnel)* |
| **`Gallatsar`** | *(non renseigné sur GitHub)* | **Inaccessible publiquement** (`email: null`, `0` dépôt public) | Non vérifiable sans action du membre | **À CONFIGURER PAR LE MEMBRE** avant son premier commit sur `feature/git01-gallatsar-qa` |
| **`deguenef87-ai`** | *(non renseigné sur GitHub)* | **Inaccessible publiquement** (`email: null`, `0` dépôt public) | Non vérifiable sans action du membre | **À CONFIGURER PAR LE MEMBRE** avant son premier commit sur `feature/git01-deguenef87-api-docs` |

---

## 3. Procédure de vérification d'identité pour chaque membre (auto-configuration)

Chaque membre réalisant sa mission complémentaire doit exécuter **sur son propre poste** (et non sur le poste d'un tiers) les commandes suivantes avant son premier commit :

```bash
# 1. Configurer son nom réel et l'adresse e-mail VÉRIFIÉE dans son compte GitHub
#    (GitHub -> Settings -> Emails : utiliser soit l'e-mail principal vérifié,
#     soit son adresse noreply officielle : <ID>+<username>@users.noreply.github.com)
git config user.name "Prénom Nom"
git config user.email "<email-verifie-sur-github>"

# 2. Contrôler la configuration effective dans le dépôt cloné
git config --show-origin user.name
git config --show-origin user.email
```

### Adresses `users.noreply.github.com` officielles (si un membre active la confidentialité d'e-mail sur GitHub)

GitHub génère automatiquement une adresse noreply officielle déterministe basée sur l'ID numérique public du compte (`<id>+<login>@users.noreply.github.com`), utilisable uniquement si le membre choisit l'option *Keep my email addresses private* dans ses paramètres GitHub :
- `Gallatsar` : `166870001+Gallatsar@users.noreply.github.com` *(ou son e-mail vérifié GitHub)*
- `deguenef87-ai` : `361915937+deguenef87-ai@users.noreply.github.com` *(ou son e-mail vérifié GitHub)*
- `wague-freres-immo` : `321158247+wague-freres-immo@users.noreply.github.com` *(ou `khady05.sall@gmail.com`, déjà vérifié lié)*

> **Rappel :** L'option la plus simple pour les membres travaillant directement via l'interface web GitHub (ou Codespaces) sur leur branche dédiée est que GitHub signe et associe automatiquement chaque commit à leur compte authentifié.
