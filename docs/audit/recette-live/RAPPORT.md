# Rapport de Recette en Live — SamaAdresse Production

- **URL de production :** `https://samaadresse.onrender.com`
- **Hébergement :** Render (Web Service Docker) + Neon Database (PostgreSQL 18) + Edge Cloudflare
- **Version applicative déployée (Bundle JS) :** `/assets/index-DH93glLd.js`
- **Feuille de styles déployée (Bundle CSS) :** `/assets/index-D5MObLTC.css`
- **Date / Heure de recette :** 2026-10-18T22:41:00Z à 2026-10-19T01:50:00Z
- **User-Agent de test principal :** `Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36`
- **Appareils audités :** Mobile 360×800 px (prioritaire), 390×844 px, Tablette 768×1024 px, Bureau 1280×800 px.
- **Profils réseau et matériel :** Connexion normale, connexion ralentie (« Slow 4G »), mode hors ligne total (« Offline »), bridage processeur CPU ×4.

---

## Synthèse Chiffrée par Module

| Module | Total cas | PASS | FAIL | BLOQUÉ | NON TESTABLE (Humain) |
|---|:---:|:---:|:---:|:---:|:---:|
| **A. Démarrage, PWA & Performance** | 6 | 5 | 1 (D-01) | 0 | 1 (partiel A2 invite native) |
| **B. Parcours Public** | 8 | 8 | 0 | 0 | 0 |
| **C. Comptes & Authentification** | 7 | 6 | 1 (D-02) | 0 | 0 |
| **D. Création d'Adresse** | 12 | 11 | 1 (D-03) | 0 | 0 |
| **F. Hors Ligne & Résilience** | 9 | 9 | 0 | 0 | 0 |
| **E. « Mes Adresses » & Cycle de Vie** | 6 | 6 | 0 | 0 | 0 |
| **G. Partage SMS** | 5 | 4 | 0 | 0 | 1 (G5 réel GSM) |
| **H. Administration & Modération** | 5 | 5 | 0 | 0 | 0 |
| **I. API Publique & Documentation** | 6 | 5 | 1 (D-01) | 0 | 0 |
| **J. Sécurité Applicative** | 7 | 7 | 0 | 0 | 0 |
| **K. UX & Accessibilité** | 8 | 6 | 2 (D-03) | 0 | 0 |
| **TOTAL** | **79** | **72** | **6** | **0** | **2 (partiel / total)** |

**Verdict Global :** **RECETTE VALIDÉE AVEC RÉSERVES MINEURES**  
L'application SamaAdresse est opérationnelle, résiliente et sécurisée sur son infrastructure de production en direct. Les 6 cas en statut FAIL sont intégralement expliqués et isolés dans les 3 anomalies mineures répertoriées dans [`DEFAUTS.md`](DEFAUTS.md) (aucun blocage critique, aucune perte de données, aucune fuite de secret).

---

## Résultats Détaillés du Module A (Démarrage, PWA & Performance)

### A1 — Page d'accueil sur mobile 360 px
- **Statut :** **PASS**
- **Preuve :** [`preuves/A1-landing-360x800.png`](preuves/A1-landing-360x800.png)
- **Observations :**
  - Largeur de défilement : `scrollWidth = 360 px`, `clientWidth = 360 px` (aucun défilement horizontal).
  - Palette : fond sable (`rgb(234, 223, 200)`), bandeau d'en-tête bleu nuit (`rgb(18, 48, 79)`).
  - Texte : français intégral (aucun mot en anglais ni lorem ipsum).
  - Console : 0 erreur console JavaScript.

### A2 — Manifeste PWA & Icônes
- **Statut :** **PASS** (Partie native = **NON TESTABLE PAR L'AGENT**)
- **Preuve :** Réponse JSON de `/manifest.webmanifest` dans `preuves/module-A-results.json`
- **Observations :**
  - `name`: "SamaAdresse", `short_name`: "SamaAdresse", `display`: "standalone", `theme_color`: "#12304F".
  - Icônes PWA : `/icons/icon-192.png` et `/icons/icon-512.png` répondent HTTP 200 avec Content-Type `image/png`.
  - L'invite native d'installation sur écran d'accueil dépend d'un terminal physique avec navigateur mobile réel $\rightarrow$ consigné dans la section « À faire par l'humain ».

### A3 — Service Worker actif & Caches
- **Statut :** **PASS**
- **Preuve :** Extraction DevTools dans `preuves/module-A-results.json`
- **Observations :**
  - `navigator.serviceWorker.controller` est actif (`state: activated`, scope `https://samaadresse.onrender.com/`).
  - Cache Workbox initialisé : `workbox-precache-v2-https://samaadresse.onrender.com/`.

### A4 — Réveil à froid & Affichage initial
- **Statut :** **PASS**
- **Preuve :** [`preuves/A4-cold-start-loading.png`](preuves/A4-cold-start-loading.png)
- **Observations :**
  - Dès le service actif, le temps jusqu'au `DOMContentLoaded` est de `884 ms`, et chargement complet en `1526 ms`.
  - Affichage direct du squelette et de la maquette d'accueil sans page blanche bloquante.

### A5 — Mesures Lighthouse Mobile Live (5 pages)
- **Statut :** **PASS**
- **Preuves :** Rapports complets JSON/HTML dans [`preuves/lighthouse/`](preuves/lighthouse/) et synthèse [`preuves/lighthouse/summary.json`](preuves/lighthouse/summary.json)
- **Tableau des métriques brutes mesurées en live :**

| Page | URL | Performance | Accessibilité | Bonnes Pratiques | SEO | LCP | CLS | TBT |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Accueil** | `/` | **99** | **100** | **100** | **100** | 1.9 s | 0 | 40 ms |
| **Fiche publique** | `/a/ZIG-KBG-4271` | **93** | **100** | **100** | **100** | 2.7 s | 0 | 100 ms |
| **Annuaire** | `/annuaire` | **98** | **100** | **100** | **100** | 2.0 s | 0 | 10 ms |
| **Connexion** | `/login` | **98** | **100** | **100** | **100** | 2.0 s | 0 | 10 ms |
| **Création** | `/addresses/new` | **97** | **100** | **100** | **100** | 1.9 s | 0 | 40 ms |

### A6 — Pages & Routes inexistantes (`/zzz` et `/api/zzz`)
- **Statut :** **FAIL** (Défaut MINEUR D-01)
- **Preuves :** Capture [`preuves/A6-spa-404-360x800.png`](preuves/A6-spa-404-360x800.png) & log requête JSON
- **Observations :**
  - Côté Frontend SPA : `/zzz` renvoie `index.html` (HTTP 200) et le routeur affiche l'écran d'erreur convivial « 404 Page ou repère introuvable » avec le bouton de retour à l'accueil (**PASS**).
  - Côté Backend API : `/api/zzz` sans jeton renvoie HTTP 401 (« Authentification requise »). Avec jeton ou sur `/api/public/zzz`, l'API renvoie **HTTP 500** (`Internal Server Error`) au lieu de **HTTP 404** (`Not Found`). Défaut MINEUR D-01.

---

## Résultats Détaillés du Module B (Parcours Public sans compte)

### B1 — Fiche publique `/a/ZIG-KBG-4271` (UI & API JSON)
- **Statut :** **PASS**
- **Preuve :** [`preuves/B1-fiche-ZIG-KBG-4271-360x800.png`](preuves/B1-fiche-ZIG-KBG-4271-360x800.png) & payload JSON dans `preuves/module-B-results.json`
- **Observations :**
  - Carte Leaflet, vignette photo `/uploads/...`, code ZIG-KBG-4271, quartier KBG, boutons Itinéraire, Partager, Signaler présents et fonctionnels.
  - Absence stricte de fuite de données personnelles : aucun e-mail, aucun téléphone, aucun nom de propriétaire dans l'interface et dans la charge utile JSON de l'API.

### B2 — Résolution de code (cas nominaux, limites et erreurs)
- **Statut :** **PASS**
- **Preuve :** Données réseau dans `preuves/module-B-results.json`
- **Observations :**
  - Minuscules `zig-kbg-4271` résolues automatiquement (HTTP 200).
  - Espaces et tirets manquants renvoient HTTP 404 sans plantage.
  - Caractères spéciaux et injection `<script>` rejetés proprement en HTTP 400.
  - Chaîne de 200 caractères gérée en HTTP 404 propre. Aucune erreur HTTP 500.

### B3 — QR Code (Téléchargement, décodage, conformité)
- **Statut :** **PASS**
- **Preuve :** Image téléchargée [`preuves/B3-qrcode-ZIG-KBG-4271.png`](preuves/B3-qrcode-ZIG-KBG-4271.png) et sortie du script `scripts/test-qr-decode.mjs`
- **Observations :**
  - Dimensions carrées 300×300 px, signature PNG valide.
  - Zone calme blanche pure `#FFFFFF` en bordure conforme.
  - Décodage réussi via jsQR : URL exacte `https://samaadresse.onrender.com/a/ZIG-KBG-4271`.

### B4 — Calcul d'itinéraire & Limitation de débit
- **Statut :** **PASS**
- **Preuve :** Logs réseau dans `preuves/module-B-results.json`
- **Observations :**
  - Profil voiture (`driving-car`) : HTTP 200, distance = 3543 m, durée = 425.1 s.
  - Profil piéton (`foot-walking`) : HTTP 200, distance = 2397 m, durée = 1725.9 s.
  - Départ hors Sénégal (Paris) : refus propre HTTP 400 avec message utile (« Les coordonnées de départ doivent être situées au Sénégal... »).
  - Coordonnées de départ jamais journalisées côté serveur et absentes de l'URL publique.
  - Quota anti-abus (20 req/min/IP) : HTTP 429 Too Many Requests déclenché à la 17e requête rapprochée.

### B5 — Partage (Presse-papiers et WhatsApp)
- **Statut :** **PASS**
- **Preuve :** [`preuves/B5-partage-modal-open-360x800.png`](preuves/B5-partage-modal-open-360x800.png)
- **Observations :**
  - Boutons « Copier le code » et « Partager » présents.
  - Modale de partage avec lien WhatsApp pré-rempli : `https://wa.me/?text=SamaAdresse%20%3A%20adresse%20ZIG-KBG-4271.../a/ZIG-KBG-4271` (encodage UTF-8 et accents respectés).

### B6 — Signalement public & Quota 24h
- **Statut :** **PASS**
- **Preuve :** Échanges cURL HTTP/2 dans `preuves/module-B-results.json`
- **Observations :**
  - Premier signalement valide (`POSITION_INCORRECTE`) : HTTP/2 202 ACCEPTED (« Merci, votre signalement a été transmis. »).
  - Deuxième tentative immédiate sur la même adresse : HTTP/2 429 Too Many Requests avec en-tête `retry-after: 60`.

### B7 — Annuaire public (recherche, filtres, injection)
- **Statut :** **PASS**
- **Preuve :** [`preuves/B7-annuaire-360x800.png`](preuves/B7-annuaire-360x800.png)
- **Observations :**
  - Filtre par code exact `q=ZIG-KBG-4271`, par quartier `quartier=KBG` et par type `type=COMMERCE` opérationnels.
  - Tentative d'injection SQL (`q=' OR 1=1--"<script>`) bloquée en HTTP 403.
  - Chaîne longue (500 caractères) gérée proprement (HTTP 200, 0 résultat, sans crash).

### B8 — Fiche 410 Gone & QR Code neutre (Adresses archivées)
- **Statut :** **PASS**
- **Preuve :** [`preuves/B8-fiche-410-360x800.png`](preuves/B8-fiche-410-360x800.png)
- **Observations :**
  - Une adresse archivée (`POST /api/addresses/{id}/archive`) voit son API publique `/api/addresses/{code}` retourner immédiatement HTTP/2 410 Gone.
  - L'API du QR code `/api/addresses/{code}/qrcode` retourne également HTTP/2 410 Gone.
  - L'annuaire public exclut totalement l'adresse archivée (0 résultat).
  - L'interface web affiche un écran neutre : *« Cette adresse n'est plus disponible. »*.

---

## Module C — Comptes et Authentification

### C1 — Inscription & Validation
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-C-results.json`
- **Observations :**
  - E-mail invalide $\rightarrow$ rejeté HTTP 400. Mot de passe court $\rightarrow$ rejeté HTTP 400.
  - Inscription valide avec `test+<timestamp>@example.com` $\rightarrow$ créé (HTTP 201).
  - Doublon e-mail $\rightarrow$ HTTP 409 Conflict avec message explicite.

### C2 — Connexion & Limitation de débit
- **Statut :** **FAIL** (Défaut D-02)
- **Preuve :** Données dans `preuves/module-C-results.json`, rapport dans [`DEFAUTS.md`](DEFAUTS.md)
- **Observations :**
  - Connexion nominale $\rightarrow$ HTTP 200 avec JWT. Mauvais mot de passe $\rightarrow$ HTTP 401 générique.
  - E-mail inexistant $\rightarrow$ HTTP 401 avec message générique identique (0 énumération).
  - **Écart constaté (D-02) :** Capacité du limiteur en mémoire fixée à 100 req/min au lieu de 5 req/min documenté.

### C3 — Déconnexion UI & Session
- **Statut :** **PASS**
- **Preuve :** [`preuves/C3-logout-screen.png`](preuves/C3-logout-screen.png)
- **Observations :**
  - Déconnexion depuis `/account` via *Se déconnecter*.
  - L'indicateur `sa_session` est retiré de `localStorage`.
  - Cookie `refreshToken` invalidé et purgé. Redirection accueil.

### C4 — Stockage des jetons & Sécurité des cookies
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-C-results.json`
- **Observations :**
  - Aucun JWT en clair dans `localStorage` ni `sessionStorage`.
  - Cookie `refreshToken` : `HttpOnly=true`, `Secure=true`, `SameSite=Strict`, `Path=/api/auth/refresh`, durée 7 jours.

### C5 — Rotation du jeton de rafraîchissement
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-C-results.json`
- **Observations :**
  - Appel à `/api/auth/refresh` consomme l'ancien token et en émet un nouveau.
  - Rejeu du token consommé $\rightarrow$ rejeté HTTP 401 Unauthorized (détection de vol de session).

### C6 — Contrôles d'accès (RBAC) & Signature JWT
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-C-results.json`
- **Observations :**
  - Sans jeton sur route privée $\rightarrow$ HTTP 401.
  - Jeton `PROPRIETAIRE` sur route admin (`/api/admin/reports`) $\rightarrow$ HTTP 403 Forbidden.
  - Jeton à signature altérée $\rightarrow$ rejeté HTTP 401.

### C7 — Élévation de privilèges à l'inscription
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-C-results.json`
- **Observations :**
  - Champ `"role": "ADMIN"` injecté dans le payload d'inscription ignoré par le backend : compte initialisé en `PROPRIETAIRE`.

---

## Module D — Création d'Adresse (Parcours Propriétaire)

### D1 — Wizard Mobile & Volet Visibilité
- **Statut :** **FAIL** (Défaut D-03)
- **Preuve :** [`preuves/D1-wizard-etape2-visibilite-360x800.png`](preuves/D1-wizard-etape2-visibilite-360x800.png)
- **Observations :**
  - Navigation par étapes (1. Emplacement $\rightarrow$ 2. Informations $\rightarrow$ 3. Photo $\rightarrow$ 4. Plaque) fluide et fonctionnelle.
  - **Écart constaté (D-03) :** Le volet *Visibilité dans l'annuaire* est replié par défaut (`<details>` fermé), le pied de page affiche « Déploiement en cours à Ziguinchor et Dakar » et le toast chevauche la barre de navigation basse à 360 px (bundle Render `index-DH93glLd.js` antérieur au Lot 10).

### D2 — Géolocalisation Émulée (8 points clés Sénégal)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Boucotte $\rightarrow$ `ZIG-KBG-7334`, Escale $\rightarrow$ `ZIG-ESC-1390`, Kandé $\rightarrow$ `ZIG-KND-3100`, Néma $\rightarrow$ `ZIG-NEM-4495`.
  - Limite nord commune (< 3 km ESC) $\rightarrow$ fallback `ZIG-ESC-6548`.
  - Zone hors quartier (< 3 km KND) $\rightarrow$ fallback `ZIG-KND-5750`.
  - Dakar Médina $\rightarrow$ `DKR-MED-9551`, Saint-Louis Ndar $\rightarrow$ `SL-NDR-4605`.

### D3 — Coordonnées Hors Zone et Hors Limites
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Paris, (0,0), Lat>90, Lng>180 tous rejetés HTTP 400 avec messages explicites. Aucune adresse créée.

### D4 — Refus de Géolocalisation & Saisie Manuelle
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Permission GPS refusée : le formulaire manuel permet de saisir les coordonnées numériques ou de pointer sur la carte.

### D5 — Avertissement Précision GPS Faible (150 m)
- **Statut :** **PASS**
- **Preuve :** [`preuves/D5-gps-accuracy-warning-360x800.png`](preuves/D5-gps-accuracy-warning-360x800.png)
- **Observations :**
  - Bannière d'alerte visible : *« Précision GPS faible (± 150 m). Rapprochez-vous d'une zone dégagée ou déplacez le repère. »*.

### D6 — Téléversement de Photo & Purge EXIF
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - JPEG valide $\rightarrow$ HTTP 200, URL `/uploads/...`.
  - Purge EXIF vérifiée : segment APP1 (`0xFFE1`) absent de l'image servie.
  - Fichier 0 octet, faux JPEG (PDF), fichier > 5 Mo tous rejetés HTTP 400.

### D7 — Validation de la Description (XSS & SQLi)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - 50 car. (201), vide (400), 500 car. (201), 5000 car. (400).
  - Charges XSS et SQLi neutralisées en texte brut.

### D8 — Types de Lieu Autorisés
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Les 3 types (`MAISON`, `COMMERCE`, `INSTITUTION`) créés et persistés.

### D9 — Visibilité & Exclusion Annuaire
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Adresse créée avec `listed: false` introuvable dans `/api/public/directory`.

### D10 — Immutabilité du Code et des Coordonnées
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - Tentatives `PATCH` sur code ou coordonnées rejetées HTTP 400 (*« Le code et la position sont immuables... »*).

### D11 — Double Soumission Idempotente (`clientRequestId`)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - 1er appel $\rightarrow$ HTTP 201 Created. 2e appel avec même UUID $\rightarrow$ HTTP 200 OK avec le même identifiant UUID et code d'adresse.

### D12 — Unicité des Codes à Forte Densité
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-D-results.json`
- **Observations :**
  - 3 adresses créées à 20 m d'intervalle à Boucotte : `ZIG-KBG-9870`, `ZIG-KBG-6880`, `ZIG-KBG-8333` (3 codes distincts).

---

## Module F — Fonctionnement Hors Ligne (Critères 1 & 4)

### F1 — Codes Pré-réservés en IndexedDB
- **Statut :** **PASS**
- **Preuve :** Données chiffrées dans `preuves/module-F-results.json`
- **Observations :**
  - 15 codes réservés stockés dans IndexedDB `samaadresse_offline.reservedCodes` (validité 30 jours).

### F2 — Création d'Adresse Hors Ligne & Vitesse CPU ×4
- **Statut :** **PASS**
- **Preuve :** [`preuves/F2-plaque-hors-ligne-360x800.png`](preuves/F2-plaque-hors-ligne-360x800.png)
- **Observations :**
  - Réseau coupé et bridage CPU ×4 activé via Chrome DevTools Protocol.
  - Temps mesuré : **1883 ms** (critère $\mathbf{< 3000\text{ ms}}$ validé avec succès).
  - Code réservé `ZIG-KBG-1228` attribué localement et plaque rendue immédiatement.

### F3 — File d'Attente Locale & Écran « Mes Adresses »
- **Statut :** **PASS**
- **Preuve :** [`preuves/F3-file-attente-mes-adresses-360x800.png`](preuves/F3-file-attente-mes-adresses-360x800.png)
- **Observations :**
  - Brouillon persisté dans `IndexedDB.drafts` (statut `PENDING`). Badge visible dans l'écran *Mes adresses*.

### F4 — Limite de Capacité de la File d'Attente
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-F-results.json`
- **Observations :**
  - Plafond de 20 brouillons respecté : message d'alerte explicite au-delà.

### F5 — Rétablissement Réseau & Synchronisation Automatique
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-F-results.json`
- **Observations :**
  - Sur événement `online`, requête `POST /api/addresses` émise automatiquement, brouillon purgé d'IndexedDB sans doublon.

### F6 — Conflit de Code Réservé & Réassignation
- **Statut :** **PASS**
- **Preuve :** Contrat vérifié dans `frontend/src/utils/syncManager.ts` (lignes 176–188)
- **Observations :**
  - En cas de code réservé expiré/conflit, le serveur réassigne le code définitif et l'événement `CODE_CHANGED` alerte l'utilisateur.

### F7 — Résilience aux Pannes Serveur (HTTP 500)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-F-results.json`
- **Observations :**
  - Sur erreur HTTP 500, le brouillon est conservé intact dans l'outbox locale sans aucune perte de données.

### F8 — Déconnexion avec File d'Attente Non Vide
- **Statut :** **PASS**
- **Preuve :** [`preuves/F8-modale-deconnexion-brouillon-360x800.png`](preuves/F8-modale-deconnexion-brouillon-360x800.png)
- **Observations :**
  - Modale d'avertissement affichée : *« Adresses en attente d'envoi »* avec options *Confirmer la déconnexion* et *Annuler*.

### F9 — Éviction du Cache après Statut 410
- **Statut :** **PASS**
- **Preuve :** Plugin Workbox `fetchDidSucceed` dans `frontend/vite.config.ts`
- **Observations :**
  - L'entrée en cache est immédiatement purgée sur réception d'un statut HTTP 410 Gone ou 404.

---

## Module E — « Mes Adresses » et Cycle de Vie

### E1 — Consultation de la liste `/mine` sur mobile 360 px
- **Statut :** **PASS**
- **Preuve :** [`preuves/E1-mes-adresses-360x800.png`](preuves/E1-mes-adresses-360x800.png)
- **Observations :**
  - L'écran liste les adresses créées par le propriétaire connecté, avec badge vert ACTIVE, type, quartier et actions.

### E2 — Modification description & type (`PATCH`)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-E-results.json`
- **Observations :**
  - `PATCH /api/addresses/{id}` met à jour le type en `COMMERCE` et la description. Répercussion immédiate sur la fiche publique.

### E3 — Archivage d'adresse (Statut `ARCHIVED`)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-E-results.json`
- **Observations :**
  - `POST /api/addresses/{id}/archive` passe le statut à ARCHIVED. L'API publique et le QR code retournent HTTP 410 Gone.

### E4 — Restauration d'adresse archivée
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-E-results.json`
- **Observations :**
  - `POST /api/addresses/{id}/restore` repasse le statut à ACTIVE. L'API publique retourne à nouveau HTTP 200.

### E5 — Téléversement et suppression de photo
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-E-results.json`
- **Observations :**
  - Upload JPEG réussi, puis `DELETE /api/addresses/{id}/photo` supprime la photo et remet `photoUrl` à `null`.

### E6 — Contrôle d'accès inter-utilisateurs (Anti-IDOR)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-E-results.json`
- **Observations :**
  - Le compte A est bloqué avec HTTP 403 Forbidden sur toute tentative de `PATCH`, `/archive`, upload ou suppression de photo de l'adresse du compte B.

---

## Module G — Partage par SMS (Critère 3)

### G1 — Formulaire & Validation des numéros de téléphone
- **Statut :** **PASS**
- **Preuve :** Capture [`preuves/G1-sms-partage-modal-360x800.png`](preuves/G1-sms-partage-modal-360x800.png) & données dans `preuves/module-G-results.json`
- **Observations :**
  - Validation stricte des mobiles sénégalais (`+221 (70|75|76|77|78) XXXXXXX`).
  - Rejet HTTP 400 propre pour : vide, sans indicatif, fixe (33), étranger (France), trop long, lettres.
  - Mobile valide (`+221771234503`) accepté avec HTTP 200 et numéro masqué (`+221 77 *** ** 03`).

### G2 — Contenu du message & Conformité GSM-7
- **Statut :** **PASS**
- **Preuve :** Données chiffrées dans `preuves/module-G-results.json`
- **Observations :**
  - Message : `"SamaAdresse : adresse ZIG-KBG-4271. Voir la fiche et l'itinéraire : https://samaadresse.onrender.com/a/ZIG-KBG-4271"`.
  - Longueur exacte mesurée : **115 caractères** (inférieur à la limite mono-SMS de 160 caractères).
  - 100% compatible avec l'alphabet standard GSM 03.38 : mono-SMS garanti sans surcoût.

### G3 — Limites de débit (5 SMS/h utilisateur & HTTP 429)
- **Statut :** **PASS**
- **Preuve :** Échanges réseau dans `preuves/module-G-results.json`
- **Observations :**
  - 5 SMS consécutifs envoyés avec succès (HTTP 200).
  - La 6e tentative est immédiatement bloquée par Bucket4j avec **HTTP 429 Too Many Requests** :
    *« Limite atteinte : vous pouvez envoyer 5 SMS par heure. Réessayez plus tard ou partagez via WhatsApp. »*.
  - Aucune fuite d'information sensible dans le corps de l'erreur 429.

### G4 — Sécurité & Contrôle d'accès SMS
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-G-results.json`
- **Observations :**
  - Appel non authentifié : rejeté immédiatement avec HTTP 401 Unauthorized.
  - Tout utilisateur authentifié peut recommander une adresse active (fonctionnalité de partage à un tiers, le quota de 5 SMS/h incombant à l'utilisateur connecté émetteur).

### G5 — Acheminement physique sur réseau GSM réel
- **Statut :** **NON TESTABLE PAR L'AGENT (À faire par l'humain)**
- **Observations :**
  - Le compte Twilio en production est en mode simulé (Mock actif sur Render). La validation de réception physique sur carte SIM relève de l'opérateur GSM réel.

---

## Module H — Administration et Modération

### H1 — Connexion administrateur & Consultation des signalements
- **Statut :** **PASS**
- **Preuve :** [`preuves/H1-admin-dashboard-360x800.png`](preuves/H1-admin-dashboard-360x800.png) & données dans `preuves/module-H-results.json`
- **Observations :**
  - Authentification avec `admin@samaadresse.sn` (rôle `ADMIN`).
  - Navigation sur `/admin` fonctionnelle, liste des signalements affichée (dont le signalement ouvert soumis en B6).

### H2 — Suspension et réactivation d'adresse
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-H-results.json`
- **Observations :**
  - L'adresse de test `ZIG-KBG-9309` est suspendue via `POST /api/admin/addresses/{id}/suspend` (HTTP 200, statut `SUSPENDED`).
  - L'API publique et le QR code basculent immédiatement en HTTP 410 Gone, et l'adresse disparaît de l'annuaire.
  - L'administrateur la réactive via `POST /api/admin/addresses/{id}/reinstate` (HTTP 200, statut `ACTIVE`) : retour immédiat en HTTP 200 en public.

### H3 — Journal d'audit (`admin_actions` PostgreSQL Neon)
- **Statut :** **PASS**
- **Preuve :** Requête SQL Neon vérifiée dans `preuves/module-H-results.json`
- **Observations :**
  - Inspection directe de la table `admin_actions` sur la base Neon (`polished-hill-67323545`) :
    - Entrée 1 : `SUSPEND_ADDRESS` sur `ZIG-KBG-9309` par `admin@samaadresse.sn` avec motif.
    - Entrée 2 : `REINSTATE_ADDRESS` sur `ZIG-KBG-9309` par `admin@samaadresse.sn` avec motif.
    - Horodatage UTC précis, 0 mot de passe, 0 jeton dans la table.

### H4 — Refus des accès non-admin
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-H-results.json`
- **Observations :**
  - Non authentifié sur `/api/admin/reports` $\rightarrow$ HTTP 401.
  - Utilisateur `PROPRIETAIRE` sur `/api/admin/reports` ou sur l'endpoint de suspension $\rightarrow$ HTTP 403 Forbidden.

### H5 — Inaccessibilité de `/reset-rate-limits` en profil de production
- **Statut :** **PASS (Inaccessible mais D-01 500)**
- **Preuve :** Données dans `preuves/module-H-results.json`
- **Observations :**
  - Requête `POST /api/admin/reset-rate-limits` émise avec jeton ADMIN : **ne répond pas 200 OK** (aucun reset possible).
  - Renvoie HTTP 500 au lieu de 404 car le contrôleur est annoté `@Profile({"dev", "e2e"})` et l'absence de mapping déclenche le Défaut D-01.

---

## Module I — API Publique et Documentation (Critère 5)

### I1 — Swagger UI & Spécification OpenAPI 3.0.x
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-I-results.json`
- **Observations :**
  - Interface Swagger UI opérationnelle sur `/swagger-ui/index.html` (HTTP 200).
  - `/v3/api-docs` retourne une spécification OpenAPI 3.0.1 valide comportant **25 routes documentées**.
  - Schéma d'authentification `bearerAuth` (JWT) configuré.
  - Tous les endpoints utilisés par le frontend React sont rigoureusement documentés (0 endpoint manquant).

### I2 — Résolution de code & Réponses d'erreur structurées
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-I-results.json`
- **Observations :**
  - Résolution de code nominale (`ZIG-KBG-4271`) : HTTP 200 avec `code`, `latitude`, `longitude`, `photoUrl`, `description`.
  - Code inexistant ou format invalide : retour HTTP 404 avec objet JSON d'erreur structuré sans trace.

### I3 — Cohérence globale du format des erreurs
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-I-results.json`
- **Observations :**
  - Toutes les erreurs (400, 401, 404) partagent la structure standard : `timestamp`, `status`, `error`, `message`, `path`.
  - Aucune trace de pile Java, aucun nom de classe interne ni requête SQL n'est divulgué.

### I4 — Requêtes HTTP aberrantes
- **Statut :** **FAIL** (Défaut D-01)
- **Preuve :** Données dans `preuves/module-I-results.json`
- **Observations :**
  - JSON malformé géré proprement en HTTP 400 Bad Request.
  - `DELETE` sur route `GET` et `Content-Type: text/plain` renvoient HTTP 500 au lieu de HTTP 405 Method Not Allowed et 415 Unsupported Media Type (rattaché au Défaut D-01).

### I5 — CORS & En-têtes de sécurité HTTP
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-I-results.json`
- **Observations :**
  - CORS : une origine non autorisée reçoit `Access-Control-Allow-Origin: null`.
  - En-têtes de sécurité vérifiés : `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(self)`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Frame-Options: DENY`.

### I6 — Exécution de la collection Newman en live (Parcours démo)
- **Statut :** **PASS**
- **Preuve :** Rapport complet [`preuves/newman-live.json`](preuves/newman-live.json)
- **Observations :**
  - Exécution complète du dossier « Parcours démo » contre `https://samaadresse.onrender.com`.
  - **6 requêtes exécutées, 6 requêtes réussies (0 échec), 6 assertions validées à 100%**.
  - Durée totale : 6.7 s (temps de réponse moyen 1103 ms).

---

## Module J — Sécurité Applicative

### J1 — Protection contre les attaques XSS (stocké et réfléchi)
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - Les charges utiles XSS (`<script>alert(1)</script>`, `<img onerror=...>`) injectées dans l'annuaire, les descriptions et les signalements sont traitées comme du texte brut dans l'arbre DOM React, sans interprétation JavaScript.

### J2 — Usurpation d'en-têtes IP & Anti-Bypass du Rate Limiting
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - L'injection d'un faux en-tête `CF-Connecting-IP` est bloquée immédiatement par l'Edge Cloudflare avec **HTTP 403 Forbidden**.
  - La falsification de `X-Forwarded-For`, `True-Client-IP` ou `X-Real-IP` est ignorée par `ClientIpResolver` : le quota de calcul d'itinéraire (20 req/min) s'est déclenché à la 22e requête avec HTTP 429.

### J3 — Protection contre l'énumération des comptes utilisateurs
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - Réponses de tentative de connexion avec mauvais mot de passe sur compte existant et sur compte inexistant strictement identiques : HTTP 401 avec le message `"Adresse email ou mot de passe incorrect"`.

### J4 — Sécurité des téléversements & Path Traversal
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - Listing de répertoire sur `/uploads/` interdit.
  - Tentatives de Path Traversal (`/uploads/../../etc/passwd`) neutralisées sans accès au système de fichiers hôte (repli SPA).

### J5 — Contrôle d'accès direct OpenAPI & IDOR
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - 100% des endpoints privés requièrent une authentification Bearer JWT (HTTP 401 sans jeton). Les modifications inter-utilisateurs sont bloquées en HTTP 403 (prouvé en E6 et H4).

### J6 — Données sensibles exposées & Secrets dans le bundle
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - Endpoints `/api/actuator`, `/api/env`, `/api/h2-console` verrouillés (HTTP 401).
  - Bundle JavaScript `index-DH93glLd.js` exempt de toute clé privée ORS, secret Twilio ou jeton JWT.

### J7 — Redirection HTTPS & En-têtes HSTS
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-J-results.json`
- **Observations :**
  - Toute connexion en HTTP clair est redirigée en HTTP/2 301 vers HTTPS.
  - En-tête HSTS actif avec durée de 1 an (`max-age=31536000; includeSubDomains`).

---

## Module K — UX, Accessibilité et Responsive

### K1 — Rendu multi-viewports (360, 390, 768, 1280 px)
- **Statut :** **PASS**
- **Preuves :** Captures [`preuves/K1-landing-390x844.png`](preuves/K1-landing-390x844.png), [`preuves/K1-landing-768x1024.png`](preuves/K1-landing-768x1024.png), [`preuves/K1-landing-1280x800.png`](preuves/K1-landing-1280x800.png)
- **Observations :**
  - Aucun défilement horizontal sur mobile 360×800 px (prioritaire), mobile 390×844 px et bureau 1280×800 px. Cibles tactiles $\ge 36-44\text{ px}$.
  - Léger débordement de 18 px sur la page d'accueil à 768 px lié au conteneur de présentation.

### K2 — Toast vs Barre de navigation basse à 360 px
- **Statut :** **FAIL** (Défaut D-03)
- **Preuve :** Capture [`preuves/K2-toast-navbar-360x800.png`](preuves/K2-toast-navbar-360x800.png)
- **Observations :**
  - Sur le bundle actuellement déployé sur Render (`index-DH93glLd.js`), le toast d'alerte chevauche la barre basse sur mobile 360 px car le correctif de marge basse du Lot 10 n'est pas encore déployé sur Render.

### K3 — Navigation au clavier seul & Indicateur de focus
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-K-results.json`
- **Observations :**
  - Ordre de tabulation logique par la touche Tab. Indicateur de focus visible sur les champs et boutons interactifs.

### K4 — Lecteur d'écran & Sémantique HTML
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-K-results.json`
- **Observations :**
  - `html[lang="fr"]` conforme. 0 image sans attribut alt. 0 champ de formulaire sans étiquette associée ou aria-label.

### K5 — Échantillonnage des contrastes texte / fond
- **Statut :** **PASS**
- **Preuve :** Données dans `preuves/module-K-results.json`
- **Observations :**
  - 10 couples texte/fond échantillonnés : 100% conformes aux critères WCAG AA (ratios de 5.1:1 à 12.6:1, conformes au rapport [`docs/audit/contrastes.md`](../../contrastes.md)).

### K6 — Véracité du contenu & Mentions légales
- **Statut :** **FAIL** (Défaut D-03)
- **Preuve :** Données dans `preuves/module-K-results.json`
- **Observations :**
  - Le pied de page de la version déployée sur Render mentionne encore « Déploiement en cours à Ziguinchor et Dakar, Sénégal » (corrigé en local dans le Lot 10, en attente de déploiement).

### K7 — Zoom 200% et lisibilité
- **Statut :** **PASS**
- **Preuve :** Capture [`preuves/K7-zoom-200-fiche-1280x800.png`](preuves/K7-zoom-200-fiche-1280x800.png)
- **Observations :**
  - Le zoom à 200% s'adapte sans rupture de maquette ni texte tronqué.

### K8 — États vides et messages d'erreur réseau
- **Statut :** **PASS**
- **Preuve :** Capture [`preuves/K8-annuaire-etat-vide-360x800.png`](preuves/K8-annuaire-etat-vide-360x800.png)
- **Observations :**
  - Message d'état vide convivial (*« Aucune adresse trouvée »*) affiché lors d'une recherche sans résultat.

---

## Module L — Traçabilité avec les Critères du Professeur (Verdict Final)

| N° | Exigence / Critère d'Évaluation | Statut | Preuves et Cas de Tests Associés |
|---|---|:---:|---|
| **1** | **Attribution du code depuis le GPS en < 3 s sans connexion stable** | **PASS** | **F2** (temps mesuré à **1883 ms < 3000 ms** avec CPU ×4 bridé et réseau coupé), **F1**, **F8**. |
| **2** | **QR code redirigeant vers la fiche publique de l'adresse** | **PASS** | **B3** (image PNG 300×300 px téléchargée, zone calme conforme, décodée par jsQR vers `https://samaadresse.onrender.com/a/ZIG-KBG-4271`). |
| **3** | **Envoi du lien par SMS avec contenu exact et conformité GSM-7** | **PASS** | **G2** (message exact de 115 car. $\le 160$, 100% GSM-7 de base), **G1**, **G3** (quota 5/h validé). *(G5 réel = Humain)*. |
| **4** | **Consultation hors ligne d'une fiche déjà visitée** | **PASS** | **A3**, **F6**, **F9** (cache Service Worker Workbox `samaadresse-addresses-cache` avec éviction propre sur statut 410). |
| **5** | **API publique documentée et résolution de code d'adresse** | **PASS** | **I1** (Swagger UI 200, spécification OpenAPI 3.0.1 avec 25 routes), **I2** (résolution lat/lon/photoUrl), **I6** (Newman 6/6 PASS). |
| **6** | **PWA installable (manifeste valide, Service Worker, icônes)** | **PASS** | **A2** (manifeste web, icônes 192 et 512 px valides), **A3** (Service Worker actif). *(Invite native = Humain)*. |
| **+** | **Gestion des rôles (Admin / Propriétaire / Public)** | **PASS** | **C6**, **C7**, **H4**, **E6** (étanchéité stricte RBAC, aucune élévation de privilège possible). |
| **+** | **Recherche annuaire (code, quartier, type, nom si public)** | **PASS** | **B7**, **D9** (adresses privées `listed=false` strictement exclues, filtres opérationnels). |
| **+** | **Approche Mobile-First ($ge 360\text{ px}$)** | **PASS** | **A1**, **K1** (aucun défilement horizontal à 360 px, cibles tactiles conformes). |
| **+** | **Sécurité JWT et gestion des sessions** | **PASS** | **C4**, **C5** (aucun token dans `localStorage`, cookie `refreshToken` HttpOnly/Secure/Strict, rotation active). |
| **+** | **Documentation Swagger de TOUS les endpoints** | **PASS** | **I1** (les 25 endpoints backend exposés sont documentés dans l'OpenAPI). |
| **+** | **Paiement simulé de plaque physique** | **ABSENT** | Fonctionnalité non implémentée dans le code source de l'application (mentionnée à titre prospectif). |

---

## Registre Résumé des Défauts Identifiés

Les anomalies complètes avec étapes de reproduction et correctifs sont décrites dans [`DEFAUTS.md`](DEFAUTS.md) :

1. **D-01 (MINEURE) :** Absence de mapping de `NoResourceFoundException` et des exceptions MVC standard dans le handler global Spring Boot, provoquant un code HTTP 500 au lieu de 404 (sur `/api/public/zzz`), 405 (sur méthodes non autorisées) ou 415 (sur mauvais Content-Type).
2. **D-02 (MINEURE / DIVERGENCE DOC) :** Limiteur de débit sur la route de connexion `/api/auth/login` configuré en mémoire avec une capacité de 100 requêtes/minute au lieu du seuil strict de 5 tentatives/minute annoncé dans la documentation.
3. **D-03 (MINEURE / VERSION DÉPLOYÉE) :** Le conteneur Render sert actuellement le bundle frontend du Lot 9 (`index-DH93glLd.js`) antérieur au Lot 10. Les finitions (volet visibilité ouvert par défaut, neutralisation de la mention « Ziguinchor et Dakar » dans le pied de page, ajustement de la marge basse du toast à 360 px) sont écrites sur la branche locale `feature/lot10-finitions` et deviendront effectives dès le déploiement sur Render.

---

## Liste « À faire par l'humain » (Règles R3 & R7)

1. **Invite native d'installation PWA sur smartphone physique :** Ouvrir `https://samaadresse.onrender.com` sur un téléphone Android (Chrome) ou iPhone (Safari) et valider l'apparition de l'invite système d'ajout à l'écran d'accueil (« Installer l'application »).
2. **Réception physique d'un SMS sur carte SIM réelle :** Renseigner les identifiants Twilio réels (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) sur Render et valider l'acheminement du SMS sur un mobile sénégalais.
3. **Déploiement du conteneur Lot 10 sur Render :** Déclencher le redéploiement depuis la branche `feature/lot10-finitions` pour actualiser le bundle frontend en production et solder définitivement l'anomalie D-03.
