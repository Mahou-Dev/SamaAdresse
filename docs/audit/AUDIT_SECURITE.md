# 03 — AUDIT DE SÉCURITÉ — PROJET SAMAADRESSE

- **Périmètre :** Backend Spring Security 6 / JJWT 0.12.6, Frontend React/TypeScript, dépendances npm/Maven, configuration production (`application-prod.yml`, `render.yaml`, `SecurityConfig.java`), inspection passive en lecture seule de `https://samaadresse.onrender.com`.
- **Aucune tentative d'exploitation destructive ni d'attaque active n'a été menée contre la production.**

---

## 1. Synthèse des vulnérabilités identifiées

| ID | Gravité | Titre | Composant / Fichier | Statut |
|---|---|---|---|---|
| **SEC-01** | **ÉLEVÉE** | Refresh token jamais révoqué en base PostgreSQL lors de la déconnexion | `AuthService.java:202`, `AuthController.java:96` | Confirmée (code) |
| **SEC-02** | **MOYENNE** | Politique CSP uniquement en `Report-Only` (aucune protection XSS appliquée) | `SecurityConfig.java:39-47, 127` | Confirmée (code + live) |
| **SEC-03** | **MOYENNE** | Stockage de l'Access Token JWT en `sessionStorage` (exposé à tout XSS) | `frontend/src/auth/AuthProvider.tsx:10-35` | Confirmée (code) |
| **SEC-04** | **MOYENNE** | Absence de limitation de débit sur `/api/auth/register` + énumération d'emails (`409`) | `AuthController.java:43`, `AuthService.java:51-54` | Confirmée (code) |
| **SEC-05** | **MOYENNE** | Dépendance de production vulnérable (`react-router-dom@6.30.6` — Open Redirect) + 19 vulnérabilités dev (`npm audit`) | `frontend/package.json`, `frontend/package-lock.json` | Confirmée (`npm audit`) |
| **SEC-06** | **MOYENNE** | Métadonnées EXIF/GPS conservées sur les photos ≤ 800 px et WebP + absence de garde anti-decompression-bomb | `FileStorageService.java:82-111`, `ImageMagicBytesValidator.java:26` | Confirmée (code) |
| **SEC-07** | **MOYENNE** | Injection JSON potentielle via concaténation brute de `request.getRequestURI()` sur 401/403 | `SecurityConfig.java:76, 81` | Confirmée (code) |
| **SEC-08** | **FAIBLE** | Access Token non révocable et statut `user.enabled` non revérifié pendant 15 minutes | `JwtAuthenticationFilter.java:34-43` | Confirmée (code) |
| **SEC-09** | **FAIBLE** | Limiteurs de débit en mémoire (`ConcurrentHashMap`) non bornés et non distribués | `RateLimiterService.java:16`, `ReportRateLimiter.java` | Confirmée (code) |
| **SEC-10** | **FAIBLE** | Matcher `GET /api/addresses/*` en `permitAll()` recouvrant `/api/addresses/mine` | `SecurityConfig.java:91` | Confirmée (code) |
| **SEC-11** | **FAIBLE** | Comptes de démonstration actifs en production (`DEMO_SEED=true`) et Swagger/OpenAPI public sans auth | `render.yaml:22`, `application-prod.yml:39-44` | Confirmée (code + live) |

> **Nombre de vulnérabilités :** `0 CRITIQUE`, `1 ÉLEVÉE`, `6 MOYENNES`, `4 FAIBLES`.

---

## 2. Analyse détaillée par vulnérabilité

### SEC-01 — [ÉLEVÉE] Non-révocation serveur du Refresh Token à la déconnexion
- **Localisation :** `backend/src/main/java/sn/samaadresse/service/AuthService.java:180-187, 200-208` et `backend/src/main/java/sn/samaadresse/controller/AuthController.java:94-101`.
- **Preuve technique :**
  - `setRefreshTokenCookie` émet le cookie avec `Path=/api/auth/refresh; HttpOnly; SameSite=Strict`.
  - L'endpoint `POST /api/auth/logout` lit `@CookieValue(name = "refreshToken", required = false) String refreshToken`.
  - Conformément à RFC 6265 §5.1.4, un navigateur n'envoie un cookie `Path=/api/auth/refresh` **que** pour des requêtes vers `/api/auth/refresh*`, **jamais** vers `/api/auth/logout`.
- **Scénario d'exploitation :** un poste partagé ou un attaquant ayant capturé le cookie `refreshToken` (ex. avant déconnexion légitime de la victime) peut continuer à appeler `POST /api/auth/refresh` et obtenir de nouveaux Access Tokens valides pendant **7 jours**, alors même que l'utilisateur a explicitement cliqué sur « Se déconnecter ».
- **Impact :** persistance d'une session compromise après déconnexion explicite ; violation du contrôle de cycle de vie de session (OWASP ASVS V3.3).
- **Recommandation :** définir `Path=/api/auth` sur le cookie `refreshToken` (ainsi envoyé uniquement à `/api/auth/refresh` et `/api/auth/logout`), **et** en complément, accepter un `Bearer` token facultatif sur `/api/auth/logout` pour révoquer tous les `refresh_tokens` de l'utilisateur en base.

### SEC-02 — [MOYENNE] Content-Security-Policy uniquement en mode `Report-Only`
- **Localisation :** `backend/src/main/java/sn/samaadresse/config/SecurityConfig.java:39-47, 127`.
- **Preuve live :** `GET https://samaadresse.onrender.com/api/health` retourne `Content-Security-Policy-Report-Only` mais **aucun en-tête `Content-Security-Policy`**. De plus, `style-src` autorise `'unsafe-inline'`.
- **Impact :** aucune défense en profondeur bloquante côté navigateur contre l'exécution de scripts injectés en cas de faille XSS future.
- **Recommandation :** passer en `Content-Security-Policy` enforcing (en vérifiant la compatibilité Leaflet/fonts/tuiles OSM) et supprimer les styles inline (`AdminUsersPage.tsx:16`, `AdminReportsPage.tsx:143`, `RouteControls.tsx:92`) pour retirer `'unsafe-inline'`.

### SEC-03 — [MOYENNE] Access Token JWT persisté dans `sessionStorage`
- **Localisation :** `frontend/src/auth/AuthProvider.tsx:10-35`.
- **Preuve :** `sessionStorage.setItem('samaadresse.session', JSON.stringify({ token, expiresAt, user }))`.
- **Scénario d'exploitation :** toute injection XSS dans l'origine ou extension malveillante peut lire directement `sessionStorage.getItem('samaadresse.session')` et exfiltrer l'Access Token valide 15 min (contrairement à un stockage en mémoire JS pure couplé au cookie `HttpOnly` refresh).
- **Recommandation :** conserver l'Access Token uniquement dans l'état React / mémoire module et déclencher `POST /api/auth/refresh` silencieusement au montage initial (ce qui résout aussi la perte de session lors de l'ouverture d'un nouvel onglet).

### SEC-04 — [MOYENNE] Endpoint `/api/auth/register` non rate-limité et énumération d'emails
- **Localisation :** `backend/src/main/java/sn/samaadresse/controller/AuthController.java:42-46` et `AuthService.java:51-54`.
- **Preuve :** contrairement à `/login` (limité à 5 req/min/IP), `/register` n'appelle pas `rateLimiterService.checkRateLimit(...)`. De plus, il retourne `409 Conflict` avec le message explicite `"L'adresse email '...' est déjà utilisée"`, permettant l'énumération automatisée des comptes existants et le spam de création de comptes (et le déni de service CPU via BCrypt coût 12!).
- **Recommandation :** appliquer une limite stricte (ex. 5 inscriptions/heure/IP) et renvoyer un message générique en cas de conflit.

### SEC-05 — [MOYENNE] Vulnérabilités de dépendances (`npm audit`)
- **Localisation :** `frontend/package.json`, `frontend/package-lock.json`.
- **Preuve mesurée (`npm audit --json`) :** `20` vulnérabilités totales (`3 CRITICAL`, `1 HIGH`, `14 MODERATE`, `2 LOW`) :
  - **En production (runtime embarqué dans le bundle) :** `react-router-dom@6.30.6` / `react-router` (**MODERATE** — Open Redirect via backslash dans `<Link>` et `useNavigate`, contournement CVE-2025-68470).
  - **En développement / CI uniquement (non embarquées dans le bundle de prod) :** `vitest@2.1.9` / `@vitest/coverage-v8` / `tinypool` (**CRITICAL** — Prototype Pollution -> RCE si serveur Vitest UI ouvert), `vite@6.3.5` (**HIGH** — Path Traversal sur `.map` en serveur dev), `esbuild`, `glob`, `minimatch`, `eslint`.
- **Recommandation :** mettre à jour `react-router-dom` vers une version corrigée en priorité, puis monter `vite` et `vitest` (v3/v4) et ajouter `npm audit --omit=dev --audit-level=moderate` dans `ci.yml`.

### SEC-06 — [MOYENNE] Conservation de métadonnées EXIF/GPS et absence de garde anti-decompression-bomb
- **Localisation :** `backend/src/main/java/sn/samaadresse/service/FileStorageService.java:82-111` et `ImageMagicBytesValidator.java:26`.
- **Preuve :**
  1. `ImageIO` ne ré-encode que `if (original != null && original.getWidth() > 800)`. Une photo ≤ 800 px ou un fichier WebP est stocké tel quel (`rawBytes`), conservant les métadonnées EXIF (modèle de téléphone, horodatage, GPS exact de prise de vue) et d'éventuelles données polyglottes en fin de fichier.
  2. `ImageIO.read(in)` décode directement l'image en mémoire sans vérifier préalablement ses dimensions via `ImageReader.getWidth/getHeight` : un PNG compressé de 50 Ko codant une image 30 000 × 30 000 px provoquerait un `OutOfMemoryError` sur le conteneur Render limité à 512 Mo.
  3. La signature PNG n'est vérifiée que sur 4 octets (`89 50 4E 47`) au lieu des 8 octets standards (`89 50 4E 47 0D 0A 1A 0A`).
- **Recommandation :** vérifier les 8 octets PNG, inspecter les dimensions avant décodage (ex. max 8000×8000 px) et ré-encoder systématiquement en JPEG/PNG propre pour purger tout EXIF.

### SEC-07 — [MOYENNE] Concaténation brute de `request.getRequestURI()` dans les réponses JSON 401/403
- **Localisation :** `backend/src/main/java/sn/samaadresse/config/SecurityConfig.java:76, 81`.
- **Preuve :** `"{\"status\":401,...,\"path\":\"" + request.getRequestURI() + "\"}"`.
- **Scénario :** une requête vers une URI contenant des guillemets encodés ou caractères spéciaux peut corrompre la structure JSON de la réponse d'erreur (alors que `GlobalExceptionHandler` sérialise proprement via Jackson `ErrorResponse`).
- **Recommandation :** sérialiser `ErrorResponse` avec l'`ObjectMapper` Spring injecté.

### SEC-08 — [FAIBLE] Fenêtre de 15 min avant prise en compte de désactivation ou déconnexion sur Access Token
- **Localisation :** `backend/src/main/java/sn/samaadresse/security/JwtAuthenticationFilter.java:34-43`.
- **Analyse :** comportement standard d'un JWT stateless ; un compte désactivé (`enabled=false`) ou déconnecté conserve des droits pendant au plus 15 minutes (`JWT_ACCESS_EXP=900000`). Acceptable pour un JWT court, à documenter ou compléter par une liste de révocation courte pour les rôles `ADMIN`.

### SEC-09 — [FAIBLE] Caches de limitation de débit en mémoire non bornés
- **Localisation :** `backend/src/main/java/sn/samaadresse/security/RateLimiterService.java:16` et `RouteService.java:47`.
- **Analyse :** un afflux d'IP distribuées crée indéfiniment des entrées dans `ConcurrentHashMap` sans éviction TTL/taille maximale, exposant la JVM 512 Mo à une dérive mémoire lente. En outre, les quotas sont remis à zéro à chaque redémarrage/déploiement.
- **Recommandation :** remplacer par Caffeine (`maximumSize(10_000)`, `expireAfterAccess(15 min)`).

### SEC-10 — [FAIBLE] Règle `GET /api/addresses/*` trop large dans `SecurityFilterChain`
- **Localisation :** `backend/src/main/java/sn/samaadresse/config/SecurityConfig.java:91`.
- **Analyse :** `antMatcher(HttpMethod.GET, "/api/addresses/*")` laisse passer `GET /api/addresses/mine` au niveau du filtre HTTP ; l'accès est heureusement bloqué en seconde ligne par `@PreAuthorize("isAuthenticated()")` (`AddressController.java:185`) et `GlobalExceptionHandler:263-281` retourne bien `401`. Néanmoins, l'ordre des matchers devrait explicitement exiger `.authenticated()` sur `/api/addresses/mine` avant le `permitAll()` sur le code.

### SEC-11 — [FAIBLE] Données démo en production et Swagger public
- **Localisation :** `render.yaml:22` (`DEMO_SEED: "true"`), `application-prod.yml:39-44`.
- **Analyse :** des comptes de démonstration connus (`demo@samaadresse.sn`, `fatou@samaadresse.sn`, `admin@samaadresse.sn`) sont actifs sur l'instance de production (sécurisés uniquement par la robustesse de `DEMO_PASSWORD` / `ADMIN_PASSWORD`). L'exposition publique de `/swagger-ui.html` est cohérente avec une API publique mais facilite la cartographie des endpoints `/api/admin/**`.

---

## 3. Points forts sécurité vérifiés

- **Autorisation & Anti-IDOR :** double verrou `SecurityConfig` + `@PreAuthorize` + vérification d'appartenance `address.getOwner().getId().equals(currentUser.getId())` sur `updateAddress`, `updateVisibility`, `archiveAddress`, `restoreAddress`, `deleteAddressPhoto`, `uploadAddressPhoto` (couvert par `AddressLifecycleAndModerationTest` et `AddressPhotoTest`).
- **SQL Injection :** 100 % des requêtes passent par Spring Data JPA / JPQL avec paramètres liés (`@Param`) — aucune concaténation SQL (sauf `ProductionFeaturesTest` en test unitaire sur constante fixe).
- **Secrets :** `.env` absent de Git, `.env.example` strictement sans valeurs, `JwtProvider` bloque le démarrage en profil `prod` si `JWT_SECRET` est vide ou `< 32` octets.
- **Protection IP & Proxy :** `ClientIpResolver` ignore `True-Client-IP`, n'utilise jamais la tête falsifiable de `X-Forwarded-For`, s'appuie sur `TRUSTED_PROXY_HOPS=1` / `CF-Connecting-IP` en prod.
- **Protection des données personnelles :** aucune donnée de contact (email, téléphone) n'est présente dans `PublicAddressResponse` ni `DirectoryItemResponse` ; le nom du propriétaire est strictement opt-in (`showOwnerName`) ; `PhoneMasker` masque les numéros dans les logs SMS ; `ReportRateLimiter` stocke uniquement `SHA-256(IP)`.
- **En-têtes HTTP live validés sur `https://samaadresse.onrender.com` :** `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(self)`.
- **CORS :** désactivé en production (mono-origine strict) et restreint à `localhost`/`127.0.0.1` en `dev`/`e2e`.
