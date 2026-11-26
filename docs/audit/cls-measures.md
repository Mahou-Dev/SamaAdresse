# Rapport des Mesures CLS & Lighthouse des Espaces Connectés (Point 2 & Point 3)

Date : 2026-10-20T05:44:22.109Z
Cible testée : `http://localhost:8082` (image Docker locale de production)

## 1. Synthèse des 3 Mesures de CLS (< 0,1)

| Page | URL Finale mesurée | Mesure 1 | Mesure 2 | Mesure 3 | Médiane CLS | Performance (médiane) | Statut (CLS < 0,1) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tableau de bord** | `http://localhost:8082/tableau-de-bord` | 0.00001 | 0.00001 | 0.00001 | **0.00001** | 100/100 | **Atteint** |
| **Mes adresses** | `http://localhost:8082/addresses/mine` | 0.00674 | 0.00674 | 0.00001 | **0.00674** | 100/100 | **Atteint** |
| **Nouvelle adresse** | `http://localhost:8082/addresses/new` | 0.00001 | 0.00001 | 0.00001 | **0.00001** | 100/100 | **Atteint** |
| **Administration** | `http://localhost:8082/admin` | 0.00001 | 0.00001 | 0.00000 | **0.00001** | 100/100 | **Atteint** |

## 2. Preuve d'Affichage Connecté & Éléments Distinctifs

Toutes les pages ont été mesurées avec session valide et profil Chrome persistant (`--disable-storage-reset`).
- **Tableau de bord :** Salutation `Bonjour, Fatou !` et tuiles métriques affichées ; capture extraite `docs/audit/lighthouse/tableau-de-bord-screenshot.jpg`.
- **Mes adresses :** En-tête `Mes adresses`, boutons de bascule liste/grille et cartes d'adresses ; capture extraite `docs/audit/lighthouse/mes-adresses-screenshot.jpg`.
- **Nouvelle adresse :** En-tête `Nouvelle adresse`, étapes de création et carte Leaflet ; capture extraite `docs/audit/lighthouse/nouvelle-adresse-screenshot.jpg`.
- **Administration :** En-tête `Administration & Modération`, file des signalements ; capture extraite `docs/audit/lighthouse/administration-screenshot.jpg`.

## 3. Analyse LCP sur la fiche publique `/a/ZIG-KBG-4271`

- **`lcp-discovery-insight` :** L'application étant une SPA (Single Page Application), le navigateur télécharge d'abord `index.html` puis le bundle JS (`index-*.js`). Ce n'est qu'après l'évaluation du bundle et le montage du composant React que la route `/a/ZIG-KBG-4271` est reconnue, déclenchant l'appel API `fetch('/api/addresses/ZIG-KBG-4271')`. L'URL de la photo (`/uploads/...`) n'est donc découverte qu'à la réception du JSON. Le scanner de préchargement HTML ne peut pas anticiper cette URL dynamique.
- **`image-delivery-insight` :** La photo de façade de démonstration (`/uploads/demo-facade-1.jpg`, 114 Ko en JPEG) est servie telle quelle. L'insight Lighthouse recommande une conversion automatique vers les formats modernes (WebP ou AVIF) et une compression adaptée au conteneur mobile pour réduire le poids de transfert sous les 30 Ko.
