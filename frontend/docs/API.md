# Contrat API connecté au backend Spring Boot SamaAdresse

Ce document résume les routes réellement appelées par `src/lib/api.ts` vers le backend Spring Boot (`backend/`).
Par défaut, `VITE_API_BASE_URL` est vide (même origine : servi par Spring Boot en production sur port `8082`, ou proxy Vite `/api` et `/uploads` → `http://localhost:8082` en développement).

## Format des erreurs

Le backend répond en `ErrorResponse` JSON : `{ "timestamp", "status", "error", "message", "path", "fieldErrors" }`.
`ApiError` expose `status`, `message` et `fieldErrors` (avec compatibilité de secours `detail` / `errors`). Une erreur réseau renvoie `status = 0`.

## Routes appelées

| Fonction (`src/lib/api.ts`) | Requête backend | Auth |
|---|---|---|
| `login` | `POST /api/auth/login` (`credentials: 'include'`) → `AuthResponse` + cookie HttpOnly `refreshToken` | non |
| `register` | `POST /api/auth/register` `{ fullName, email, phoneNumber, password }` → `201` puis connexion auto | non |
| `refreshSession` | `POST /api/auth/refresh` (`credentials: 'include'`) → rotation cookie + nouvel Access Token | cookie |
| `logoutSession` | `POST /api/auth/logout` (`credentials: 'include'`) → révocation en base + effacement cookie | cookie |
| `getCurrentUser` | `GET /api/auth/me` → `UserProfileResponse` | Bearer |
| `getPublicAddress` | `GET /api/addresses/{code}` → `PublicAddressResponse` (`404` / `410 Gone`) | non |
| `searchDirectory` | `GET /api/public/directory?q=&quartier=&type=&page=&size=` → `Page<DirectoryItemResponse>` | non |
| `getRoute` | `GET /api/public/route?fromLat=&fromLon=&code=&profile=` → `RouteResponse` (GeoJSON `[lon, lat]` converti en `[lat, lng]`) | non |
| `reportAddress` | `POST /api/public/addresses/{code}/reports` `{ reason, comment }` → `202 Accepted` | non |
| `listAllMyAddresses` / `listMyAddresses` | `GET /api/addresses/mine` → `AddressResponse[]` | Bearer |
| `createMyAddress` | `POST /api/addresses` `{ latitude, longitude, description, locationType, listed, showOwnerName, clientRequestId }` | Bearer |
| `updateMyAddress` | `PATCH /api/addresses/{id}` `{ description, locationType, listed, showOwnerName }` | Bearer |
| `uploadMyAddressPhoto` | `POST /api/addresses/{id}/photo` (multipart champ `file`) | Bearer |
| `deleteMyAddressPhoto` | `DELETE /api/addresses/{id}/photo` | Bearer |
| `archiveMyAddress` | `POST /api/addresses/{id}/archive` | Bearer |
| `restoreMyAddress` | `POST /api/addresses/{id}/restore` | Bearer |
| `sendAddressSms` | `POST /api/addresses/{code}/share/sms` `{ phoneNumber }` (`+221...`) | Bearer |
| `listReports` | `GET /api/admin/reports?status=&page=&size=` | ADMIN |
| `updateReportStatus` | `PATCH /api/admin/reports/{id}` `{ status: RESOLVED \| DISMISSED, reason? }` | ADMIN |
| `suspendAdminAddress` | `POST /api/admin/addresses/{id}/suspend` `{ reason }` | ADMIN |
| `reinstateAdminAddress` | `POST /api/admin/addresses/{id}/reinstate` `{ reason? }` | ADMIN |

## Statuts et types réels du backend

- `LocationType` : `MAISON`, `COMMERCE`, `INSTITUTION`
- `AddressStatus` : `ACTIVE`, `SIGNALED`, `SUSPENDED`, `ARCHIVED`
- `ReportReason` : `POSITION_INCORRECTE`, `CONTENU_INAPPROPRIE`, `PHOTO_INAPPROPRIEE`, `AUTRE`
- `ReportStatus` : `OPEN`, `RESOLVED`, `DISMISSED`
- `Role` : `PROPRIETAIRE`, `ADMIN`
