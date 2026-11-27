# Progression du frontend

## Première tranche — socle et recherche publique

- Dépôt identifié par son remote `sama-AdresseWeb.git`; dépôt initial vide, sans fichier suivi ni modification locale à préserver.
- Socle React 19, TypeScript et Vite 6 créé à la racine du dépôt.
- Page d'accueil en français, responsive, avec identité visuelle originale (repère + maison) et navigation par ancres.
- Recherche de code reliée au client HTTP commun ; états de chargement, résultat, code inconnu et indisponibilité réseau prévus.
- URL API définie par `VITE_API_BASE_URL`, sans secret navigateur.
- Tests API et interface React : `npm test`, 6 tests réussis.
- `npm run lint` réussi ; `npm run build` réussi (vérification TypeScript et bundle Vite).
- Vérification navigateur : recherche d'un code inconnu affiche l'état vide, pas de défilement horizontal à 360 px.

## Deuxième tranche — compte et adresses du propriétaire (19 octobre 2026)

État initial constaté : dépôt sans aucun commit, tous les fichiers non suivis ; copie de sauvegarde faite hors dépôt avant modification. Aucun commit ni push effectué.

- React Router 6.30 ajouté (la v7 exige Node 20 ; le projet cible Node 18.19).
- Page d'accueil déplacée sans changement de contenu dans `src/pages/HomePage.tsx` ; en-tête et pied de page partagés (`SiteLayout`) avec état de session ; lien « Créer mon adresse » dans l'accueil.
- Client API commun étendu (`src/lib/api.ts`) : erreurs problem+json, erreurs par champ, jeton en en-tête.
- `AuthProvider` : session en `sessionStorage`, revérification au chargement, déconnexion à l'expiration ou sur 401.
- Pages inscription, connexion, liste paginée de mes adresses, création (géolocalisation réelle du navigateur ou saisie manuelle, choix explicite de publication), fiche propriétaire (code, statut, visibilité, copie du code, lien OpenStreetMap).
- Styles dans `src/pages.css`, cohérents avec l'accueil ; responsive vérifié à 360 px.

### Vérifications exécutées

- `npm test` : **19 tests réussis** sur 3 fichiers (7 client API, 3 accueil, 9 parcours compte/adresses).
- `npm run lint` : 0 erreur, 0 avertissement.
- `npm run build` : réussi (TypeScript + Vite).
- Parcours navigateur réel (Chrome 153 headless piloté par puppeteer-core installé hors dépôt, Vite dev sur :5173, API Docker sur :8080) : anonyme redirigé vers la connexion ; inscription par le formulaire ; création avec le bouton de géolocalisation (position simulée par Chrome) ; envoi bloqué tant que le choix de publication n'est pas fait ; fiche affichant le code serveur et « En attente de validation » ; recherche publique → « aucune adresse » ; après validation admin par l'API (utilisateur : 403, admin : 200), la recherche publique affiche l'adresse ; connexion mobile ; aucun débordement horizontal à 360 px sur les 6 pages.
- Défauts trouvés lors de cette vérification visuelle et corrigés : champs latitude/longitude désalignés ; lien « Mes adresses » absent de l'en-tête mobile.

## Troisième tranche — fidélité aux références et logique métier (19 octobre 2026)

État initial : dépôt toujours sans commit ; copie de sauvegarde faite hors dépôt. Aucun commit ni push.

- Règles du code public reprises du backend (`src/lib/addressCode.ts`) : format vérifié et normalisé avant l’appel, préfixe VIL-QUA annoncé dans l’assistant.
- Cycle de vie de l’adresse affiché au propriétaire (`StatusTimeline`), notes d’état sur le tableau de bord (publiques, en vérification, rejetées).
- Recherche en deux modes (code public / mes adresses par quartier, type, texte).
- Administration : navigation Tableau de bord / Modération (compteur réel) / Adresses ; indicateurs, courbe sur 12 mois, file de modération avec mini-carte et confirmation, registre paginé par statut.
- Accueil : illustration retravaillée (ville côtière au couchant) et téléphone de présentation aux liens réels ; page Paramètres ; barre d’onglets mobile.
- Correctifs : débordement mobile de la page Paramètres (e-mail long) et du registre admin (libellé masqué hors de la zone défilante).
- Vérifications : `npm test` 36 tests réussis, lint 0 problème, build réussi ; parcours réel dans Chrome (création ZIG-KAN-…, validation admin, recherche publique, QR) ; aucun débordement à 375/390/768/1440 px.

## Quatrième tranche — photo de façade (19 octobre 2026)

- Étape « Photo » (facultative) dans l'assistant, entre Localisation et Validation ; photo préparée dans le navigateur (orientation, 1600 px, JPEG, métadonnées retirées) puis envoyée après la création ; en cas d'échec, l'adresse est conservée et la fiche propose de réessayer.
- Fiche propriétaire : photo en bannière, panneau d'ajout/remplacement (pendant la vérification) et de retrait avec confirmation.
- Modération : photo affichée avec un point de contrôle dédié. Fiche publique et recherche : photo et vignette.
- `npm test` : 39 tests réussis ; lint et build réussis ; parcours réel Chrome (390 px et 1366 px) sans erreur JS.

## Audit fonctionnel — code, partage, SMS et géolocalisation (20 octobre 2026)

Rapport complet : `~/Projets/SamaAdresse/RAPPORT_AUDIT_ET_CORRECTIONS_SAMAADRESSE.md`.

- Parcours réel reproduit dans Chrome (API Java 25 + PostgreSQL) : le code renvoyé par le serveur (`publicCode`) est bien affiché, copié et utilisé ; le QR code se décode en `/a/{code}`.
- Défauts corrigés : lien/QR/SMS en `localhost` sans avertissement (inutilisables depuis un téléphone) ; copie impossible sur une page http ; position GPS prise au premier relevé, sans indication claire d'imprécision ; inversion latitude/longitude non détectée ; recentrage intempestif de la carte.
- Nouveaux modules : `src/lib/geolocation.ts`, `src/lib/coordinates.ts`, `src/lib/clipboard.ts`, `src/lib/publicUrl.ts`, `src/components/LocalLinkWarning.tsx`.
- `npm run coverage` : 74 tests réussis (9 fichiers), 76 % des lignes ; lint et build réussis.

## À poursuivre

Carte Leaflet (affichage et sélection du point), fiche publique dédiée avec partage/QR et itinéraire, favoris, signalements, photos, modification/archivage, récupération de mot de passe, PWA, console d'administration. Aucun test de bout en bout automatisé n'est encore intégré au dépôt ni à la CI (le parcours navigateur a été exécuté manuellement).
