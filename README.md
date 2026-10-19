# SamaAdresse

Plateforme web et PWA d'adressage numérique citoyen par géolocalisation GPS et QR code pour le Sénégal (Ziguinchor, Dakar, Saint-Louis).

---

## 1. Contexte et problème

Dans de nombreux quartiers résidentiels et périurbains du Sénégal, les voies ne portent pas de nom affiché et les habitations ou commerces n'ont pas de numéro de rue. Pour indiquer un lieu à un livreur, un visiteur, un artisan ou un service de secours, les habitants décrivent oralement un itinéraire à partir de repères locaux (« derrière la boulangerie, troisième concession à gauche après le château d'eau »). Cette transmission orale entraîne des retards, des appels répétés et des erreurs d'orientation, en particulier la nuit ou lorsque le visiteur ne connaît pas le quartier.

**SamaAdresse** permet à tout habitant ou commerçant de :
1. Capturer la position GPS de son entrée (ou placer le repère sur la carte), ajouter une description de terrain et une photo de façade facultative.
2. Obtenir un code d'adresse court, lisible et immuable au format `ZONE-QUARTIER-XXXX` (par exemple `ZIG-KBG-4271` pour Boucotte - Kangourou à Ziguinchor), accompagné d'une plaque numérique et d'un QR code imprimable.
3. Partager cette fiche par lien, WhatsApp ou SMS pour permettre à tout visiteur de consulter le repère, la photo et l'itinéraire routier ou piéton jusqu'à l'entrée, sans créer de compte.

---

## 2. État d'avancement par rapport au cahier des charges

| Exigence du cahier | Statut | Commentaire et preuve |
|---|:---:|---|
| **Authentification & Gestion des utilisateurs** (JWT, cookies HttpOnly SameSite=Strict, rôles PROPRIETAIRE / ADMIN) | **Fait** | Validé par tests d'intégration Spring Security (`AuthControllerTest`) et E2E Playwright. |
| **Génération et immuabilité du code d'adresse** (format `ZONE-QUARTIER-XXXX`, SecureRandom, coordonnées figées) | **Fait** | Vérifié unitairement (`AddressCodeGeneratorTest`) ; code et coordonnées protégés contre toute modification. |
| **Fiche publique & Plaque d'enseigne** (palette Ziguinchor, QR code PNG ZXing, réponse 410 neutre sur révocation) | **Fait** | Validé en local et conteneur (`smoke-prod.sh`, décodage QR jsQR, Playwright). |
| **Annuaire public opt-in** (`listed` décoché par défaut, filtrage quartier/type, recherche textuelle normalisée) | **Fait** | 4 tests dédiés dans `DirectoryControllerTest`, CLS = 0,000, audits Lighthouse conformes. |
| **Itinéraire OpenRouteService** (voiture/piéton, cache mémoire 5 min, proxy backend sans stockage de l'origine) | **Fait** | Réponses réelles consignées dans `docs/audit/ors-real-car.json` et `docs/audit/ors-real-foot.json`. |
| **Partage multi-canal** (Web Share API, WhatsApp pré-rempli, SMS GSM-7 ≤ 160 car., triple limitation de débit) | **Fait** | Providers `MockSmsProvider`, `TwilioSmsProvider`, `SendFlashSmsProvider` testés unitairement. |
| **Envoi et réception d'un SMS réel sur un téléphone physique** | **NON PROUVÉ** | Aucun compte Twilio/SendFlash crédité ni numéro physique de test disponible dans cet environnement. |
| **Mode hors ligne & PWA** (Service Worker Workbox, pré-réservation IndexedDB, synchronisation idempotente) | **Fait** | Délais mesurés dans `docs/audit/offline-timing.json` (< 3 s) et tests de reprise réseau E2E. |
| **Installation PWA via invite native sous certificat HTTPS public** | **NON PROUVÉ** | Testé localement sur `http://localhost:8082` avec Service Worker actif et mode hors ligne validé. |
| **Modération & Signalements publics** (signalement anonyme par IP hachée SHA-256, suspension admin, journal d'audit) | **Fait** | Testé dans `PublicReportControllerTest`, `AdminModerationControllerTest` et E2E. |
| **Sécurité IP cliente derrière Render** (`CF-Connecting-IP`, `X-Forwarded-For` sécurisé, `TRUSTED_PROXY_HOPS`) | **Fait** | Validé par `ClientIpResolverTest` (tests a, b, c, d). |
| **Comportement réel de la résolution d'IP derrière l'infrastructure Render** | **NON PROUVÉ** | Requiert un déploiement cloud actif sur Render (procédure de contrôle documentée ci-dessous). |
| **Déploiement effectif sur les infrastructures distantes (Render, Neon, GitHub Actions)** | **Fait** | Déployé et validé sur [https://samaadresse.onrender.com](https://samaadresse.onrender.com) (19/19 vérifications réussies le 2026-10-18 dans [`docs/audit/smoke-prod-render.md`](docs/audit/smoke-prod-render.md)). |
| **Design System & Palette visuelle** (Sable doré #EADFC8, Crème #FBF7EF, Bleu nuit #12304F, 0 blanc pur sauf QR/boutons) | **Fait** | Ratios de contraste WCAG AA/AAA calculés dans [`docs/audit/contrastes.md`](docs/audit/contrastes.md) ; 59 captures validées (189 au total dans `docs/audit`, 183 empreintes MD5 uniques). |

---

## 3. Architecture et pile technique

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Navigateur / PWA (React 19, TypeScript, Vite 8, Tailwind v4, Leaflet)    │
│  ├─ Service Worker (Workbox injectManifest : précache + cache /a/{code}) │
│  ├─ IndexedDB (codes réservés par utilisateur + file pendingAddresses)   │
│  ├─ AuthContext (JWT en mémoire + cookie HttpOnly SameSite=Strict)       │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ HTTPS (même origine en production)
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Conteneur unique Spring Boot 3.4.3 / Java 21 (Temurin JRE Alpine)        │
│  ├─ Ressources statiques SPA (index.html no-cache, /assets/* immutable)  │
│  ├─ Contrôleurs REST (/api/auth, /api/addresses, /api/public, /api/admin)│
│  ├─ ClientIpResolver + Limiteurs de débit en mémoire (Bucket4j, SHA-256) │
│  ├─ GeoGridService + AddressCodeGenerator + QrCodeService (ZXing)        │
│  ├─ PhotoStorage : DiskPhotoStorage (dev) / DbPhotoStorage bytea (prod)  │
│  └─ Flyway (V1__init.sql, V2__photo_blobs.sql) + HikariCP (max 5 conn.)  │
└───────────┬───────────────────────────────┬──────────────────────────────┘
            │ JDBC SSL                      │ HTTPS (proxy serveur)
            ▼                               ▼
┌───────────────────────────────┐ ┌────────────────────────────────────────┐
│ PostgreSQL 16 (Neon / Docker) │ │ Services externes                      │
│  ├─ users, refresh_tokens     │ │  ├─ OpenRouteService (itinéraires)     │
│  ├─ addresses, reserved_codes │ │  └─ Fournisseur SMS (Mock/Twilio/...)  │
│  ├─ address_reports           │ └────────────────────────────────────────┘
│  ├─ admin_actions             │
│  └─ photo_blobs (bytea)       │
└───────────────────────────────┘
```

Les diagrammes PlantUML détaillés et leur rapport de vérification sont disponibles dans :
- Documentation des diagrammes : [`docs/uml/README.md`](docs/uml/README.md)
- Tableau de vérification code/diagrammes : [`docs/uml/VERIFICATION.md`](docs/uml/VERIFICATION.md)
- Rendus PNG et SVG des diagrammes :
  - Cas d'utilisation : [`docs/uml/rendus/01-cas-utilisation.png`](docs/uml/rendus/01-cas-utilisation.png) ([SVG](docs/uml/rendus/01-cas-utilisation.svg))
  - Classes du domaine : [`docs/uml/rendus/02-classes-domaine.png`](docs/uml/rendus/02-classes-domaine.png) ([SVG](docs/uml/rendus/02-classes-domaine.svg))
  - Contrôleurs & Services : [`docs/uml/rendus/03a-classes-controleurs-services.png`](docs/uml/rendus/03a-classes-controleurs-services.png) ([SVG](docs/uml/rendus/03a-classes-controleurs-services.svg))
  - Services & Infrastructure : [`docs/uml/rendus/03b-classes-services-infrastructure.png`](docs/uml/rendus/03b-classes-services-infrastructure.png) ([SVG](docs/uml/rendus/03b-classes-services-infrastructure.svg))
  - Séquence — Création en ligne : [`docs/uml/rendus/04-seq-creation-en-ligne.png`](docs/uml/rendus/04-seq-creation-en-ligne.png) ([SVG](docs/uml/rendus/04-seq-creation-en-ligne.svg))
  - Séquence — Création hors ligne : [`docs/uml/rendus/05-seq-creation-hors-ligne.png`](docs/uml/rendus/05-seq-creation-hors-ligne.png) ([SVG](docs/uml/rendus/05-seq-creation-hors-ligne.svg))
  - Séquence — QR code vers fiche publique : [`docs/uml/rendus/06-seq-qr-vers-fiche.png`](docs/uml/rendus/06-seq-qr-vers-fiche.png) ([SVG](docs/uml/rendus/06-seq-qr-vers-fiche.svg))
  - Séquence — Itinéraire OpenRouteService (cache 5 min) : [`docs/uml/rendus/07-seq-itineraire.png`](docs/uml/rendus/07-seq-itineraire.png) ([SVG](docs/uml/rendus/07-seq-itineraire.svg))
  - Séquence — Partage SMS (limites 5/h, 3/24h, quota global) : [`docs/uml/rendus/08-seq-partage-sms.png`](docs/uml/rendus/08-seq-partage-sms.png) ([SVG](docs/uml/rendus/08-seq-partage-sms.svg))
  - Séquence — Signalement & Modération : [`docs/uml/rendus/09-seq-signalement-moderation.png`](docs/uml/rendus/09-seq-signalement-moderation.png) ([SVG](docs/uml/rendus/09-seq-signalement-moderation.svg))
  - Séquence — Authentification & Rotation : [`docs/uml/rendus/10-seq-authentification.png`](docs/uml/rendus/10-seq-authentification.png) ([SVG](docs/uml/rendus/10-seq-authentification.svg))
  - Séquence — Annuaire public opt-in : [`docs/uml/rendus/11-seq-annuaire.png`](docs/uml/rendus/11-seq-annuaire.png) ([SVG](docs/uml/rendus/11-seq-annuaire.svg))

---

## 4. Documentation de l'API

L'API REST est intégralement spécifiée au format OpenAPI 3.0 (`springdoc.api-docs.version=OPENAPI_3_0`) :

- **Interface interactive Swagger UI** : [`/swagger-ui.html`](http://localhost:8080/swagger-ui.html) en développement local, ou `http://localhost:8082/swagger-ui.html` sur le conteneur de production.
- **Spécification brute JSON** : [`/v3/api-docs`](http://localhost:8080/v3/api-docs) et fichier versionné [`docs/api/openapi.json`](docs/api/openapi.json).
- **Spécification brute YAML** : [`/v3/api-docs.yaml`](http://localhost:8080/v3/api-docs.yaml) et fichier versionné [`docs/api/openapi.yaml`](docs/api/openapi.yaml).
- **Complétude garantie par test automatique** : `OpenApiCompletenessTest` inspecte chaque contrôleur Spring au démarrage des tests et échoue si un endpoint, un résumé ou une réponse documentée est manquant.
- **Collection Postman** : [`docs/api/SamaAdresse.postman_collection.json`](docs/api/SamaAdresse.postman_collection.json), générée à partir de la spécification OpenAPI avec le dossier automatisé `Parcours démo`.
- **Exécution Newman en ligne de commande** :
  ```bash
  npx --yes newman run docs/api/SamaAdresse.postman_collection.json \
    --folder "Parcours démo" \
    --env-var "baseUrl=http://localhost:8082" \
    --env-var "demoPassword=VotreMotDePasseDemo2026!"
  ```

---

## 5. Sécurité

1. **Jeton d'accès JWT en mémoire** : Durée de vie courte (15 minutes), signature HMAC-SHA256, clé secrète obligatoire d'au moins 32 octets (`JWT_SECRET`). Conservé exclusivement en mémoire JavaScript (`apiClient.ts`), jamais dans `localStorage` ni `sessionStorage`.
2. **Jeton de rafraîchissement par cookie sécurisé** : Durée de vie 7 jours, transmis dans un cookie `HttpOnly; SameSite=Strict; Path=/api/auth/refresh` (avec attribut `Secure` activé en production via `COOKIE_SECURE=true`). Seule l'empreinte SHA-256 du jeton est persistée en base, avec révocation et rotation automatique à chaque rafraîchissement.
3. **Limitation de débit en mémoire (Bucket4j)** :
   - `/api/auth/login` : 5 tentatives par minute par IP cliente.
   - `/api/public/route` : 20 requêtes par minute par IP cliente.
   - `/api/public/directory` : 30 requêtes par minute par IP cliente.
   - `/api/public/addresses/{code}/reports` : 3 signalements par heure par IP, et 1 signalement par tranche de 24 h par couple `(adresse, SHA-256(IP))`.
   - `/api/addresses/{id}/share/sms` : 5 SMS par heure par utilisateur connecté, 3 SMS par 24 h par numéro destinataire (clé basée sur le hash SHA-256 du numéro E.164), et plafond quotidien global (`SMS_DAILY_CAP`, défaut 200 en dev, 20 en prod).
4. **Résolution sécurisée de l'adresse IP du client (`ClientIpResolver`)** :
   - L'en-tête `True-Client-IP` est **strictement ignoré** car falsifiable par le client.
   - Le premier élément de `X-Forwarded-For` n'est **jamais utilisé** (vulnérable à l'injection d'adresses factices en tête d'en-tête).
   - En environnement de production avec proxy inverse (`TRUSTED_PROXY_HOPS >= 1`) :
     - Si `CF-Connecting-IP` est présent (présent d'après la documentation Render, comportement à confirmer par la procédure de contrôle), il est prioritaire.
     - Sinon, l'adresse ajoutée par le dernier proxy de confiance dans `X-Forwarded-For` est extraite à l'index `(taille - TRUSTED_PROXY_HOPS)`.
   - En développement local sans proxy (`TRUSTED_PROXY_HOPS=0`), seule la socket distante directe (`request.getRemoteAddr()`) est utilisée.
   - *Référence consultée :* [Documentation Render sur les Load Balancers et en-têtes HTTP](https://render.com/docs/load-balancers).
5. **Procédure de contrôle après déploiement sur Render (statut actuel : NON PROUVÉ)** :
   - Étape 1 : Effectuer un appel depuis un premier équipement connecté en 4G/5G mobile, puis depuis un second équipement connecté en fibre/Wi-Fi domestique.
   - Étape 2 : Déclencher un dépassement de quota sur le premier équipement (ex. 6 tentatives de connexion rapides).
   - Étape 3 : Constater que le premier équipement reçoit un code HTTP `429 Too Many Requests`, tandis que le second équipement peut continuer d'interroger l'API sans être bloqué.
   - Étape 4 : Vérifier dans les journaux Render que les adresses IP consignées correspondent bien aux adresses IP publiques distinctes des deux équipements et non à l'IP interne du proxy Render (`127.0.0.1` ou `10.x.x.x`).
6. **En-têtes de sécurité HTTP** :
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(self), camera=(self)`
   - `Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; ...`
   - Cache statique long (`max-age=31536000, immutable`) sur `/assets/*` et `no-cache` sur `index.html`.

---

## 6. Attributions et licences

- **Cartographie** : © Contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright) (données sous licence Open Database License - ODbL).
- **Calcul d'itinéraires** : [OpenRouteService](https://openrouteservice.org/) (fourni par HeiGIT gGmbH).
- **Typographie d'interface** : Police *Outfit* conçue par Rodrigo Fuenzalida (licence [SIL Open Font License 1.1](https://openfontlicense.org)).
- **Typographie des codes d'adresses** : Police *JetBrains Mono* conçue par JetBrains (licence [SIL Open Font License 1.1](https://openfontlicense.org)).
- **Icônes d'interface** : Collection *Lucide Icons* (licence ISC).

---

## 7. Prérequis et lancement en développement

### Prérequis
- **Java 21** (Temurin JDK 21)
- **Node.js 22+** et **npm**
- **Docker** et **Docker Compose** (pour PostgreSQL 16 local)

### Démarrage rapide en développement
1. Copier le fichier d'environnement et renseigner vos variables locales :
   ```bash
   cp .env.example .env
   ```
2. Démarrer PostgreSQL 16 :
   ```bash
   docker compose up -d
   ```
3. Démarrer le backend Spring Boot (port `8080`, profil `dev`) :
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
4. Démarrer le frontend Vite (port `5173`) :
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

---

## 8. Lancement avec l'image Docker de production

Pour tester localement l'image Docker multi-étapes en profil `prod` (port `8082`, avec PostgreSQL 16, Flyway, `ddl-auto=validate`, stockage des photos en base `bytea`, en-têtes de sécurité et jeu de démonstration) :

```bash
docker compose -f docker-compose.prod-test.yml up --build -d
```

L'application complète (interface PWA + API REST sur la même origine) est accessible sur `http://localhost:8082`.

Pour exécuter le script de vérification fonctionnelle (`smoke-prod.sh`) sur ce conteneur :
```bash
./scripts/smoke-prod.sh http://localhost:8082
```

Pour exécuter les tests E2E Playwright contre ce conteneur :
```bash
cd frontend
PLAYWRIGHT_BASE_URL=http://localhost:8082 npx playwright test
```

Pour arrêter et nettoyer les conteneurs de test :
```bash
docker compose -f docker-compose.prod-test.yml down -v
```

---

## 9. Variables d'environnement

Aucun secret n'est présent dans les fichiers suivis par Git. Le modèle [`.env.example`](.env.example) liste l'ensemble des clés utilisables sans aucune valeur pré-remplie.

| Variable | Rôle | Obligatoire en `prod` | Exemple non sensible |
|---|---|:---:|---|
| `SPRING_PROFILES_ACTIVE` | Profil Spring Boot actif (`dev`, `e2e`, `prod`) | Oui | `prod` |
| `PORT` | Port HTTP d'écoute du serveur Spring Boot | Non (défaut `8080` en dev, `8082` en prod) | `8082` |
| `DATABASE_URL` | URL PostgreSQL au format Render/Neon (`postgresql://user:pass@host/db?sslmode=require`), convertie automatiquement en JDBC | Oui (ou `DB_URL`) | `postgresql://user:secret@ep-xxx.eu-central-1.aws.neon.tech/samaadresse?sslmode=require` |
| `DB_URL` | URL JDBC PostgreSQL explicite (alternative à `DATABASE_URL`) | Non | `jdbc:postgresql://db:5432/samaadresse` |
| `DB_USERNAME` | Nom d'utilisateur PostgreSQL (si non inclus dans `DATABASE_URL`) | Non | `samaadresse` |
| `DB_PASSWORD` | Mot de passe de la base PostgreSQL | Non | *(mot de passe base)* |
| `JWT_SECRET` | Clé secrète HMAC-SHA256 pour signer les JWT (**≥ 32 octets** en `prod`, sinon arrêt immédiat au démarrage) | Oui | *(chaîne aléatoire d'au moins 32 octets)* |
| `JWT_ACCESS_EXP` | Durée de validité du jeton d'accès JWT en millisecondes | Non (défaut `900000` = 15 min) | `900000` |
| `JWT_REFRESH_EXP` | Durée de validité du jeton de rafraîchissement en millisecondes | Non (défaut `604800000` = 7 jours) | `604800000` |
| `COOKIE_SECURE` | Active l'attribut `Secure` sur le cookie de rafraîchissement (`true` en HTTPS) | Non (défaut `true` en `prod`, `false` en dev) | `true` |
| `TRUSTED_PROXY_HOPS` | Nombre de sauts de proxy inverse de confiance pour l'extraction de l'IP cliente (`1` derrière Render/Cloudflare, `0` en local) | Non (défaut `1` en `prod`, `0` en dev) | `1` |
| `FRONTEND_BASE_URL` | URL publique de l'application (utilisée dans les QR codes et les liens partagés, doit débuter par `https://` en production) | Oui | `https://samaadresse.onrender.com` |
| `PHOTO_STORAGE` | Mode de stockage des photos de façade : `disk` (système de fichiers local) ou `db` (table PostgreSQL `photo_blobs`) | Non (défaut `db` en `prod`, `disk` en dev) | `db` |
| `UPLOAD_DIR` | Répertoire local de stockage des photos lorsque `PHOTO_STORAGE=disk` | Non (défaut `./uploads`) | `./uploads` |
| `ADMIN_EMAIL` | Adresse e-mail du compte administrateur initial créé de manière idempotente au démarrage | Oui | `admin@samaadresse.sn` |
| `ADMIN_PASSWORD` | Mot de passe initial du compte administrateur (**≥ 12 caractères** en `prod`) | Oui | *(mot de passe fort ≥ 12 car.)* |
| `DEMO_SEED` | Active le chargement idempotent des adresses et photos de démonstration en `prod` | Non (défaut `false`) | `true` |
| `DEMO_PASSWORD` | Mot de passe attribué aux comptes de démonstration lorsque `DEMO_SEED=true` | Si `DEMO_SEED=true` | *(mot de passe démo)* |
| `ORS_API_KEY` | Clé API OpenRouteService pour le calcul d'itinéraires (`/api/public/route`) | Non (503 propre si absente) | *(clé ORS)* |
| `ORS_BASE_URL` | URL de base de l'API OpenRouteService | Non (défaut `https://api.openrouteservice.org`) | `https://api.openrouteservice.org` |
| `SMS_PROVIDER` | Fournisseur d'envoi de SMS (`mock`, `console`, `twilio`, `sendflash`) | Non (défaut `mock`) | `mock` |
| `SMS_TIMEOUT` | Délai d'expiration des requêtes HTTP vers le fournisseur SMS | Non (défaut `5s`) | `5s` |
| `SMS_DAILY_CAP` | Plafond quotidien global de SMS de la plateforme (protection financière du crédit) | Non (défaut `20` en `prod`, `200` en dev) | `20` |
| `SMS_USER_HOURLY_LIMIT` | Plafond horaire d'envoi de SMS par utilisateur connecté | Non (défaut `5`) | `5` |
| `SMS_RECIPIENT_DAILY_LIMIT` | Plafond quotidien d'envoi de SMS par numéro destinataire (clé SHA-256) | Non (défaut `3`) | `3` |
| `TWILIO_ACCOUNT_SID` | Identifiant de compte Twilio (`AC...`) lorsque `SMS_PROVIDER=twilio` | Si `SMS_PROVIDER=twilio` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Jeton d'authentification Twilio lorsque `SMS_PROVIDER=twilio` | Si `SMS_PROVIDER=twilio` | *(jeton Twilio)* |
| `TWILIO_FROM_NUMBER` | Numéro d'expéditeur Twilio E.164 ou `MessagingServiceSid` (`MG...`) | Si `SMS_PROVIDER=twilio` | `+15005550006` |
| `TWILIO_API_BASE_URL` | URL de base de l'API Twilio (utile pour mocker l'API en test) | Non (défaut `https://api.twilio.com`) | `https://api.twilio.com` |
| `SENDFLASH_API_URL` | URL d'envoi de l'API SendFlash | Non | `https://api.sendflash.com/v1/sms/send` |
| `SENDFLASH_API_KEY` | Clé API du service d'envoi SendFlash | Si `SMS_PROVIDER=sendflash` | *(clé SendFlash)* |
| `SENDFLASH_SENDER_ID` | Nom d'expéditeur alphanumérique agréé (ex. `SamaAdresse`) | Non (défaut `SamaAdresse`) | `SamaAdresse` |
| `GEO_FALLBACK_MAX_DISTANCE_KM` | Rayon maximal de rattachement Haversine au quartier le plus proche | Non (défaut `3.0`) | `3.0` |
| `VITE_TILE_URL` | Modèle d'URL des tuiles cartographiques Leaflet | Non | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `VITE_TILE_ATTRIBUTION` | Mention textuelle d'attribution des tuiles cartographiques | Non | `&copy; OpenStreetMap contributors` |
| `VITE_API_BASE_URL` | URL de base de l'API pour le frontend Vite en mode séparé | Non (vide en conteneur unique même origine) | `http://localhost:8080` |

---

## 10. Tests et vérification automatique

Le script unique `./scripts/verify-all` exécute l'ensemble des contrôles et génère `docs/audit/VERIFY.md` ainsi que `rapport.md` :
- Scan d'absence de secrets et de clés dans les fichiers suivis par Git.
- Contrôle de stricte cohérence des variables d'environnement (`scripts/check-env-vars.py`).
- Contrôle de validité des liens relatifs du README (`scripts/check-readme-links.py`).
- Tests unitaires et d'intégration Backend (`./mvnw test`) + couverture JaCoCo (≥ 60 %) + test de complétude OpenAPI (`OpenApiCompletenessTest`).
- Vérification TypeScript (`tsc --noEmit`), linter (`oxlint`), tests unitaires Vitest, build de production Vite et budget de taille gzip (`check-size.mjs`).
- Contrôle des ratios de contraste WCAG AA/AAA sur tous les jetons de thème (`scripts/check-contrast.py` dans `docs/audit/contrastes.md`).
- Tests E2E Playwright (parcours en ligne, hors ligne, synchronisation, annuaire, itinéraire, modération) et vérification des 59 captures d'écran des lots 6, 7, 9 et 10 (dimensions 360×780 et 1440×900, empreintes MD5 uniques, 189 fichiers au total dans `docs/audit`).
- Audits Lighthouse sur les 8 pages (accessibilité = 100, bonnes pratiques = 100, performance ≥ 90, CLS < 0,1).
- Exécution de la collection Postman via Newman (`docs/audit/newman.json`).

```bash
# Vérification complète standard
./scripts/verify-all

# Vérification complète incluant la construction et le test de l'image Docker de production
./scripts/verify-all --with-docker
```

---

## 11. Déploiement sur Neon + Render

Le dépôt inclut le fichier Blueprint [`render.yaml`](render.yaml) prêt pour Render :

1. **Base de données Neon (PostgreSQL 16)** :
   - Créer un projet PostgreSQL 16 sur [Neon](https://neon.tech) dans la région `eu-central-1` (Francfort).
   - Copier l'URL de connexion directe (non poolée, format `postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require`) : Flyway nécessite une connexion directe pour ses verrous de migration, et HikariCP est plafonné à 5 connexions (`max-lifetime: 540000`).
2. **Service Web Render (Docker)** :
   - Connecter votre dépôt GitHub à [Render](https://render.com) et créer un **Web Service** (ou importer le Blueprint `render.yaml`).
   - Dans l'onglet **Environment**, renseigner les variables `sync: false` :
     - `DATABASE_URL` : l'URL Neon copiée à l'étape 1.
     - `FRONTEND_BASE_URL` : l'URL HTTPS de votre service Render (ex. `https://samaadresse.onrender.com`).
     - `ADMIN_PASSWORD` : un mot de passe administrateur d'au moins 12 caractères.
     - `DEMO_PASSWORD` : un mot de passe pour les comptes de démonstration (si `DEMO_SEED=true`).
     - `ORS_API_KEY` : votre clé OpenRouteService.
     - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` : vos identifiants Twilio (si `SMS_PROVIDER=twilio`).
   - `JWT_SECRET` est généré automatiquement par Render (`generateValue: true`).
   - `TRUSTED_PROXY_HOPS` est initialisé à `1` pour extraire l'IP cliente derrière le proxy inverse de Render.
   - La route de santé `/api/health` répond `200 {"status":"UP"}` en mémoire sans interroger PostgreSQL, ce qui permet à Render de vérifier l'état du conteneur tout en laissant Neon se mettre en veille en l'absence de trafic utilisateur.

---

## 12. Limites connues

- **Grille géographique par boîtes englobantes (`geo-grid.json`)** : Les limites des 8 quartiers de Ziguinchor, Dakar et Saint-Louis sont des **boîtes rectangulaires estimées géométriquement, non confirmées par l'administration locale ni par un cadastre municipal officiel**. Voir [`docs/geo-grid-a-verifier.md`](docs/geo-grid-a-verifier.md) pour la fiche de vérification terrain.
- **Réveil à froid sur hébergement gratuit** : Le plan gratuit de Render met le conteneur en veille après 15 minutes d'inactivité (réveil en 30 à 60 s au premier appel). Voir [`docs/DEMO.md`](docs/DEMO.md) pour la préparation avant soutenance.
- **Envoi de SMS au Sénégal (`+221`)** : Les opérateurs sénégalais (Orange, Free, Expresso) filtrent les numéros internationaux non enregistrés et exigent l'enregistrement préalable d'un `Sender ID` alphanumérique pour une délivrabilité garantie. Le mode par défaut est `SMS_PROVIDER=mock`, et le script `./scripts/sms-live-test +221XXXXXXXXX` permet de tester l'intégration Twilio sur un numéro vérifié.
- **Absence de notifications push** : L'application ne sollicite pas d'autorisation de notifications push ; les retours de synchronisation hors ligne et de modération sont présentés directement dans l'interface (« Mes adresses »).
