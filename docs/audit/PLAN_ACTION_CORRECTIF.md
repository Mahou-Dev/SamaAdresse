# 07 — PLAN D'ACTION CORRECTIF PRIORISÉ

> **Rappel :** conformément aux règles d'audit en lecture seule, aucune de ces corrections n'a été appliquée au cours de la mission. Ce plan est ordonné par priorité métier et sécurité pour amener SamaAdresse vers 100 % de conformité.

---

## Priorité P0 — Vulnérabilités critiques/élevées et blocages majeurs en production

### P0-01 — Corriger la non-révocation du Refresh Token lors du logout (`SEC-01`)
- **Problème :** le cookie `refreshToken` porte `Path=/api/auth/refresh`, ce qui empêche le navigateur de l'envoyer à `POST /api/auth/logout` ; le refresh token reste valide 7 jours en base après déconnexion.
- **Fichiers concernés :** `backend/src/main/java/sn/samaadresse/service/AuthService.java` (lignes 180–212), `backend/src/main/java/sn/samaadresse/controller/AuthController.java` (lignes 94–101), `scripts/smoke-prod.sh` (ligne 259).
- **Impact métier :** session compromise restant exploitable 7 jours après déconnexion explicite.
- **Solution recommandée :** définir `Path=/api/auth` sur `setRefreshTokenCookie` et révoquer également tous les tokens de l'utilisateur authentifié si un en-tête `Authorization: Bearer` est fourni sur `/api/auth/logout`.
- **Difficulté :** Faible (0,5 j).
- **Dépendances :** mise à jour de l'assertion `Path=/api/auth` dans `smoke-prod.sh` et `AuthAndSecurityTest`.
- **Critère de validation :** test d'intégration navigateur prouvant que `POST /api/auth/logout` supprime la ligne en table `refresh_tokens` et qu'un rejeu ultérieur de l'ancien cookie sur `POST /api/auth/refresh` retourne `401`.

### P0-02 — Rétablir OpenRouteService en production et supprimer le tracé de secours trompeur (`F-G2`)
- **Problème :** `GET https://samaadresse.onrender.com/api/public/route` retourne `HTTP 503` en production ; de plus `RouteService.generateFallbackRoute` fabrique un tracé en zigzag fictif sans avertir l'utilisateur en cas d'erreur ORS 403/502/503.
- **Fichiers concernés :** configuration secrète Render (`ORS_API_KEY`), `backend/src/main/java/sn/samaadresse/service/RouteService.java` (lignes 135–205), `backend/src/main/java/sn/samaadresse/dto/RouteResponse.java`, `frontend/src/components/RouteControls.tsx` (lignes 83–90).
- **Impact métier :** fonctionnalité officielle de calcul d'itinéraire inopérante en production.
- **Solution recommandée :** provisionner une clé `ORS_API_KEY` valide sur Render ; ajouter un booléen `approximateFallback` dans `RouteResponse` (ou renvoyer `503` propre sans zigzag artificiel) et afficher un avertissement explicite si un secours est utilisé.
- **Difficulté :** Faible (0,5 j).
- **Dépendances :** compte/clé OpenRouteService valide.
- **Critère de validation :** `GET https://samaadresse.onrender.com/api/public/route?fromLat=12.5605&fromLon=-16.2735&code=ZIG-KBG-4271&profile=driving-car` renvoie `HTTP 200` avec géométrie routière réelle (> 10 points) et étapes en français.

### P0-03 — Mettre à jour les dépendances vulnérables (`SEC-05`)
- **Problème :** `react-router-dom@6.30.6` (dépendance de production) est vulnérable à un Open Redirect ; `vitest`/`tinypool` (3 `CRITICAL`) et `vite@6.3.5` (1 `HIGH`) sont signalés par `npm audit`.
- **Fichiers concernés :** `frontend/package.json`, `frontend/package-lock.json`, `.github/workflows/ci.yml`.
- **Impact métier :** exposition sécurité runtime (Open Redirect) et outillage dev vulnérable.
- **Solution recommandée :** mettre à jour `react-router-dom` vers la dernière patch sécurisée, monter `vite` et `vitest`, puis ajouter `npm audit --omit=dev --audit-level=moderate` au job `frontend` de la CI.
- **Difficulté :** Faible à moyenne (0,5 j).
- **Dépendances :** re-validation complète Vitest + Playwright + `check:size`.
- **Critère de validation :** `npm audit --omit=dev` retourne `0` vulnérabilité ; `npm audit` global retourne `0 critical` / `0 high`.

---

## Priorité P1 — Fonctionnalités obligatoires défaillantes ou incomplètes et sécurité moyenne

### P1-01 — Corriger la recherche par nom de quartier et activer les filtres combinés (`F-F1`)
- **Problème :** saisir `"Boucotte"`, `"Kandé"` ou `"Médina"` dans l'onglet Quartier retourne `0` résultat en production ; impossible de combiner `q` + `quartier` + `type` dans `SearchPage`.
- **Fichiers concernés :** `backend/src/main/java/sn/samaadresse/service/AddressService.java` (lignes 388, 428–440), `frontend/src/pages/SearchPage.tsx` (lignes 66–140), `frontend/src/lib/geoGrid.ts`.
- **Impact métier :** recherche annuaire par quartier (exigence explicite du cahier des charges) cassée en saisie libre.
- **Solution recommandée :** (a) côté backend, inclure le nom humain du quartier (depuis `GeoGridService`) dans `searchText` et résoudre un nom de quartier en code dans `searchDirectory()` ; (b) côté frontend, résoudre également le nom vers le code et permettre la combinaison `q` + `quartier` + `type` + tri.
- **Difficulté :** Moyenne (1 j).
- **Dépendances :** migration de recalcul de `search_text` pour les adresses existantes.
- **Critère de validation :** `GET /api/public/directory?quartier=Boucotte` et `GET /api/public/directory?quartier=KBG` retournent exactement les mêmes résultats ; test Vitest dédié sur `SearchPage`.

### P1-02 — Câbler la réservation de codes hors ligne et ajouter Saint-Louis (`SL`) (`F-A2`)
- **Problème :** le frontend génère un code provisoire local (`gridCell`) qui change à la synchronisation, alors que l'API `/api/address-codes/reservations` existe déjà ; `ReservedCodeService` exclut la zone `SL`.
- **Fichiers concernés :** `backend/src/main/java/sn/samaadresse/service/ReservedCodeService.java` (ligne 29), `frontend/src/lib/api.ts`, `frontend/src/lib/drafts.ts`, `frontend/src/pages/NewAddressPage.tsx`, `frontend/src/auth/AuthProvider.tsx`.
- **Impact métier :** rupture du critère de génération de code hors ligne stable en moins de 3 s.
- **Solution recommandée :** charger les zones autorisées dynamiquement depuis `GeoGridService` (incluant `SL`) ; pré-charger un petit pool `/api/address-codes/reservations` en IndexedDB après connexion ; consommer un code réservé lors d'une création offline et transmettre `reservedCode` dans `syncDrafts()`.
- **Difficulté :** Moyenne (1 j).
- **Dépendances :** aucune.
- **Critère de validation :** création hors ligne en Playwright (`setOffline(true)`) puis reconnexion (`setOffline(false)`) conservant exactement le même code (`codeChanged === false`) en `< 3 s`.

### P1-03 — Valider le partage SMS en sandbox réel et trancher SendFlash (`F-D2`)
- **Problème :** `SendFlashSmsProvider` est un squelette (502), la prod tourne en `SMS_PROVIDER=mock` et aucun test sandbox réel n'a été exécuté ; texte contradictoire sur `SharePage.tsx:90`.
- **Fichiers concernés :** `backend/src/main/java/sn/samaadresse/sms/SendFlashSmsProvider.java`, `render.yaml`, `frontend/src/pages/SharePage.tsx`.
- **Impact métier :** critère officiel #3 reste `NON VÉRIFIABLE`.
- **Solution recommandée :** exécuter `scripts/sms-live-test` contre un compte Twilio Trial/Sandbox (avec capture de preuve anonymisée SID) ; implémenter `SendFlashSmsProvider` dès réception de la doc API officielle ou le retirer explicitement ; clarifier la distinction entre lien `sms:` public et envoi API propriétaire.
- **Difficulté :** Faible (Twilio) à Moyenne (SendFlash, selon documentation externe).
- **Dépendances :** identifiants sandbox Twilio ou documentation + clé API SendFlash.
- **Critère de validation :** réception effective d'un SMS contenant le lien `https://samaadresse.onrender.com/a/ZIG-KBG-4271` en ≤ 160 caractères GSM-7.

### P1-04 — Durcir la sécurité authentification, en-têtes, uploads et erreurs (`SEC-02`, `SEC-03`, `SEC-04`, `SEC-06`, `SEC-07`, `A-01`)
- **Problème :** CSP en `Report-Only`, access token en `sessionStorage`, `/register` sans rate limit + bug casse `existsByEmail`, EXIF conservé ≤ 800 px / WebP + pas de garde decompression-bomb, concaténation JSON dans `SecurityConfig:76,81`, erreurs 500 non loguées.
- **Fichiers concernés :** `SecurityConfig.java`, `AuthController.java`, `AuthService.java`, `FileStorageService.java`, `ImageMagicBytesValidator.java`, `GlobalExceptionHandler.java`, `frontend/src/auth/AuthProvider.tsx`.
- **Impact métier :** réduction forte de la surface d'attaque OWASP et observabilité des incidents 500.
- **Solution recommandée :**
  1. Migrer l'access token hors `sessionStorage` (mémoire JS + refresh silencieux au montage).
  2. Activer `Content-Security-Policy` en mode enforcing après retrait des 3 attributs `style={{ ... }}` inline.
  3. Ajouter un rate limit sur `/api/auth/register` et normaliser l'email avant `existsByEmail`.
  4. Sérialiser les 401/403 via `ObjectMapper`, logger les exceptions 500 dans `GlobalExceptionHandler` et mapper `DataIntegrityViolationException` en `409`.
  5. Vérifier les 8 octets PNG, borner largeur/hauteur avant `ImageIO.read` et ré-encoder toute image pour purger EXIF.
- **Difficulté :** Moyenne (1,5 j).
- **Dépendances :** P0-01.
- **Critère de validation :** tests unitaires + sécurité automatisés validant CSP enforcing, 429 sur `/register`, 409 sur email majuscule/minuscule, absence de métadonnées EXIF sur image 400×300 px uploadée.

---

## Priorité P2 — Améliorations importantes (performance, UX/accessibilité, admin, couverture)

### P2-01 — Supprimer le burst N+1 sur `/carte` et gérer les erreurs de tuiles (`F-G1`)
- **Problème :** `/carte` émet jusqu'à 24 `GET /api/addresses/{code}` en parallèle, saturant le quota `60 req/min/IP` ; `BaseMap.tsx` ignore `tileerror`.
- **Fichiers concernés :** `backend/src/main/java/sn/samaadresse/dto/DirectoryItemResponse.java`, `AddressService.java`, `frontend/src/pages/MapPage.tsx`, `frontend/src/components/map/BaseMap.tsx`.
- **Impact métier :** fiabilité de la carte publique sous trafic partagé et lisibilité des pannes réseau.
- **Solution recommandée :** inclure `latitude` et `longitude` dans `DirectoryItemResponse` (déjà publiques sur la fiche), supprimer la boucle `Promise.all` dans `MapPage.tsx`, ajouter un listener `tileerror` sur `<TileLayer>` affichant un bandeau discret.
- **Difficulté :** Faible (0,5 j).
- **Dépendances :** régénération `docs/api/openapi.*` et tests DTO.
- **Critère de validation :** charger `/carte` n'émet qu'**1 seule requête API** (`GET /api/public/directory`) au lieu de 25.

### P2-02 — Corriger les contrastes WCAG 2.1 AA et les cibles tactiles mobiles (`U-02`)
- **Problème :** `.button-success` (`2,78:1`), `.button-danger` (`3,91:1`) et `--ink-400` (`3,44:1`) échouent WCAG AA ; lien `Se connecter` (`90×19 px`), toggle MDP (`36×36 px`), chips (`36 px`) et boutons Leaflet (`30×30 px`) sont sous `44 px` sur mobile.
- **Fichiers concernés :** `frontend/src/styles/tokens.css`, `components.css`, `public.css`, `app.css`.
- **Impact métier :** accessibilité et confort tactile sur smartphone.
- **Solution recommandée :** foncer `--green-500` (`#0b7a57`), `--red-500` (`#c82333`), `--ink-400` (`#52657c`) ; garantir `min-height: 44px` et `min-width: 44px` sur tous les boutons/liens d'action en vue mobile (`≤ 768 px`).
- **Difficulté :** Faible (0,5 j).
- **Dépendances :** aucune.
- **Critère de validation :** 100 % des combinaisons de couleurs ≥ `4,5:1` et 0 bouton/contrôle mobile critique < `44 px` dans l'audit Playwright.

### P2-03 — Compléter l'administration et l'espace propriétaire (`F-J1`, `S-01`)
- **Problème :** `admin_actions` non consultable via API/UI, `AdminAddressesPage` omet les adresses non listées, `AdminUsersPage` est un placeholder, `suspendedReason` masqué au propriétaire, changement/réinitialisation de mot de passe absent (`AccountPage` affiche « Bientôt »).
- **Fichiers concernés :** `AdminModerationController.java`, `ModerationService.java`, `AuthController.java`, `AddressService.java`, `AdminAddressesPage.tsx`, `AdminUsersPage.tsx`, `AccountPage.tsx`.
- **Impact métier :** gouvernance administrative complète et autonomie des propriétaires.
- **Solution recommandée :** exposer `GET /api/admin/actions`, `GET /api/admin/addresses`, `GET /api/admin/users` (paginés), transmettre `suspendedReason` au propriétaire dans `AddressResponse`, implémenter `POST /api/auth/change-password`.
- **Difficulté :** Moyenne (1,5 j).
- **Dépendances :** aucune.
- **Critère de validation :** console `/admin` intégralement branchée sur données réelles + tests MockMvc et Vitest.

### P2-04 — Relever la couverture branches backend ≥ 60 % et combler les angles morts tests frontend (`T-01`, `T-02`, `T-03`)
- **Problème :** couverture branches backend à `58,42 %` (`controller` `40,3 %` lignes / `28,0 %` branches) ; `0 %` frontend sur carte et admin adresses, `11 %` sur `drafts.ts`, `14 %` sur `photo.ts`, `28 %` sur `SearchPage.tsx` ; `OpenApiCompletenessTest` et `GeoGridFixtureTest` mutent le dépôt.
- **Fichiers concernés :** `backend/pom.xml`, `backend/src/test/**`, `frontend/src/**/*.test.ts*`, `frontend/e2e/app.spec.ts`.
- **Impact métier :** prévention des régressions silencieuses (comme le bug quartier).
- **Solution recommandée :** ajouter un seuil JaCoCo `BRANCH >= 0.60`, tester les contrôleurs restants, ajouter des tests Vitest pour `drafts.ts` (`fake-indexeddb`), `photo.ts`, `SearchPage.tsx`, `AccountPage.tsx`, et étendre Playwright E2E aux scénarios offline, photo et modération admin.
- **Difficulté :** Moyenne (1,5 j).
- **Dépendances :** P1-01, P1-02.
- **Critère de validation :** JaCoCo `LINE >= 75 %` et `BRANCH >= 60 %` ; Vitest `>= 75 %` global sans module métier à `0 %` ; `mvn verify` sans mutation de fichiers suivis.

---

## Priorité P3 — Améliorations secondaires, scalabilité et exploitation

### P3-01 — Remplacer les caches mémoire non bornés et isoler les données de démonstration (`SEC-09`, `A-02`)
- **Problème :** `RateLimiterService.cache` et `RouteService.routeCache` sans éviction ; `DEMO_SEED=true` en prod mélange données démo et citoyennes.
- **Fichiers concernés :** `RateLimiterService.java`, `RouteService.java`, `render.yaml`, `DemoDataSeeder.java`, nouvelle migration `V3__*.sql`.
- **Solution recommandée :** utiliser Caffeine avec `maximumSize` + `expireAfterAccess` ; désactiver `DEMO_SEED` en production citoyenne (ou ajouter une colonne `is_demo`) ; ajouter un index GIN `pg_trgm` sur `addresses.search_text` et un retry transactionnel sur collision `UNIQUE` de `addresses.code`.
- **Difficulté :** Moyenne (1 j).

### P3-02 — Stratégie de sauvegarde Neon, readiness check et observabilité (`D-02`)
- **Problème :** pas de backup Neon automatisé/testé, pas de sonde `/api/health/ready` vérifiant la BDD, pas d'alerting externe, et TTL absent sur `samaadresse-public-v2` dans `sw.js`.
- **Fichiers concernés :** `docs/exploitation/` (runbook), `HealthController.java`, `frontend/public/sw.js`.
- **Solution recommandée :** documenter/automatiser un dump chiffré périodique Neon + test de restauration, configurer un moniteur Uptime sur `/api/health`, ajouter un TTL (ex. 7 jours) dans `sw.js` et `await trim(...)`, nettoyer les archives `lot*.zip`/`.diff` locales.
- **Difficulté :** Faible (0,5 j).
