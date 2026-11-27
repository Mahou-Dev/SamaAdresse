# 01 — RAPPORT D'AUDIT GLOBAL — PROJET SAMAADRESSE

- **Projet audité :** SamaAdresse (Système d'adressage numérique géolocalisé pour le Sénégal)
- **Référentiel de conformité :** Cahier des charges « Projet 12 — SamaAdresse » (*Briefs de projets L3*, pages 25 et 26)
- **Date d'audit :** 27 novembre 2026
- **Branche Git auditée :** `feature/frontend-migration` (commit HEAD `8fe7ce9498e0fe820dda73a627305d334944af48`)
- **Correspondance production :** `https://samaadresse.onrender.com` (déployée depuis `origin/main` @ `aaf8bf8`, bundle identique `/assets/index-BzAtSjBR.js`)
- **Nature de la mission :** Audit indépendant technique, fonctionnel, sécurité, UX/UI, QA et DevOps — strictement en lecture seule

---

## 1. Résumé exécutif

SamaAdresse dispose d'un socle d'ingénierie sérieux : backend Spring Boot 3.4 / Java 21 bien structuré, base PostgreSQL 16/18 avec migrations Flyway et contrainte `UNIQUE` réelle sur les codes-adresses, RBAC backend effectif, API publique documentée à 100 % sous OpenAPI 3.0.1, PWA installable réellement fonctionnelle hors ligne (vérifiée en Chromium avec coupure réseau), décodage QR Code prouvé en production, et pipeline CI/CD GitHub Actions entièrement vert (runs CI #18/#20 et CD #1).

Toutefois, une vérification rigoureuse — code source, tests, dépendances et contrôles live sur la production — révèle **des écarts concrets qui interdisent une validation « EXCELLENT »** :

1. **Sécurité (ÉLEVÉE) :** le cookie `refreshToken` est émis avec `Path=/api/auth/refresh` (`AuthService.java:202`), ce qui empêche le navigateur de le transmettre à `POST /api/auth/logout` : **la déconnexion ne révoque jamais le refresh token en base PostgreSQL**. Par ailleurs, `sessionStorage` expose l'access token en cas de XSS, la CSP n'est qu'en mode `Report-Only`, `/api/auth/register` n'est pas limité en débit et `npm audit` signale 20 vulnérabilités (dont 1 `MODERATE` en dépendance de production `react-router-dom@6.30.6`).
2. **Itinéraire OpenRouteService en panne en production :** `GET https://samaadresse.onrender.com/api/public/route` retourne actuellement **`HTTP 503 Service Unavailable`** (`ORS_API_KEY` absente ou rejetée sur Render). En outre, le mode de secours `RouteService.generateFallbackRoute` synthétise un tracé en zigzag fictif sans en avertir l'utilisateur.
3. **Partage SMS réel non prouvé et SendFlash non implémenté :** `SendFlashSmsProvider.java` est un squelette renvoyant systématiquement HTTP 502 ; la production utilise `SMS_PROVIDER=mock` ; aucun envoi sandbox Twilio/SendFlash réel n'est vérifiable dans cet environnement.
4. **Code-adresse hors ligne non stabilisé après synchronisation :** le nouveau frontend génère un code provisoire local (`gridCell`) dans IndexedDB mais ne consomme pas l'endpoint backend existant `/api/address-codes/reservations`, si bien que le code attribué hors ligne change lors de la synchronisation serveur.
5. **Recherche annuaire et UX :** la saisie texte d'un nom de quartier (ex. `Boucotte`, `Médina`) retourne `0` résultat (`AddressRepository.java:35` filtre uniquement sur le code 3 lettres), la page `/carte` déclenche jusqu'à 24 appels parallèles `GET /api/addresses/{code}` (N+1), plusieurs contrastes (`.button-success` à `2,78:1`) et cibles tactiles mobiles (`< 44 px`) ne respectent pas WCAG 2.1 AA, et certaines fonctions d'administration (journal `admin_actions`, gestion utilisateurs, adresses non listées) restent absentes ou partielles.

- **Score global pondéré :** **`67,75 / 100`**
- **Taux de vérification :** **`98,00 %`** (98 points vérifiés sur 100 ; 2 points non vérifiables : SMS sandbox réel)
- **Taux de conformité sur périmètre vérifié :** **`69,13 %`** (`67,75 / 98,00`)
- **Verdict global indépendant :** **`SATISFAISANT`** *(exigences principales respectées pour une présentation académique solide, mais corrections P0/P1 indispensables avant une ouverture grand public)*.

---

## 2. Présentation du projet et méthodologie d'audit

SamaAdresse répond à l'absence d'adressage postal structuré au Sénégal en attribuant à chaque lieu un code court géolocalisé au format `ZONE-QUARTIER-XXXX` (ex. `ZIG-KBG-4271`), accompagné de coordonnées GPS, d'une photo de façade, d'une description, d'un QR Code, d'une fiche publique consultable hors ligne et d'un annuaire public modéré.

La méthodologie appliquée sur les 9 phases repose exclusivement sur des **preuves vérifiables** :
- Revue statique intégrale du code backend (91 classes Java), frontend (70+ modules TypeScript/React), migrations SQL (`V1__init.sql`, `V2__photo_blobs.sql`), workflows CI/CD et configuration Docker/Render.
- Mesure réelle de couverture : JaCoCo XML backend (`141` tests) et Vitest v8 frontend (`61` tests).
- Audit sécurité applicatif et dépendances (`npm audit`).
- Contrôles HTTP live en lecture seule sur `https://samaadresse.onrender.com` (18 sondes).
- Exécution réelle dans Chromium (Playwright autonome en lecture seule) : décodage réel `jsQR` des QR Codes backend (PNG) et frontend (SVG), test offline complet (`setOffline(true)` + `page.reload()`), audit PWA (`ServiceWorker` + `CacheStorage` + manifeste) et mesures responsive/accessibilité sur les **6 largeurs imposées** (`360`, `375`, `390`, `768`, `1024`, `1440 px`).

---

## 3. Architecture constatée et technologies détectées

Architecture monolithique modulaire mono-origine en production (le JAR Spring Boot sert directement les artefacts statiques Vite + PWA sous `classpath:/static/`), déployée en conteneur Docker multi-étapes sur Render (`plan: free`, 512 Mo RAM) avec PostgreSQL managé Neon.

| Couche | Technologies et versions détectées | Preuve |
|---|---|---|
| **Backend** | Java 21 (Eclipse Temurin), Spring Boot `3.4.3`, Spring Web, Spring Data JPA/Hibernate, Spring Security 6, Flyway, PostgreSQL JDBC, JJWT `0.12.6`, Bucket4j `8.10.1`, ZXing `3.5.3`, Springdoc OpenAPI `2.8.5`, Lombok | `backend/pom.xml` |
| **Frontend** | React `19.1.0`, TypeScript `~5.8.3`, Vite `6.3.5`, React Router DOM `6.30.6`, Leaflet `1.9.4`, React-Leaflet `5.0.0`, `qrcode` `1.5.4`, `lucide-react` `1.59.0`, CSS natif à jetons (`tokens.css`) | `frontend/package.json` |
| **PWA / Offline** | Service Worker natif (`frontend/public/sw.js`, v2), `manifest.webmanifest`, IndexedDB (`frontend/src/lib/drafts.ts`) | `frontend/public/` |
| **Base de données** | PostgreSQL `16-alpine` (CI/Docker test) & Neon PostgreSQL (production), 7 tables migrées via Flyway (`V1__init.sql`, `V2__photo_blobs.sql`) | `backend/src/main/resources/db/migration/` |
| **Tests & Qualité** | JUnit 5 + MockMvc + H2/PostgreSQL + JaCoCo `0.8.12`, Vitest `2.1.9` + `@vitest/coverage-v8` + Testing Library, Playwright `1.64.1`, `jsqr` `1.4.0`, Newman/Postman, ESLint `9.25.0` | `backend/pom.xml`, `frontend/package.json` |
| **DevOps & CI/CD** | Dockerfile 3 stages (`node:22-alpine`, `maven:3.9.9-eclipse-temurin-21-alpine`, `eclipse-temurin:21-jre-alpine`), `docker-compose.prod-test.yml`, `render.yaml`, GitHub Actions (`ci.yml`, `cd.yml`) | Racine & `.github/workflows/` |

---

## 4. Synthèse chiffrée des résultats et taux de conformité

| Domaine | Pondération | Points vérifiés | Points obtenus | Conformité / pondération | Conformité / vérifié |
|---|---:|---:|---:|---:|---:|
| **1. Fonctionnalités métier (A–K)** | 35,00 | 33,00 | 23,25 | 66,43 % | 70,45 % |
| **2. Sécurité** | 20,00 | 20,00 | 13,25 | 66,25 % | 66,25 % |
| **3. Architecture et base de données** | 10,00 | 10,00 | 5,00 | 50,00 % | 50,00 % |
| **4. UX/UI et responsive** | 10,00 | 10,00 | 7,00 | 70,00 % | 70,00 % |
| **5. PWA et mode hors ligne** | 10,00 | 10,00 | 9,00 | 90,00 % | 90,00 % |
| **6. Tests et qualité** | 10,00 | 10,00 | 6,50 | 65,00 % | 65,00 % |
| **7. Documentation et déploiement** | 5,00 | 5,00 | 3,75 | 75,00 % | 75,00 % |
| **TOTAL** | **100,00** | **98,00** | **67,75** | **67,75 %** | **69,13 %** |

- **Taux de vérification :** `98,00 %` (`27 / 28` exigences vérifiées ; `1 / 28` `NON VÉRIFIABLE` : envoi SMS sandbox réel).
- **Répartition des 28 exigences :** `12 CONFORME`, `14 PARTIELLEMENT CONFORME`, `1 NON CONFORME` (calcul d'itinéraire ORS en prod 503), `1 NON VÉRIFIABLE` (SMS sandbox).

### Vérification synthétique des 6 critères officiels de réussite

| # | Critère officiel | Verdict | Synthèse des preuves |
|---|---|---|---|
| 1 | Code généré depuis GPS < 3 s sans connexion stable | **PARTIELLEMENT CONFORME** | Résolution locale `geo-grid` mesurée à `0,0008 ms/op` et brouillon IndexedDB OK, mais le code provisoire change à la sync (endpoint `/api/address-codes/reservations` non câblé) et `locateBestPosition` peut attendre jusqu'à 15 s si précision > 20 m. |
| 2 | QR Code redirige correctement vers la fiche publique | **CONFORME** | Décodage réel `jsQR` validé en live sur le PNG backend (`300x300`, zone calme blanche) ET le SVG frontend -> `https://samaadresse.onrender.com/a/ZIG-KBG-4271`. |
| 3 | Partage SMS envoie le bon lien via SendFlash/Twilio sandbox | **NON VÉRIFIABLE** | `TwilioSmsProvider` implémenté (mock HTTP uniquement), `SendFlashSmsProvider` à l'état de squelette (502), prod en `SMS_PROVIDER=mock`, aucun sandbox réel accessible. |
| 4 | Fiche adresse consultable hors ligne après consultation préalable | **CONFORME** | Prouvé en Chromium réel (`setOffline(true)` + `page.reload()`) sur `/a/ZIG-KBG-4271` : fiche complète, coordonnées, description, photo `1200 px` et bandeau daté affichés en `2024 ms`. |
| 5 | API publique résout correctement un code d'adresse | **CONFORME** | `GET https://samaadresse.onrender.com/api/addresses/ZIG-KBG-4271` -> `HTTP 200` JSON complet sans PII ; code inexistant -> `404` ; archive/suspendu -> `410` ; quota `60 req/min/IP`. |
| 6 | Application PWA installable (manifest, SW, icône) | **CONFORME** | Manifest `standalone` valide, 3 icônes PNG (`192`, `512`, `maskable`), `sw.js` `activated` + contrôleur actif sur scope HTTPS `/`, hook `beforeinstallprompt` présent. |

---

## 5. Forces réelles du projet

1. **Architecture propre et contrat OpenAPI exhaustif :** 31 opérations REST documentées à 100 % sous OpenAPI 3.0.1 avec résumés et codes d'erreur, testées automatiquement par `OpenApiCompletenessTest`.
2. **Contrôle d'accès backend effectif (RBAC & anti-IDOR) :** protection `@PreAuthorize` + vérifications systématiques `address.owner.id == currentUser.id` côté service ; séparation nette entre `PublicAddressResponse` (zéro PII) et `AddressResponse`.
3. **PWA & mode hors ligne réellement opérationnels :** le Service Worker `sw.js` met en cache les fiches publiques consultées, leurs photos `/uploads/*` et les tuiles OSM, exclut strictement les endpoints privés/authentifiés et marque honnêtement la copie hors ligne (`X-SamaAdresse-Offline`).
4. **Modélisation PostgreSQL rigoureuse et stockage photos résilient :** migrations Flyway idempotentes (`V1`/`V2`), unicité `UNIQUE` en base, stockage photos en `bytea` PostgreSQL pour survivre au disque éphémère Render, validation par magic bytes.
5. **Qualité responsive et livraison CI/CD éprouvée :** 0 débordement horizontal sur les 6 viewports (`360` à `1440 px`), 0 erreur JS non gérée, bundle d'entrée léger (`98,20 Ko` gzip), documentation UML complète (12 diagrammes), CI et CD verts sur GitHub Actions.

---

## 6. Faiblesses, risques techniques et risques de sécurité

### Faiblesses fonctionnelles
- Calcul d'itinéraire OpenRouteService indisponible en production (`HTTP 503`) et tracé de secours fictif non signalé côté backend.
- Intégration `SendFlashSmsProvider` non implémentée ; aucun test SMS sandbox réel.
- Saisie texte d'un nom de quartier dans l'annuaire (`/recherche?par=quartier`) renvoyant 0 résultat.
- Pool de codes réservés serveur (`/api/address-codes/reservations`) non utilisé par le nouveau frontend (code hors ligne non conservé après sync) et excluant Saint-Louis (`SL`).
- Administration incomplète : pas de lecture UI de `admin_actions`, pas de gestion des utilisateurs (`AdminUsersPage` placeholder), adresses non listées invisibles dans `AdminAddressesPage`.

### Risques techniques
- **Saturation / N+1 :** `/carte` envoie jusqu'à 24 requêtes parallèles `GET /api/addresses/{code}` contre un rate limit de 60 req/min/IP.
- **Mémoire JVM (512 Mo Render) :** `RateLimiterService.cache` et `RouteService.routeCache` sont des `ConcurrentHashMap` sans éviction ; absence de garde anti-decompression-bomb sur `ImageIO.read`.
- **Observabilité & robustesse :** `GlobalExceptionHandler.handleGenericException` ne logue pas les erreurs 500 ; `DataIntegrityViolationException` renvoie HTTP 500 ; données de démonstration mélangées aux données de production (`DEMO_SEED=true` sans indicateur `is_demo`).
- **Capacité d'adressage :** 4 chiffres (`1000..9999`) plafonnent chaque quartier à `9 000` adresses et la grille ne couvre que 3 villes / 8 quartiers.
- **Angles morts de tests :** 0 % de couverture unitaire sur Leaflet (`components/map/*`, `MapPage`), `AdminAddressesPage`, `AdminUsersPage` ; couverture branches backend à `58,42 %` (< 60 %).

### Risques de sécurité
- **ÉLEVÉE :** Refresh token jamais révoqué en base lors du logout (`Path=/api/auth/refresh` vs `POST /api/auth/logout`).
- **MOYENNE :** CSP uniquement en `Report-Only` ; token d'accès JWT stocké en `sessionStorage` ; absence de rate limit sur `/api/auth/register` ; vulnérabilité runtime `react-router-dom@6.30.6` (Open Redirect backslash) + 3 critiques dev (`vitest`/`tinypool`) ; EXIF non purgé sur images ≤ 800 px ou WebP ; injection JSON potentielle sur `request.getRequestURI()` dans `SecurityConfig:76,81`.

---

## 7. Conclusion indépendante (réponses aux 10 questions)

1. **Le projet respecte-t-il réellement le cahier des charges ?**
   **Partiellement — majoritairement oui sur le cœur métier (`69,13 %` de conformité sur `98 %` vérifié), mais pas à 100 %.** Les piliers fondamentaux (génération géolocalisée, unicité DB, photo, QR Code lisible, fiche publique, API publique, PWA hors ligne, RBAC) fonctionnent réellement ; trois points du cahier des charges font défaut ou restent non prouvés : itinéraire ORS opérationnel en prod (503), envoi SMS réel sandbox (SendFlash squelette + Twilio non testé en sandbox), et stabilité du code généré hors ligne après synchronisation.
2. **Quelles fonctionnalités sont totalement opérationnelles ?**
   Création/gestion d'adresses en ligne (propriétaire), résolution géographique sur Ziguinchor/Dakar/Saint-Louis, unicité des codes en PostgreSQL, QR Code PNG + SVG décodable, partage lien/code/presse-papiers/Web Share, fiche publique anonyme sans PII, consultation hors ligne des fiches déjà visitées, PWA installable, API publique de résolution (`GET /api/addresses/{code}`), documentation OpenAPI 3.0.1 (100 % des endpoints), signalement public et modération des signalements (`OPEN`/`RESOLVED`/`DISMISSED` + suspension/réactivation).
3. **Quelles fonctionnalités sont partiellement implémentées ?**
   Génération hors ligne (code provisoire modifié à la sync), recherche annuaire (nom de quartier en saisie libre cassé + pas de filtres combinés UI + pas de tri), upload photo (EXIF non purgé ≤ 800 px / WebP), carte publique (requêtes N+1 et absence d'erreur tuiles), partage SMS (Twilio codé mais prod en mock, `SharePage` en `sms:` uniquement), administration (audit `admin_actions` non consultable, registre partiel), authentification (logout ne révoque pas en DB, pas de changement/réinitialisation de mot de passe).
4. **Quelles fonctionnalités sont absentes ?**
   Implémentation HTTP de `SendFlashSmsProvider`, itinéraire ORS fonctionnel en production (503), gestion administrative des comptes utilisateurs, consultation UI du journal `admin_actions`, réinitialisation/modification de mot de passe, notifications propriétaire, couverture géographique au-delà de 3 villes / 8 quartiers.
5. **Quels sont les problèmes de sécurité ?**
   1 vulnérabilité **ÉLEVÉE** (non-révocation du refresh token au logout), 6 vulnérabilités **MOYENNES** (CSP Report-Only, access token en `sessionStorage`, `/register` non limité, `react-router-dom` vulnérable + `npm audit`, EXIF non purgé ≤ 800 px / WebP, concaténation URI non échappée en 401/403) et 4 **FAIBLES** (absence de révocation immédiate de l'access token / `enabled` pendant 15 min, caches rate-limit non bornés, Swagger public en prod, comptes démo actifs en prod). Détail complet dans [AUDIT_SECURITE.md](AUDIT_SECURITE.md).
6. **L'application est-elle techniquement stable ?**
   **Oui pour une démonstration ou charge modérée**, prouvée par la CI/CD verte et les tests live sans erreur JS. Des risques de stabilité existent toutefois à moyen terme sous charge réelle (N+1 sur `/carte`, caches mémoire sans éviction sur 512 Mo RAM, exceptions 500 non loguées, absence de sauvegarde Neon automatisée).
7. **L'application est-elle réellement utilisable par le public ?**
   **Oui pour consulter, scanner un QR Code, rechercher par code/chips et lire une fiche hors ligne.** En revanche, l'expérience publique est dégradée sur deux points visibles : le calcul d'itinéraire intégré échoue en 503 en production, et taper un nom de quartier dans l'onglet Quartier renvoie 0 résultat ; sur mobile, plusieurs boutons/liens restent trop petits (`< 44 px`) et certains contrastes sont faibles.
8. **Le projet est-il suffisamment abouti pour une présentation académique ?**
   **Oui.** L'architecture full-stack, la cohérence documentaire (UML, OpenAPI, Postman), le déploiement live vérifié, les tests CI/CD et le mode hors ligne réel dépassent largement le niveau moyen d'un projet L3, à condition d'être transparent devant le jury sur le SMS mocké et de reconfigurer la clé ORS avant la soutenance.
9. **Quels éléments empêchent une validation complète ?**
   (1) La faille ÉLEVÉE de non-révocation du refresh token au logout, (2) l'indisponibilité 503 d'OpenRouteService en production, (3) l'absence de preuve d'envoi SMS sandbox réel et le squelette SendFlash, (4) le découplage entre brouillons hors ligne et codes réservés serveur, (5) le bug de recherche par nom de quartier, (6) les contrastes `.button-success`/`.button-danger` et cibles tactiles mobiles, et (7) la couverture branches backend à `58,42 %` (< 60 %) ainsi que les 0 % sur les modules carte/admin frontend.
10. **Quel est le travail restant pour atteindre 100 % de conformité ?**
    Environ **4 à 6 jours-homme** d'une équipe senior ciblés sur le plan [PLAN_ACTION_CORRECTIF.md](PLAN_ACTION_CORRECTIF.md) : corrections P0 (logout cookie path, clé ORS en prod, mise à jour dépendances `react-router-dom`/`vitest`/`vite`), P1 (recherche par nom de quartier, câblage `/api/address-codes/reservations` hors ligne + zone `SL`, test SMS Twilio sandbox réel + implémentation SendFlash si documentation disponible, CSP appliquée, purge EXIF systématique, endpoints admin manquants) et P2 (suppression N+1 `/carte`, contrastes/cibles tactiles WCAG AA, couverture branches ≥ 60 % et tests carte).

---

### VERDICT GLOBAL FINAL : **`SATISFAISANT`**
*(Score : `67,75 / 100` — Vérification : `98,00 %` — Conformité sur vérifié : `69,13 %`)*
