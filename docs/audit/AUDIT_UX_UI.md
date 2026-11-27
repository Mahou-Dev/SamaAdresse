# 05 — AUDIT UX/UI, RESPONSIVE DESIGN ET ACCESSIBILITÉ

- **Application inspectée :** Version auditée (`8fe7ce9`, bundle `/assets/index-BzAtSjBR.js`) déployée en live sur `https://samaadresse.onrender.com`
- **Protocole :** Inspection réelle dans Chromium headless (Playwright en lecture seule) sur les **6 largeurs imposées** (`360 px`, `375 px`, `390 px`, `768 px`, `1024 px`, `1440 px`), audit des ratios de contraste WCAG 2.1 sur les jetons [tokens.css](../../frontend/src/styles/tokens.css) et revue fonctionnelle des parcours.

---

## 1. Résultats des tests responsive (6 viewports)

| Viewport | Routes testées | Débordement horizontal (`scrollWidth > innerWidth`) | Erreurs JS non gérées | Anomalies structurelles A11y (`lang`, `h1`, `alt`, labels) |
|---|---|---:|---:|---:|
| **`360 × 800 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/a/ZIG-KBG-4271/partage`, `/connexion`, `/inscription`, `/route-inexistante` | **0 / 8** | **0** | **0** |
| **`375 × 812 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/connexion` | **0 / 5** | **0** | **0** |
| **`390 × 844 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/connexion` | **0 / 5** | **0** | **0** |
| **`768 × 1024 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/connexion` | **0 / 5** | **0** | **0** |
| **`1024 × 768 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/connexion` | **0 / 5** | **0** | **0** |
| **`1440 × 900 px`** | `/`, `/recherche`, `/carte`, `/a/ZIG-KBG-4271`, `/a/ZIG-KBG-4271/partage`, `/connexion`, `/inscription`, `/route-inexistante` | **0 / 8** | **0** | **0** |

**Constat positif :** la mise en page est propre, cohérente et **exempte de tout débordement horizontal** de `360 px` à `1440 px`, avec `lang="fr"`, un unique `<h1>` par page, des repères sémantiques (`<header>`, `<nav>`, `<main>`, `<footer>`), des labels de champs correctement liés et zéro image dépourvue d'attribut `alt`.

---

## 2. Audit des contrastes WCAG 2.1 (ratios calculés sur `tokens.css` & `components.css`)

| Combinaison (texte / fond) | Usage dans l'interface | Ratio mesuré | Verdict WCAG 2.1 AA (≥ 4,5:1 texte normal) |
|---|---|---:|---|
| `--ink-900` `#0b1f38` / `#ffffff` | Titres, textes principaux | **16,57 : 1** | **CONFORME (AAA)** |
| `--dark-text` `#e7eef8` / `--dark-surface` `#0d2340` | Sidebar, espace admin | **13,51 : 1** | **CONFORME (AAA)** |
| `--ink-700` `#2a4361` / `#ffffff` | Textes secondaires | **10,13 : 1** | **CONFORME (AAA)** |
| `--dark-text-muted` `#8ea3bf` / `--dark-surface` `#0d2340` | Sous-titres admin/sidebar | **6,11 : 1** | **CONFORME (AA)** |
| `--ink-500` `#5b6f87` / `#ffffff` | Textes `.muted`, `.field-hint` | **5,16 : 1** | **CONFORME (AA)** |
| `#ffffff` / `--blue-600` `#0b6cf0` | `.button-primary` (`components.css:4`) | **4,75 : 1** | **CONFORME (AA)** |
| `#ffffff` / `--red-500` `#e5484d` | `.button-danger` (`components.css:12`, 14 px bold) | **3,91 : 1** | **ÉCHEC AA** (< 4,5:1 pour texte 14 px bold) |
| `#ffffff` / `--blue-500` `#1a7cff` | Accents / focus | **3,91 : 1** | **ÉCHEC AA** (texte normal) |
| `--ink-400` `#7b8ca1` / `#ffffff` | `.photo-picker__empty` (`components.css:91`, 13 px) | **3,44 : 1** *(3,20 sur `#f4f7fb`)* | **ÉCHEC AA** |
| `#ffffff` / `--green-500` `#13b07f` | `.button-success` (`components.css:10` : *Envoyer par SMS*, *Réactiver*) | **2,78 : 1** | **ÉCHEC AA ET LARGE** (< 3,0:1) |

---

## 3. Audit des zones tactiles mobiles (`360 px`, `375 px`, `390 px` — cible ≥ 44 × 44 px)

Les boutons principaux (`.button { min-height: 46px }`) respectent le standard tactile, mais **plusieurs contrôles interactifs essentiels mesurés dans Chromium mobile tombent sous 44 px** :

| Route | Contrôle mesuré | Taille réelle (`L × H`) | Écart cible 44 px |
|---|---|---|---|
| Toutes pages publiques (header) | Lien `Se connecter` | `90 × 19 px` | Hauteur insuffisante (-25 px) |
| Toutes pages publiques (header) | Logo `SamaAdresse` | `156 × 32 px` | Hauteur insuffisante (-12 px) |
| `/connexion`, `/inscription` | Bouton `Afficher le mot de passe` | `36 × 36 px` | Largeur et hauteur insuffisantes (-8 px) |
| `/recherche` | Onglets `Code`, `Mot-clé / Propriétaire`, `Quartier`, `Type de lieu` | `143 × 40 px` | Hauteur légèrement sous 44 px (-4 px) |
| `/carte` | Chips filtres `Tous`, `Maison`, `Commerce`, `Institution` | `60..98 × 36 px` | Hauteur insuffisante (-8 px) |
| `/a/ZIG-KBG-4271` | Lien retour `Recherche` et contrôles zoom Leaflet `+` / `-` | `95 × 19 px` et `30 × 30 px` | Hauteur/zone trop réduites |
| `/a/ZIG-KBG-4271/partage` | Lien retour `Fiche de l’adresse` et champ lecture seule | `144 × 19 px` et `192 × 40 px` | Hauteur insuffisante |

---

## 4. Évaluation parcours par parcours

1. **Page d'accueil (`/`) :** proposition de valeur claire, hiérarchie visuelle lisible, champ de recherche directe par code (`CodeLookup`), aperçu mobile pertinent, 0 débordement sur `360 px`.
2. **Navigation :** navigation adaptative (`AdaptiveLayout`) basculant proprement entre barre publique (`PublicLayout`), barre latérale + tabbar mobile (`AppLayout` avec 5 raccourcis), et console sombre dédiée (`AdminLayout`).
3. **Recherche & Annuaire (`/recherche`) :** onglets clairs et chips de quartiers efficaces, mais **défaut ergonomique majeur** : le champ texte de l'onglet *Quartier* invite explicitement à saisir `"Ex. KBG, Kandé, Médina…"` (`SearchPage.tsx:133`), alors que toute saisie d'un nom complet (`Kandé`, `Boucotte`, `Médina`) retourne `0` résultat ! De plus, impossible de combiner mot-clé + quartier + type dans l'interface.
4. **Carte interactive (`/carte`) :** carte Leaflet + panneau latéral/liste synchronisés, centrage sur position, mais dépendance cachée au burst de 24 requêtes API et absence de message dédié si les tuiles OSM échouent au chargement (`BaseMap.tsx`).
5. **Fiche publique (`/a/:code`) & Partage (`/a/:code/partage`) :** excellente lisibilité mobile, bandeau hors ligne daté clair, boutons d'action directs, impression `@media print` propre. **Points à corriger :**
   - Boutons d'itinéraire `À pied` / `En voiture` mènent actuellement à une erreur HTTP 503 en production live (seul le bouton externe OpenStreetMap aboutit).
   - Contraste insuffisant du bouton vert `Envoyer par SMS` (`2,78:1`) et mention trompeuse ligne 90 (`SharePage.tsx:90`) indiquant que SamaAdresse n'envoie aucun SMS lui-même alors que l'espace propriétaire dispose d'un envoi API.
6. **Formulaires d'authentification & création GPS (`/connexion`, `/inscription`, `/mes-adresses/nouvelle`) :**
   - Validation client claire avec messages d'erreur reliés via `aria-describedby` et `aria-invalid`.
   - Wizard 4 étapes (`Informations` -> `Localisation` -> `Photo` -> `Validation`) ergonomique : choix GPS + carte cliquable + saisie manuelle + détection d'inversion latitude/longitude + virgule décimale + prévisualisation photo.
   - En connexion lente/coupée, le formulaire indique clairement la sauvegarde locale en brouillon et la synchronisation ultérieure, mais le changement du code provisoire après synchronisation peut surprendre un utilisateur ayant déjà noté ou partagé le code provisoire.
7. **Tableaux de bord & Paramètres (`/tableau-de-bord`, `/mes-adresses`, `/compte`) :** interface sobre et structurée, mais 2 fonctionnalités affichées comme **« Bientôt »** dans `/compte` (`Modifier le mot de passe`, `Notifications`).
8. **Administration (`/admin`, `/admin/signalements`, `/admin/adresses`, `/admin/utilisateurs`) :** thème sombre bien contrasté (`13,51:1` et `6,11:1`), file de signalements claire avec motif obligatoire avant suspension, mais `/admin/utilisateurs` est une page informative vide de données et `/admin/adresses` n'affiche ni les adresses non listées ni le journal `admin_actions`.
9. **Connexion lente :** bundle principal optimisé à `98,20 Ko` gzip, lazy-loading des pages et chunks lourds (`leaflet`, `qrcode`), compression Gzip activée côté Tomcat (`application-prod.yml:33`), cache `immutable` 1 an sur `/assets/**` et `/uploads/**`, et cache Service Worker des tuiles et fiches visitées.
