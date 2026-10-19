# Scénario de Démonstration & Préparation Soutenance (5 minutes)

Ce document décrit le scénario minuté de soutenance de **SamaAdresse**, le plan de secours contre les aléas réseau ou d'hébergement gratuit, ainsi que 12 questions techniques probables du jury et leurs réponses.

---

## 1. Préparation avant d'entrer en salle (T - 10 min)

1. **Réveiller l'instance de production (Render + Neon)** :
   Le plan gratuit de Render met le conteneur en veille après 15 minutes d'inactivité (30 à 60 s au premier appel). Cinq minutes avant le passage :
   ```bash
   # 1. Réveille le conteneur Spring Boot
   curl -s "$FRONTEND_BASE_URL/api/health"
   # 2. Réveille la connexion PostgreSQL Neon et charge le cache
   curl -s "$FRONTEND_BASE_URL/api/addresses/ZIG-KBG-4271" > /dev/null
   ```
2. **Démarrer le plan de secours local en tâche de fond** :
   Garder l'image Docker de production prête localement sur `http://localhost:8082` :
   ```bash
   docker compose -f docker-compose.prod-test.yml up -d
   ```
3. **Comptes utilisés pendant la démonstration** *(aucun mot de passe n'est inscrit dans ce document — utiliser les valeurs définies dans votre fichier `.env` non versionné)* :
   - **Propriétaire de démonstration** : `demo@samaadresse.sn` / mot de passe défini par la variable d'environnement `DEMO_PASSWORD`.
   - **Administrateur (modération)** : adresse e-mail définie par `ADMIN_EMAIL` (défaut `admin@samaadresse.sn`) / mot de passe défini par `ADMIN_PASSWORD`.
   - **Adresses de démonstration pré-chargées (`DEMO_SEED=true`)** :
     - `ZIG-KBG-4271` (Boucotte - Kangourou, Ziguinchor — Maison familiale au toit rouge)
     - `ZIG-ESC-1042` (Escale, Ziguinchor — Boutique d'alimentation générale)
     - `ZIG-KND-8319` (Kandé - Lyndiane, Ziguinchor — Atelier de couture, non listé dans l'annuaire)

---

## 2. Scénario chronométré (5 minutes)

### Minute 0:00 – 1:00 : Problème d'adressage & Consultation publique (`/a/ZIG-KBG-4271`)
- **Action** : Ouvrir la page d'accueil (`/`), saisir le code `ZIG-KBG-4271` (ou scanner le QR code avec un téléphone) pour afficher la fiche publique `/a/ZIG-KBG-4271`.
- **Points à montrer** :
  - Plaque d'enseigne `ZIG-KBG-4271` (Zone Ziguinchor · Quartier Boucotte - Kangourou), repère de terrain, photo de façade servie depuis PostgreSQL (`bytea`, `ETag` + cache immuable 1 an) et carte Leaflet centrée sur le point.
  - Cliquer sur **« Itinéraire depuis ma position »** : afficher le tracé réel OpenRouteService sur la carte en mode **Voiture** puis **À pied**, avec la distance, la durée et la liste des étapes de navigation en français, sans jamais exposer la clé API côté navigateur ni stocker la position du visiteur.

### Minute 1:00 – 2:15 : Annuaire public opt-in & Respect de la vie privée (`/annuaire`)
- **Action** : Ouvrir `/annuaire`.
- **Points à montrer** :
  - Filtrer par quartier `Boucotte - Kangourou` ou type `Commerce`, puis rechercher `Boutique` ou `ZIG-ESC-1042` (recherche tolérante aux accents et aux tirets).
  - Montrer que `ZIG-KND-8319` (`listed = false`) n'apparaît jamais dans l'annuaire, même en tapant son code exact.
  - Montrer que le nom du propriétaire n'est affiché et cherchable que lorsque ce dernier a explicitement activé `showOwnerName = true` (`ZIG-KBG-4271`), et qu'il est absent de la réponse JSON pour `ZIG-ESC-1042` (`showOwnerName = false`).

### Minute 2:15 – 3:45 : Connexion, Création hors ligne & Synchronisation (`/addresses/new` et `/addresses/mine`)
- **Action** : Se connecter avec `demo@samaadresse.sn` (`DEMO_PASSWORD`). Ouvrir `/addresses/new`.
- **Points à montrer** :
  - À la connexion, l'application pré-réserve en arrière-plan un lot de codes par quartier (`POST /api/address-codes/reservations?zone=ZIG`) stockés dans IndexedDB.
  - Dans les DevTools Chrome (onglet *Network*), activer le mode **Offline**.
  - Parcourir les 4 étapes de l'assistant hors ligne :
    1. Positionner le repère à Ziguinchor (montrer au passage le message actionnable si l'on déplace le repère hors zone couverte, puis revenir dans Boucotte/Kandé).
    2. Choisir le type (`Maison`, `Commerce` ou `Institution`) et saisir un repère visuel.
    3. Constater que **« Figurer dans l'annuaire public » est décoché par défaut** (consentement explicite).
    4. Valider : la plaque provisoire s'affiche en moins de 3 secondes avec la mention unique *« Enregistrée sur cet appareil · en attente d'envoi »*.
  - Ouvrir **« Mes adresses »** (`/addresses/mine`) : montrer la file d'attente hors ligne.
  - Désactiver le mode **Offline** : la synchronisation automatique s'exécute (`POST /api/addresses` avec `clientRequestId` idempotent), l'adresse sort de la file d'attente et le bloc de partage (QR code, WhatsApp, SMS) devient actif. Si le repère avait été déplacé dans un autre quartier que celui du code réservé, montrer la bannière de réattribution indiquant l'ancien code, le nouveau code et le nom du quartier.

### Minute 3:45 – 5:00 : Signalement public, Modération & Purge du cache (`410 Gone`)
- **Action** : Sur une fiche publique, cliquer sur **« Signaler un problème »**, choisir un motif (`Position incorrecte`) et envoyer (`202 Accepted`).
- **Action Admin** : Se connecter avec le compte administrateur (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) et ouvrir `/admin`.
- **Points à montrer** :
  - Consulter le signalement `OPEN`, puis suspendre l'adresse en saisissant un motif obligatoire (journalisé dans `admin_actions`).
  - Revenir sur la fiche publique `/a/{code}` : le serveur renvoie `410 Gone` (« Cette adresse n'est plus disponible ») et le plugin Workbox (`fetchAndEvictOnGonePlugin`) purge immédiatement la fiche du cache hors ligne du navigateur.

---

## 3. Plan de secours en cas d'aléa pendant la soutenance

| Aléa | Symptôme | Action immédiate (< 15 secondes) |
|---|---|---|
| **Cold start Render** | Le premier chargement sur l'URL Render met > 20 s | Basculer immédiatement sur l'onglet local pré-ouvert `http://localhost:8082` (même image Docker de production, même base PostgreSQL 16 et mêmes données de démonstration). |
| **Coupure Wi-Fi de la salle** | Plus d'accès Internet pendant la démo | 1. Utiliser la coupure pour démontrer la consultation hors ligne d'une fiche déjà ouverte (`/a/ZIG-KBG-4271`) et la création hors ligne.<br>2. Pour la synchronisation et la modération, basculer sur `http://localhost:8082` qui tourne intégralement en local sans dépendre du Wi-Fi. |
| **Quota ou panne OpenRouteService** | `/api/public/route` renvoie `503` | Montrer la gestion gracieuse du `503` dans l'interface (message clair + bouton de repli « Ouvrir dans l'application de cartes ») et présenter les réponses réelles capturées dans `docs/audit/ors-real-car.json` et `docs/audit/ors-real-foot.json`. |
| **GPS imprécis à l'intérieur du bâtiment** | `accuracy > 50 m` ou position à Dakar/hors zone | Montrer le bandeau d'avertissement de précision GPS faible (> 50 m), puis utiliser les coordonnées pré-remplies de Ziguinchor ou déplacer manuellement le repère sur la carte. |

---

## 4. Douze questions probables du jury et réponses techniques

### Q1. Pourquoi avoir empaqueté le frontend React et le backend Spring Boot dans une seule image Docker au lieu de deux services séparés ?
**Réponse** : Sur les hébergements gratuits comme Render, deux services distincts reçoivent deux sous-domaines sous `*.onrender.com`. Comme `onrender.com` figure sur la *Public Suffix List*, les navigateurs traitent deux sous-domaines `*.onrender.com` comme *cross-site* : un cookie de rafraîchissement configuré en `SameSite=Strict` serait donc bloqué lors des appels `fetch` du frontend vers l'API. En servant les fichiers statiques compilés de Vite et l'API `/api/**` depuis le même conteneur Spring Boot, toute l'application partage la même origine : on conserve `SameSite=Strict`, `HttpOnly` et `Secure`, et on désactive complètement CORS en production.

### Q2. Où est stocké le jeton JWT côté client et comment gérez-vous le rafraîchissement sans erreur `401` dans la console des visiteurs anonymes ?
**Réponse** : L'`accessToken` JWT (durée de vie 15 minutes) est conservé **uniquement en mémoire JavaScript** (variable de module dans `apiClient.ts` et état React), jamais dans `localStorage`, afin d'empêcher son vol par script tiers. Le `refreshToken` (7 jours) est transmis dans un cookie `HttpOnly; SameSite=Strict; Path=/api/auth/refresh` dont seul le hash SHA-256 est stocké en base, avec rotation à chaque usage. Pour éviter qu'un visiteur non connecté ne déclenche un `POST /api/auth/refresh` renvoyant `401` en console au chargement, l'application pose un simple drapeau non sensible `sa_session=1` dans `localStorage` lors de la connexion et ne tente le rafraîchissement silencieux que si ce drapeau est présent.

### Q3. Comment évitez-vous que deux adresses créées hors ligne reçoivent le même code ou créent des doublons à la reconnexion ?
**Réponse** : Deux mécanismes complémentaires sont combinés :
1. **Pré-réservation en ligne** : dès que l'utilisateur est connecté, le client réserve auprès du serveur 3 codes par quartier (`reserved_codes`, uniques en base, valables 30 jours) et les stocke dans IndexedDB par `userId`. Hors ligne, l'assistant consomme l'un de ces codes réservés.
2. **Idempotence et validation serveur à la synchronisation** : chaque brouillon génère un UUID `clientRequestId` soumis à une contrainte `UNIQUE` en base. Si la requête réseau est rejouée après une coupure, le serveur renvoie `200 OK` avec l'adresse déjà créée sans créer de doublon. De plus, le serveur recalcule toujours le quartier réel à partir des coordonnées GPS : si l'utilisateur a déplacé le repère dans un autre quartier que celui du code réservé, le serveur attribue un nouveau code du bon quartier et renvoie `codeChanged = true` avec `previousCode`.

### Q4. Pourquoi le code d'adresse et les coordonnées GPS sont-ils immuables après création ?
**Réponse** : Le code d'adresse a vocation à être imprimé sur une plaque ou un QR code fixé sur un mur et partagé par SMS ou WhatsApp à des tiers. Si un propriétaire pouvait modifier les coordonnées GPS d'un code existant, un QR code déjà distribué pointerait vers un autre lieu sans que ses détenteurs en soient avertis. La méthode `PATCH /api/addresses/{id}` n'autorise donc que la mise à jour de la description, du type de lieu et des options d'annuaire ; en cas de changement d'emplacement, le propriétaire archive l'adresse (`410 Gone`) et en crée une nouvelle.

### Q5. Comment gérez-vous le stockage des photos sur un hébergement PaaS gratuit dont le système de fichiers est éphémère ?
**Réponse** : Nous avons abstrait le stockage derrière l'interface `PhotoStorage` avec deux implémentations activées par `@ConditionalOnProperty(name = "app.photo.storage")` :
- `DiskPhotoStorage` en développement (`PHOTO_STORAGE=disk`).
- `DbPhotoStorage` en production (`PHOTO_STORAGE=db`), qui stocke les octets dans la table PostgreSQL `photo_blobs` (colonne `bytea`, sans `@Lob` pour éviter l'API Large Object `oid` de PostgreSQL).
Avant stockage, chaque image est vérifiée par ses octets magiques (JPEG, PNG, WebP) et redimensionnée côté serveur à 800 px maximum (~80 à 150 Ko). Le contrôleur `GET /uploads/{filename}` sert ensuite l'image avec `Cache-Control: public, max-age=31536000, immutable` et un `ETag` basé sur l'identifiant immuable (`304 Not Modified`), ce qui évite de recharger la base lors des consultations suivantes.

### Q6. Pourquoi la route `/api/health` n'interroge-t-elle pas la base PostgreSQL ?
**Réponse** : Sur Render couplé à Neon (plan gratuit), Render appelle régulièrement le `healthCheckPath` (`/api/health`) toutes les quelques secondes. Si `/api/health` exécutait un `SELECT 1` SQL, l'instance PostgreSQL Neon ne pourrait jamais se mettre en veille (*scale-to-zero*) et consommerait en continu son quota mensuel d'heures de calcul. `/api/health` répond donc immédiatement `200 {"status":"UP"}` en mémoire.

### Q7. Comment protégez-vous la vie privée des propriétaires dans l'annuaire et sur les fiches publiques ?
**Réponse** :
1. Sur la fiche publique `/a/{code}`, le DTO `PublicAddressResponse` ne contient aucun champ relatif au propriétaire (ni nom, ni e-mail, ni téléphone).
2. Dans l'assistant de création, la case *« Figurer dans l'annuaire public »* (`listed`) est **décochée par défaut**.
3. Même lorsqu'une adresse est listée (`listed = true`), le nom du propriétaire n'est inclus dans la réponse JSON et n'est indexé dans la colonne de recherche `search_text` que si `showOwnerName = true`. Dans le cas contraire, chercher le nom du propriétaire dans `/api/public/directory` ne renvoie aucun résultat.

### Q8. Comment fonctionne la résolution de quartier et que se passe-t-il dans les zones de recouvrement ou en périphérie ?
**Réponse** : La grille `geo-grid.json` (partagée à l'identique entre `GeoGridService.java` et `geoGrid.ts`, vérifiée par `cmp -s` dans `verify-all`) définit pour chaque zone (Ziguinchor, Dakar, Saint-Louis) une boîte englobante globale et, pour chaque quartier, sa boîte `[minLat, maxLat, minLon, maxLon]` et son centre `[centerLat, centerLon]`. Si un point tombe dans plusieurs boîtes qui se chevauchent, l'algorithme retient le quartier dont le centre est le plus proche par distance de Haversine. Si le point est dans la zone mais juste à l'extérieur des boîtes de quartier, un repli Haversine jusqu'à 3 km rattache le point au quartier le plus proche ; au-delà, l'API renvoie `422 Unprocessable Entity`.

### Q9. Que se passe-t-il dans le cache hors ligne du téléphone d'un visiteur lorsqu'une adresse est archivée ou suspendue par la modération ?
**Réponse** : Le Service Worker (`frontend/src/sw.ts`) utilise une stratégie `NetworkFirst` (délai de repli de 3 secondes) sur `/api/addresses/{code}` complétée par un plugin personnalisé `fetchAndEvictOnGonePlugin`. Lorsque le serveur répond `410 Gone` (adresse `ARCHIVED` ou `SUSPENDED`), le plugin supprime immédiatement l'entrée correspondante du cache Workbox `public-addresses-cache` et renvoie la réponse `410` à l'interface, empêchant qu'une fiche révoquée reste consultable hors ligne.

### Q10. Comment l'application évite-t-elle les abus sur les routes publiques (signalements, itinéraires, SMS, connexion) derrière un proxy inverse comme Render ?
**Réponse** : `ClientIpResolver` n'accorde aucune confiance aux en-têtes falsifiables par le client : l'en-tête `True-Client-IP` est strictement ignoré et le premier élément de `X-Forwarded-For` n'est jamais utilisé. En production derrière Render (`TRUSTED_PROXY_HOPS = 1`), le résolveur lit en priorité `CF-Connecting-IP` (présent d'après la documentation Render, comportement à confirmer par la procédure de contrôle) ou l'adresse ajoutée par le dernier proxy de confiance dans `X-Forwarded-For` (`taille - TRUSTED_PROXY_HOPS`). Sans proxy (`TRUSTED_PROXY_HOPS = 0` en dev), seule l'adresse distante directe (`request.getRemoteAddr()`) est utilisée. Les limiteurs en mémoire (`RateLimiterService`, `ReportRateLimiter`, `SmsRateLimiter`) appliquent des quotas glissants : 5 tentatives/min/IP sur `/api/auth/login`, 20 req/min/IP sur `/api/public/route`, 30 req/min/IP sur `/api/public/directory`, 3 signalements/h/IP et 1 signalement/24h par couple `(adresse, IP hachée SHA-256)`. Sur les SMS, la protection combine 3 niveaux atomiques : 5 SMS/h par utilisateur connecté, 3 SMS/24h par numéro destinataire (haché SHA-256), et le plafond quotidien global de la plateforme `SMS_DAILY_CAP` (200 en dev, 20 en prod).

### Q11. Comment avez-vous éliminé le décalage de mise en page (CLS) sur `/addresses/mine` et `/annuaire` et optimisé le LCP sur `/addresses/new` ?
**Réponse** :
- Sur `/addresses/mine` et `/annuaire`, les décalages provenaient de l'apparition asynchrone de la barre de filtres, du compteur de résultats et des cartes d'adresses qui repoussaient le pied de page (`footer`). Nous avons réservé les hauteurs minimales des conteneurs (`min-h-[1100px]`, `min-h-[172px] sm:min-h-[116px]`), utilisé des squelettes de chargement de même géométrie que les cartes finales et fixé les dimensions `width`/`height` explicites des vignettes et icônes, ramenant le CLS mesuré à `0.000` (objectif < 0,1).
- Sur `/addresses/new`, la carte Leaflet est chargée par import dynamique (`React.lazy`) avec un conteneur de hauteur fixe réservée, ce qui maintient le chunk JS d'entrée à 102.67 Ko gzip (objectif ≤ 105 Ko, plafond ≤ 125 Ko) et le LCP mesuré à 2.6 secondes (2585 ms, cible < 3 s).

### Q12. Pourquoi l'adresse de départ d'un itinéraire n'est-elle jamais envoyée directement par le navigateur à OpenRouteService ?
**Réponse** : Appeler OpenRouteService depuis le navigateur exposerait la clé `ORS_API_KEY` dans le bundle JavaScript public et permettrait à n'importe qui d'épuiser le quota de l'API. En passant par `GET /api/public/route`, la clé reste uniquement en variable d'environnement serveur, le backend vérifie que le point de départ est au Sénégal, applique le limiteur de débit (20/min/IP), met en cache les résultats pendant 5 minutes (`RouteService`) et ne journalise jamais les coordonnées de départ du visiteur.
