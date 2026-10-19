# Rapport de Vérification Automatique SamaAdresse (Lots 8b, 9 et 10)

**Date d'exécution :** 2026-10-19 10:34:41 UTC
**Branche / Commit :** feature/lot10-finitions / b560b95
**Mode d'exécution :** Local (`--with-docker` non activé)

## 0. Sécurité Git & Clé ORS hors du dépôt

- **Fichier `.env` suivi par Git (`git ls-files .env`) :** Aucun (0 fichier) — **Atteint**
- **Fichier `.env.example` ne contenant que des placeholders vides (`KEY=`) :** 0 valeur pré-remplie — **Atteint**
- **Scan ciblé (`backend/`, `frontend/src/`, `docs/*.md`, `.env.example`, `scripts/`, `Dockerfile`, `render.yaml`, `.github/`) pour préfixe ORS et `eyJ...` (> 60 car.) :** 0 occurrence — **Atteint**
- **Historique Git (`git log --all -S"<8 premiers caractères de ORS_API_KEY>"`) :** 0 commit trouvé — **Atteint**

## 0b. Cohérence des Variables d'Environnement & Liens README

- **Cohérence des variables d'environnement (`.env.example`, README, `render.yaml`, `docker-compose.prod-test.yml`, Spring) :** 36 variables strictement alignées (0 divergence) — **Atteint**
- **Liens internes du `README.md` :** 33 liens relatifs, aucun lien absolu ou `file://`, tous pointant vers des fichiers existants — **Atteint**

## 1. Backend (Spring Boot 3.4 & Java 21)

- **Nombre de tests exécutés :** 130 (Échecs : 0, Erreurs : 0, Ignorés : 0) — **Atteint**
- **Couverture JaCoCo (Instructions) :** 76.38% (7300/9557 instructions couvertes)
- **Couverture JaCoCo (Lignes) :** 76.86% (1661/2161 lignes couvertes, cible ≥ 60%) — **Atteint**
- **Tests d'annuaire Étape 0c (`DirectoryControllerTest`) :** 4/4 exécutés et réussis — **Atteint**
  - `directory_whenShowOwnerNameFalse_ownerNameAbsentAndNotSearchable`
  - `directory_whenShowOwnerNameTrue_ownerNamePresentAndSearchable`
  - `directory_unlistedAddress_neverAppearsEvenWhenSearchingExactCode`
  - `directory_archivedOrSuspendedAddress_disappearsFromDirectory`

## 2. Frontend (React 19 & Vite 8)

- **TypeScript (`tsc --noEmit`) :** 0 erreur — **Atteint**
- **Linter (`oxlint`) :** 0 erreur — **Atteint**
- **Tests Vitest :** 111 / 111 tests passés (22 suites de tests) — **Atteint**
- **Chunk JS d'entrée (`index-CTDtI6Ym.js`) :** **102.67 Ko gzip** (Objectif ≤ 105 Ko : **Atteint** ; Plafond ≤ 125 Ko : **Atteint**)

```

=== SamaAdresse — Rapport des tailles de chunks JS ===

Fichier                                    Taille brute           Gzip
----------------------------------------------------------------------
AccountPage-D7_OuSKt.js                        12.10 Ko        3.58 Ko
AdminPage-BxPRjyyI.js                          12.38 Ko        3.40 Ko
DirectoryPage-DfyqGT6M.js                      12.16 Ko        3.73 Ko
EditAddressPage-BBo6xsax.js                    11.05 Ko        3.28 Ko
LeafletMapInner-QSS9uhQf.js                   154.77 Ko       45.31 Ko
MyAddressesPage-BRGBGfwc.js                    24.04 Ko        6.57 Ko
NewAddressPage-CsUUgnsg.js                     26.24 Ko        7.07 Ko
Toast-Chreacnl.js                               4.81 Ko        2.12 Ko
camera-BDcOnvgC.js                              0.35 Ko        0.26 Ko
download-DWYUQ-F9.js                            0.38 Ko        0.26 Ko
formValidation-yD29BZv7.js                      4.25 Ko        2.13 Ko
index-CTDtI6Ym.js                             359.68 Ko      102.67 Ko
jsx-runtime-Dk72oS4N.js                         8.57 Ko        3.25 Ko
rotate-ccw-BfH7sPWo.js                          0.22 Ko        0.20 Ko
workbox-window.prod.es5-Bd17z0YL.js             5.52 Ko        2.15 Ko
x-CSlIypbX.js                                   8.68 Ko        3.39 Ko
----------------------------------------------------------------------

Chunk d'entrée : index-CTDtI6Ym.js
Taille gzip : 102.67 Ko (Seuil max : 125.00 Ko, Objectif : <= 105.00 Ko)

SUCCES : Le chunk d'entrée est inférieur ou égal à l'objectif de 105 Ko gzip (102.67 Ko <= 105 Ko) !
```

