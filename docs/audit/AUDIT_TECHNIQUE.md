# 04 — AUDIT TECHNIQUE (ARCHITECTURE, CODE, BASE DE DONNÉES, API & DEVOPS)

---

## 1. Inventaire et cohérence architecturale

### Structure du dépôt
- **`backend/` (Spring Boot 3.4.3 / Java 21) :** 91 classes Java réparties en 9 packages (`config`, `controller`, `domain.entity`, `domain.enums`, `domain.model`, `dto`, `exception`, `repository`, `security`, `service`, `sms`).
- **`frontend/` (React 19.1 / TypeScript 5.8 / Vite 6.3) :** 70+ fichiers structurés par rôle (`auth/`, `components/`, `components/layout/`, `components/map/`, `data/`, `hooks/`, `lib/`, `pages/`, `pages/admin/`, `styles/`, `e2e/`).
- **`docs/` :** spécifications OpenAPI (`openapi.json`, `openapi.yaml`), collection Postman, 12 diagrammes UML PlantUML + rendus PNG/SVG, rapports d'audits antérieurs.
- **`scripts/` :** 24 scripts d'exploitation, qualité, vérification (`check-env-vars.py`, `check-readme-links.py`, `smoke-prod.sh`, `test-qr-decode.mjs`, `verify-all`, etc.).
- **Anomalie d'hygiène du dépôt local :** présence à la racine de plusieurs archives locales volumineuses non ignorées ou temporaires (`lot8.zip`, `lot8b-9.zip`, `lot10.zip`, `lot12c.zip`, `lot12b.diff`, `lot12c.diff` — > 250 Mo sur disque local, exclus de Git par `.gitignore` pour `*.zip` mais visibles localement).

### Évaluation des 10 critères d'architecture
1. **Cohérence architecturale (Bon) :** monolithe modulaire mono-origine pertinent pour la cible académique et Render Free (zéro problème CORS en prod, 1 seul artefact Docker).
2. **Séparation des responsabilités (Bon côté backend, contrasté côté frontend) :** contrôleurs backend fins déléguant aux services ; côté frontend, `frontend/src/lib/api.ts` (839 lignes) concentre tous les types, mappers et clients HTTP dans un seul module, et `MapPage`/`AdminAddressesPage` compensent côté client des manques d'endpoints backend.
3. **Principes SOLID (Satisfaisant) :** bonne inversion de dépendance sur `PhotoStorage` (`DiskPhotoStorage` / `DbPhotoStorage`) et `SmsProvider` (`MockSmsProvider` / `TwilioSmsProvider` / `SendFlashSmsProvider`) pilotées par `@ConditionalOnProperty`. À noter : `AddressService` (486 lignes) porte à la fois le CRUD propriétaire, la résolution publique, la recherche annuaire et le mapping DTO.
4. **Modélisation des données (Solide avec limites d'échelle) :** 7 tables normalisées, UUID en clés primaires, contraintes `UNIQUE`, `FK`, `CHECK` et `NOT NULL` explicites.
5. **Gestion des erreurs (Perfectible) :** format `ErrorResponse` homogène côté `GlobalExceptionHandler`, mais `handleGenericException` (ligne 392) **ne journalise aucune stack trace** sur les HTTP 500, et `DataIntegrityViolationException` n'est pas intercepté (renvoie 500 au lieu de 409).
6. **Maintenabilité (Bonne) :** TypeScript `strict: true` avec `tsc -b --noEmit` à 0 erreur, ESLint à 0 erreur/0 avertissement, code Java propre et commenté.
7. **Réutilisabilité des composants (Bonne) :** composants UI bien découpés (`AddressDetails`, `CodeLookup`, `PhotoPicker`, `RouteControls`, `StatusBadge`, `StatusTimeline`, `AdaptiveLayout`).
8. **Gestion des configurations (Très bonne) :** 37/37 variables vérifiées automatiquement par `scripts/check-env-vars.py`, `DatabaseUrlEnvironmentPostProcessor` convertissant proprement `postgres://` (Neon) vers JDBC.
9. **Conventions de développement (Bonnes) :** nommage cohérent, commits structurés.
10. **Risques de dette technique (Modérés à surveiller) :** voir section 5 ci-dessous.

---

## 2. Audit de la base de données PostgreSQL

### Inventaire des tables (`V1__init.sql` + `V2__photo_blobs.sql`)

| Table | Clé primaire | Contraintes clés | Index | Observations |
|---|---|---|---|---|
| `users` | `id (uuid)` | `email UNIQUE NOT NULL`, `CHECK (role IN ('ADMIN','PROPRIETAIRE'))` | `idx_user_email` (redondant avec `UNIQUE`) | Pas de contrainte unique insensible à la casse (`LOWER(email)`). |
| `addresses` | `id (uuid)` | **`code UNIQUE NOT NULL`**, `FK owner_id -> users(id)`, `CHECK location_type`, `CHECK status` | `idx_address_owner`, `idx_address_status`, `idx_address_directory(status, listed)`, `idx_address_client_request(owner_id, client_request_id)` | Unicité du code garantie au niveau DB. `idx_address_client_request` non `UNIQUE` (idempotence reposant sur lecture avant écriture). `search_text` sans index GIN `pg_trgm`. |
| `refresh_tokens` | `id (uuid)` | `token_hash UNIQUE NOT NULL`, `FK user_id -> users(id)` | `idx_refresh_token_hash` | Pas de tâche périodique de purge des tokens expirés. |
| `address_reports` | `id (uuid)` | `FK address_id -> addresses(id)`, `CHECK reason`, `CHECK status` | `idx_report_address`, `idx_report_status`, `idx_report_created_at` | `ip_hash` en SHA-256 (64 car.). |
| `admin_actions` | `id (uuid)` | `admin_email`, `action`, `address_id`, `address_code` `NOT NULL` | `idx_admin_action_address`, `idx_admin_action_created_at` | Journal d'audit écrit mais **aucune FK** vers `users` ou `addresses` (choix tolérable pour historique) et **aucun endpoint de lecture**. |
| `reserved_codes` | `id (uuid)` | `code UNIQUE NOT NULL`, `FK user_id -> users(id)`, `CHECK status` | `idx_reserved_codes_user_status`, `idx_reserved_codes_user_zq` | Jamais alimenté par le nouveau frontend. |
| `photo_blobs` | `id (uuid)` | `data bytea NOT NULL`, `content_type`, `size_bytes`, `created_at` | PK uniquement | Aucune FK vers `addresses` : en cas de panne entre `storeFile()` et `addressRepository.save()`, un blob orphelin peut rester en base. |

### Anomalies base de données et intégrité identifiées
1. **Mélange données de démonstration / données réelles en production :** `render.yaml:22` active `DEMO_SEED: "true"`. `DemoDataSeeder` insère `demo@samaadresse.sn`, `fatou@samaadresse.sn`, `admin@samaadresse.sn` et leurs adresses directement dans les mêmes tables Neon sans colonne `is_demo` ni schéma séparé.
2. **Double vérification sensible à la casse sur l'inscription (`AuthService.java:52` vs `58`) :** `existsByEmail(request.getEmail())` ne normalise pas en minuscules avant de vérifier, alors que l'insertion fait `.trim().toLowerCase()`. Une inscription avec majuscule sur un email déjà pris provoque une `DataIntegrityViolationException` -> HTTP 500.
3. **Collision concurrente sur `addresses.code` (`AddressCodeGenerator.java:47-52`) :** la boucle vérifie `existsByCode` avant `save()`, mais deux créations simultanées tirant le même suffixe parmi les 9 000 possibles (`1000..9999`) lèveront une violation de contrainte `UNIQUE` -> HTTP 500 faute de mécanisme de retry transactionnel.
4. **Capacité structurelle limitée :** 4 chiffres (`1000..9999`) limitent chaque quartier à `9 000` adresses et `geo-grid.json` ne couvre que 3 zones (`ZIG`, `DKR`, `SL`) et 8 quartiers.
5. **Requête annuaire non indexable (`AddressRepository.java:39-40`) :** `LOWER(a.searchText) LIKE LOWER(CONCAT('%', :qNorm, '%'))` empêche l'utilisation d'index B-Tree. De plus, `quartier` est comparé par égalité exacte (`a.quartier = :quartier`) sur le code 3 lettres, provoquant 0 résultat lors d'une recherche texte par nom de quartier (`Boucotte`, `Médina`).
6. **Statut `AddressStatus.SIGNALED` mort :** défini dans l'enum et la contrainte `CHECK`, mais jamais affecté par `ModerationService.createPublicReport`.
7. **Absence de politique `ON DELETE` :** aucune suppression d'utilisateur ou d'adresse n'est exposée (archivage logique utilisé pour les adresses, ce qui est pertinent pour l'immuabilité).

---

## 3. Audit API, contrats et performances

- **Couverture OpenAPI :** `docs/api/openapi.json` (et live `GET /v3/api-docs`) expose **29 chemins / 31 opérations**, toutes pourvues d'un `summary` et de codes de réponses documentés (`missing_summary=0`, `missing_resp=0`).
- **Incohérences de contrat API / Frontend :**
  1. `DirectoryItemResponse` n'inclut pas `latitude`/`longitude` -> `MapPage.tsx:50-56` émet un burst N+1 de 24 requêtes `GET /api/addresses/{code}` (épuisant le quota `60 req/min/IP` en 3 chargements).
  2. `GET /api/addresses/mine` n'est pas paginé et il n'existe pas de `GET /api/addresses/id/{id}` -> `getMyAddress` télécharge toutes les adresses de l'utilisateur pour en afficher une seule (`api.ts:596-603`).
  3. `AddressService.java:466` masque `suspendedReason` derrière la chaîne générique `"Suspendue par la modération"` au lieu d'exposer le motif au propriétaire.
  4. `PublicAddressResponse` n'inclut pas `ownerName` même si `showOwnerName=true`, laissant `PublicAddressPage.tsx:61` inopérant.
  5. `RouteService.java:135-158` génère un itinéraire factice en zigzag (4 points avec décalage arbitraire `±0.0005°`) en cas d'erreur ORS 403/502/503/réseau, sans champ booléen `fallback` pour prévenir l'UI (qui affiche pourtant `"Calculé par OpenRouteService"`).
  6. `ReservedCodeService.java:29` hardcode `ALLOWED_ZONES = Set.of("ZIG", "DKR")`, oubliant `SL` (Saint-Louis) présent dans `geo-grid.json`.
- **Performance mesurée :**
  - Bundle JS principal frontend : `321,19 Ko` brut / **`98,20 Ko` gzip** (objectif ≤ 105 Ko respecté ; `leaflet` `48,41 Ko` gzip et `qrcode` `9,73 Ko` gzip chargés à la demande).
  - Latences live Render (Europe Francfort, réveillé) : `/api/health` ~`1,5 s` (premier hit), endpoints courants `360–900 ms`, premier appel `/v3/api-docs` `20,0 s` (génération Springdoc à froid sur CPU partagé Free).
  - Résolution géo locale (`geo-grid.json`) : `0,0008 ms/op`.

---

## 4. Audit DevOps, CI/CD et production live

- **Dockerfile (`Dockerfile`) :** multi-étapes propre (`node:22-alpine` -> `maven:3.9.9-eclipse-temurin-21-alpine` -> `eclipse-temurin:21-jre-alpine`), exécution sous utilisateur non-root `samaadresse`, tuning JVM adapté à 512 Mo RAM (`-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k`).
- **CI (`.github/workflows/ci.yml`) :** 4 jobs (`secrets`, `backend` avec PostgreSQL 16 + JaCoCo, `frontend` TypeScript/ESLint/Vitest/Build/check:size, `e2e` Docker + Newman + Playwright + `smoke-prod.sh`). **Statut vérifié : vert** sur run #18 (`feature/frontend-migration`) et run #20 (`main`).
- **CD (`.github/workflows/cd.yml`) :** 3 jobs (`pre-deploy-gate`, `deploy-render`, `post-deploy-smoke`). **Statut vérifié : vert** sur run #1 (`main` @ `aaf8bf8`).
- **Correspondance code <-> production :** `https://samaadresse.onrender.com/` sert exactement `/assets/index-BzAtSjBR.js`, `sw.js` (`4625 B`) et `manifest.webmanifest` (`908 B`) identiques au build local du commit `8fe7ce9`.
- **Défauts DevOps / Production constatés :**
  1. **`ORS_API_KEY` non fonctionnelle sur Render :** `GET /api/public/route` retourne `HTTP 503` en production live.
  2. **`SMS_PROVIDER=mock` en production (`render.yaml:13`) :** aucun envoi SMS réel actif.
  3. **Absence de stratégie de sauvegarde / restauration Neon :** aucun script de backup planifié ni procédure de restauration testée dans le dépôt.
  4. **Observabilité minimale :** uniquement `/api/health` (`{"status":"UP"}` sans sonde DB réelle `SELECT 1` !), pas d'Actuator/métriques Prometheus, pas d'alerting ni agrégation de logs, et `GlobalExceptionHandler` ne journalise pas les 500.
  5. **Contraintes Render Free :** mise en veille après inactivité (cold start de 30–50 s) et absence de réplication multi-instances (incompatibilité future des rate limiters en mémoire).

---

## 5. Synthèse de la dette technique

| Priorité | Dette technique | Impact |
|---|---|---|
| Haute | Caches mémoire non bornés (`RateLimiterService`, `RouteService`) + absence d'éviction | Risque OOM progressif sur 512 Mo RAM |
| Haute | Burst N+1 sur `/carte` (24 appels `GET /api/addresses/{code}`) | Déclenchement 429 + coordonnées imprécises |
| Haute | Exceptions 500 silencieuses (`GlobalExceptionHandler:392`) | Diagnostic production aveugle |
| Moyenne | Fichier monolithique `frontend/src/lib/api.ts` (839 lignes) & `AddressService.java` (486 lignes) | Maintenabilité réduite à long terme |
| Moyenne | `LIKE '%...%'` sans `pg_trgm` & plafond de 9 000 codes/quartier | Limite de scalabilité nationale |
| Moyenne | `HealthController` statique (`{"status":"UP"}` sans vérification PostgreSQL) | Faux positif de disponibilité si Neon est coupé |
| Basse | Archives `lot*.zip`/`.diff` (> 250 Mo) présentes sur le disque de travail local | Encombrement poste développeur |
