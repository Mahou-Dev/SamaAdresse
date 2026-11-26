# Preuve et Analyse du 403 / 500 / 200 sur la Recherche Annuaire (B7)

## 1. Contexte du test
Test en direct contre l'environnement de production hébergé sur Render :
`https://samaadresse.onrender.com/api/public/directory?q=...`

Date de la mesure : 20 octobre 2026

## 2. Exécution des 4 requêtes demandées

### Cas 1 : Requête avec `<script>` (`%3Cscript%3E`)
**Commande :**
```bash
curl -i -s "https://samaadresse.onrender.com/api/public/directory?q=%3Cscript%3E"
```
**En-têtes et corps réels reçus :**
```http
HTTP/2 200 
date: Tue, 20 Oct 2026 05:20:47 GMT
content-type: application/json
cache-control: no-cache, no-store, max-age=0, must-revalidate
content-security-policy-report-only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
expires: 0
permissions-policy: geolocation=(self), camera=(self)
pragma: no-cache
referrer-policy: strict-origin-when-cross-origin
rndr-id: 817e7aad-9848-40e7
server: cloudflare
strict-transport-security: max-age=31536000; includeSubDomains
vary: accept-encoding
x-content-type-options: nosniff
x-frame-options: DENY
x-render-origin-server: Render
x-xss-protection: 0
cf-cache-status: DYNAMIC
cf-ray: a4d5933f395ef8b3-LHR
alt-svc: h3=":443"; ma=86400

{"content":[],"pageable":{"pageNumber":0,"pageSize":12,"sort":{"empty":true,"sorted":false,"unsorted":true},"offset":0,"unpaged":false,"paged":true},"totalElements":0,"totalPages":0,"last":true,"numberOfElements":0,"first":true,"size":12,"number":0,"sort":{"empty":true,"sorted":false,"unsorted":true},"empty":true}
```

---

### Cas 2 : Requête avec `'` (apostrophe seule)
**Commande :**
```bash
curl -i -s "https://samaadresse.onrender.com/api/public/directory?q='"
```
**En-têtes et corps réels reçus :**
```http
HTTP/2 500 
date: Tue, 20 Oct 2026 05:20:48 GMT
content-type: application/json
cache-control: no-cache, no-store, max-age=0, must-revalidate
cf-cache-status: DYNAMIC
content-security-policy-report-only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
expires: 0
permissions-policy: geolocation=(self), camera=(self)
pragma: no-cache
referrer-policy: strict-origin-when-cross-origin
rndr-id: d380d945-3df1-4d7c
server: cloudflare
strict-transport-security: max-age=31536000; includeSubDomains
vary: accept-encoding
x-content-type-options: nosniff
x-frame-options: DENY
x-render-origin-server: Render
x-xss-protection: 0
cf-ray: a4d5934b0a014a37-LHR
alt-svc: h3=":443"; ma=86400

{"timestamp":"2026-10-20T05:20:48.041758412Z","status":500,"error":"Internal Server Error","message":"Une erreur interne s'est produite. Veuillez réessayer ultérieurement.","path":"/api/public/directory"}
```

---

### Cas 3 : Requête avec `%27` (apostrophe encodée)
**Commande :**
```bash
curl -i -s "https://samaadresse.onrender.com/api/public/directory?q=%27"
```
**En-têtes et corps réels reçus :**
```http
HTTP/2 500 
date: Tue, 20 Oct 2026 05:20:48 GMT
content-type: application/json
cache-control: no-cache, no-store, max-age=0, must-revalidate
content-security-policy-report-only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
expires: 0
permissions-policy: geolocation=(self), camera=(self)
pragma: no-cache
referrer-policy: strict-origin-when-cross-origin
rndr-id: b83d9e54-435a-429b
server: cloudflare
strict-transport-security: max-age=31536000; includeSubDomains
vary: accept-encoding
x-content-type-options: nosniff
x-frame-options: DENY
x-render-origin-server: Render
x-xss-protection: 0
cf-cache-status: DYNAMIC
cf-ray: a4d5935089eb9480-LHR
alt-svc: h3=":443"; ma=86400

{"timestamp":"2026-10-20T05:20:48.936020228Z","status":500,"error":"Internal Server Error","message":"Une erreur interne s'est produite. Veuillez réessayer ultérieurement.","path":"/api/public/directory"}
```

---

### Cas 4 : Requête avec `--` (double tiret)
**Commande :**
```bash
curl -i -s "https://samaadresse.onrender.com/api/public/directory?q=--"
```
**En-têtes et corps réels reçus :**
```http
HTTP/2 200 
date: Tue, 20 Oct 2026 05:20:49 GMT
content-type: application/json
cache-control: no-cache, no-store, max-age=0, must-revalidate
cf-cache-status: DYNAMIC
content-security-policy-report-only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
expires: 0
permissions-policy: geolocation=(self), camera=(self)
pragma: no-cache
referrer-policy: strict-origin-when-cross-origin
rndr-id: 097c3fa9-933c-4a24
server: cloudflare
strict-transport-security: max-age=31536000; includeSubDomains
vary: accept-encoding
x-content-type-options: nosniff
x-frame-options: DENY
x-render-origin-server: Render
x-xss-protection: 0
cf-ray: a4d59354fd466527-LHR
alt-svc: h3=":443"; ma=86400

{"content":[],"pageable":{"pageNumber":0,"pageSize":12,"sort":{"empty":true,"sorted":false,"unsorted":true},"offset":0,"unpaged":false,"paged":true},"totalElements":0,"totalPages":0,"last":true,"numberOfElements":0,"first":true,"size":12,"number":0,"sort":{"empty":true,"sorted":false,"unsorted":true},"empty":true}
```

---

## 3. Origine du 403 : Reproduction et Démonstration

Lorsqu'une charge d'injection SQL complète comme `' OR 1=1--` est envoyée :
**Commande :**
```bash
curl -i -s "https://samaadresse.onrender.com/api/public/directory?q=%27%20OR%201=1--"
```
**En-têtes reçus :**
```http
HTTP/2 403 
date: Tue, 20 Oct 2026 05:21:32 GMT
content-type: text/html; charset=UTF-8
content-length: 221309
cache-control: private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0
expires: Thu, 01 Jan 1970 00:00:01 GMT
referrer-policy: same-origin
x-frame-options: SAMEORIGIN
server: cloudflare
cf-ray: a4d594627d562532-LHR
alt-svc: h3=":443"; ma=86400
```
*(Corps reçu : Page HTML Render WAF intitulée `403 - Forbidden` indiquant : `Your request was blocked by this site's web application firewall (WAF). Powered by Render`).*

## 4. Analyse et Conclusion Faisant Foi

1. **Les 4 requêtes demandées (`<script>`, `'`, `%27`, `--`) ne retournent AUCUN 403** :
   - `<script>` et `--` retournent **HTTP 200** avec la liste vide en JSON de l'application.
   - `'` et `%27` retournent **HTTP 500** avec l'objet d'erreur JSON de l'application (`GlobalExceptionHandler`).

2. **D'où vient le 403 constaté dans le cas B7 ?**
   - Le statut 403 est généré **exclusivement par l'intermédiaire réseau (Cloudflare / WAF Render)**, et **non par l'application Spring Boot**.
   - **Preuve par les en-têtes** :
     - Les réponses applicatives (200 et 500) contiennent systématiquement l'en-tête `x-render-origin-server: Render`, ainsi que `rndr-id` et les en-têtes de sécurité Spring (`x-content-type-options: nosniff`, `permissions-policy`).
     - Sur la réponse HTTP 403, l'en-tête `x-render-origin-server` est **totalement absent**.
     - Le corps de la réponse 403 est une page HTML de Render WAF (`Your request was blocked by this site's web application firewall (WAF). Powered by Render`) et non un JSON applicatif.
   - **Conclusion catégorique** : Le 403 vient de l'intermédiaire (Cloudflare / WAF Render). Ligne d'en-tête qui le prouve : absence de `x-render-origin-server: Render` combinée à la présence de `server: cloudflare` et du corps WAF Render.
