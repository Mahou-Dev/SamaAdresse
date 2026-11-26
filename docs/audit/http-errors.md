# Preuves d'Exécution : Gestion des Erreurs HTTP (D-01) et Suppression des Pages HTML Tomcat

Date de la mesure : 20 octobre 2026
Cible : Conteneur Docker local `samaadresse:prod-test` (`http://localhost:8082`)

---

## 1. 404 Not Found (Route API Inconnue)

### Requête
```bash
curl -i http://localhost:8082/api/public/route-inconnue
```

### Réponse brute
```http
HTTP/1.1 404 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Vary: origin,access-control-request-method,access-control-request-headers,accept-encoding
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:18:40 GMT

{"timestamp":"2026-10-20T05:18:40.426518437Z","status":404,"error":"Not Found","message":"Ressource ou endpoint introuvable","path":"/api/public/route-inconnue"}
```

---

## 2. 405 Method Not Allowed (Méthode Interdite)

### Requête
```bash
curl -i -X POST http://localhost:8082/api/health
```

### Réponse brute
```http
HTTP/1.1 405 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
vary: accept-encoding
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:18:40 GMT

{"timestamp":"2026-10-20T05:18:40.444562412Z","status":405,"error":"Method Not Allowed","message":"Méthode HTTP POST non autorisée pour cette ressource.","path":"/api/health"}
```

---

## 3. 415 Unsupported Media Type (Content-Type non géré)

### Requête
```bash
curl -i -X POST http://localhost:8082/api/auth/register -H "Content-Type: text/plain" -d "raw"
```

### Réponse brute
```http
HTTP/1.1 415 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
vary: accept-encoding
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:18:40 GMT

{"timestamp":"2026-10-20T05:18:40.458138451Z","status":415,"error":"Unsupported Media Type","message":"Type de média non supporté : text/plain;charset=UTF-8","path":"/api/auth/register"}
```

---

## 4. 400 Bad Request (Corps JSON Malformé)

### Requête
```bash
curl -i -X POST http://localhost:8082/api/auth/register -H "Content-Type: application/json" -d '{"email": bad_json'
```

### Réponse brute
```http
HTTP/1.1 400 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
vary: accept-encoding
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:18:40 GMT
Connection: close

{"timestamp":"2026-10-20T05:18:40.475930064Z","status":400,"error":"Bad Request","message":"Corps de requête absent ou JSON invalide","path":"/api/auth/register"}
```

---

## 5. 413 Payload Too Large (Téléversement Dépassant 5 Mo)

### Requête
```bash
curl -i -X POST http://localhost:8082/api/addresses/ZIG-KBG-4271/photo \
  -H "Authorization: Bearer <TOKEN_AUTHENTIFIE>" \
  -F "file=@/tmp/test-large.jpg"
```
*(Fichier `/tmp/test-large.jpg` de taille 6,29 Mo > 5 Mo).*

### Réponse brute
```http
HTTP/1.1 100 

HTTP/1.1 413 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
vary: accept-encoding
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:22:50 GMT
Connection: close

{"timestamp":"2026-10-20T05:22:50.635286199Z","status":413,"error":"Payload Too Large","message":"Le fichier dépasse la taille maximale autorisée de 5 Mo.","path":"/api/addresses/ZIG-KBG-4271/photo"}
```

---

## 6. 400 Bad Request Tomcat (URL Malformée avec encodage `%` invalide)

### Requête
```bash
curl -i --path-as-is "http://localhost:8082/api/%"
```

### Réponse brute
```http
HTTP/1.1 400 
vary: accept-encoding
Content-Type: application/json;charset=UTF-8
Date: Tue, 20 Oct 2026 05:22:18 GMT
Connection: close

{"timestamp":"2026-10-20T05:22:18.398490403Z","status":400,"error":"Bad Request","message":"Requête invalide ou URL malformée","path":"/api/%"}
```

*(Aucune page HTML Tomcat `Apache Tomcat - Error report` n'est émise grâce à `JsonErrorReportValve`).*

---

## 7. 404 Not Found sur GET `/uploads/` (Listage de Répertoire Interdit)

### Requête
```bash
curl -i http://localhost:8082/uploads/
```

### Réponse brute
```http
HTTP/1.1 404 
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(self)
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 0
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
vary: accept-encoding
Content-Type: application/json
Transfer-Encoding: chunked
Date: Tue, 20 Oct 2026 05:18:51 GMT

{"timestamp":"2026-10-20T05:18:51.017789832Z","status":404,"error":"Not Found","message":"Le listage du répertoire /uploads/ est interdit ou introuvable.","path":"/uploads/"}
```

---

## Résumé de conformité
- Les 7 cas d'erreurs HTTP retournent strictement un corps JSON normalisé avec `status`, `error`, `message`, `path`.
- L'en-tête `Content-Type` est toujours `application/json` ou `application/json;charset=UTF-8`.
- Aucune trace de page HTML par défaut Tomcat ne subsiste.
- Tests automatisés validés dans `HttpErrorHandlingIntegrationTest.java` (7/7 tests passés).
