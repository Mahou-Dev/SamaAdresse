# PLAN DES MISSIONS COLLABORATIVES RÉELLES — MISSION GIT-01 (TEMPS 2)

- **Principe fondamental :** Aucune simulation d'activité. Chaque membre réalise **personnellement** sa mission, exécute ses propres vérifications, rédige ses livrables et pousse ses commits depuis **son propre compte GitHub vérifié** sur sa branche dédiée, via une Pull Request ciblant **`develop`** (zéro impact sur la production Render).
- **Branche de base validée :** `develop` alignée sur `origin/main` @ `9bccbe38` (état post-remédiation audit, CI #25 & CD #2 verts).
- **Protection stricte :** Ne jamais committer de secrets (`.env`, mots de passe, tokens `eyJ...`), ne pas altérer les fonctionnalités de production, ne pas fusionner sa propre PR sans revue.

---

## Protocole Git commun aux trois membres

### Cas 1 — Le membre travaille en local avec Git + son compte GitHub (recommandé)
```bash
# 1. Cloner le dépôt (ou mettre à jour un clone existant)
git clone https://github.com/Mahou-Dev/SamaAdresse.git
cd SamaAdresse
git fetch origin

# 2. Configurer SON identité Git réelle (e-mail vérifié sur son compte GitHub)
git config user.name "Prénom Nom"
git config user.email "<votre-email-verifie-github>"
git config --list --local | grep user

# 3. Se placer sur sa branche dédiée créée depuis origin/develop
git checkout -b <NOM_DE_LA_BRANCHE> origin/develop
# (ou si déjà pré-créée sur origin : git checkout -t origin/<NOM_DE_LA_BRANCHE>)

# 4. Réaliser la mission, lancer les vérifications, puis vérifier git status & git diff
git status
git diff --stat

# 5. Committer uniquement ses livrables (messages factuels) et pousser
git add <fichiers-livrables>
git commit -m "<type>(<scope>): <description réelle>"
git push -u origin <NOM_DE_LA_BRANCHE>
```
Puis ouvrir sur GitHub une **Pull Request** : **`<NOM_DE_LA_BRANCHE>` → `develop`**, assigner **`Mahou-Dev`** et **`Andrebampoky`** en reviewers, et attendre la CI verte (`4/4` jobs) + approbation avant fusion.

### Cas 2 — Repli authentique si un membre n'a pas d'environnement Git local fonctionnel
- Utiliser **GitHub Codespaces** ou l'**éditeur Web GitHub** directement connecté avec **son propre compte GitHub** :
  1. Ouvrir `https://github.com/Mahou-Dev/SamaAdresse`, basculer sur la branche `develop`, créer la branche `<NOM_DE_LA_BRANCHE>` depuis le sélecteur de branches.
  2. Téléverser ou éditer ses livrables (`Add file → Upload files / Create new file`) directement sur sa branche, en remplissant un message de commit descriptif.
  3. Ouvrir la Pull Request vers `develop` depuis son compte.
  *(Ne jamais envoyer les fichiers à `Mahou-Dev` pour qu'il committe à sa place : cela casserait la traçabilité authentique demandée par le jury.)*

---

## MISSION 1 — `Gallatsar` (Responsable Qualité, Validation Fonctionnelle et Tests)

- **Compte GitHub :** `@Gallatsar` (ID `166870001`)
- **Branche dédiée :** `feature/git01-gallatsar-qa` (base : `develop` @ `9bccbe38`)
- **Objectif :** Valider concrètement les parcours fonctionnels et les rôles de SamaAdresse, mesurer la couverture réelle et combler par de vrais tests reproductibles les lacunes encore présentes dans la suite de tests.

### Base réelle constatée dans le dépôt (point de départ exact)
- **Backend :** `154` tests Maven (`./mvnw -B verify`), couverture JaCoCo `82,21 %` lignes / `65,68 %` branches (`0` échec).
- **Frontend :** `75` tests Vitest (`cd frontend && npm run test:run`), couverture globale `69,60 %` lignes / `61,74 %` branches (`0` échec).
  - **Lacunes de couverture réelles identifiées (cibles prioritaires pour nouveaux tests) :**
    - `frontend/src/lib/photo.ts` (`~16 %` lignes — redimensionnement/compression photo côté client)
    - `frontend/src/hooks/useInstallPrompt.ts` (`0 %` — gestion événement `beforeinstallprompt`)
    - `frontend/src/pages/SharePage.tsx` (`~46 %` — copie lien/code, export PNG/SVG, mode `sms:`)
    - `frontend/src/pages/MyAddressesPage.tsx` (`~50 %` — filtres, brouillons hors ligne, synchronisation)
    - `frontend/src/hooks/useDrafts.ts` (`~75 %` lignes / `16,7 %` branches)
- **E2E Playwright :** `frontend/e2e/app.spec.ts` contient actuellement **3 scénarios** (public/QR, annuaire/redirections/404, parcours propriétaire création/archivage/restauration). **Manquants en E2E :** modération admin (`/admin/signalements`, `/admin/adresses`), changement de mot de passe (`/compte`), recherche par nom de quartier (`Boucotte`, `Médina`) et carte `/carte` (vérification 1 seule requête).

### Travaux obligatoires
1. Exécuter les suites existantes et consigner les sorties réelles (jamais de résultat déclaré sans exécution) :
   - `cd backend && ./mvnw -B verify`
   - `cd frontend && npm run test:run && npx vitest run --coverage`
2. Tester manuellement/automatiquement les parcours essentiels (en local ou sur `https://samaadresse.onrender.com`) :
   - Inscription (validation e-mail, téléphone sénégalais `+221`, mot de passe ≥ 8 car.), connexion, déconnexion (vérifier révocation session), changement de mot de passe (`/compte`).
   - Création d'adresse (GPS, saisie manuelle, inversion lat/lon, coordonnées hors zone Sénégal, photo > 5 Mo / format invalide).
   - Consultation publique (`/a/ZIG-KBG-4271`, `404` code inexistant, `410` adresse archivée/suspendue), recherche par code, mot-clé, quartier (`Boucotte`, `Médina`, `KBG`) et filtres combinés.
   - Rôles et autorisations : anonyme → `/mes-adresses` (redirection `/connexion`), `PROPRIETAIRE` → `/admin` (accès refusé), `ADMIN` → modération `/admin/signalements`, `/admin/adresses`, journal d'audit.
3. Ajouter de **vrais tests unitaires/E2E** ciblant les lacunes réelles ci-dessus (ex. `frontend/src/lib/photo.test.ts`, `frontend/src/hooks/useInstallPrompt.test.ts`, ou scénarios supplémentaires dans `frontend/e2e/`).
4. Rédiger le livrable principal **`docs/qa/RAPPORT_TESTS_FONCTIONNELS.md`** comprenant :
   - Tableau des scénarios testés (ID, rôle, étapes, résultat attendu, résultat observé, statut `PASS`/`FAIL`, preuve).
   - État réel des tests automatisés et de la couverture avant/après ajout de tests.
   - Anomalies / régressions éventuelles avec étapes exactes de reproduction et priorité (`P0`–`P3`).

### Livrables attendus & exemple de commits (à n'utiliser que pour du travail réel)
- `docs/qa/RAPPORT_TESTS_FONCTIONNELS.md`
- Nouveaux fichiers de tests réellement exécutés et passants (ex. `frontend/src/lib/photo.test.ts`, `frontend/src/hooks/useInstallPrompt.test.ts`, etc.)
- Exemple de commit : `test(qa): add functional validation report and missing unit tests`

---

## MISSION 2 — `deguenef87-ai` (Responsable Documentation Technique et Contrat API)

- **Compte GitHub :** `@deguenef87-ai` (ID `361915937`) *(attention à l'orthographe exacte avec `e` : `deguenef87-ai`)*
- **Branche dédiée :** `feature/git01-deguenef87-api-docs` (base : `develop` @ `9bccbe38`)
- **Objectif :** Auditer l'ensemble des contrôleurs REST Spring Boot, vérifier la cohérence complète avec `docs/api/openapi.json`, `frontend/docs/API.md` et `.env.example`, et livrer un contrat API de référence 100 % fidèle au code.

### Base réelle constatée dans le dépôt (point de départ exact)
- **12 contrôleurs backend** dans `backend/src/main/java/sn/samaadresse/controller/` :
  - `AuthController` (`/api/auth` : `register`, `login`, `refresh`, `logout`, `me`, `change-password`)
  - `AddressController` (`/api/addresses` : création, `mine`, résolution `{code}`, `qrcode`, `PATCH {id}`, `visibility`, `photo` POST/DELETE, `archive`, `restore`)
  - `AddressShareController` (`/api/addresses/{code}/share/sms`)
  - `DirectoryController` (`/api/public/directory`)
  - `RouteController` (`/api/public/route`)
  - `PublicReportController` (`/api/public/addresses/{code}/reports`)
  - `ReservedCodeController` (`/api/address-codes/reservations` GET/POST)
  - `AdminModerationController` (`/api/admin/reports`, `PATCH reports/{id}`, `suspend`, `reinstate`, `actions`, `addresses`)
  - `AdminDevController` (`/api/admin/reset-rate-limits`, `/api/admin/system/reset-rate-limits` — **vérifier le profil Spring `@Profile` !**)
  - `HealthController` (`/api/health`, `/api/health/ready`)
  - `PhotoController` (`/uploads`, `/uploads/`, `/uploads/{filename}`)
  - `CustomErrorController` (`/error`, annoté `@Hidden`)
- **Spécification OpenAPI existante :** `docs/api/openapi.json` et `docs/api/openapi.yaml` (`33` chemins, `35` opérations).
- **Documentation client à confronter :** `frontend/docs/API.md` et `docs/api/SamaAdresse.postman_collection.json`.
- **Variables d'environnement :** `.env.example` (`37` variables alignées avec `scripts/check-env-vars.py`).

### Travaux obligatoires
1. Lire les 12 contrôleurs, les DTOs (`backend/src/main/java/sn/samaadresse/dto/`), `SecurityConfig.java` et `GlobalExceptionHandler.java`.
2. Pour **chaque endpoint réellement implémenté**, documenter avec exactitude : méthode HTTP, URL, paramètres (path/query), schéma du corps de requête + règles `@Valid`, schéma de réponse, tous les codes HTTP possibles (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `410`, `429`, `502`, `503`), authentification (`Bearer`, cookie HttpOnly `Path=/api/auth`, anonyme) et rôle requis (`PROPRIETAIRE`, `ADMIN`, public), limites de débit (`RateLimiterService`).
3. Comparer méthodiquement le code réel contre :
   - `docs/api/openapi.json` / `openapi.yaml`
   - `frontend/docs/API.md` (repérer les éventuels endpoints nouveaux non encore listés dans `frontend/docs/API.md`, tels que `/api/auth/change-password`, `/api/admin/actions`, `/api/admin/addresses`, `/api/health/ready`)
   - `docs/api/SamaAdresse.postman_collection.json`
4. Documenter l'ensemble des **37 variables d'environnement** à partir de `.env.example` et `backend/src/main/resources/application*.yml` (**strictement sans aucun secret, mot de passe ou token**, et **sans aucun exemple de chaîne `eyJ...` > 60 car.** qui ferait échouer le job CI `secrets` !).
5. Vérifier par commande réelle : `python3 scripts/check-env-vars.py` et `cd backend && ./mvnw -B test -Dtest=OpenApiCompletenessTest`.

### Livrables attendus & exemple de commit
- **`docs/api/API_CONTRACT.md`** comprenant :
  - Contrat détaillé des endpoints vérifiés dans le code.
  - Tableau de correspondance exhaustif : `Contrôleur / Endpoint réel` ↔ `openapi.json` ↔ `frontend/docs/API.md` ↔ `Postman`.
  - Section dédiée **« Rapport des écarts détectés »** (endpoints documentés vs code, divergences de champs ou statuts).
  - Référentiel des 37 variables d'environnement et mécanismes de sécurité (JWT, cookie `Path=/api/auth`, CSP, rate limiting).
- Mise à jour éventuelle de `frontend/docs/API.md` si des écarts documentaires sont corrigés.
- Exemple de commit : `docs(api): add verified API contract and documentation gap analysis`

---

## MISSION 3 — `wague-freres-immo` (Responsable Documentation Utilisateur et Validation UX Mobile)

- **Compte GitHub :** `@wague-freres-immo` (ID `321158247`)
- **Branche dédiée :** `feature/git01-wague-user-guide` (base : `develop` @ `9bccbe38`)
- **Objectif :** Rédiger un guide utilisateur progressif et authentique basé sur l'application réellement déployée (`https://samaadresse.onrender.com`), réaliser une validation UX mobile rigoureuse sur **360 px et 375 px** avec captures d'écran réelles et contrôler l'exhaustivité du `README.md`.

### Base réelle constatée dans le dépôt (point de départ exact)
- **Routes publiques (`frontend/src/App.tsx`) :** `/` (Accueil), `/recherche` (alias `/annuaire`), `/carte`, `/a/:code` (fiche publique + itinéraire + signalement), `/a/:code/partage` (QR code + copie + SMS), `/connexion` (alias `/login`), `/inscription` (alias `/register`), `*` (404).
- **Routes propriétaire (`ROLE_PROPRIETAIRE`) :** `/tableau-de-bord`, `/mes-adresses`, `/mes-adresses/nouvelle` (wizard 4 étapes), `/mes-adresses/:id` (édition, photo, SMS, archivage/restauration), `/compte` (profil, changement mot de passe, PWA/hors ligne).
- **Routes administrateur (`ROLE_ADMIN`) :** `/admin` (KPIs + graphiques), `/admin/signalements` (traitement `OPEN`/`RESOLVED`/`DISMISSED` + onglet `Journal d'audit`), `/admin/adresses` (registre complet + suspension/réactivation), `/admin/utilisateurs`.
- **Comptes de démonstration (`DEMO_SEED=true` dans `render.yaml`) :** `demo@samaadresse.sn` (`PROPRIETAIRE`) et `admin@samaadresse.sn` (`ADMIN`) — **ne jamais écrire de mot de passe en clair dans les fichiers Git** ; renvoyer vers la configuration `DEMO_PASSWORD` / `ADMIN_PASSWORD` comme le fait déjà `README.md`.

### Travaux obligatoires
1. Parcourir l'application réelle en tant que :
   - **Visiteur anonyme** (recherche par code `ZIG-KBG-4271`, recherche annuaire par quartier `Boucotte` / mot-clé / type, carte `/carte`, consultation fiche publique + QR code, mode hors ligne après visite d'une fiche).
   - **Propriétaire connecté** (tableau de bord, création guidée 4 étapes, gestion photo, partage QR/SMS, archivage/restauration, changement mot de passe).
   - **Administrateur** (tableau de bord admin, modération signalements, registre adresses, journal d'audit).
2. Réaliser des **captures d'écran réelles et récentes** (ex. enregistrées dans `docs/user/captures/`) illustrant les parcours clés (desktop + mobile `360 px` / `375 px`).
3. Contrôler systématiquement l'ergonomie mobile à **`360×800`** et **`375×812`** :
   - Absence de débordement horizontal (`scrollWidth <= innerWidth`).
   - Lisibilité des textes, contrastes, taille et accessibilité des boutons/champs/formulaires.
   - Signaler tout défaut UX réel avec sa résolution d'écran exacte et ses étapes de reproduction (sans modifier arbitrairement le code applicatif).
4. Contrôler `README.md` (présentation, prérequis, installation, configuration, variables d'environnement, démarrage, mention sécurisée des comptes de démo, liens internes vérifiables via `python3 scripts/check-readme-links.py`). Compléter uniquement les lacunes documentaires avérées.

### Livrables attendus & exemple de commit
- **`docs/user/GUIDE_UTILISATEUR.md`** (guide progressif par rôle + captures authentiques intégrées).
- **`docs/user/captures/*.png`** (captures réelles et récentes, sans aucune donnée sensible ni mot de passe visible).
- **`docs/user/RAPPORT_VALIDATION_MOBILE.md`** (ou section dédiée complète dans le guide + tableau de validation `360 px` / `375 px`, anomalies UX éventuelles avec étapes de reproduction).
- Compléments ciblés dans `README.md` si des lacunes documentaires sont identifiées (vérifiés par `python3 scripts/check-readme-links.py` et `python3 scripts/check-env-vars.py`).
- Exemple de commit : `docs(user): add user guide, authentic screenshots and mobile UX report`

---

## Critères d'acceptation de chaque Pull Request vers `develop`

1. La branche est créée depuis `develop` (`9bccbe38`) et cible **`develop`** (jamais `main` directement).
2. Les commits sont signés/créés par **l'identité Git vérifiée du membre réel** (aucun commit `SamaAdresse Developer`).
3. Les 4 jobs de la CI GitHub Actions (`secrets`, `backend`, `frontend`, `e2e`) sont **100 % VERTS** sur la PR.
4. **Au moins une revue humaine** (`Approve` + commentaire technique réel) est enregistrée sur GitHub par un autre membre (`Mahou-Dev` ou `Andrebampoky`) avant fusion dans `develop`.
5. Aucune régression fonctionnelle, aucun secret exposé, aucune modification injustifiée de l'application en production.
