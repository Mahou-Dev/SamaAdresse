# Rapport de Vérification Smoke Production (`smoke-prod.sh`)

- **Cible testée :** `http://localhost:8082`
- **Date d'exécution :** 2026-10-20 10:48:48 UTC
- **Statut global :** **Atteint**

| Vérification | Statut | Détail mesuré |
|---|:---:|---|
| GET /api/health | **Atteint** | `HTTP 200, corps={"status":"UP"}` |
| GET / et GET /a/ZIG-KBG-4271 (SPA fallback) | **Atteint** | `GET / -> 200 (Cache-Control: no-cache) ; GET /a/ZIG-KBG-4271 -> 200 (Cache-Control: no-cache)` |
| GET /assets/index-CQLV-z3d.js (cache long immuable) | **Atteint** | `HTTP 200, taille=337965 octets, Cache-Control: max-age=31536000, public, immutable` |
| GET /api/addresses/ZIG-KBG-4271 | **Atteint** | `HTTP 200, code=ZIG-KBG-4271, photoUrl=/uploads/00000000-0000-4000-8000-000000000001.jpg` |
| GET /uploads/00000000-0000-4000-8000-000000000001.jpg (photo en base + ETag + 304) | **Atteint** | `1er appel: HTTP 200 (66775 octets, ETag="3254cf262b6dfe7edd79b16f369cfdb8", Cache-Control=max-age=31536000, public, immutable) ; 2e appel (If-None-Match): HTTP 304` |
| GET /api/addresses/ZIG-KBG-4271/qrcode | **Atteint** | `HTTP 200, Content-Type=image/png, taille=410 octets (signature PNG valide)` |
| GET /api/public/directory?quartier=KBG | **Atteint** | `HTTP 200, totalElements=2` |
| GET /api/public/route | **Atteint** | `HTTP 200, distance=3543.0 m, duration=425.1 s` |
| POST /api/auth/login + attributs Set-Cookie | **Atteint** | `HTTP 200, token reçu (323 car.), Set-Cookie contient HttpOnly, SameSite=Strict, Path=/api/auth/refresh` |
| Cycle de vie photo en base PostgreSQL (création -> lecture 200 -> suppression -> 404) | **Atteint** | `Création=201, Upload=200 (/uploads/ac32706f-1618-4acd-bd98-7fb6b1952183.jpg), Lecture=200 (25892 octets), Suppression=200, Lecture après suppression=404` |
| En-têtes de sécurité HTTP (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only) | **Atteint** | `X-Content-Type-Options=nosniff ; Referrer-Policy=strict-origin-when-cross-origin ; Permissions-Policy=geolocation=(self), camera=(self) ; CSP-Report-Only présent (247 car.)` |
| GET /sw.js (Service Worker PWA) | **Atteint** | `HTTP 200, Content-Type=text/javascript, taille=5540 octets` |
| GET /manifest.webmanifest (Manifeste PWA) | **Atteint** | `HTTP 200, name=SamaAdresse, theme_color=#12304F` |
| GET /icons/icon-192.png et /icons/icon-512.png (Icônes PWA) | **Atteint** | `icon-192 -> 200 (1953 octets) ; icon-512 -> 200 (5692 octets)` |
| GET /v3/api-docs (Spécification OpenAPI 3.0) | **Atteint** | `HTTP 200, version openapi=3.0.1, titre=SamaAdresse API` |
| POST /api/auth/refresh sans cookie (Rejet 401) | **Atteint** | `HTTP 401, corps={"timestamp":"2026-10-20T10:48:45.248491599Z","status":401,"error":"Unauthorized","message":"Refresh token absent","path":"/api/auth/refresh"}` |
| GET /cette-page-n-existe-pas (Repli SPA vers index.html) | **Atteint** | `HTTP 200, index.html servi correctement pour routage côté client` |
| Décodage du QR Code téléchargé (test-qr-decode.mjs) | **Atteint** | `code=0, sortie=SUCCÈS : QR Code téléchargé valide (300x300), zone calme blanche conforme, décodé en : http://localhost:8082/a/ZIG-KBG-4271` |
| Table flyway_schema_history dans PostgreSQL (hôte: localhost:5432 (conteneur db docker compose)) | **Atteint** | `migrations appliquées=2 migrations appliquées avec succès` |
| POST /api/admin/reset-rate-limits avec jeton ADMIN (404 en profil prod) | **Atteint** | `HTTP 404 (contrôleur dev désactivé en profil prod)` |
| Limiteur de débit login D-02 (6 tentatives, 429 attendu sur identifiant inexistant) | **Atteint** | `Codes HTTP observés : [401, 401, 401, 429, 429, 429], Retry-After=6` |
