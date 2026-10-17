# SamaAdresse

Plateforme web et PWA d'adressage numérique citoyen par géolocalisation GPS et QR code pour le Sénégal (Ziguinchor, Dakar, Saint-Louis).

---

## 1. Contexte et problème

Dans de nombreux quartiers résidentiels et périurbains du Sénégal, les voies ne portent pas de nom affiché et les habitations ou commerces n'ont pas de numéro de rue. Pour indiquer un lieu à un livreur, un visiteur, un artisan ou un service de secours, les habitants décrivent oralement un itinéraire à partir de repères locaux (« derrière la boulangerie, troisième concession à gauche après le château d'eau »). Cette transmission orale entraîne des retards, des appels répétés et des erreurs d'orientation, en particulier la nuit ou lorsque le visiteur ne connaît pas le quartier.

**SamaAdresse** permet à tout habitant ou commerçant de :
1. Capturer la position GPS de son entrée (ou placer le repère sur la carte), ajouter une description de terrain et une photo de façade facultative.
2. Obtenir un code d'adresse court, lisible et immuable au format `ZONE-QUARTIER-XXXX` (par exemple `ZIG-KBG-4271` pour Kandé Banéto à Ziguinchor), accompagné d'une plaque numérique et d'un QR code imprimable.
3. Partager cette fiche par lien, WhatsApp ou SMS pour permettre à tout visiteur de consulter le repère, la photo et l'itinéraire routier ou piéton jusqu'à l'entrée, sans créer de compte.

---

## 2. Fonctionnalités principales

- **Création d'adresse en 4 étapes** : acquisition GPS (avec avertissement si la précision dépasse 50 m et déplacement libre du repère sur la carte), choix du type de lieu (`Maison`, `Commerce`, `Institution`) et description de terrain, ajout d'une photo de façade (compressée côté client à 1600 px JPEG avant envoi, validée par octets magiques et redimensionnée à 800 px côté serveur) et choix explicite de visibilité dans l'annuaire, puis récapitulatif et validation.
- **Plaque d'enseigne et QR code** : génération du code `ZONE-QUARTIER-XXXX` par tirage aléatoire cryptographique (`SecureRandom`) à partir de la grille géographique (`geo-grid.json`), affichage de la plaque inspirée des plaques de rue de Ziguinchor et génération du QR code PNG via ZXing (`/api/addresses/{code}/qrcode`).
- **Fiche publique (`/a/{code}`)** : accessible sans authentification ; affiche la plaque, le quartier, la description, la photo de façade et la carte interactive. Renvoie un statut HTTP `410 Gone` neutre si l'adresse a été archivée par son propriétaire ou suspendue par la modération.
- **Itinéraire intégré (OpenRouteService)** : calcul d'itinéraire en voiture (`driving-car`) ou à pied (`foot-walking`) depuis la position courante du visiteur jusqu'à l'adresse via le proxy serveur `/api/public/route`, avec tracé GeoJSON sur la carte, durée, distance et étapes en français, ainsi qu'un bouton de secours vers l'application de cartes du téléphone.
- **Partage multi-canal** : copie du lien, copie du code, partage natif Web Share API, partage WhatsApp pré-rempli et envoi par SMS (`/api/addresses/{code}/share/sms`, message GSM-7 ≤ 160 caractères, protégé par trois niveaux de limitation de débit).
- **Annuaire public opt-in (`/annuaire`)** : recherche par code ou mots-clés (insensible à la casse, aux tirets et aux accents via `search_text`) et filtrage par quartier et par type de lieu (`Maison`, `Commerce`, `Institution`). Une adresse n'y figure que si son propriétaire a coché « Figurer dans l'annuaire public » (`listed = true`, décoché par défaut), et le nom du propriétaire n'est cherché et affiché que si `showOwnerName = true`.
- **Mode hors ligne (PWA, Service Worker et IndexedDB)** :
  - Consultation hors ligne des fiches publiques déjà visitées (cache Workbox `NetworkFirst` avec délai de 3 s, 50 entrées, 30 jours, et purge automatique sur réponse `410 Gone`).
  - Pré-réservation de codes par zone (`POST /api/address-codes/reservations?zone=ZIG`, 3 codes par quartier, plafond de 40 par utilisateur, validité 30 jours) stockés dans IndexedDB.
  - Création d'adresse hors ligne avec affichage immédiat de la plaque provisoire (< 3 s), mise en file d'attente locale (`pendingAddresses`), synchronisation automatique au retour du réseau avec idempotence (`clientRequestId`) et bannière d'information si le code provisoire a dû être remplacé après vérification serveur du quartier.
- **Signalement public et modération (`/admin`)** : signalement anonyme d'une adresse (`POST /api/public/addresses/{code}/reports`, limité par IP hachée SHA-256) ; interface d'administration réservée au rôle `ADMIN` permettant de classer sans suite un signalement ou de suspendre/réactiver une adresse avec motif obligatoire et journalisation d'audit (`admin_actions`).

---

## 3. Architecture et pile technique

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Navigateur / PWA (React 19, TypeScript, Vite 8, Tailwind v4, Leaflet)    │
│  ├─ Service Worker (Workbox injectManifest : précache + cache /a/{code}) │
│  ├─ IndexedDB (codes réservés par utilisateur + file pendingAddresses)   │
│  └─ AuthContext (JWT en mémoire + cookie HttpOnly SameSite=Strict)       │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ HTTPS (même origine en production)
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Conteneur unique Spring Boot 3.4.3 / Java 21 (Temurin JRE Alpine)        │
│  ├─ Ressources statiques SPA (index.html no-cache, /assets/* immutable)  │
│  ├─ Contrôleurs REST (/api/auth, /api/addresses, /api/public, /api/admin)│
│  ├─ ClientIpResolver + Limiteurs de débit en mémoire (SHA-256)           │
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

Les diagrammes UML détaillés (cas d'utilisation, classes du domaine, contrôleurs/services/infrastructure, et 8 diagrammes de séquence) ainsi que leur table de vérification par rapport au code sont disponibles dans :
- [`docs/uml/README.md`](file:///home/mahou-dev/Documents/SamaAdresse/docs/uml/README.md)
- [`docs/uml/VERIFICATION.md`](file:///home/mahou-dev/Documents/SamaAdresse/docs/uml/VERIFICATION.md)
- Rendus PNG et SVG : [`docs/uml/rendus/`](file:///home/mahou-dev/Documents/SamaAdresse/docs/uml/rendus/)

---

## 4. Modèle de données

Le modèle du domaine comprend 7 entités JPA persistées par Flyway :
- `User` (`users`) : compte utilisateur (`PROPRIETAIRE` ou `ADMIN`), mot de passe haché BCrypt (coût 12).
- `RefreshToken` (`refresh_tokens`) : jeton de rafraîchissement haché en SHA-256 avec rotation à chaque utilisation.
- `Address` (`addresses`) : adresse géolocalisée avec `code` et coordonnées (`latitude`, `longitude`) immuables, `locationType` (`MAISON`, `COMMERCE`, `INSTITUTION`), `status` (`ACTIVE`, `SIGNALED`, `ARCHIVED`, `SUSPENDED`), options d'annuaire (`listed`, `showOwnerName`), `searchText` normalisé sans accents et `clientRequestId` d'idempotence.
- `ReservedCode` (`reserved_codes`) : code pré-réservé par zone et quartier pour la création hors ligne (`RESERVED`, `USED`, `EXPIRED`).
- `AddressReport` (`address_reports`) : signalement public anonyme associé à l'empreinte SHA-256 de l'IP.
- `AdminAction` (`admin_actions`) : journal d'audit des décisions de modération.
- `PhotoBlob` (`photo_blobs`) : stockage binaire `bytea` des photos redimensionnées pour les environnements de production sans disque persistant.

Voir le diagramme de classes complet : [`docs/uml/rendus/02-classes-domaine.png`](file:///home/mahou-dev/Documents/SamaAdresse/docs/uml/rendus/02-classes-domaine.png).

---

## 5. Choix d'architecture et compromis

1. **Image Docker unique et même origine (`SameSite=Strict`)** : Sur un hébergement gratuit où frontend et backend séparés seraient servis depuis deux sous-domaines distincts d'un domaine figurant sur la Public Suffix List (`*.onrender.com`), un cookie `SameSite=Strict` ne serait pas transmis lors des appels API cross-site. En empaquetant le build Vite directement dans les ressources statiques de Spring Boot au sein d'un conteneur unique, l'application et l'API partagent exactement la même origine : le cookie `refreshToken` conserve `SameSite=Strict`, `HttpOnly` et `Secure`, et aucune configuration CORS n'est ouverte en production.
2. **Jeton d'accès en mémoire + rafraîchissement par cookie `HttpOnly`** : Le JWT d'accès (15 min) n'est jamais écrit dans `localStorage` ni `sessionStorage`, ce qui le protège d'une exfiltration par script. Seul un indicateur booléen non sensible (`sa_session=1`) permet de savoir au chargement s'il faut appeler `/api/auth/refresh` (évitant ainsi toute requête `401` inutile en console pour les visiteurs anonymes).
3. **Immuabilité du code et de la position** : Une fois attribué et synchronisé, un code `ZONE-QUARTIER-XXXX` et ses coordonnées GPS ne peuvent pas être déplacés vers un autre point géographique, afin qu'un QR code imprimé ou un lien déjà transmis ne dirige jamais vers un autre lieu. En cas de déménagement, l'adresse est archivée (`410 Gone`) et une nouvelle adresse est créée.
4. **Pré-réservation de codes pour le mode hors ligne** : Afin d'afficher une plaque dès la validation hors ligne sans risquer de collision probable, le client pré-réserve un petit lot de codes par quartier lorsqu'il est connecté. Si l'utilisateur capture finalement une position dans un autre quartier que celui du code réservé ou si le stock est épuisé, le serveur attribue un code définitif à la synchronisation et l'interface affiche une bannière explicite indiquant l'ancien et le nouveau code ainsi que le nom du quartier résolu.
5. **Proxy OpenRouteService sans journalisation de la position** : L'appel à OpenRouteService transite par `/api/public/route` pour garder la clé `ORS_API_KEY` côté serveur, appliquer une limitation de débit par IP et mettre en cache les trajets récents (TTL 10 min), sans jamais enregistrer en base ni dans les journaux la position de départ du visiteur.
6. **Stockage des photos en base (`DbPhotoStorage`) en production** : Le plan gratuit de Render ne fournissant pas de volume disque persistant, l'interface `PhotoStorage` bascule en profil `prod` (`PHOTO_STORAGE=db`) sur la table `photo_blobs` (`bytea`). Comme chaque photo est compressée et redimensionnée à 800 px max (~80 à 150 Ko) et servie par `/uploads/{uuid}.jpg` avec `Cache-Control: public, max-age=31536000, immutable` et `ETag` (`304 Not Modified`), l'empreinte en base reste compatible avec le quota de 0,5 Go de Neon.

---

## 6. Prérequis et lancement en développement

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

## 7. Lancement avec l'image Docker de production

Pour tester localement l'image Docker multi-étapes en profil `prod` (avec PostgreSQL 16, Flyway, `ddl-auto=validate`, stockage des photos en base `bytea`, en-têtes de sécurité et jeu de démonstration) :

```bash
docker compose -f docker-compose.prod-test.yml up --build -d
```

L'application complète (interface PWA + API REST sur la même origine) est alors accessible sur `http://localhost:8082`.
Pour exécuter le script de vérification fonctionnelle sur ce conteneur :

```bash
./scripts/smoke-prod.sh http://localhost:8082
```

Pour arrêter et nettoyer les conteneurs de test :

```bash
docker compose -f docker-compose.prod-test.yml down -v
```

---

## 8. Variables d'environnement

Aucun secret n'est présent dans les fichiers suivis par Git. Le fichier [`.env.example`](file:///home/mahou-dev/Documents/SamaAdresse/.env.example) contient uniquement des clés vides à copier dans `.env`.

| Variable | Rôle | Obligatoire en `prod` | Exemple non sensible |
|---|---|:---:|---|
| `SPRING_PROFILES_ACTIVE` | Profil Spring Boot actif (`dev`, `e2e`, `prod`) | Oui | `prod` |
| `PORT` | Port HTTP d'écoute du serveur Spring Boot | Non (défaut `8080`) | `8080` |
| `DATABASE_URL` | URL PostgreSQL au format Render/Neon (`postgresql://user:pass@host/db?sslmode=require`), convertie automatiquement en JDBC | Oui (ou `DB_URL`) | `postgresql://user:secret@ep-xxx.eu-central-1.aws.neon.tech/samaadresse?sslmode=require` |
| `DB_URL` | URL JDBC PostgreSQL explicite (alternative à `DATABASE_URL`) | Non | `jdbc:postgresql://db:5432/samaadresse` |
| `DB_USERNAME` | Utilisateur PostgreSQL (si non inclus dans `DATABASE_URL`) | Non | `samaadresse` |
| `DB_PASSWORD` | Mot de passe PostgreSQL (si non inclus dans `DATABASE_URL`) | Non | *(mot de passe base)* |
| `JWT_SECRET` | Clé secrète HMAC-SHA256 pour signer les JWT (**≥ 32 octets** en `prod`, sinon arrêt au démarrage) | Oui | *(chaîne aléatoire de 64 caractères)* |
| `COOKIE_SECURE` | Ajoute l'attribut `Secure` au cookie `refreshToken` (`true` en HTTPS) | Non (défaut `true` en `prod`) | `true` |
| `FRONTEND_BASE_URL` | URL publique de l'application utilisée dans les QR codes et les SMS (doit commencer par `https://` en `prod`) | Oui | `https://samaadresse.onrender.com` |
| `ADMIN_EMAIL` | Adresse e-mail du compte administrateur initial créé de manière idempotente au démarrage | Oui | `admin@samaadresse.sn` |
| `ADMIN_PASSWORD` | Mot de passe initial de l'administrateur (**≥ 12 caractères** en `prod`) | Oui | *(mot de passe fort ≥ 12 car.)* |
| `DEMO_SEED` | Active le chargement idempotent des 3 adresses et photos de démonstration en `prod` | Non (défaut `false`) | `true` |
| `DEMO_PASSWORD` | Mot de passe attribué aux comptes de démonstration lorsque `DEMO_SEED=true` | Si `DEMO_SEED=true` | *(mot de passe démo)* |
| `PHOTO_STORAGE` | Mode de stockage des photos de façade : `disk` (système de fichiers) ou `db` (table `photo_blobs`) | Non (défaut `db` en `prod`) | `db` |
| `ORS_API_KEY` | Clé API OpenRouteService pour le calcul d'itinéraire (`/api/public/route`) | Non (503 propre si absente) | *(clé ORS)* |
| `SMS_PROVIDER` | Fournisseur d'envoi de SMS (`mock`, `twilio`, `sendflash`) | Non (défaut `mock`) | `mock` |
| `SMS_DAILY_CAP` | Plafond quotidien global d'envoi de SMS (protection du crédit) | Non (défaut `20`) | `20` |
| `TWILIO_ACCOUNT_SID` | Identifiant de compte Twilio (`AC...`) lorsque `SMS_PROVIDER=twilio` | Si `SMS_PROVIDER=twilio` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Jeton d'authentification Twilio lorsque `SMS_PROVIDER=twilio` | Si `SMS_PROVIDER=twilio` | *(jeton Twilio)* |
| `TWILIO_FROM_NUMBER` | Numéro d'expéditeur Twilio E.164 ou `MessagingServiceSid` (`MG...`) | Si `SMS_PROVIDER=twilio` | `+15005550006` |

---

## 9. Tests et vérification automatique

Le script unique `./scripts/verify-all` exécute l'ensemble des contrôles et génère `VERIFY.md` ainsi que `rapport.md` :
- Scan d'absence de secrets et de clés dans les fichiers suivis par Git.
- Tests unitaires et d'intégration Backend (`./mvnw test`, 124 tests) + vérification de la couverture JaCoCo (≥ 60 %) + test de complétude OpenAPI (`OpenApiCompletenessTest`).
- Vérification TypeScript (`tsc --noEmit`), linter (`oxlint`), tests unitaires Vitest, build de production Vite et budget de taille gzip (`check-size.mjs`).
- Tests E2E Playwright (parcours en ligne, hors ligne, synchronisation, annuaire, itinéraire, modération) et vérification des 38 captures d'écran (dimensions et unicité MD5).
- Audits Lighthouse sur les 8 pages (Performance, Accessibilité, Bonnes pratiques = 100, CLS < 0,1).
- Exécution de la collection Postman via Newman (`docs/audit/newman.json`).

```bash
# Vérification complète standard
./scripts/verify-all

# Vérification complète incluant la construction et le test de l'image Docker de production
./scripts/verify-all --with-docker
```

---

## 10. Déploiement sur Neon + Render

Le dépôt inclut le fichier Blueprint [`render.yaml`](file:///home/mahou-dev/Documents/SamaAdresse/render.yaml) prêt pour Render :

1. **Base de données Neon (PostgreSQL 16)** :
   - Créer un projet PostgreSQL 16 sur [Neon](https://neon.tech) dans la région `eu-central-1` (Francfort).
   - Copier l'URL de connexion directe (non poolée, format `postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require`) : Flyway nécessite une connexion directe pour ses verrous de migration, et HikariCP est déjà plafonné à 5 connexions (`max-lifetime: 540000`).
2. **Service Web Render (Docker)** :
   - Connecter votre dépôt GitHub à [Render](https://render.com) et créer un **Web Service** (ou importer le Blueprint `render.yaml`).
   - Dans l'onglet **Environment**, renseigner les variables `sync: false` :
     - `DATABASE_URL` : l'URL Neon copiée à l'étape 1.
     - `FRONTEND_BASE_URL` : l'URL HTTPS de votre service Render (ex. `https://samaadresse.onrender.com`).
     - `ADMIN_PASSWORD` : un mot de passe administrateur d'au moins 12 caractères.
     - `DEMO_PASSWORD` : un mot de passe pour les comptes de démonstration (si `DEMO_SEED=true`).
     - `ORS_API_KEY` : votre clé OpenRouteService.
   - `JWT_SECRET` est généré automatiquement par Render (`generateValue: true`).
   - La route de santé `/api/health` répond `200 {"status":"UP"}` sans interroger PostgreSQL, ce qui permet à Render de vérifier l'état du conteneur tout en laissant Neon se mettre en veille en l'absence de trafic utilisateur.

---

## 11. Limites connues

- **Grille géographique par boîtes englobantes (`geo-grid.json`)** : Les limites des quartiers de Ziguinchor, Dakar et Saint-Louis sont définies par des boîtes englobantes (`bbox`) et leurs centres (repli Haversine ≤ 3 km). Elles permettent de découper chaque zone de façon déterministe mais ne constituent pas un cadastre municipal. Voir [`docs/geo-grid-a-verifier.md`](file:///home/mahou-dev/Documents/SamaAdresse/docs/geo-grid-a-verifier.md) pour la procédure de vérification terrain à Ziguinchor.
- **Réveil à froid sur hébergement gratuit** : Le plan gratuit de Render met le conteneur en veille après 15 minutes d'inactivité (réveil en 30 à 60 s au premier appel). Voir [`docs/DEMO.md`](file:///home/mahou-dev/Documents/SamaAdresse/docs/DEMO.md) pour la préparation avant soutenance.
- **Envoi de SMS au Sénégal (`+221`)** : Les opérateurs sénégalais (Orange, Free, Expresso) filtrent les numéros internationaux non enregistrés et exigent l'enregistrement préalable d'un `Sender ID` alphanumérique pour une délivrabilité garantie. Le mode par défaut est `SMS_PROVIDER=mock`, et le script `./scripts/sms-live-test +221XXXXXXXXX` permet de tester l'intégration Twilio sur un numéro vérifié.
- **Absence de notifications push** : L'application ne sollicite pas d'autorisation de notifications push ; les retours de synchronisation hors ligne et de modération sont présentés directement dans l'interface (« Mes adresses »).
