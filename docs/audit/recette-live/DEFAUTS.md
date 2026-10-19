# Registre des Anomalies et Défauts — Recette Live Render

Ce document consigne tous les défauts constatés lors de la recette en direct sur `https://samaadresse.onrender.com`.
Aucune correction n'est apportée au code : constatation factuelle, preuves mesurées, cause probable et correction suggérée.

---

### D-01 — Code HTTP 500 au lieu de 404 sur les routes d'API inexistantes
- **Gravité :** MINEURE (pas de plantage de service, pas de fuite de données ni de trace de pile, mais non-respect du code de statut REST standard).
- **Cas liés :** A6, H5, I4
- **Date / Heure du constat :** 2026-10-18T22:47:27Z
- **Étapes de reproduction :**
  1. Envoyer une requête HTTP GET vers une route inexistante autorisée publiquement :
     `curl -s https://samaadresse.onrender.com/api/public/zzz`
  2. Ou envoyer une requête HTTP GET authentifiée vers une route inconnue :
     `curl -s -H "Authorization: Bearer <TOKEN>" https://samaadresse.onrender.com/api/zzz`
- **Résultat attendu :** Réponse HTTP 404 Not Found avec corps JSON `{ "status": 404, "error": "Not Found", ... }`.
- **Résultat observé :** Réponse HTTP 500 Internal Server Error :
  ```json
  {
    "timestamp": "2026-10-18T22:47:27.740110901Z",
    "status": 500,
    "error": "Internal Server Error",
    "message": "Une erreur interne s'est produite. Veuillez réessayer ultérieurement.",
    "path": "/api/zzz"
  }
  ```
- **Preuve :** Log de requête cURL et capture dans `docs/audit/recette-live/preuves/module-A-results.json`.
- **Cause probable (hypothèse) :** Sous Spring Boot 3.4 / Spring 6, les requêtes vers des routes sans handler génèrent une exception `org.springframework.web.servlet.resource.NoResourceFoundException`. En l'absence de mapping explicite dans `GlobalExceptionHandler`, l'exception est capturée par le fallback générique `@ExceptionHandler(Exception.class)` qui renvoie HTTP 500.
- **Correction suggérée :** Déployer sur Render le correctif déjà présent sur la branche locale dans `GlobalExceptionHandler.java` mappant `NoResourceFoundException` vers HTTP 404.

---

### D-02 — Limitation de débit sur `/api/auth/login` fixée à 100/min au lieu de 5/min documenté
- **Gravité :** MINEURE / DIVERGENCE DOCUMENTAIRE (sécurité affaiblie contre les attaques par force brute distribuée sur les mots de passe).
- **Cas lié :** C2 (et J2)
- **Date / Heure du constat :** 2026-10-18T23:08:15Z
- **Étapes de reproduction :**
  1. Envoyer 6 requêtes POST consécutives sur `https://samaadresse.onrender.com/api/auth/login` avec de mauvais identifiants depuis la même adresse IP en moins de 5 secondes.
- **Résultat attendu (selon DEMO.md et README §2) :** À la 6e tentative, retour HTTP 429 Too Many Requests avec délai de réessai (`retry-after`).
- **Résultat observé :** Toutes les 6 requêtes reçoivent HTTP 401 Unauthorized (`login429Hit: false`). Aucune erreur 429 n'est déclenchée.
- **Preuve :** Données chiffrées dans `docs/audit/recette-live/preuves/module-C-results.json`.
- **Cause probable (hypothèse) :** Dans `RateLimiterService.java`, la méthode `createNewBucket(String key)` configure par défaut une capacité de 100 jetons par minute (`Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)))`) pour les routes d'authentification au lieu de la limite stricte de 5 tentatives par minute spécifiée dans la documentation.
- **Correction suggérée :** Définir une règle spécifique pour la clé `login` avec un bucket de capacité 5 et réapprovisionnement de 5 jetons / 15 minutes.

---

### D-03 — Version déployée sur Render antérieure au Lot 10 (Volet visibilité replié, Toast chevauchant, Footer Dakar)
- **Gravité :** MINEURE (confort visuel et conformité cahier des charges Lot 10).
- **Cas liés :** D1, K2, K6
- **Date / Heure du constat :** 2026-10-19T01:05:24Z
- **Étapes de reproduction :**
  1. Se connecter sur `https://samaadresse.onrender.com/login` sur viewport mobile 360×800.
  2. Naviguer vers `/addresses/new`.
  3. Renseigner ou capturer la position GPS puis cliquer sur *Continuer vers les détails*.
  4. Observer l'état initial du volet *Visibilité dans l'annuaire*, le pied de page et le toast de notification.
- **Résultat attendu (spécification Lot 10) :**
  - Le volet *Visibilité dans l'annuaire* est déplié par défaut (`<details open>`).
  - Le pied de page ne mentionne plus « Déploiement en cours à Ziguinchor et Dakar » mais uniquement « Projet étudiant — Ziguinchor, Sénégal ».
  - Le toast de notification ne chevauche plus la barre de navigation basse à 360 px (marge basse suffisante).
- **Résultat observé :**
  - Le volet est replié (`<details>` fermé).
  - Le pied de page affiche « Déploiement en cours à Ziguinchor et Dakar, Sénégal ».
  - Le toast `Position GPS capturée !` chevauche directement la barre de navigation basse (icônes Accueil/Annuaire/Créer masquées en partie).
- **Preuve :** Capture d'écran live [`preuves/D1-wizard-etape2-visibilite-360x800.png`](preuves/D1-wizard-etape2-visibilite-360x800.png).
- **Cause certaine :** Le bundle frontend actuellement servi par Render est `/assets/index-DH93glLd.js` (généré lors du Lot 9). Les modifications du Lot 10 présentes dans le code local de la branche `feature/lot10-finitions` n'ont pas encore été déployées en production sur Render.
- **Correction suggérée :** Déployer la branche `feature/lot10-finitions` sur Render.
