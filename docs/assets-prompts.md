# Documentation des Images d'Ambiance & Prompts IA (Lot 11C)

Ce document consigne les rôles, dimensions, budgets et descriptions de génération par IA des 7 visuels d'ambiance intégrés à la plateforme SamaAdresse.

## Attributions & Nature des visuels
> Les illustrations ont été générées avec un outil d'IA (ChatGPT / OpenAI) à partir de prompts rédigés par l'auteur du projet. Ce ne sont pas des photographies de lieux réels. Elles illustrent de manière sobre et chaleureuse l'environnement casamançais et la démarche de repérage numérique citoyen à Ziguinchor.

---

## 1. Inventaire des visuels et rôles dans l'application

| Fichier source (`assets-sources/`) | Fichiers générés (`frontend/public/images/`) | Rôle & Emplacement exclusif | Budget max | Poids réel mesuré |
|---|---|---|:---:|:---:|
| `hero-accueil.png` | `hero-accueil-{480,800,1280,1536}w.webp` | Fond du bandeau d'accueil (zone sombre gauche, village à droite) | ≤ 120 Ko (800w) | **29.78 Ko** (800w) |
| `panneau-connexion.png` | `panneau-connexion-{480,800,1024}w.webp` | Panneau latéral des pages `/login` et `/register` (≥ 1024 px uniquement) | ≤ 150 Ko (1024w) | **100.38 Ko** (1024w) |
| `etape-1-localiser.png` | `etape-1-localiser-{320,480,800}w.webp` | Carte étape 1 « Capturer la position » sur l'accueil | ≤ 60 Ko (800w) | **18.85 Ko** (800w) |
| `etape-2-plaque.png` | `etape-2-plaque-{320,480,800}w.webp` | Carte étape 2 « Obtenir un code et une plaque avec QR » sur l'accueil | ≤ 60 Ko (800w) | **42.12 Ko** (800w) |
| `etape-3-partager.png` | `etape-3-partager-{320,480,800}w.webp` | Carte étape 3 « Partager le lien ou le QR pour être retrouvé » | ≤ 60 Ko (800w) | **44.52 Ko** (800w) |
| `bandeau-annuaire.png` | `bandeau-annuaire-{480,800,1280}w.webp` | Bandeau panoramique bas (4:1) sur `/annuaire` | ≤ 80 Ko (1280w) | **55.33 Ko** (1280w) |
| `etat-vide.png` | `etat-vide-{144,320,480}w.webp` | Illustration des états vides (`EmptyState`) : mes adresses, recherche infructueuse | ≤ 60 Ko (480w) | **9.71 Ko** (480w) |

---

## 2. Prompts de génération par IA

### 1. `hero-accueil.png` (Accueil - Héros)
- **Rôle :** Illustration d'ouverture nocturne de la Casamance.
- **Prompt :**
  > *« Vue panoramique nocturne stylisée et épurée d'un quartier paisible de Ziguinchor au crépuscule. À gauche, un ciel bleu nuit profond et dégagé sans détails perturbateurs pour y accueillir du texte clair. À droite, silhouettes douces de concessions aux toits de tôle et tuiles, manguiers et fromagers illuminés par la lumière chaleureuse d'un lampadaire solaire. Couleurs : Bleu nuit #12304F, Terre cuite #B84A24, Crème #FBF7EF. Style affiche sérigraphiée moderne, pas de rendu 3D agressif, ambiance conviviale et sobre. »*

### 2. `panneau-connexion.png` (Connexion & Inscription)
- **Rôle :** Panneau latéral vertical sur écrans larges pour humaniser l'accès à l'espace personnel.
- **Prompt :**
  > *« Illustration verticale représentant une façade de maison chaleureuse en terre et crépi ocre à Boucotte, Ziguinchor. Sur le mur près du portail vert, une plaque émaillée bleu marine et blanche est fixée avec élégance. Végétation tropicale luxuriante en arrière-plan. Ambiance de fin d'après-midi, lumière dorée. Palette harmonieuse Terre & Enseigne. »*

### 3. `etape-1-localiser.png` (Étape 1 : Localisation)
- **Rôle :** Illustration de la prise de coordonnées GPS devant le bâtiment.
- **Prompt :**
  > *« Illustration carrée montrant une personne tenant un smartphone devant l'entrée d'une maison sénégalaise, pointant vers le sol pour marquer la position GPS de l'entrée. Ligne graphique claire, tons chaleureux ocre, terre cuite et bleu nuit. »*

### 4. `etape-2-plaque.png` (Étape 2 : Attribution de plaque)
- **Rôle :** Illustration de la création de la plaque émaillée avec son QR code.
- **Prompt :**
  > *« Illustration carrée mettant en valeur la fixation d'une plaque d'adresse officielle bleu marine avec lettrage blanc et motif discret de QR code sur un pilier de portail. Précision artisanale, respect des couleurs de signalétique urbaine sénégalaise. »*

### 5. `etape-3-partager.png` (Étape 3 : Partage)
- **Rôle :** Illustration du partage de l'adresse et de l'arrivée d'un livreur ou visiteur.
- **Prompt :**
  > *« Illustration carrée montrant un livreur en deux-roues arrivant avec aisance devant la concession grâce à l'adresse numérique partagée sur son téléphone. Climat de confiance et de simplicité, ambiance ensoleillée de Ziguinchor. »*

### 6. `bandeau-annuaire.png` (Bandeau panoramique annuaire)
- **Rôle :** Panorama panoramique urbain pour la clôture visuelle de l'annuaire public.
- **Prompt :**
  > *« Frise panoramique horizontale très large (ratio 4:1) montrant une rue vivante de quartier à Ziguinchor : petites boutiques de quartier, ateliers, pharmacies et habitations arborées. Ligne d'horizon rythmée, teintes douces, sans texte parasite. »*

### 7. `etat-vide.png` (Illustration état vide)
- **Rôle :** Accompagnement bienveillant lors des recherches infructueuses ou boîtes vides.
- **Prompt :**
  > *« Illustration carrée minimaliste montrant une allée sablonneuse calme bordée d'un manguier centenaire et d'un repère discret, évoquant la tranquillité et l'invitation à créer une première adresse. »*

---

## 3. Script d'optimisation
La régénération de tous les fichiers WebP responsives à partir des originaux `assets-sources/` est automatisée via le script reproductible :
```bash
python3 scripts/optimize-images.py
```
Ce script vérifie automatiquement la conformité aux budgets de poids stricts définis au cahier des charges.
