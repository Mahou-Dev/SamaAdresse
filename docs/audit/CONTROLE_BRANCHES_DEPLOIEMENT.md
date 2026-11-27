# CONTRÔLE DES BRANCHES ET DES RISQUES DE DÉPLOIEMENT — MISSION GIT-01 (TEMPS 2)

- **Date de contrôle :** 27 novembre 2026 (UTC)
- **Production en ligne :** `https://samaadresse.onrender.com` (Render Free, région `frankfurt`, Docker)
- **Statut de la production :** **STABLE ET DÉPLOYÉE** — CI #25 (`46055304173`) et CD #2 (`46055304231`) tous deux **`SUCCESS`** sur `main` @ `9bccbe38` (`2026-11-27T19:14:39Z`).

---

## 1. Cartographie des déclencheurs CI/CD et Render

L'inspection directe des fichiers `render.yaml`, `.github/workflows/cd.yml` et `.github/workflows/ci.yml` établit les déclencheurs exacts suivants :

| Mécanisme | Fichier de configuration | Branches déclencheuses | Effet d'un push / merge | Risque sur la production |
|---|---|---|---|---|
| **Render Blueprint (Auto-Deploy)** | `render.yaml` (`branch: main`, `runtime: docker`) | **`main` uniquement** | Reconstruit l'image Docker et redéploie automatiquement `https://samaadresse.onrender.com`. | **ÉLEVÉ** sur tout push/force-push sur `main`. **NUL** sur `develop` et `feature/*`. |
| **Workflow CD Production** | `.github/workflows/cd.yml` (`on.push.branches: [main]` + `workflow_dispatch`) | **`main` uniquement** | Exécute `pre-deploy-gate` (PostgreSQL 16 + Maven + Vitest + Docker), appelle `RENDER_DEPLOY_HOOK_URL` et exécute les sondes post-déploiement live. | **ÉLEVÉ** sur tout push sur `main`. **NUL** sur `develop` et `feature/*`. |
| **Workflow CI Qualité** | `.github/workflows/ci.yml` (`on.push.branches: [main, develop, "feature/**", "fix/**"]` ; `on.pull_request.branches: [main, develop]`) | `main`, `develop`, `feature/**`, `fix/**` | Exécute les 4 jobs (`secrets`, `backend`, `frontend` + `npm audit`, `e2e` Docker/Playwright/Newman/`smoke-prod.sh`). **Ne déploie jamais sur Render.** | **NUL sur la prod** (contrôle qualité pur et isolé). |

### Vérification des secrets & variables de production (`render.yaml`)
- Aucune variable de production n'a été modifiée pendant TEMPS 2 (`SPRING_PROFILES_ACTIVE=prod`, `PHOTO_STORAGE=db`, `SMS_PROVIDER=mock`, `COOKIE_SECURE=true`, `TRUSTED_PROXY_HOPS=1`, `DEMO_SEED=true`).
- Les secrets externes (`DATABASE_URL`, `FRONTEND_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_PASSWORD`, `ORS_API_KEY`, `TWILIO_*`, `RENDER_DEPLOY_HOOK_URL`) sont stockés hors dépôt (`sync: false`) et restent strictement intacts.

---

## 2. État actuel complet des branches (local vs distant `origin`)

| Branche | SHA local | SHA distant (`origin`) | Protection GitHub | État / Risque |
|---|---|---|---|---|
| **`main`** | `34450534` *(en retard de 15 commits)* | **`9bccbe38`** *(PR #2 fusionnée, CD #2 vert)* | `false` *(non protégée)* | **Branche de production active.** Ne pas toucher sans validation explicite. |
| **`develop`** | `09d35e02` *(19 oct.)* | `09d35e02` *(19 oct.)* | `false` | **Obsolète de 39 commits** par rapport à `origin/main` (`9bccbe38`). Doit être synchronisée sur `9bccbe38` (fast-forward propre) avant d'accueillir les PR des 3 missions collaboratives. |
| `fix/audit-remediation` *(HEAD local)* | `ad6e9f97` | `ad6e9f97` | `false` | Déjà fusionnée dans `origin/main` (`9bccbe38`) via PR #2 ; CI #24 verte. |
| `feature/frontend-migration` | `8fe7ce94` | `8fe7ce94` | `false` | Déjà fusionnée dans `origin/main` (`aaf8bf8`) via PR #1. |
| `feature/p04-connected-experience` | `36f7fe85` | `36f7fe85` | `false` | Fusionnée dans `main` (`34450534`). |
| `feature/p01-design-system` | `c9f88640` | *(absente sur origin)* | — | Locale uniquement ; ancêtre de `main`. |
| `feature/p02-public-experience` | `0f8cec32` | *(absente sur origin)* | — | Locale uniquement ; ancêtre de `main`. |
| `feature/p03-address-experience` | `0483bffb` | *(absente sur origin)* | — | Locale uniquement ; ancêtre de `main`. |
| `feature/lot12-corrections` | `d2f7e046` | `d2f7e046` | `false` | Taguée `v1.1.0` ; ancêtre de `main`. |
| `feature/lot11a-espaces` | `1e5686bb` | *(absente sur origin)* | — | Locale uniquement ; ancêtre de `main`. |
| `feature/lot10-finitions` | `09d35e02` | *(absente sur origin)* | — | Locale uniquement (identique à `develop`). |
| `feature/lot8b-correctifs` | `061682cc` | `061682cc` | `false` | Fusionnée dans `develop` et `main`. |
| `feature/palette` | `b9e3cb66` | `b9e3cb66` | `false` | Fusionnée via `lot8b-correctifs`. |
| `feature/lot8-deploiement` | `7be529c2` | `7be529c2` | `false` | Fusionnée dans `develop` et `main` (`v1.0.0`). |

### Nouvelles branches de travail collaboratif prévues (non créées pendant TEMPS 2)
- `feature/git01-gallatsar-qa` (base : `develop` alignée sur `9bccbe38`)
- `feature/git01-deguenef87-api-docs` (base : `develop` alignée sur `9bccbe38`)
- `feature/git01-wague-user-guide` (base : `develop` alignée sur `9bccbe38`)

---

## 3. Matrice des risques de déploiement et mesures de maîtrise

| Risque | Probabilité | Impact | Mesure de maîtrise obligatoire |
|---|---|---|---|
| **Redéploiement involontaire sur Render** lors des travaux des 3 membres | Faible si PR vers `develop` ; Élevée si PR vers `main` | Indisponibilité transitoire Render (Free tier build ~4 min) ou régression prod | Cibler **obligatoirement `develop`** pour les 3 PR (`feature/git01-*` → `develop`). Aucun push sur `main` tant que l'ensemble n'est pas relu et validé. |
| **Déclenchement CD Render en cas de Stratégie A (`--force-with-lease` sur `main`)** | Certaine si `main` est réécrite | Reconstruction Docker + redéploiement du même code (aucune perte de données Neon, mais redémarrage du service) | **Suspendre toute réécriture de `main`** jusqu'à validation explicite distincte ; vérifier `git diff backup/pre-git01..main` = 0 octet avant tout push sur `main` ; exécuter hors créneau de démonstration. |
| **Erreur de rebase / perte des 4 fichiers locaux préexistants** (`VERIFY.md`, `newman.json`, `smoke-prod.md`, `.last-run.json`) | Moyenne lors d'un changement de branche local | Perte ou inclusion involontaire dans un commit | Vérifier `git status` avant chaque opération ; ne jamais utiliser `git reset --hard` ni `git clean -fd` ; sauvegarder ces 4 fichiers avant tout `checkout`. |
| **Échec CI `secrets` sur les nouveaux rapports Markdown** | Faible | Blocage PR si un exemple de token `eyJ...` (> 60 car.) figure dans `docs/api/API_CONTRACT.md` | Rappel explicite dans la fiche de mission de `deguenef87-ai` : utiliser exclusivement des placeholders courts comme `<JWT_ACCESS_TOKEN>` (jamais de faux JWT `eyJ...`). |
| **Dégradation de la couverture ou du budget gzip (`≤ 105 Ko`)** | Faible (missions orientées docs + tests) | Échec CI `frontend` (`check:size`) ou `backend` (`jacoco:check`) | Les 3 missions n'altèrent pas le bundle applicatif runtime ; la CI valide automatiquement chaque PR ouverte vers `develop`. |

---

## 4. Architecture Git cible recommandée (zéro impact prod durant les missions)

```text
origin/main (9bccbe38 — PRODUCTION RENDER STABLE, PROTÉGÉE)
     │
     ▼  (synchronisation fast-forward de develop sans toucher main)
origin/develop (alignée sur 9bccbe38 — BRANCHE D'INTÉGRATION)
     ├── feature/git01-gallatsar-qa        (PR #3 → develop, relue par Mahou-Dev / Andrebampoky)
     ├── feature/git01-deguenef87-api-docs (PR #4 → develop, relue par Mahou-Dev / Andrebampoky)
     └── feature/git01-wague-user-guide    (PR #5 → develop, relue par Mahou-Dev / Andrebampoky)
     │
     ▼  (UNIQUEMENT après validation humaine finale + CI verte sur develop)
PR finale develop → main (mise à jour documentaire/QA en production maîtrisée)
```
