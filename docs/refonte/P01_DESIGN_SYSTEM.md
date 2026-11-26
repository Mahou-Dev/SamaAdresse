# P01 — Design System « SamaAdresse Clarté »

**Version :** 2.0.0-p01  
**Direction artistique :** Lumineuse, contemporaine, rassurante, ancrée dans l'identité culturelle sénégalaise et casamançaise.  
**Sources de vérité :**
- CSS / Tailwind v4 : [frontend/src/styles/tokens.css](../../frontend/src/styles/tokens.css)
- Constantes typées TS : [frontend/src/styles/tokens.ts](../../frontend/src/styles/tokens.ts)
- Tests WCAG automatisés : [frontend/src/styles/__tests__/tokens.test.ts](../../frontend/src/styles/__tests__/tokens.test.ts)

---

## 1. Direction artistique : SamaAdresse Clarté

### Intention créative
La version précédente (« Sable doré ») reposait sur un fond beige texturé omniprésent (`#EADFC8`) qui alourdissait visuellement les écrans et donnait un caractère administratif à l'application.

**SamaAdresse Clarté** inverse le rapport figure/fond en s'inspirant des meilleures pratiques du marché sans copier aucun produit existant :
- **Airbnb** : respiration généreuse sur fond blanc pur `#FFFFFF`, mise en majesté des façades réelles (format 4:3), barre de recherche en pilule, filtres tactiles horizontaux, menu de profil compact.
- **Stripe** : précision typographique, ombres multicouches subtiles sans lourdeur, hiérarchie rigoureuse des formulaires et états de validation.
- **Linear** : densité maîtrisée des tableaux et tiroirs d'administration, transitions nettes (150–200 ms), navigation clavier exemplaire.
- **Identité SamaAdresse** : chaleur du **Terracotta** casamançais (`#C2410C`), autorité sereine du **Bleu fleuve** (`#0369A1`, fil rouge des plaques d'adresse émaillées) et vitalité du **Vert baobab** (`#15803D`), relevés par une surface secondaire ivoire très douce (`#FAF8F5`).

---

## 2. Palette officielle et audit de contraste WCAG 2.2 AA

Chaque paire de couleurs a été calculée mathématiquement et verrouillée par 23 assertions automatisées dans `tokens.test.ts`.

### 2.1 Surfaces
| Token Tailwind / CSS | Valeur Hex | Rôle |
|---|---|---|
| `bg-canvas` / `--color-canvas` | `#FFFFFF` | Fond principal des pages et zones de lecture |
| `bg-surface` / `--color-surface` | `#F8FAFC` | Fond des espaces de travail, en-têtes de tableau, zones neutres |
| `bg-surface-secondary` / `--color-surface-secondary` | `#FAF8F5` | Rappel chaleureux (bandeaux éditoriaux, fonds d'illustrations et cartes sans photo) |
| `bg-surface-elevated` / `--color-surface-elevated` | `#FFFFFF` | Cartes, modales, tiroirs, menus déroulants |
| `bg-surface-hover` / `--color-surface-hover` | `#F1F5F9` | État de survol subtil sur surfaces claires |
| `bg-surface-inverse` / `--color-surface-inverse` | `#0F172A` | Infobulles (`Tooltip`), voiles d'arrière-plan |

### 2.2 Typographie & Ajustement documenté WCAG 2.2 AA
| Token | Valeur Hex | Contraste sur `#FFFFFF` | Contraste sur `#F8FAFC` | Contraste sur `#FAF8F5` | Statut WCAG 2.2 AA |
|---|---|---:|---:|---:|:---:|
| `text-ink` | `#0F172A` | **17.85:1** | **17.06:1** | **16.84:1** | AAA |
| `text-ink-secondary` | `#334155` | **10.35:1** | **9.90:1** | **9.77:1** | AAA |
| `text-ink-muted` | **`#5B6B7F`** *(ajusté)* | **5.45:1** | **5.21:1** | **5.14:1** | **AA** |
| `text-ink-subtle` | `#64748B` *(icônes / grands textes)* | 4.76:1 | 4.55:1 | 4.49:1 | Non-texte ≥ 3:1 |

> **Ajustement documenté n°1 (`#64748B` → `#5B6B7F`) :**  
> Le test mathématique WCAG a montré que `#64748B` sur la surface secondaire `#FAF8F5` obtient un ratio de **4,49:1**, juste sous le seuil normatif de **4,50:1** pour du texte normal. Le token `ink-muted` a donc été légèrement assombri à **`#5B6B7F`**, garantissant un ratio > 5,1:1 sur les trois surfaces claires tout en conservant la même teinte ardoise neutre. `#64748B` reste disponible sous `ink-subtle` pour les éléments non textuels et icônes décoratives.

### 2.3 Couleurs identitaires et sémantiques
| Famille | Token principal | Valeur | Hover / Soft / Border | Contraste clé (AA ≥ 4.5:1) |
|---|---|---|---|---|
| **Terracotta** (Signature / CTA principal) | `brand` | `#C2410C` | `#9A3412` / `#FFF7ED` / `#FDBA74` | Blanc sur `#C2410C` : **5.18:1** · `#9A3412` sur `#FFF7ED` : **6.88:1** |
| **Bleu fleuve** (Institution / Plaques / Focus) | `institution` | `#0369A1` | `#075985` / `#F0F9FF` / `#BAE6FD` | Blanc sur `#0369A1` : **5.93:1** · `#0369A1` sur `#F0F9FF` : **5.57:1** |
| **Vert baobab** (Nature / Succès / Active) | `nature` / `success` | `#15803D` | `#166534` / `#F0FDF4` / `#BBF7D0` | Blanc sur `#15803D` : **5.02:1** · `#15803D` sur `#F0FDF4` : **4.79:1** |
| **Danger** (Erreurs / Suspension / Suppression) | `danger` | `#B91C1C` | `#991B1B` / `#FEF2F2` / `#FECACA` | Blanc sur `#B91C1C` : **6.47:1** · `#B91C1C` sur `#FEF2F2` : **5.91:1** |
| **Avertissement** (Hors ligne / En attente) | `warning` | `#92400E` | `#D97706` (dot) / `#FFFBEB` / `#FDE68A` | `#92400E` sur `#FFFBEB` : **6.84:1** |

### 2.4 Délimitations & Ajustement documenté WCAG 2.2 SC 1.4.11
| Token | Valeur Hex | Usage strict | Contraste sur `#FFFFFF` |
|---|---|---|---:|
| `border-border` | `#E2E8F0` | Bordures décoratives de cartes, séparateurs, en-têtes | 1.23:1 (décoratif) |
| `border-border-strong` | `#CBD5E1` | Bordures de cartes au survol, boutons `outline`, pilules | 1.48:1 (emphase) |
| `border-border-control` | **`#7C8B9E`** *(ajouté)* | Bordures des champs de saisie (`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`) | **3.47:1** (≥ 3.0:1 requis) |

> **Ajustement documenté n°2 (ajout de `--color-border-control: #7C8B9E`) :**  
> Le critère WCAG 2.2 SC 1.4.11 impose un contraste minimal de **3,0:1** pour les limites visuelles des contrôles de formulaire interactifs. `#E2E8F0` (1,23:1) et `#CBD5E1` (1,48:1) sont parfaits pour les cartes et séparateurs mais insuffisants seuls pour un champ de saisie. Le token `border-control` (`#7C8B9E`) atteint **3,47:1** sur `#FFFFFF`, **3,32:1** sur `#F8FAFC` et **3,28:1** sur `#FAF8F5`.

---

## 3. Typographie (Polices auto-hébergées — zéro téléchargement)

Les deux polices locales WOFF2 existantes sont conservées et systématisées :
- **Principale (`--font-sans`) :** `Outfit` (`public/fonts/outfit-latin.woff2`, variable 100–900, `font-display: swap`).
- **Technique (`--font-mono`) :** `JetBrains Mono` (`public/fonts/jetbrains-mono-latin.woff2`, variable 100–800) réservée aux codes d'adresse (`ZIG-KBG-4271`), coordonnées GPS, compteurs tabulaires (`tabular-nums`) et exemples techniques.

### Échelle typographique
| Niveau | Classe Tailwind | Taille | Interlignage | Graisse | Usage |
|---|---|---:|---:|---|---|
| **Display / Hero** | `text-4xl sm:text-5xl font-extrabold tracking-tight` | 36–48 px | 1.1 | 800 | Accroche de la page d'accueil |
| **H1 (Page)** | `text-2xl sm:text-3xl font-extrabold tracking-tight` | 24–30 px | 1.2 | 800 | Titre principal de chaque page (`PageHeader`) |
| **H2 (Section)** | `text-xl font-bold tracking-tight` | 20 px | 1.25 | 700 | Titres de sections et modales |
| **H3 (Sous-section / Carte)** | `text-base sm:text-lg font-bold` | 16–18 px | 1.35 | 700 | Titres de cartes, panneaux et états vides |
| **Body Large** | `text-base font-normal` | 16 px | 1.55 | 400 | Paragraphes d'introduction, fiches détaillées |
| **Body Default** | `text-sm font-normal` | 14 px | 1.5 | 400–500 | Corps de texte, tableaux, champs de formulaire |
| **Label** | `text-sm font-semibold` | 14 px | 1.35 | 600 | Libellés de champs et boutons standards |
| **Caption / Meta** | `text-xs font-medium` | 12 px | 1.4 | 500–600 | Badges, aides de champ, métadonnées (jamais < 12 px sur du texte courant) |
| **Code Adresse** | `font-mono font-bold tracking-tight` | 12–42 px | 1.1 | 700–800 | `AddressCode`, `AddressPlate`, coordonnées GPS |

---

## 4. Espacements, rayons, ombres et dimensions

### Échelle d'espacement (unité stricte de 4 px)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 px` (respectivement `1 · 2 · 3 · 4 · 5 · 6 · 8 · 10 · 12 · 16 · 20` en Tailwind).

- **Micro-espacement interne (icône/texte, badges)** : `6–8 px` (`gap-1.5` / `gap-2`).
- **Padding de cartes** : `16 px` (`sm`), `20–24 px` (`md`), `24–32 px` (`lg`).
- **Gouttières de grille de cartes** : `16 px` mobile (`gap-4`), `24 px` desktop (`gap-6`).
- **Espacement entre sections majeures** : `32–48 px` (`space-y-8` / `space-y-12`), jusqu'à `64–80 px` sur la page d'accueil.

### Rayons de courbure
- `rounded-md` (8 px) : champs compacts, tags secondaires, éléments de menu.
- `rounded-xl` (12 px) : boutons standards, inputs, selects, icônes encadrées, alertes.
- `rounded-2xl` (16 px) : cartes (`Card`, `AddressCard`, `StatTile`), modales (`Modal`), menus déroulants (`DropdownMenu`), toasts.
- `rounded-full` (9999 px) : `SearchBar`, `SearchFilter` (pilules), `Badge`, `StatusBadge`, `Avatar`, `Switch`.

### Hauteurs interactives & cibles tactiles
- Bouton / Input `sm` : `min-h-[36px]` (usage bureau / barres denses).
- Bouton / Input `md` (défaut) : **`min-h-[44px]`** (conforme aux cibles tactiles WCAG / mobile).
- Bouton / Input `lg` : `min-h-[48px]` (CTA héros et formulaires mobiles principaux).

### Ombres & Élévation
- `shadow-xs` : cartes au repos, boutons outline.
- `shadow-sm` : cartes élevées (`Card variant="elevated"`), plaques d'adresse.
- `shadow-card-hover` : élévation au survol des cartes interactives (`AddressCard`, `StatTile`).
- `shadow-search` : barre de recherche flottante (`SearchBar variant="hero"`).
- `shadow-lg` / `shadow-xl` : `DropdownMenu`, `Toast`, `Modal`, `Drawer`.

### Transitions & Mouvement
- Durées maîtrisées : `150ms` (états de bouton/champ), `200ms` (cartes, modales, tiroirs).
- Courbes : `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`.
- Respect intégral de `@media (prefers-reduced-motion: reduce)` dans `src/index.css`.

---

## 5. Inventaire du Design System implémenté en P01

### 5.1 Primitives UI (`frontend/src/components/ui/`) — 24 fondamentales + 6 structurants
| Catégorie | Composants |
|---|---|
| **Actions** | `Button`, `IconButton` |
| **Formulaires** | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch` |
| **Affichage & Données** | `Badge`, `Avatar`, `Card` (+ `CardHeader`/`CardBody`/`CardFooter`), `Divider`, `Skeleton`, `Spinner`, `Tooltip`, `StatTile`, `StatusBadge`, `DataTable` |
| **Navigation** | `Tabs` (+ `TabPanel`), `Breadcrumb`, `PageHeader` |
| **Retours & États** | `Alert`, `Toast` (`ToastProvider`, `ToastItem`, `useToast`), `EmptyState`, `ErrorState` |
| **Surfaces superposées** | `Modal`, `Drawer`, `SidePanel`, `ConfirmDialog`, `DropdownMenu` |

### 5.2 Composants métier SamaAdresse (`frontend/src/components/shared/`) — 11 composants
`AddressCard` · `AddressPlate` · `AddressStatusBadge` · `LocationBadge` · `NeighborhoodTag` · `AddressCode` · `MapPreview` · `SearchBar` · `SearchFilter` · `UserProfileMenu` · `OfflineStatusIndicator`.

### 5.3 États interactifs garantis
Chaque composant interactif couvre explicitement : **Default**, **Hover**, **Focus-visible** (`outline-institution` 2 px + offset 2 px ou ring 3 px), **Active** (assombrissement + micro-pression `scale-[0.99]`), **Disabled** (`opacity-55`, `cursor-not-allowed`), **Loading** (`Spinner` + `aria-busy`), **Error** (`border-danger` + `role="alert"` + `aria-invalid`), **Success** (`border-success` + icône dédiée).
