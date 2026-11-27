# SamaAdresse — application web

SamaAdresse aide à retrouver et partager des lieux au Sénégal au moyen d'un code d'adresse géolocalisé. Ce dépôt contient uniquement le frontend React ; l'API Java est maintenue dans son dépôt distinct ([sama-Adresseback](https://github.com/Andrebampoky/sama-Adresseback)).

## Prérequis

- Node.js 18.19 ou plus récent (testé avec 18.19.1) ;
- npm 9 ou plus récent ;
- l'API backend disponible sur `http://localhost:8080`.

## Démarrer les deux projets en local

1. Backend (dans le dépôt `sama-Adresseback`) :

   ```bash
   docker compose up --build -d
   curl http://localhost:8080/api/v1/health   # {"status":"UP","database":"UP"}
   ```

2. Frontend (dans ce dépôt) :

   ```bash
   npm ci
   cp .env.example .env.local   # facultatif : la valeur par défaut est déjà http://localhost:8080
   npm run dev
   ```

Le site est disponible sur <http://localhost:5173>. Cette origine est celle autorisée par défaut par le CORS du backend ; si vous changez de port, adaptez `APP_CORS_ALLOWED_ORIGINS` côté API.

## Variables

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_API_BASE_URL` | port 8080 de la machine qui sert la page (`http://localhost:8080` en local) | Adresse de l'API. Variable **publique**, incluse dans le code envoyé au navigateur : n'y mettez jamais de secret. |
| `VITE_PUBLIC_APP_URL` | origine de la page ouverte | Adresse publique du site, mise dans le lien de partage et le QR code. En production : le nom de domaine. |

### Tester le partage et la géolocalisation avec un téléphone

Un lien ou un QR code qui contient `localhost` ne s'ouvre **que sur l'ordinateur** : le site le signale par un avertissement. Pour essayer depuis un téléphone connecté au même Wi-Fi :

1. lancer `npm run dev -- --host` et noter l'adresse « Network » (ex. `http://192.168.1.20:5173`) ;
2. côté API, ajouter cette origine à `APP_CORS_ALLOWED_ORIGINS` et la mettre dans `APP_PUBLIC_BASE_URL` (liens des SMS) ;
3. optionnel : `VITE_PUBLIC_APP_URL=http://192.168.1.20:5173` pour que le QR code généré sur l'ordinateur pointe vers cette adresse.

Sur une page `http://192.168…`, le navigateur **refuse la géolocalisation** (elle exige https) : le site l'explique et propose de placer le point sur la carte. La copie dans le presse-papiers utilise alors une méthode de secours.

## Pages disponibles

| Route | Accès | Contenu |
|---|---|---|
| `/` | public | Accueil immersif (illustration vectorielle, pas de photo), fonctionnalités, recherche par code, étapes |
| `/connexion`, `/inscription` | public | Formulaires en deux colonnes, affichage du mot de passe, erreurs par champ |
| `/recherche` | public | Annuaire : onglets Code (format vérifié avant l’appel), Propriétaire, Quartier (+ ville), Type de lieu ; résultats paginés depuis l’API |
| `/carte` | public | Carte de l’annuaire public (filtres, recherche) ; onglet « Mes adresses » si connecté |
| `/a/:code` | public | Fiche publique : code, photo, informations, mini-carte, itinéraire OpenRouteService (à pied / en voiture, repli OpenStreetMap), copie du code et du lien, signalement (connecté), mention « copie hors ligne » |
| `/a/:code/partage` | public | QR code réel (URL publique uniquement), téléchargement PNG/SVG, impression, copie, Web Share, lien `sms:` |
| `/tableau-de-bord` | connecté | Statistiques réelles (total, validées, en attente, rejetées), carte de ses adresses, dernières adresses |
| `/mes-adresses` | connecté | Liste paginée, statut et visibilité |
| `/mes-adresses/nouvelle` | connecté | Assistant en 4 étapes : informations, localisation (carte cliquable, marqueur déplaçable, GPS, saisie), photo de façade facultative, validation avec aperçu du préfixe du code et de la position, consentement |
| `/mes-adresses/:id` | connecté | Gestion : modifier, publier/masquer, nom dans l’annuaire, envoyer le lien par SMS, archiver ; photo ; suivi. Fiche propriétaire, suivi du cycle de vie (enregistrée → vérification → validée/rejetée → publique ou privée) ; QR et lien public seulement si l’adresse est publique |
| `/compte` | connecté | Paramètres : profil en lecture seule, sécurité (session, déconnexion), application ; réglages non livrés marqués « Bientôt » |
| `/admin` | rôle ADMIN | Console sombre : indicateurs, évolution sur 12 mois par type, types de lieux, dernières adresses, aperçu de la file, carte |
| `/admin/moderation` | rôle ADMIN | File d’attente (plus anciennes d’abord), fiche avec mini-carte et points à vérifier, validation/rejet avec confirmation, gestion du conflit 409 |
| `/admin/adresses` | rôle ADMIN | Registre par statut, pagination serveur, filtre de la page |

Sur mobile (≤ 900 px), l’espace connecté affiche une barre d’onglets en bas (Accueil, Adresses, Créer, Carte, Profil).

Les pages `/recherche` et `/a/...` s’affichent dans l’espace personnel quand on est connecté, et dans le site public sinon. Les redirections et l’entrée « Administration » ne sont que du confort : le backend refuse toute requête non autorisée (401/403).

## Cartes

Leaflet 1.9 + react-leaflet 5, tuiles OpenStreetMap avec attribution visible. Les tuiles publiques d’OSM conviennent au développement ; pour une mise en production à fort trafic, configurer un fournisseur de tuiles respectant sa politique d’usage. Les pages avec carte ou QR code sont chargées à la demande.

## Design

Les couleurs, rayons, ombres et la typographie sont centralisés dans `src/styles/tokens.css`. Feuilles par contexte : `components.css` (composants partagés), `public.css` (site public), `app.css` (espace connecté), `admin.css` (console sombre). Icônes : `lucide-react`.

## Session et sécurité

- Le jeton renvoyé par l'API est conservé dans `sessionStorage` (onglet courant, effacé à la fermeture du navigateur) et envoyé uniquement dans l'en-tête `Authorization`.
- Au rechargement, la session est revérifiée avec `GET /api/v1/auth/me` ; un refus (401) déconnecte. La session est aussi fermée automatiquement à l'expiration du jeton (1 h par défaut).
- Compromis : un script injecté (XSS) pourrait lire `sessionStorage`. L'interface n'insère aucun HTML non échappé et le jeton a une durée de vie courte.
- La position GPS n'est lue qu'après clic sur « Utiliser ma position actuelle » et accord du navigateur.

## Vérifications

```bash
npm test        # Vitest + Testing Library
npm run lint    # ESLint
npm run build   # vérification TypeScript + bundle Vite
```

## État fonctionnel et limites

Pas encore livré (aucun bouton factice ne le simule) : notifications, journal d’audit, modification/archivage d’une adresse, favoris, signalements, recherche par quartier/ville/type, carte publique de toutes les adresses (l’API ne fournit pas de liste publique), récupération de mot de passe, paramètres et notifications, mode hors ligne (PWA), gestion des utilisateurs et journal d’audit dans l’administration.

## Mode hors ligne et PWA

- `public/manifest.webmanifest` + icônes (`public/icons/`) : application installable.
- `public/sw.js` (enregistré seulement dans la version construite, `npm run build` puis `npm run preview`) : met en cache l’application, les **fiches publiques déjà consultées** (30 au plus) et leurs photos, les tuiles de carte vues. Jamais `/me`, `/admin`, `/auth` ni une requête portant un jeton : aucune donnée privée ne reste sur l’appareil pour une autre personne.
- Création hors ligne : l’adresse est gardée sur l’appareil (IndexedDB, par compte) avec son **code provisoire** calculé localement (même grille que le serveur), puis envoyée automatiquement au retour du réseau ; le serveur confirme le code définitif.
- Pour tester : `npm run build && npx vite preview --port 4173`, et ajouter `http://localhost:4173` à `APP_CORS_ALLOWED_ORIGINS` côté API.

## Tests et couverture

```bash
npm test           # Vitest + Testing Library
npm run coverage   # couverture V8 (échec sous 60 % de lignes) ; rapport HTML dans coverage/
```
