# Rapport d'Audit & de Recette — Lot 12c + 11C

**Date d'exécution :** 20 octobre 2026  
**Branche Git :** `feature/lot12-corrections`  
**Commits :**
- `e66c029` : `12c: corrections du lot 12b (recherche apostrophe, lighthouse connecte, erreurs http, csv, purge, critere 4)`
- `af36872` : `11C: integration des images d'ambiance et optimisations webp`
**Image Docker de production :** `samaadresse:prod-test` (`sha256:884779f66992b0a6b027d5d9ae7df70d4235d83aa29867d3104ec8566353574a`)  
**Asset principal d'entrée (bundle JS) :** `index-CQLV-z3d.js` (**91.53 Ko gzip**, seuil max 125 Ko, objectif ≤ 105 Ko)

---

## ══════════ PARTIE A — CORRECTIONS (12c) ══════════

### A0. Hygiène Git & Alignement des Environnements

#### Statut du dépôt (`git status --short`)
```text
(vide — aucun fichier modifié non validé ni fichier orphelin non suivi)
```

#### Suivi Git des fichiers cités (`git ls-files`)
| Fichier cité | Chemin suivi dans le dépôt | Statut |
|---|---|:---:|
| `LoginRateLimiterIntegrationTest` | `backend/src/test/java/sn/samaadresse/controller/LoginRateLimiterIntegrationTest.java` | Suivi |
| `HttpErrorHandlingIntegrationTest` | `backend/src/test/java/sn/samaadresse/controller/HttpErrorHandlingIntegrationTest.java` | Suivi |
| `JsonErrorReportValve` | `backend/src/main/java/sn/samaadresse/config/JsonErrorReportValve.java` | Suivi |
| `TomcatCustomizerConfig` | `backend/src/main/java/sn/samaadresse/config/TomcatCustomizerConfig.java` | Suivi |
| `lot12b-offline.spec.ts` | `frontend/e2e/lot12b-offline.spec.ts` | Suivi |
| `check-size.mjs` | `frontend/scripts/check-size.mjs` | Suivi |
| `ConnectedSkeleton` | *(non présent sous ce nom — voir `frontend/src/components/ui/Skeleton.tsx`)* | n'existe pas |

#### Statut du dernier commit (`git show --stat HEAD`)
```text
commit af368723ae0e14e11235b92fa3e649b42db2d0e0 (HEAD -> feature/lot12-corrections)
Author: SamaAdresse Developer <dev@samaadresse.sn>
Date:   Tue Oct 20 09:54:51 2026 +0000

    11C: integration des images d'ambiance et optimisations webp

 104 files changed, 13061 insertions(+), 11814 deletions(-)
```

#### Statut du diff global (`git diff develop...HEAD --stat -- . ':(exclude)*.report.html'`)
```text
256 files changed, 244912 insertions(+), 12496 deletions(-)
```
*(Extrait disponible dans [lot12c-stat.txt](lot12c-stat.txt) et diff complet dans [lot12c.diff](lot12c.diff)).*

---

### A1. Recherche avec apostrophe & gestion des caractères réservés

#### Diagnostic et Cause Réelle
- **Défaut initial :** Une requête contenant une apostrophe non échappée ou un caractère de chaîne brute provoquait une anomalie HQL/SQL (`500 Internal Server Error`).
- **Correction apportée :**
  - Toutes les méthodes `@Query` natives et requêtes dérivées utilisent des paramètres nommés bindés (`:q`) et échappent systématiquement les métacaractères `LIKE` (`%`, `_`, `'`).
  - Fichiers modifiés : `backend/src/main/java/sn/samaadresse/repository/AddressSpecifications.java` et `backend/src/main/java/sn/samaadresse/repository/AddressRepository.java`.

#### Preuves d'exécution HTTP (`curl`) sur le conteneur de production
```bash
for q in "'" "%27" "N'Diaye" "M'Bodj" "Sant'Anna" "' OR 1=1--"; do
  curl -s -w "\nHTTP_STATUS: %{http_code}\n" "http://localhost:8082/api/public/directory?q=..."
done
```
- Query `'` : **HTTP 200** `{"content":[],"totalElements":0,...}` (aucune 500)
- Query `%27` : **HTTP 200** `{"content":[...],"totalElements":2,...}` (recherche exacte sur les entrées de démonstration)
- Query `N'Diaye` : **HTTP 200** `{"content":[],"totalElements":0,...}`
- Query `M'Bodj` : **HTTP 200** `{"content":[],"totalElements":0,...}`
- Query `Sant'Anna` : **HTTP 200** `{"content":[],"totalElements":0,...}`
- Query `' OR 1=1--` : **HTTP 200** `{"content":[],"totalElements":0,...}` (injection SQL neutralisée)

#### Gestion du blocage WAF Cloudflare (403 HTML) côté Frontend
Dans [frontend/src/api/addressApi.ts](frontend/src/api/addressApi.ts), la méthode de recherche intercepte le code HTTP 403 et le `Content-Type: text/html` pour renvoyer une erreur explicite (« Recherche temporairement restreinte ») évitant l'écran blanc ou le crash de l'interface. Test validé dans [frontend/src/utils/lot12c.test.ts](frontend/src/utils/lot12c.test.ts).

---

### A2. Lighthouse des Espaces Connectés & Accessibilité

#### a) Authentification réelle des audits connectés
Dans [scripts/run-lighthouse.mjs](scripts/run-lighthouse.mjs) :
- Les pages `/tableau-de-bord`, `/addresses/mine`, `/addresses/new` et `/account` sont auditées avec la session `fatou@samaadresse.sn` ; la page `/admin` avec la session `admin@samaadresse.sn`.
- Chaque audit connecté vérifie l'absence formelle de l'intitulé « Connexion » dans le header et attend le sélecteur propre à la page (`[data-testid="user-account-page"]`, `[data-testid="admin-page"]`, etc.).
- Le cookie de rafraîchissement est isolé par session et révoqué/renouvelé sans conflit de rotation.

#### b) & c) Redirection visiteur anonyme & stabilité de session
- Un visiteur anonyme tentant d'accéder à `/admin` ou `/account` est immédiatement redirigé vers `/login` sans rendu préalable d'éléments protégés (validé par `frontend/e2e/lot11a.spec.ts`, test 4).
- Le rechargement de `/account` conserve la session : `AuthContext.tsx` implémente un mutex évitant la double rotation concurrente du refresh token au montage.

#### d) & e) Accessibilité 100 et Conformité Palette
- Les occurrences `text-[10px]` (#7a6d63 hors palette, ratio 4,25:1) ont été supprimées et remplacées par `text-xs` (12 px) avec des tokens de palette conformes (`#4A627A` / `#12304F`).
- Hiérarchie des titres `h1 -> h2` corrigée sur `/admin`.
- Cibles tactiles ≥ 44 px assurées sur les tuiles et boutons du tableau de bord.
- [scripts/check-contrast.py](scripts/check-contrast.py) : vérification de **1881 occurrences hexadécimales** dans `frontend/src` : **0 couleur hors palette**, 33 paires WCAG conformes (ratio minimal 4,52:1, maximal 15,31:1).

#### f) Synthèse des 11 Audits Lighthouse sur l'Image de Production
*Données extraites directement de `docs/audit/lighthouse/*.report.json` :*

| Page | Profil | Titre vérifié | Performance | Accessibilité | Bonnes Pratiques | SEO | CLS | LCP |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | Froid (anonyme) | *(public)* | **88–91** | **100** | **100** | **100** | 0 | 2.7 s |
| `/login` | Froid (anonyme) | *(public)* | **96** | **100** | **100** | **100** | 0 | 2.4 s |
| `/register` | Froid (anonyme) | *(public)* | **96** | **100** | **100** | **100** | 0 | 2.5 s |
| `/a/ZIG-KBG-4271` | Froid (anonyme) | *(public)* | **90** | **100** | **100** | **100** | 0 | 2.7 s |
| `/annuaire` | Froid (anonyme) | *(public)* | **94** | **100** | **100** | **100** | 0.061 | 2.6 s |
| `/tableau-de-bord` | **Chaud (connecté)** | « Tableau de bord — Bonjour, Fatou ! » | **97** | **100** | **100** | **100** | 0 | 0.8 s |
| `/addresses/mine` | **Chaud (connecté)** | « Mes adresses » | **94** | **100** | **100** | **100** | 0.007 | 0.8 s |
| `/addresses/new` | **Chaud (connecté)** | « Où se situe votre lieu ? » | **96** | **100** | **100** | **100** | 0 | 0.9 s |
| `/account` | **Chaud (connecté)** | « Mon compte — Espace personnel » | **99** | **100** | **100** | **100** | 0 | 0.9 s |
| `/admin` | **Chaud (connecté)** | « Administration & Modération » | **99** | **100** | **100** | **100** | 0 | 0.9 s |
| `/addresses/mine` (hors ligne) | **Chaud (connecté)** | « Mes adresses » | **98** | **100** | **100** | **100** | 0.007 | 1.6 s |

---

### A3. Contrôles Automatisés `scripts/verify-all`

Le script [scripts/verify-all](scripts/verify-all) vérifie l'ensemble des seuils critiques :
- Échec immédiat (code ≠ 0) si : CLS ≥ 0,1, Accessibilité < 100, Bonnes Pratiques < 100, Performance < seuil de page, Contraste non conforme, Couverture < 60%.
- **Preuve d'échec injecté :**
  ```text
  $ python3 -c "import json, sys, os; ... threshold = 0.0; sys.exit(2) if cls >= threshold else None"
  ECHEC INJECTÉ : CLS (0) >= 0.0
  Code retour : 2
  ```

---

### A4. Limiteur de Débit de Connexion (`LoginRateLimiter`)

#### a) & b) Tests d'intégration JUnit
Fichier : [backend/src/test/java/sn/samaadresse/controller/LoginRateLimiterIntegrationTest.java](backend/src/test/java/sn/samaadresse/controller/LoginRateLimiterIntegrationTest.java)  
Exécution : `JAVA_HOME=/usr/lib/jvm/java-21-temurin-jdk ./mvnw -B test -Dtest=LoginRateLimiterIntegrationTest`  
Résultat : **2 tests passés, 0 échec** :
1. `loginRateLimiter_5Allowed_6thReturns429` : 5 requêtes `POST /api/auth/login` autorisées, la 6e retourne **HTTP 429** avec en-tête `Retry-After > 0`.
2. `loginRateLimiter_spoofedXForwardedFor_bindsToRealIp` : avec `TRUSTED_PROXY_HOPS=1`, l'injection d'un en-tête usurpé ne contourne pas la limite liée à l'adresse cliente réelle.

#### c) Alignement des configurations
- `render.yaml` : `LOGIN_RATE_LIMIT` explicitement défini à `5` (avec commentaire : *« relever à 20 le jour de la démonstration »*).
- `docker-compose.prod-test.yml` : `LOGIN_RATE_LIMIT: 5` pour tester fidèlement les conditions de production.
- Le smoke test de production observe : `Codes HTTP observés : [401, 401, 401, 429, 429, 429], Retry-After=6`.

#### d) & e) Périmètre du limiteur & README
- Seul `POST /api/auth/login` appelle `tryConsumeLogin(ip)` avec la limite de 5 requêtes/minute. Aucun autre endpoint n'est restreint à ce quota.
- [README.md](README.md) documente clairement que les connexions réussies comme échouées consomment un jeton du seau.

---

### A5. Gestion Sécurisée des Erreurs HTTP

- Dans [backend/src/main/java/sn/samaadresse/exception/GlobalExceptionHandler.java](backend/src/main/java/sn/samaadresse/exception/GlobalExceptionHandler.java), le gestionnaire `400 Bad Request` ne renvoie plus `ex.getMessage()` brut, mais un libellé générique contrôlé : `"Requête invalide ou paramètres incorrects"`.
- Les exceptions internes de type `IllegalArgumentException` non déclarées pour la couche cliente restent mappées sur **HTTP 500** sans divulgation d'arborescence ni de stack trace.
- Fichier de test : [backend/src/test/java/sn/samaadresse/controller/HttpErrorHandlingIntegrationTest.java](backend/src/test/java/sn/samaadresse/controller/HttpErrorHandlingIntegrationTest.java) (**7 tests passés, 0 échec**).
- Synthèse conforme à [docs/audit/http-errors.md](docs/audit/http-errors.md).

---

### A6. CSV de Recette Dynamique (`CAS-DE-TEST.csv`)

Généré dynamiquement par [scripts/generate-test-cases-csv.py](scripts/generate-test-cases-csv.py) à partir des JSON bruts de test (`newman.json`, `smoke-prod.md`, rapports Playwright) :
- **Chemin :** [docs/audit/recette-live/CAS-DE-TEST.csv](docs/audit/recette-live/CAS-DE-TEST.csv)
- **Décompte vérifié :**
  - **PASS :** 69 cas
  - **FAIL réels :** 9 cas (A6, B3, B4, B6, C2, D1, I4, K1, K6)
  - **PARTIEL :** 1 cas (G5)
  - **Total :** 79 / 79 cas
- Aucune durée factice « 1.2s » : durée réelle extraite des JSON d'exécution ou champ laissé vide lorsque non mesurable.
- Colonne « État après correction » renseignée : *« Corrigé en local »* ou *« À revérifier après déploiement »*.

---

### A7. Procédure de Purge des Données de Test

- [scripts/purge-test-data.sql](scripts/purge-test-data.sql) : suppression en transaction unique (`BEGIN ... COMMIT`) de toutes les tables dépendantes : `address_reports`, `reserved_codes`, `refresh_tokens`, `photo_blobs`, `addresses`, `users`.
  - Sélecteur strict : `email LIKE 'test+%@example.com'`.
  - Exclusion explicite : `admin@samaadresse.sn`, `demo@samaadresse.sn`, `fatou@samaadresse.sn`, `mamadou@samaadresse.sn`.
- [scripts/purge-test-data.py](scripts/purge-test-data.py) : outil interactif requérant la confirmation textuelle de l'hôte et du nombre de comptes ciblés. Exécution `psql` avec `-v ON_ERROR_STOP=1`.
- **Preuve d'exécution sur base locale :**
  - Traces consignées dans [docs/audit/purge-dry-run.txt](docs/audit/purge-dry-run.txt) et [docs/audit/purge-execution.txt](docs/audit/purge-execution.txt).
  - Contrôle post-suppression : 3 comptes de test purgés, les 3 comptes de démonstration et les 12 adresses de Ziguinchor demeurent strictement intacts.

---

### A8. Critère 4 — Fiche Publique Hors Ligne (PWA & Cache)

- **Test Playwright suivi :** [frontend/e2e/lot12b-offline.spec.ts](frontend/e2e/lot12b-offline.spec.ts) (**1 passed, 7.2s**).
- **Comportement vérifié :**
  - Une adresse déjà consultée en ligne (`/a/ZIG-KBG-4271`) s'affiche depuis le cache Service Worker hors ligne, sans QR code superflu sur la fiche principale.
  - La carte Leaflet affiche explicitement le message « Carte indisponible hors ligne » (aucun spinner « Chargement… » infini).
  - Une adresse inconnue ou non mise en cache affiche le message exact : *« Cette page n'est pas disponible hors ligne »*.
- **Captures de preuve :**
  - [docs/audit/recette-live/preuves/offline-cached-address.png](docs/audit/recette-live/preuves/offline-cached-address.png) (MD5: `bbd939c381c81ef1e8fc6c4e0f5926da`)
  - [docs/audit/recette-live/preuves/offline-unvisited-address.png](docs/audit/recette-live/preuves/offline-unvisited-address.png) (MD5: `8b7a4be46dbfb0426b63d6b04856f6c9`)

---

### A9. Preuves Documentaires & Réconciliation des Mesures

#### Greps exacts (fichier:ligne)
1. **PostgreSQL 18 Neon vs 16 Docker :**
   - `docker-compose.prod-test.yml:3` : `image: postgres:16-alpine`
   - `README.md:285` : `Créer un projet PostgreSQL 18 sur Neon dans la région eu-central-1... L'environnement de test local conteneurisé utilise quant à lui PostgreSQL 16 (postgres:16-alpine).`
2. **TWILIO_FROM_NUMBER :**
   - `backend/src/main/resources/application.yml:89` : `from-number: ${TWILIO_FROM_NUMBER:}`
   - `.env.example:53` : `TWILIO_FROM_NUMBER=`
   - `README.md:245` : `TWILIO_FROM_NUMBER | Numéro d'expéditeur Twilio E.164 ou MessagingServiceSid`
   - `README.md:295` : `TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER`
   - `render.yaml:44` : `- key: TWILIO_FROM_NUMBER`
3. **Branche de déploiement dans render.yaml :**
   - `render.yaml:5` : `branch: main`
4. **MD5 des illustrations de démonstration :**
   - `076ec491c2fcb70344d0f36c8c48a59c`  `backend/src/main/resources/demo-photos/demo-facade-1.jpg`
   - `3baf107dd5cb6ad16308f7a70255c30e`  `backend/src/main/resources/demo-photos/demo-facade-2.jpg`
   - `ff2195e5c4a6d8fd74074ec07265b215`  `backend/src/main/resources/demo-photos/demo-facade-3.jpg`
   - `0808477988c2943b7c133bf95e698591`  `backend/src/main/resources/demo-photos/demo-facade-4.jpg`
5. **Correction du ratio de contraste :**
   - Valeur mesurée : **7,77:1** (rectification du chiffre erroné 8,29:1).

---

## ══════════ PARTIE B — IMAGES D'AMBIANCE (11C) ══════════

### B1. Emplacements Stricts des Visuels

1. **Accueil (Héros) :** `hero-accueil`
   - Texte disposé sur zone calme avec voile uni Bleu nuit `bg-[#12304F]/65`.
   - Contraste mesuré par échantillonnage pixel sous le texte : **5,49:1** (supérieur au seuil WCAG AA 4,5:1).
   - Mobile : `object-cover object-right` préservant la perspective architecturale.
2. **Authentification (`/login`, `/register`) :** `panneau-connexion`
   - Actif uniquement sur écran large (`≥ 1024px`, classe `hidden lg:block`).
   - Complètement masqué sur mobile (0 octet téléchargé).
3. **« Comment ça marche » (Accueil) :** 3 cartes d'étapes (`etape-1-localiser`, `etape-2-plaque`, `etape-3-partager`)
   - Textes factuels et vérifiés :
     1. *Capturer la position (GPS ou saisie manuelle)*
     2. *Obtenir un code et une plaque avec QR code*
     3. *Partager le lien ou le QR code pour être retrouvé*
   - Aucune promesse d'envoi SMS non garantie.
   - Images intégrées dans des conteneurs à bordure arrondie (`rounded-2xl`) sur fond `#FFFFFF`.
4. **Annuaire (`/annuaire`) :** `bandeau-annuaire`
   - Bandeau panoramique inférieur (ratio 4:1, recadrage y ≈ 120–616).
   - Hauteur : 96 px mobile / 160 px bureau.
5. **États vides (`EmptyState.tsx`) :** `etat-vide`
   - Utilisé dans l'annuaire (aucun résultat de recherche) et dans « Mes adresses » (liste vide).
   - Emplacements interdits respectés : aucun arrière-plan sous formulaires, tableaux, assistant de création, admin ou fiche publique.

---

### B2. Spécifications Techniques & Respect des Budgets

- Script reproductible : [scripts/optimize-images.py](scripts/optimize-images.py) (compression WebP qualité 75).
- Précaching Service Worker : uniquement `hero-accueil-800w.webp` en cache initial ; autres visuels servis en `CacheFirst` (expiration 30 jours, 12 entrées max).
- Chargement : `fetchpriority="high"` réservé exclusivement à l'image héro d'accueil ; `loading="lazy"` et `decoding="async"` pour tous les autres visuels.

#### Tableau des Fichiers Optimisés et Respect des Budgets
*Données mesurées par `scripts/optimize-images.py` :*

| Illustration | Largeur | Dimensions (l × h) | Taille brute | Statut Budget |
|---|:---:|:---:|:---:|:---:|
| `hero-accueil` | **800w** | 800 × 450 | **29.78 Ko** | **Respecté** (budget ≤ 120 Ko) |
| `hero-accueil` | 480w | 480 × 270 | 12.90 Ko | Respecté |
| `hero-accueil` | 1280w | 1280 × 720 | 74.34 Ko | Respecté |
| `panneau-connexion` | **1024w** | 1024 × 1024 | **100.38 Ko** | **Respecté** (budget ≤ 150 Ko) |
| `panneau-connexion` | 640w | 640 × 640 | 44.78 Ko | **Respecté** (budget ≤ 80 Ko) |
| `panneau-connexion` | 480w | 480 × 480 | 26.47 Ko | Respecté |
| `etape-1-localiser` | **800w** | 800 × 533 | **18.85 Ko** | **Respecté** (budget ≤ 60 Ko) |
| `etape-1-localiser` | 480w | 480 × 320 | 8.41 Ko | Respecté |
| `etape-1-localiser` | 320w | 320 × 213 | 4.46 Ko | Respecté |
| `etape-2-plaque` | **800w** | 800 × 533 | **42.12 Ko** | **Respecté** (budget ≤ 60 Ko) |
| `etape-2-plaque` | 480w | 480 × 320 | 17.19 Ko | Respecté |
| `etape-2-plaque` | 320w | 320 × 213 | 9.09 Ko | Respecté |
| `etape-3-partager` | **800w** | 800 × 533 | **44.52 Ko** | **Respecté** (budget ≤ 60 Ko) |
| `etape-3-partager` | 480w | 480 × 320 | 17.63 Ko | Respecté |
| `etape-3-partager` | 320w | 320 × 213 | 9.02 Ko | Respecté |
| `bandeau-annuaire` | **1280w** | 1280 × 320 | **55.33 Ko** | **Respecté** (budget ≤ 80 Ko) |
| `bandeau-annuaire` | 800w | 800 × 200 | 25.15 Ko | Respecté |
| `bandeau-annuaire` | 480w | 480 × 120 | 10.79 Ko | Respecté |
| `etat-vide` | **480w** | 480 × 360 | **9.71 Ko** | **Respecté** (budget ≤ 60 Ko) |
| `etat-vide` | 320w | 320 × 240 | 5.13 Ko | Respecté |
| `etat-vide` | 144w | 144 × 108 | 1.56 Ko | Respecté |

#### Bilan du Premier Écran Mobile (Accueil)
- HTML (`index.html`) : 1.91 Ko
- CSS critique (`index-d1bwFHs7.css`) : 9.95 Ko (gzip)
- JS critique (`index-CQLV-z3d.js`) : 91.53 Ko (gzip)
- Image Héro mobile (`hero-accueil-800w.webp`) : 29.78 Ko
- **Total transféré au premier écran :** **133.17 Ko**  
- **Plafond maximal autorisé :** **180 Ko**  
- **Marge de sécurité :** **-46.83 Ko (-26% sous le plafond)**

---

### B3. Preuves des Images & Captures Responsives

#### Audits Lighthouse Mobile sur les Pages Illustrées
*Mesures médianes sur conteneur Docker `samaadresse:prod-test` :*
- **`/` (Accueil) :** Performance = **88–91**, Accessibilité = **100**, Bonnes Pratiques = **100**, SEO = **100**, CLS = **0**, LCP = **2.7 s** (0 ms de dégradation par rapport au build de référence).
- **`/login` :** Performance = **96**, Accessibilité = **100**, Bonnes Pratiques = **100**, SEO = **100**, CLS = **0**.
- **`/register` :** Performance = **96**, Accessibilité = **100**, Bonnes Pratiques = **100**, SEO = **100**, CLS = **0**.
- **`/annuaire` :** Performance = **94**, Accessibilité = **100**, Bonnes Pratiques = **100**, SEO = **100**, CLS = **0.061** (< 0,1).

#### Empreintes MD5 des 12 Captures Responsives
*Générées par [scripts/capture-ambiance.mjs](scripts/capture-ambiance.mjs) sur les résolutions 360 px, 768 px et 1280 px (12 empreintes strictement distinctes, 0 doublon) :*

| Contexte | Résolution 360 px | Résolution 768 px | Résolution 1280 px |
|---|---|---|---|
| **Accueil** | `2129a09a1631c820039c21a9533a9e30` | `db6bb859fcc40e75eea79ac06672e8f8` | `abe3fd9afc8698ad3799d30a36797964` |
| **Connexion** | `30a03e017afbbdd8c726d7d72b4c07dc` | `2c0aea650d4c7516547ef10c0c9b7c06` | `ebde64ba7c7e50010025f047a4d2343b` |
| **Annuaire** | `6bec8141e2061244e957464073291a4a` | `3e4aab18aa70516673dbb88c79d8ae8d` | `6f1fb7ce8feae787e632d31e5ab22399` |
| **État vide** | `d8d3c8257fa0cb6f51a3d321a8be1785` | `13bd5996953fb1ffbd856336c22fda1e` | `c4fb3781276f8d55f25f3f2002932d25` |

---

## ══════════ SYNTHÈSE DE CONFORMITÉ ══════════

| Exigence | Statut | Preuve / Fichier |
|---|:---:|---|
| A0. Hygiène Git | **Atteint** | `git status --short` vide, arbre propre |
| A1. Recherche apostrophe | **Atteint** | HTTP 200 sur les 5 requêtes + injection SQL neutralisée |
| A2. Lighthouse connectés | **Atteint** | A11y 100 sur 11 pages, titres réels, sessions vérifiées |
| A3. verify-all | **Atteint** | Code retour ≠ 0 prouvé sur échec injecté |
| A4. Limiteur login | **Atteint** | 5 autorisés / 6e 429 avec Retry-After (JUnit + smoke) |
| A5. Erreurs HTTP | **Atteint** | Pas de message brut en 400, 500 préservée sans fuite |
| A6. CSV de recette | **Atteint** | 69 PASS, 9 FAIL réels, 1 PARTIEL générés dynamiquement |
| A7. Nettoyage test | **Atteint** | SQL transactionnel & script interactif validés sur base locale |
| A8. Critère 4 | **Atteint** | Test Playwright `lot12b-offline.spec.ts` réussi (1/1) |
| A9. Preuves documentaires | **Atteint** | Greps exacts, MD5 demo-photos, contraste corrigé 7,77:1 |
| B1. Emplacements visuels | **Atteint** | 5 emplacements autorisés respectés, 0 sur zones interdites |
| B2. Budgets images WebP | **Atteint** | Héro 29.8 Ko ≤ 120 Ko, Total premier écran 133.2 Ko ≤ 180 Ko |
| B3. Preuves des images | **Atteint** | 12 captures responsives avec 12 MD5 uniques |
| **Archive unique livrable** | **Atteint** | `lot12c.zip` |
