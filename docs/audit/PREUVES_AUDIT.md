# 08 — PREUVES D'AUDIT ET TRAÇABILITÉ DES VÉRIFICATIONS

Ce document consigne de manière reproductible l'ensemble des commandes exécutées, les résultats bruts observés, les preuves de code et les contrôles d'intégrité Git réalisés pendant l'audit en lecture seule du 27 novembre 2026.

---

## 1. Empreinte Git initiale (avant audit)

```text
Branche active : feature/frontend-migration
HEAD initial   : 8fe7ce9498e0fe820dda73a627305d334944af48
git status --short (état initial préexistant) :
 M docs/audit/VERIFY.md
 M docs/audit/newman.json
 M docs/audit/smoke-prod.md
 M frontend/test-results/.last-run.json
```

*(Références distantes vérifiées en lecture seule par `git ls-remote origin main feature/frontend-migration` : `origin/feature/frontend-migration = 8fe7ce9498e0fe820dda73a627305d334944af48`, `origin/main = aaf8bf873b38aa31b7229bced01183a91a82b764`.)*

---

## 2. Preuves de couverture et qualité (Phase 6)

### Backend — Analyse JaCoCo XML (`backend/target/site/jacoco/jacoco.xml`)
- **Suites exécutées :** `141` tests JUnit 5 (`0` échec, `0` erreur, `0` ignoré), confirmés aussi sur PostgreSQL 16 dans GitHub Actions run #18 (`140496384030`) et #20 (`45998578616`).
- **Résultats mesurés :**
```text
INSTRUCTION : 7537/9937 (75.85%)
BRANCH      : 541/926 (58.42%)
LINE        : 1722/2264 (76.06%)
COMPLEXITY  : 399/803 (49.69%)
METHOD      : 256/340 (75.29%)
CLASS       : 82/91 (90.11%)
```
- **Packages les moins couverts :** `sn/samaadresse/controller` (`LINE=62/154 = 40.3%`, `BRANCH=14/50 = 28.0%`), `sn/samaadresse/domain/entity` (`LINE=10/31 = 32.3%`, `BRANCH=2/12 = 16.7%`), `sn/samaadresse/security` (`BRANCH=48/96 = 50.0%`).

### Frontend — Vitest v8 (`npx vitest run --coverage --coverage.reportsDirectory=/tmp/samaadresse-audit-fe-coverage`)
- **Résultat :** `10/10` fichiers de test, `61/61` tests réussis.
- **Totaux mesurés (`/tmp/samaadresse-audit-fe-coverage/coverage-summary.json`) :**
```json
{
  "lines":      { "total": 4542, "covered": 3016, "pct": 66.4 },
  "statements": { "total": 4542, "covered": 3016, "pct": 66.4 },
  "functions":  { "total": 299,  "covered": 200,  "pct": 66.88 },
  "branches":   { "total": 926,  "covered": 682,  "pct": 73.65 }
}
```
- **Fichiers à 0 % / très faible couverture :** `src/components/map/*` (`0%`), `src/pages/MapPage.tsx` (`0%`), `src/pages/admin/AdminAddressesPage.tsx` (`0%`), `src/pages/admin/AdminUsersPage.tsx` (`0%`), `src/pages/AccountPage.tsx` (`3.17%`), `src/hooks/useInstallPrompt.ts` (`8.69%`), `src/lib/drafts.ts` (`11.34%`), `src/lib/photo.ts` (`14.70%`), `src/pages/SearchPage.tsx` (`28.16%`).

### Sécurité dépendances (`cd frontend && npm audit --json`)
```text
total: 20 (critical: 3, high: 1, moderate: 14, low: 2)
- CRITICAL : vitest, @vitest/coverage-v8, tinypool (devDependencies)
- HIGH     : vite@6.3.5 (devDependency)
- MODERATE : react-router-dom@6.30.6 / react-router (PRODUCTION runtime — Open Redirect via backslash), esbuild, glob, minimatch, @vitest/mocker, typescript-eslint, vite-node
- LOW      : eslint, @eslint/plugin-kit
```

---

## 3. Preuves documentation, OpenAPI, UML et CI/CD (Phases 7 & 8)

### Scripts d'hygiène exécutés
- `python3 scripts/check-env-vars.py` : `34` variables backend + `4` frontend = `37` dans `.env.example` = `37` dans `README.md` (`0 divergence — Atteint`).
- `python3 scripts/check-readme-links.py` : `37` liens relatifs vérifiés (`Tous pointent vers des fichiers existants — Atteint`).
- Audit `docs/api/openapi.json` : `OpenAPI 3.0.1`, `29 paths`, `31 opérations`, `missing_summary=0`, `missing_resp=0`.
- Inventaire UML `docs/uml/` : `12` diagrammes sources `.puml` (`01-cas-utilisation`, `02-classes-domaine`, `03a`, `03b`, `04` à `11` séquences) + `12` PNG + `12` SVG dans `docs/uml/rendus/`.

### Runs GitHub Actions vérifiés via API GitHub
- `CI — SamaAdresse` #18 (`feature/frontend-migration` @ `8fe7ce9`, ID `45996284595`) : `completed success` (4/4 jobs : `secrets`, `backend`, `frontend`, `e2e`).
- `CI — SamaAdresse` #20 (`main` @ `aaf8bf8`, ID `45998578616`) : `completed success`.
- `CD — Déploiement Production SamaAdresse (Render)` #1 (`main` @ `aaf8bf8`, ID `45998578589`) : `completed success`.

---

## 4. Preuves live en lecture seule sur `https://samaadresse.onrender.com` (Phases 2, 8 & 9)

### A. Sondes HTTP GET (18 contrôles sans mutation)
```text
[Health] HTTP 200 (1518ms, 15B) body={"status":"UP"}
  HSTS=max-age=31536000; includeSubDomains | XCTO=nosniff | XFO=DENY
  RP=strict-origin-when-cross-origin | PP=geolocation=(self), camera=(self)
  CSP-Report-Only=True | CSP (enforcing)=False
[Root HTML] HTTP 200 (611ms, 996B) bundle=['/assets/index-BzAtSjBR.js'] CC=no-cache
[Public address ZIG-KBG-4271] HTTP 200 (1401ms, 297B) code=ZIG-KBG-4271 lat=12.5738 lon=-16.2650 photoUrl=/uploads/00000000-0000-4000-8000-000000000001.jpg
[Public address nonexistent] HTTP 404 (703ms, 176B)
[QR PNG] HTTP 200 (2142ms, 578B)
[Directory KBG] HTTP 200 (1753ms, 833B) totalElements=2
[Directory quartier=Boucotte] HTTP 200 (904ms, 315B) totalElements=0   <-- ANOMALIE PROUVÉE
[Directory q=Medina (no accent)] HTTP 200 (820ms, 536B) totalElements=1
[Route car] HTTP 503 (2876ms, 179B) msg="Service d'itinéraire temporairement indisponible."  <-- PANNE ORS PROUVÉE
[OpenAPI JSON] HTTP 200 (20071ms, 46814B)
[Swagger UI] HTTP 200 (1321ms, 734B)
[Manifest] HTTP 200 (610ms, 908B) name=SamaAdresse display=standalone icons=3
[Service Worker] HTTP 200 (517ms, 4625B)
[Icon 192] HTTP 200 (399ms, 18018B)
[Icon 512] HTTP 200 (415ms, 51167B)
[Private /mine unauth] HTTP 401 (364ms, 148B)
[Admin /reports unauth] HTTP 401 (461ms, 102B)
[Uploads dir listing] HTTP 404 (342ms, 175B)
```

### B. Benchmark résolution locale hors ligne (Critère #1)
- Exécution Node sur `frontend/src/data/geo-grid.json` (`1 000` résolutions) : **`0,831 ms` total (`0,0008 ms/op`)**.

### C. Preuves Chromium Playwright autonome (`/tmp/samaadresse-audit-playwright.json`)
1. **Décodage QR Code réel via `jsQR` (Critère #2) :**
   - Backend PNG (`/api/addresses/ZIG-KBG-4271/qrcode`) : `578 B`, `pngSigValid=true`, `300 × 300 px`, `whiteQuiet=true`, `decodedUrl = "https://samaadresse.onrender.com/a/ZIG-KBG-4271"`.
   - Frontend SVG (`/a/ZIG-KBG-4271/partage`) : `decodedUrl = "https://samaadresse.onrender.com/a/ZIG-KBG-4271"`.
2. **PWA & Service Worker (Critère #6) :**
   - `scope = "https://samaadresse.onrender.com/"`, `activeState = "activated"`, `hasController = true`.
   - Caches présents : `samaadresse-shell-v2` (16 entrées), `samaadresse-public-v2` (2 entrées : JSON + photo), `samaadresse-tiles-v2`.
3. **Test hors ligne réel avec coupure réseau (`context.setOffline(true)` + `page.reload()`) (Critère #4) :**
   - Fiche visitée `/a/ZIG-KBG-4271` : `visitedAddressReloadOk = true` en `2 024 ms`, `h1 = "ZIG-KBG-4271"`, `hasCoords = true`, `hasDescription = true`, `photoNaturalWidth = 1200`, `offlineNotice = "Hors ligne : copie de cette fiche enregistrée sur l’appareil le 27 novembre 2026 à 13:16."`.
   - Fiche non visitée `/a/DKR-PLT-9999` : affiche `"Vous êtes hors ligne — Cette fiche n’a pas encore été consultée sur cet appareil : elle n’est pas disponible sans connexion."`.
4. **Cartographie live :**
   - `/a/ZIG-KBG-4271` : `1` marqueur Leaflet, `4/4` tuiles OSM chargées, photo `1200 px` chargée.
   - `/carte` (1440 px) : `11` marqueurs Leaflet, `16` tuiles OSM chargées.
5. **Responsive & A11y (6 viewports : `360`, `375`, `390`, `768`, `1024`, `1440 px`) :**
   - `overflows = []` (0 débordement horizontal), `a11yIssues = []`, `pageErrorsCount = 0`.
   - `mobileSmallTargets` détectés sur `360/375/390 px` : `Se connecter` (`90×19`), logo (`156×32`), `Afficher le mot de passe` (`36×36`), chips (`36 px` hauteur), onglets recherche (`40 px` hauteur), zoom Leaflet (`30×30`).
6. **Ratios de contraste WCAG 2.1 calculés (`tokens.css` / `components.css`) :**
   - `.button-primary` (`#fff` / `#0b6cf0`) : `4,75:1` (AA OK).
   - `.button-success` (`#fff` / `#13b07f`) : **`2,78:1` (FAIL)**.
   - `.button-danger` (`#fff` / `#e5484d`) : **`3,91:1` (FAIL AA texte normal)**.
   - `--ink-400` (`#7b8ca1` / `#fff`) : **`3,44:1` (FAIL AA)**.

---

## 5. Références exactes aux fichiers sources audités (preuves principales)

- `backend/src/main/java/sn/samaadresse/service/AuthService.java` : lignes 51–58 (email case check), 180–212 (`logout` & `Path=/api/auth/refresh`).
- `backend/src/main/java/sn/samaadresse/controller/AuthController.java` : lignes 42–46 (`/register` sans rate limit), 94–101 (`/logout`).
- `backend/src/main/java/sn/samaadresse/config/SecurityConfig.java` : lignes 39–47 (`CSP_REPORT_ONLY_VALUE`), 76 & 81 (JSON non échappé), 91 (`GET /api/addresses/*`).
- `backend/src/main/java/sn/samaadresse/security/JwtAuthenticationFilter.java` : lignes 34–44.
- `backend/src/main/java/sn/samaadresse/security/RateLimiterService.java` : ligne 16 (`ConcurrentHashMap` non borné).
- `backend/src/main/java/sn/samaadresse/service/FileStorageService.java` : lignes 82–111 (EXIF conservé ≤ 800 px / WebP, absence de garde dimensions).
- `backend/src/main/java/sn/samaadresse/service/DbPhotoStorage.java` : ligne 48 (extension `.jpg` forcée).
- `backend/src/main/java/sn/samaadresse/security/ImageMagicBytesValidator.java` : ligne 26 (PNG 4 octets).
- `backend/src/main/java/sn/samaadresse/repository/AddressRepository.java` : lignes 31–63 (`quartier = :quartier` exact, `LIKE '%...%'`).
- `backend/src/main/java/sn/samaadresse/service/AddressCodeGenerator.java` : lignes 42–55 (`1000..9999`, 9 000 codes/quartier).
- `backend/src/main/java/sn/samaadresse/service/ReservedCodeService.java` : ligne 29 (`ALLOWED_ZONES = Set.of("ZIG", "DKR")`).
- `backend/src/main/java/sn/samaadresse/service/RouteService.java` : lignes 47 (`routeCache`), 103–106 (503 sans clé), 135–200 (fallback zigzag).
- `backend/src/main/java/sn/samaadresse/sms/SendFlashSmsProvider.java` : lignes 9–45 (squelette 502).
- `backend/src/main/java/sn/samaadresse/exception/GlobalExceptionHandler.java` : lignes 391–404 (500 non logué).
- `backend/src/main/java/sn/samaadresse/controller/HealthController.java` : lignes 21–35 (liveness sans DB).
- `backend/src/main/resources/db/migration/V1__init.sql` & `V2__photo_blobs.sql`.
- `render.yaml` : lignes 13 (`SMS_PROVIDER: mock`) et 22 (`DEMO_SEED: "true"`).
- `frontend/public/sw.js` : lignes 11–111.
- `frontend/src/auth/AuthProvider.tsx` : lignes 10–43 (`sessionStorage`).
- `frontend/src/lib/drafts.ts` : lignes 56–129 (IndexedDB sans `reservedCode`).
- `frontend/src/lib/geolocation.ts` : lignes 52–102 (`maxWaitMs = 15_000`).
- `frontend/src/pages/SearchPage.tsx` : lignes 100–138 (recherche quartier texte + onglets non combinables).
- `frontend/src/pages/MapPage.tsx` : lignes 47–63 (burst N+1 de 24 requêtes).
- `frontend/src/pages/SharePage.tsx` : lignes 82–90 (`sms:` natif).
- `frontend/src/pages/AccountPage.tsx` : lignes 49, 59 (« Bientôt »).
- `frontend/src/pages/admin/AdminAddressesPage.tsx` & `AdminUsersPage.tsx`.
- `frontend/src/components/map/BaseMap.tsx` : lignes 38–42 (absence de `tileerror`).
- `frontend/src/styles/tokens.css` & `frontend/src/styles/components.css` : lignes 4, 10, 12, 91.
