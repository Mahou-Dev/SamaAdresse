# P02 — Audit de l'expérience publique SamaAdresse

**Branche :** `feature/p02-public-experience`  
**Base validée :** P01 (`feature/p01-design-system`, commit `c9f886406f815a7b88fd328702f5b6c73491065b`)  
**Périmètre :** Expérience publique uniquement — navigation globale (`AppNavigation`, `AppFooter`, `OfflineBanner`), page d'accueil (`/`), annuaire public (`/annuaire`) et vue cartographique intégrée.

---

## 1. Constat initial avant refonte P02

### 1.1 Navigation et cohérence globale
- **Charte héritée encore active :** `frontend/src/index.css` et `frontend/src/App.tsx` appliquaient toujours le fond sable doré (`#EADFC8`), la grille à points et l'en-tête bleu nuit (`#12304F`) avec bordures brunes (`#766B5B`) issus du Lot 9, alors que les tokens et composants SamaAdresse 2.0 « Clarté » étaient prêts depuis P01.
- **Redondance sur mobile :** l'ancienne `AppNavigation.tsx` affichait « Connexion » à la fois dans l'en-tête mobile et dans la barre inférieure à 5 colonnes (serrée à 320 px).
- **Absence de lien d'évitement (skip-link) :** la navigation clavier exigeait de parcourir tous les liens de l'en-tête avant d'atteindre `<main>`.

### 1.2 Page d'accueil (`/`)
- **Aucune recherche directe :** un visiteur arrivant sur `/` ne disposait pas de champ de recherche pour trouver une adresse ou un commerce ; il devait d'abord naviguer vers `/annuaire`.
- **Aucune découverte réelle :** pas de cartes de catégories (`MAISON`, `COMMERCE`, `INSTITUTION`), pas d'accès par quartiers couverts (`geo-grid.json`), ni d'aperçu des adresses publiées dans l'annuaire public.
- **Surcharge éditoriale :** 8 sections empilées dont un bloc terminal `curl` sombre destiné aux développeurs et des répétitions de CTA identiques entre le bandeau et le bloc Avant/Après.

### 1.3 Annuaire public (`/annuaire`)
- **Couverture géographique incomplète :** la liste des quartiers était codée en dur à 5 quartiers de Ziguinchor (`KBG`, `ESC`, `TIL`, `KND`, `NEM`), omettant les 3 autres quartiers réels présents dans `frontend/src/data/geo-grid.json` (`MED`, `PLT` à Dakar et `NDR` à Saint-Louis).
- **Présentation datée et vue unique :** liste verticale unique de miniatures 64×64 / 80×80 px, aucune vue Grille 4:3, aucune vue Carte interactive, aucun tiroir de filtres sur mobile, aucun bandeau de filtres actifs supprimables individuellement.
- **Défaut asset état vide :** `DirectoryPage.tsx` référençait `/images/etat-vide-288w.webp` dans son `srcSet`, fichier absent de `frontend/public/images/` (les variantes réelles sont `144w`, `320w`, `480w`).

---

## 2. Contrats backend et données réelles vérifiés

L'inspection directe de `backend/src/main/java/com/samaadresse/controller/DirectoryController.java`, `DirectoryItemResponse.java`, `AddressController.java` et `frontend/src/data/geo-grid.json` a établi les contraintes exactes suivantes :

| Source | Contrat vérifié | Incidence UX / Architecture P02 |
| --- | --- | --- |
| `GET /api/public/directory` | Paramètres : `q`, `quartier`, `type` (`MAISON` \| `COMMERCE` \| `INSTITUTION`), `page`, `size` (défaut 12, max 50). Rate-limit : 30 req/min/IP. | Recherche temps réel (debounce 300 ms), pagination par pages de 12, filtres strictement alignés sur les paramètres réels, gestion 429 (décompte) et 403 WAF. |
| `DirectoryItemResponse` | Champs : `code`, `zone`, `quartier`, `locationType`, `description`, `photoUrl`, `createdAt`, `ownerName`. **Ne retourne pas `latitude` ni `longitude`.** | Interdiction stricte d'inventer des coordonnées. La vue Carte hydrate les coordonnées réelles à la demande via `GET /api/addresses/{code}` avec cache mémoire + `localStorage` et gestion explicite des adresses non localisables (`unmappedItems`). |
| `GET /api/addresses/{code}` | Endpoint public (60 req/min/IP) retournant `PublicAddressResponse` avec `latitude` et `longitude` réelles, mis en cache dans Workbox et `localStorage` (`cached_addr_<code>`). | Hydratation bornée (concurrence max 4), déclenchée **uniquement** lorsque l'utilisateur ouvre la vue Carte (`view=map`), avec arrêt propre en cas de HTTP 429. |
| `frontend/src/data/geo-grid.json` | 3 zones (`ZIG` Ziguinchor, `DKR` Dakar, `SL` Saint-Louis) et 8 quartiers (`KBG`, `ESC`, `KND`, `TIL`, `NEM`, `MED`, `PLT`, `NDR`). | Source unique de vérité pour l'accueil (zones & quartiers), le sélecteur `#filter-quartier` desktop, le tiroir mobile et le pied de page. |
| Assets WebP (`frontend/public/images/`) | `hero-accueil-{480,800,1280}w.webp`, `etape-{1,2,3}-*.webp`, `bandeau-annuaire-*.webp`, `etat-vide-{144,320,480}w.webp`. | Réutilisation intégrale des visuels optimisés existants sans dépendance externe ; correction du `srcSet` état vide vers `320w`. |

---

## 3. Décisions UX / Produit retenues pour P02

1. **Identité lumineuse SamaAdresse 2.0 « Clarté » :** bascule du socle global (`body`, `App.tsx`, navigation, pied de page, accueil, annuaire) sur fond blanc `#FFFFFF`, surfaces `#F8FAFC` / `#FAF8F5`, signature Terracotta `#C2410C` et Bleu fleuve `#0369A1`, en préservant les alias CSS hérités pour ne pas casser les pages P03/P04 non encore migrées.
2. **Navigation unifiée sans doublons :** un en-tête desktop unique et sobre (`Accueil`, `Annuaire`, `Exemple` ou `Tableau de bord`/`Mes adresses`, indicateur hors ligne contextuel, CTA `Créer une adresse`, `Se connecter` ou `UserProfileMenu`) et une barre inférieure mobile plafonnée à **4 destinations distinctes** sans répétition de `Se connecter`.
3. **Accueil orienté recherche & découverte :** hero éditorial lumineux centré sur `SearchBar` + raccourcis quartiers + plaque emblématique `ZIG-KBG-4271`, suivi des 3 catégories réelles, des 8 quartiers réels, des 6 dernières adresses publiques réelles, d'un guide en 3 étapes illustrées avec Avant/Après + anatomie de code, et d'un appel à l'action final sobre. Les utilisateurs authentifiés conservent un accueil utilitaire sans discours marketing (`HomeConnectedView`).
4. **Annuaire multi-vues synchronisé par URL :** `?q=&quartier=&type=&view=grid|list|map`. Basculer entre Grille, Liste et Carte préserve les filtres et les résultats en mémoire sans relancer `/api/public/directory`.
5. **Carte interactive différée (lazy-loaded) :** Leaflet et `DirectoryMapCanvas` sont isolés dans un chunk chargé uniquement à l'activation de `view=map`, protégeant le budget initial (`index-*.js` <= 105 Ko gzip).
6. **Non-régression E2E & PWA garantie :** préservation des sélecteurs critiques (`#directory-search-input` avec placeholder non tronqué à 360 px, `#filter-quartier`, plaque `ZIG-KBG-4271` visible hors ligne, libellés d'états hors ligne/vide/WAF 403, absence du mot « Connexion » dans `<header>` lorsque connecté).
