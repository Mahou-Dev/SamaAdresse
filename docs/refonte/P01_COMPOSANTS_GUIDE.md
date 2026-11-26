# P01 — Guide d'Utilisation des Composants du Design System

Ce document constitue la référence technique directement utilisable par les développeurs lors des missions **P02, P03 et P04**. Il remplace l'installation de Storybook (évitant l'alourdissement des dépendances et du dépôt).

---

## 1. Règles d'importation (Performance & Tree-shaking)

- **Dans les routes chargées en différé (`pages/` lazy, `features/`) :**
  ```tsx
  import { Button, Input, Card, Modal } from '../components/ui';
  import { AddressCard, SearchBar, SearchFilter } from '../components/shared';
  ```
- **Dans les fichiers critiques du chunk d'entrée (`App.tsx`, `HomePage.tsx`) :**
  Privilégier les imports directs par fichier pour garantir un bundle initial minimal :
  ```tsx
  import { ErrorBoundary } from './app/boundaries/ErrorBoundary';
  import { Button } from '../components/ui/Button';
  ```

---

## 2. Primitives fondamentales (`frontend/src/components/ui/`)

### `Button`
Bouton principal ou lien stylisé (supporte `to` pour React Router et `href` pour liens externes).
- **Props clés :** `variant` (`'primary' | 'secondary' | 'outline' | 'subtle' | 'ghost' | 'danger'`), `size` (`'sm' | 'md' | 'lg'`), `isLoading`, `loadingText`, `leftIcon`, `rightIcon`, `fullWidth`, `to`, `href`.
- **Exemple :**
  ```tsx
  <Button variant="primary" size="md" leftIcon={Plus} to="/addresses/new">
    Créer une adresse
  </Button>
  ```

### `IconButton`
Bouton à icône seule imposant `aria-label` à la compilation TypeScript.
- **Props clés :** `icon`, `'aria-label'` *(obligatoire)*, `variant`, `size`, `rounded` (`'md' | 'full'`), `isLoading`.
- **Exemple :**
  ```tsx
  <IconButton icon={Share2} aria-label="Partager l'adresse" variant="outline" rounded="full" />
  ```

### `Input` & `Textarea`
Champs de saisie accessibles (`useId()`, `aria-invalid`, `aria-describedby`, bordure `border-control` ≥ 3:1).
- **Props clés (`Input`) :** `label`, `helperText`, `error`, `success`, `size`, `leftIcon`, `rightIcon`, `rightAddon`, `clearable`, `onClear`.
- **Props clés (`Textarea`) :** `label`, `helperText`, `error`, `success`, `maxLength`, `showCount`.
- **Exemple :**
  ```tsx
  <Input
    label="Adresse e-mail"
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={emailError}
  />
  ```

### `Select`, `Checkbox`, `RadioGroup`, `Switch`
- **`Select` :** `label`, `placeholder`, `options: SelectOption[]`, `error`, `helperText`, `size`.
- **`Checkbox` :** `label`, `description`, `checked`, `indeterminate`, `error`, `onChange`.
- **`RadioGroup` :** `label`, `options`, `value`, `onChange`, `variant` (`'default' | 'card' | 'segmented'`), `orientation` (`'vertical' | 'horizontal'`). Navigation complète aux flèches directionnelles.
- **`Switch` :** `checked`, `onChange`, `label`, `description`, `size` (`'sm' | 'md'`), `disabled`. Utilise `role="switch"` + `aria-checked`.

### `Badge`, `Avatar`, `Divider`, `Skeleton`, `Spinner`, `Tooltip`
- **`Badge` :** `variant` (`'neutral' | 'brand' | 'institution' | 'success' | 'warning' | 'danger' | 'outline'`), `size`, `dot`, `icon`.
- **`Avatar` :** `name`, `src`, `size` (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`), `tone`, `status` (`'online' | 'offline'`). Repli automatique sur initiales.
- **`Divider` :** `orientation` (`'horizontal' | 'vertical'`), `label`, `tone`.
- **`Skeleton` :** `variant` (`'rect' | 'text' | 'circle' | 'card'`), `count`, `className`.
- **`Spinner` :** `size` (`'xs' | 'sm' | 'md' | 'lg'`), `tone`, `label` (`sr-only`).
- **`Tooltip` :** `content`, `placement` (`'top' | 'bottom' | 'left' | 'right'`). Ouverture au survol et au focus clavier, fermeture sur `Escape`.

### `Card`, `StatTile`, `StatusBadge`, `DataTable`, `Tabs`, `Breadcrumb`, `PageHeader`
- **`Card` :** `variant` (`'elevated' | 'outlined' | 'subtle' | 'interactive'`), `padding`, `border`, `as` (`'div' | 'article' | 'section'`), sous-composants `CardHeader`, `CardBody`, `CardFooter`.
- **`StatTile` :** Tuile KPI cliquable (`to` ou `onClick`) ou statique, avec `variant` (`'default' | 'success' | 'alert' | 'warning' | 'neutral'`).
- **`StatusBadge` :** Statuts normalisés (`ACTIVE`, `SUSPENDED`, `SIGNALED`, `ARCHIVED`, `PENDING`, `OPEN`, `RESOLVED`, `DISMISSED`).
- **`DataTable` :** Tableau triable (`aria-sort`) sur desktop basculant automatiquement en cartes empilées sur mobile (`< 768 px`).
- **`Tabs` + `TabPanel` :** Structure WAI-ARIA complète (`tablist`, `tab`, `tabpanel`), variantes `'segment' | 'underline' | 'pill'`, navigation flèches + `Home`/`End`.
- **`Breadcrumb` :** `<nav aria-label="Fil d'Ariane">` avec `aria-current="page"` sur le dernier segment.
- **`PageHeader` :** Titre H1, sous-titre, lien retour ou `breadcrumbs`, action principale et secondaire.

### `Alert`, `Toast`, `EmptyState`, `ErrorState`, `Modal`, `Drawer`, `SidePanel`, `ConfirmDialog`, `DropdownMenu`
- **`Alert` :** Bannière en ligne (`'info' | 'success' | 'warning' | 'danger'`), `title`, `onDismiss`, `action`.
- **`Toast` :** `ToastProvider` + `useToast()` (`showToast(message, type, title?)` avec `'success' | 'error' | 'warning' | 'info'`).
- **`EmptyState` :** Supporte `illustration` WebP (`srcSet`, `sizes`) ou `icon`, `action`, `secondaryAction`, `compact`.
- **`ErrorState` :** Écran de repli d'erreur (`errorCode`, `onRetry`, `homeTo`), utilisé dans `ErrorBoundary`.
- **`Modal` :** Fenêtre modale avec `useFocusTrap`, fermeture `Escape` et clic voile, tailles `'sm' | 'md' | 'lg' | 'xl'`.
- **`Drawer` / `SidePanel` :** Panneau glissant (`side: 'right' | 'left' | 'bottom'`) avec piège de focus.
- **`ConfirmDialog` :** Dialogue de confirmation adossé à `Modal` et `Button` (`variant: 'danger' | 'warning' | 'info'`).
- **`DropdownMenu` :** Menu déroulant accessible (`role="menu"`, `menuitem`, flèches haut/bas, `Home`/`End`, `Escape`, clic extérieur).

---

## 3. Composants spécialisés SamaAdresse (`frontend/src/components/shared/`)

| Composant | Données réelles consommées | Usage principal (P02–P04) |
|---|---|---|
| **`AddressCard`** | `code`, `zone`, `quartier`, `locationType`, `description`, `photoUrl`, `status`, `ownerName`, `createdAt` | Grille annuaire (P02) et gestion propriétaire (P03/P04) en modes `vertical` (4:3) ou `horizontal`. |
| **`AddressPlate`** | `code`, `zone`, `type`, `size`, `showCopy`, `isExample`, `animated` | Emblème officiel sur Accueil, Fiche publique et Confirmation de création. |
| **`AddressCode`** | `code`, `size`, `variant`, `copyable`, `onCopy` | Affichage JetBrains Mono copiable d'un identifiant `ZIG-KBG-4271`. |
| **`AddressStatusBadge`** | `AddressStatus \| ReportStatus \| 'PENDING'` | Statut typé sur fiches propriétaire et file admin. |
| **`LocationBadge`** | `LocationType` (`MAISON`, `COMMERCE`, `INSTITUTION`), `surface` (`default` / `overlay`) | Catégorie visuelle sur cartes photo et filtres. |
| **`NeighborhoodTag`** | `quartierCode`, `zoneCode`, résolution via `geoGrid.ts` | Étiquette de quartier (ex. `Boucotte · Ziguinchor`), statique ou filtrable. |
| **`MapPreview`** | `latitude`, `longitude`, `code`, `zone`, `quartier`, `interactive`, `isOffline` | Aperçu léger de coordonnées ou intégration carte Leaflet lazy, résilient hors ligne. |
| **`SearchBar`** | `value`, `onChange`, `onSubmit`, `onClear`, `variant` (`hero` / `compact`), `isLoading` | Recherche unifiée dans le Header (P02), la Homepage (P02) et l'Annuaire (P02). |
| **`SearchFilter`** | `options`, `value`, `onChange`, `onReset`, `showReset` | Filtres en pilules horizontales (quartiers, types de lieu, statuts). |
| **`UserProfileMenu`** | `user: UserProfile \| null`, `isAuthenticated`, `isOnline`, `onLogout` | Menu compte du Header unifié (affiche Modération uniquement si `role === 'ADMIN'`). |
| **`OfflineStatusIndicator`** | `isOnline`, `pendingCount`, `isSyncing`, `onSyncClick`, `compact` | Témoin réseau et déclencheur de synchronisation manuelle IndexedDB. |

---

## 4. Hooks et Layouts (`frontend/src/hooks/` & `frontend/src/app/`)

- **`useFocusTrap`** : piège Tab/Shift+Tab, touche Échap, blocage du scroll et restauration du focus.
- **`useClickOutside`** : fermeture propre des menus contextuels au clic/touch extérieur.
- **`useMediaQuery` & `useBreakpoints`** : détection réactive des 4 paliers (`isMobile`, `isTablet`, `isDesktop`, `isWide`) sans cascade `useEffect`.
- **`ErrorBoundary`** : protection globale contre les erreurs de rendu React, déjà active dans `src/App.tsx`.
- **`PublicLayout`, `AuthenticatedLayout`, `AdminLayout`, `AuthLayout`, `AppShell`** : gabarits de mise en page prêts à accueillir les refontes P02, P03 et P04.
