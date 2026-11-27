# 03 — CARTOGRAPHIE DES CONTRIBUTIONS INDIVIDUELLES

- **Méthode :** Croisement systématique entre l'historique Git local (54 commits), le dépôt GitHub `Mahou-Dev/SamaAdresse` (55 commits dont PR #1 et PR #2), les dépôts publics associés des collaborateurs (`Andrebampoky/sama-AdresseWeb`, `Andrebampoky/sama-Adresseback`) et le contenu réel des fichiers modifiés (code source, tests, documentation, `frontend/docs/PROGRESS.md`).
- **Échelle de certitude :**
  - **`CERTAIN`** : contribution directement démontrable par des preuves techniques objectives (commits liés, correspondance exacte de fichiers/remote, PR, dépôt source).
  - **`PROBABLE`** : contribution soutenue par plusieurs indices concordants mais nécessitant validation humaine (ex. commits enregistrés sous `dev@samaadresse.sn` depuis la machine de `Mahou-Dev` qui pourraient inclure du travail collaboratif hors Git).
  - **`À CONFIRMER`** : preuves Git/GitHub insuffisantes ; aucune attribution automatique autorisée sans validation explicite du responsable de projet.

---

## 1. Inventaire des domaines fonctionnels réels dans SamaAdresse

L'examen du code source actuel (`main` @ `9bccbe38`) identifie les 14 domaines techniques effectivement développés :

1. **Authentification et comptes :** JWT HS256 (15 min) + Refresh Token HttpOnly (`Path=/api/auth`, hash SHA-256 + rotation), BCrypt 12, rate-limiting login/register, `POST /api/auth/change-password`, `AuthProvider` mémoire uniquement.
2. **Génération de codes-adresses & SIG (`geo-grid`) :** Algorithme déterministe `ZONE-QUARTIER-XXXX` (3 zones : `ZIG`, `DKR`, `SL` ; 8 quartiers), fallback 3 km, pré-réservation hors ligne `/api/address-codes/reservations`, retry collision `UNIQUE`.
3. **Géolocalisation :** Acquisition GPS haute précision (`locateBestPosition`), détection d'inversion lat/lon, virgule décimale, sélection sur carte Leaflet (`LocationPicker`).
4. **Gestion des adresses (propriétaire) :** Wizard 4 étapes (`NewAddressPage`), CRUD propriétaire (`/api/addresses/mine`, édition `PATCH`, archivage/restauration, contrôle anti-IDOR `403`).
5. **Photographie de façade :** Upload multipart 5 Mo, validation magic bytes (JPEG, PNG 8 octets, WebP), anti-decompression-bomb, ré-encodage systématique (purge EXIF/GPS), stockage PostgreSQL `bytea` (`DbPhotoStorage`) + ETag/304.
6. **Cartographie & Itinéraires :** Cartes Leaflet + OpenStreetMap (`BaseMap`, `AddressMap`, `MapPage` en 1 requête sans N+1, détection `tileerror`), proxy serveur OpenRouteService (`/api/public/route`) avec repli direct explicite (`approximateFallback`).
7. **Annuaire & Recherche :** Résolution publique par code (`/api/addresses/{code}`), annuaire paginé (`/api/public/directory`) avec recherche texte insensible casse/accents, résolution des noms humains de quartiers (`Boucotte`, `Médina`, `Kandé`) et filtres combinés.
8. **QR Code & Partage :** Génération QR PNG serveur (`QrCodeService`) + SVG/PNG 1024 px client (`SharePage`), copie presse-papiers, Web Share API, partage SMS API (`/api/addresses/{code}/share/sms` + providers Mock/Twilio/SendFlash).
9. **PWA, Mode hors ligne & Synchronisation :** Manifeste + icônes + Service Worker `v3` (`sw.js`, cache public TTL 7 j, exclusion stricte des routes authentifiées), brouillons IndexedDB (`drafts.ts`), idempotence `clientRequestId` et consommation de codes réservés.
10. **API & Contrats :** 35 opérations REST documentées OpenAPI 3 (`/v3/api-docs`, `docs/api/openapi.{json,yaml}`) + collection Postman/Newman.
11. **Administration & Modération :** Signalements publics anti-abus (IP hashée), console `/admin` (`ROLE_ADMIN`), traitement `RESOLVED`/`DISMISSED`, suspension/réactivation, registre complet `/api/admin/addresses`, journal d'audit immuable `/api/admin/actions`.
12. **Interface utilisateur moderne (`sama-AdresseWeb`) :** Nouvelle interface React 19 / TypeScript / Vite (design maritime bleu nuit, 0 débordement mobile, WCAG 2.1 AA, bundle `104,48 Ko` gzip).
13. **Tests & Assurance qualité :** `154` tests backend (JaCoCo `82,21 %` lignes / `65,68 %` branches), `75` tests Vitest frontend (`69,60 %` lignes), E2E Playwright Chromium, `smoke-prod.sh`.
14. **DevOps, CI/CD & Documentation :** `Dockerfile` multi-stage, `render.yaml`, workflows GitHub Actions (`ci.yml`, `cd.yml`), 12 diagrammes UML PlantUML/PNG/SVG, rapports d'audit et de remédiation.

---

## 2. Matrice obligatoire des contributions par membre

| Membre | Username GitHub | Fonctionnalités | Fichiers | Commits concernés | Certitude |
|---|---|---|---|---|---|
| **Mahou-Dev** *(Propriétaire / Responsable intégration)* | `Mahou-Dev` | Fusion PR #1 (`feature/frontend-migration` → `main`) et PR #2 (`fix/audit-remediation` → `main`) ; administration et publication sur le dépôt GitHub. | Intégration complète PR #1 (311 fichiers) et PR #2 (61 fichiers) | `aaf8bf87`, `9bccbe38` | **CERTAIN** |
| **Mahou-Dev** *(Poste local `/home/mahou-dev/Documents/SamaAdresse` sous `dev@samaadresse.sn`)* | `Mahou-Dev` | **Backend Spring Boot complet** (entités, JWT/RBAC, geo-grid, génération codes, photos `bytea`, annuaire, ORS, QR, SMS, modération, Flyway `V1`/`V2`, OpenAPI), **ancien frontend & refontes Lots 1–12 / P01–P04**, **adaptation et connexion du nouveau frontend `sama-AdresseWeb` au backend Spring Boot**, **Docker / Render / CI / CD / E2E Playwright**, **audits et remédiation complète (`P0`–`P3`)**. | `backend/**`, `Dockerfile`, `render.yaml`, `.github/workflows/**`, `scripts/**`, `docs/uml/**`, `docs/api/**`, `docs/audit/**`, `docs/refonte/**`, adaptateurs `frontend/src/lib/api.ts`, `frontend/src/lib/geoGrid.ts`, `frontend/e2e/**`, correctifs post-migration | `03141908` → `34450534` (40 commits), part d'intégration de `b905b81e`, `aeb54539` → `8fe7ce94` (7 commits), `a953b160` → `ad6e9f97` (5 commits) | **PROBABLE** *(tous committés sur son poste local sous `dev@samaadresse.sn` ; à confirmer en TEMPS 2 si d'autres membres ont co-développé certains modules hors Git)* |
| **AndreBampoky** | `Andrebampoky` | **Conception et développement complet du nouveau frontend React 19 / TypeScript (`sama-AdresseWeb`)** : pages publiques/connectées/admin, composants UI, cartes Leaflet, assistant de création 4 étapes, brouillons hors ligne IndexedDB, QR code/partage, PWA (`sw.js`, manifeste, icônes), feuilles CSS et suite initiale de tests Vitest (`114 / 117` fichiers importés dans `frontend/`). | `frontend/src/App.tsx`, `frontend/src/pages/**`, `frontend/src/components/**`, `frontend/src/auth/**`, `frontend/src/hooks/**`, `frontend/src/lib/**`, `frontend/src/styles/**`, `frontend/public/**`, `frontend/docs/PROGRESS.md`, `frontend/docs/API.md` | Base applicative importée dans `b905b81e` *(provenant directement du commit `4d47a411` du `2026-10-20T01:39:17Z` sur `Andrebampoky/sama-AdresseWeb`)* | **CERTAIN** *(prouvé par `97,4 %` de correspondance exacte des chemins, `"name": "sama-adresseweb"` dans `package.json`, et référence explicite `sama-AdresseWeb.git` dans `frontend/docs/PROGRESS.md`)* |
| **Collaborateur `Gallatsar`** | `Gallatsar` | Non identifiable dans l'historique Git ni sur GitHub (`0` commit, `0` PR, `0` review, `0` dépôt public). | *(aucun fichier attribuable sans preuve)* | *(aucun)* | **À CONFIRMER** |
| **Collaborateur `deguenef87-ai`** | `deguenef87-ai` | Non identifiable dans l'historique Git ni sur GitHub (`0` commit, `0` PR, `0` review, compte créé le `2026-11-27T10:26Z`). | *(aucun fichier attribuable sans preuve)* | *(aucun)* | **À CONFIRMER** |
| **Collaborateur `wague-freres-immo`** | `wague-freres-immo` | Non identifiable dans l'historique Git ni sur GitHub pour SamaAdresse (`0` commit, `0` PR, `0` review). | *(aucun fichier attribuable sans preuve)* | *(aucun)* | **À CONFIRMER** |

---

## 3. Analyse détaillée du commit collaboratif `b905b81e`

Le commit `b905b81e` (`2026-11-27 10:08:01 +0000` — *`feat(frontend): remplace le frontend par samaadresse_frontend connecté au backend Spring Boot`*, 307 fichiers modifiés) rassemble objectivement le travail de **deux contributeurs distincts** :

1. **Auteur du socle frontend importé (`CERTAIN`) : `AndreBampoky <a.b255@zig.univ.sn>` (`@Andrebampoky`)**
   - Date historique originale vérifiée sur GitHub (`Andrebampoky/sama-AdresseWeb` @ `4d47a411`) : **`2026-10-20T01:39:17Z`**.
   - Périmètre : structure React 19 / TypeScript, design system CSS, pages `HomePage`, `SearchPage`, `MapPage`, `PublicAddressPage`, `SharePage`, `LoginPage`, `RegisterPage`, `DashboardPage`, `MyAddressesPage`, `NewAddressPage`, `MyAddressDetailPage`, `AccountPage`, espace `/admin/*`, `sw.js`, `drafts.ts`, tests Vitest de base.
2. **Auteur de l'intégration / connexion au backend Spring Boot (`CERTAIN`) : `Mahou-Dev <ndourmahoul2i@gmail.com>` (`@Mahou-Dev`)**
   - Date : **`2026-11-27T10:08:01Z`**.
   - Périmètre : adaptation de `frontend/src/lib/api.ts` aux endpoints Spring Boot (`/api/addresses/*`, `/api/public/directory`, `/api/public/route`, `/api/admin/*`), synchronisation `frontend/src/data/geo-grid.json` + `geoGrid.ts`, adaptation `vite.config.ts` (proxy `:8082`, `manualChunks`), ajout `scripts/check-size.mjs`, suppression de l'ancien frontend.

**Option de traitement recommandée en Phase F/G (à valider en TEMPS 2) :**
- **Option 1 (recommandée — la plus fidèle) :** scinder logiquement `b905b81e` en **2 commits** sur la branche `feature/frontend-migration` (avec arbre final bit-à-bit identique à `b905b81e` !) :
  1. Un commit attribué à **`Author: AndreBampoky <a.b255@zig.univ.sn>`** (date auteur préservée `2026-10-20T01:39:17Z`, `Committer: Mahou-Dev`) pour l'import du frontend `sama-AdresseWeb` ;
  2. Un second commit attribué à **`Author: Mahou-Dev <ndourmahoul2i@gmail.com>`** (`2026-11-27T10:08:01Z`, avec `Co-authored-by: AndreBampoky <a.b255@zig.univ.sn>`) pour l'adaptation et la connexion au backend Spring Boot.
- **Option 2 (plus simple, sans scission) :** conserver le commit unique `b905b81e` avec `Author: AndreBampoky <a.b255@zig.univ.sn>` et `Co-authored-by: Mahou-Dev <ndourmahoul2i@gmail.com>` (ou inversement).

---

## 4. Contributions hors commits (à documenter sans fabrication artificielle)

À ce stade de l'audit, **aucun indice technique dans le dépôt** ne permet d'attribuer des commits existants à **`Gallatsar`**, **`deguenef87-ai`** ou **`wague-freres-immo`**.

Deux situations réelles sont possibles (à trancher par le responsable du projet en **TEMPS 2**) :

1. **Cas A — Travail effectivement réalisé par ces membres puis intégré localement sur la machine de `Mahou-Dev`** (ex. : rédaction des diagrammes UML `docs/uml/`, rédaction du `README.md` / `docs/DEMO.md`, conception de la maquette / palette Lot 9, développement d'un module backend spécifique comme QR Code / Annuaire / Modération / Tests, ou campagne de tests manuels).
   - *Règle stricte :* une réattribution (en `Author` ou en `Co-authored-by`) ne pourra être effectuée en TEMPS 3 **que si le responsable du projet confirme explicitement quels modules/commits exacts chaque membre a réellement produits**, ainsi que leur **nom public et l'adresse e-mail liée à leur compte GitHub**.
2. **Cas B — Participation à la conception, aux tests manuels, au cahier des charges, à la recette ou à la rédaction du rapport académique (hors code Git)** :
   - *Règle stricte :* **ne fabriquer aucun commit artificiel**. Documenter honnêtement leur rôle dans le tableau officiel de répartition des tâches du rapport académique (et, s'ils participent à des revues de PR ou de futures branches documentaires légitimes avant la soutenance, ces contributions apparaîtront naturellement).
