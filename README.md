# SamaAdresse — Plateforme de Génération d'Adresses Géolocalisées

**SamaAdresse** est une plateforme dédiée à la création et à la gestion d'adresses géolocalisées intelligentes pour le Sénégal.

---

## 🚀 Prérequis

Avant de lancer le projet en local, assurez-vous d'avoir installé les outils suivants sur votre machine :

- **Java 21** : JDK 21 (Eclipse Temurin recommandé). `JAVA_HOME` doit pointer vers votre installation JDK 21 (`/usr/lib/jvm/temurin-21-jdk` sur Linux).
- **Node.js 20+** et **npm 10+** (pour le frontend).
- **PostgreSQL 15+** (Optionnel pour le premier démarrage du squelette, configurable via variables d'environnement).
- **Git** (pour le versionnement multi-branches).

---

## 📁 Structure du Repository (Monorepo)

```
samaadresse/
├── backend/       # Service Backend Spring Boot 3.4.3 (Java 21 Temurin)
├── frontend/      # Client Frontend PWA React (Vite + TypeScript + Tailwind CSS)
├── docs/          # Documentation technique et spécifications d'architecture
└── README.md      # Guide d'installation et d'utilisation
```

---

## 🛠️ Instructions de démarrage en local

### 1. Démarrage du Backend (`/backend`)

Accédez au dossier `backend/` et lancez l'application via le Maven Wrapper (avec Java 21) :

```bash
cd backend

# Assurez-vous d'utiliser Java 21
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk

# Compilation & vérification du projet
c

# Démarrage de Spring Boot (port 8082 par défaut en dev)
./mvnw spring-boot:run
```

#### Variables d'environnement PostgreSQL (Optionnelles pour le dev local) :
Le fichier `src/main/resources/application.yml` utilise des variables d'environnement avec valeurs de fallback pour le développement local :
- `DB_URL` (défaut en dev : `jdbc:postgresql://localhost:5434/samaadresse`)
- `DB_USER` (défaut en dev : `samaadresse`)
- `DB_PASSWORD` (défaut en dev : `samaadresse_dev`)
- `GEO_FALLBACK_MAX_DISTANCE_KM` (défaut : `3.0`, rayon de tolérance de rattachement au quartier le plus proche)

Exemple de lancement avec variables personnalisées :
```bash
DB_URL=jdbc:postgresql://localhost:5434/mon_bd DB_USER=myuser DB_PASSWORD=mypass ./mvnw spring-boot:run
```

#### Endpoints utiles :
- Healthcheck : [http://localhost:8082/api/health](http://localhost:8082/api/health) (Retourne `{"status":"UP"}`)
- Documentation Swagger UI : [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)

---

### 2. Démarrage du Frontend (`/frontend`)

Accédez au dossier `frontend/` puis installez les dépendances et lancez le serveur de dev Vite :

```bash
cd frontend

# Installation des dépendances Node.js
npm install

# Démarrage du serveur de dev Vite (port 5173 par défaut)
npm run dev
```

L'application web/PWA sera accessible sur [http://localhost:5173](http://localhost:5173). Le serveur Vite redirige automatiquement les appels `/api` et `/uploads` vers le backend Spring Boot sur `http://localhost:8082`.

#### Variables d'environnement Frontend (dans `.env` ou `.env.local`) :
- `VITE_TILE_URL` : URL des tuiles cartographiques Leaflet (défaut : OpenStreetMap standard `https://tile.openstreetmap.org/{z}/{x}/{y}.png`).
- `VITE_TILE_ATTRIBUTION` : Attribution légale de la cartographie (défaut : `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`).
- `VITE_API_BASE_URL` : URL de base du backend si hébergé hors du même domaine (vide par défaut pour utiliser les proxys relatifs Vite `/api` et `/uploads`).

Pour construire la version de production PWA :
```bash
npm run build
```

### 🔄 Gestion du rafraîchissement de session (Double Refresh Avoidance)
Pour prévenir la rotation concurrente et l'invalidation prématurée du refresh token (notamment sous React StrictMode en dev qui monte deux fois les composants, ou lors de requêtes simultanées), `AuthContext.tsx` utilise une référence de verrouillage `initRanRef`. Ce mécanisme garantit qu'un seul appel POST `/api/auth/refresh` est émis à l'initialisation de l'application. Les requêtes réseau partagent le jeton d'accès en mémoire sans déclencher de rejeu concurrent destructeur sur le cookie HttpOnly de rotation.


---

## 🌿 Stratégie Git & Branches

Le repository utilise le modèle Git Flow basique :
- `main` : Branche de production stable.
- `develop` : Branche principale de développement. Toutes les nouvelles fonctionnalités sont développées sur des feature branches découpées depuis `develop`.
