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
./mvnw clean compile

# Démarrage de Spring Boot (port 8080 par défaut)
./mvnw spring-boot:run
```

#### Variables d'environnement PostgreSQL (Optionnelles pour le dev local) :
Le fichier `src/main/resources/application.yml` utilise des variables d'environnement avec valeurs de fallback pour le développement local :
- `DB_URL` (défaut : `jdbc:postgresql://localhost:5432/samaadresse`)
- `DB_USER` (défaut : `postgres`)
- `DB_PASSWORD` (défaut : `postgres`)

Exemple de lancement avec variables personnalisées :
```bash
DB_URL=jdbc:postgresql://localhost:5432/mon_bd DB_USER=myuser DB_PASSWORD=mypass ./mvnw spring-boot:run
```

#### Endpoints utiles :
- Healthcheck : [http://localhost:8080/api/health](http://localhost:8080/api/health) (Retourne `{"status":"UP"}`)
- Documentation Swagger UI : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

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

L'application web/PWA sera accessible sur [http://localhost:5173](http://localhost:5173). Le serveur Vite redirige automatiquement les appels `/api` vers le backend Spring Boot sur `http://localhost:8080`.

Pour construire la version de production PWA :
```bash
npm run build
```

---

## 🌿 Stratégie Git & Branches

Le repository utilise le modèle Git Flow basique :
- `main` : Branche de production stable.
- `develop` : Branche principale de développement. Toutes les nouvelles fonctionnalités sont développées sur des feature branches découpées depuis `develop`.
