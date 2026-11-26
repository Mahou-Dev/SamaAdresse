# Journal de Nettoyage des Données de Test (Règle R5)

Toutes les entités créées lors de cette campagne de test en production portent obligatoirement le préfixe `TEST-` ou l'adresse e-mail `test+<horodatage>@example.com`.
Aucune adresse ni aucun compte de démonstration (`demo@samaadresse.sn`, `ZIG-KBG-4271`, `ZIG-ESC-1042`, etc.) n'est altéré ou supprimé.

---

## 1. Données créées et statut de suppression

| Horodatage (UTC) | Type d'entité | Identifiant / E-mail / Code | Statut de suppression |
|---|---|---|---|
| *Module A* | *Aucune entité de test créée (uniquement consultations GET / login de lecture)* | N/A | Sans objet |

---

## 2. Données résiduelles éventuelles à supprimer manuellement
- *Aucune à ce stade.*
| 2026-10-18T23:07:57.995Z | Compte Utilisateur | test+1792364874293@example.com | En attente de nettoyage final |
| 2026-10-18T23:08:27.491Z | Compte Utilisateur | test+admin_escalate_1792364874293@example.com | En attente de nettoyage final |
| 2026-10-19T01:02:31.191Z | Compte | test+moduled_1792371748361@example.com | En attente de nettoyage final |
| 2026-10-19T01:04:26.697Z | Compte | test+moduled_1792371863931@example.com | En attente de nettoyage final |
| 2026-10-19T01:04:58.944Z | Adresse | 01829890-f096-44c3-a02d-3de26fb83b99 (code: ZIG-KBG-7517) | En attente de nettoyage final |
| 2026-10-19T01:04:59.774Z | Adresse | 72131288-757e-4181-af5e-b42fb7193208 (code: ZIG-ESC-4244) | En attente de nettoyage final |
| 2026-10-19T01:05:00.689Z | Adresse | b5a7b29f-3b63-4823-aa30-a2eb3f5afc28 (code: ZIG-KND-7298) | En attente de nettoyage final |
| 2026-10-19T01:05:01.503Z | Adresse | ff2fac36-49f7-4a34-a022-d2ae83147d5b (code: ZIG-NEM-6164) | En attente de nettoyage final |
| 2026-10-19T01:05:02.731Z | Adresse | c6194147-7420-4b96-93fd-8c3b278b3862 (code: ZIG-ESC-6849) | En attente de nettoyage final |
| 2026-10-19T01:05:03.555Z | Adresse | 982bc471-f322-49b0-961e-07f6ec35ca2a (code: DKR-MED-3642) | En attente de nettoyage final |
| 2026-10-19T01:05:04.271Z | Adresse | f3317374-dca9-4796-bbbf-3a288466f2d2 (code: SL-NDR-1865) | En attente de nettoyage final |
| 2026-10-19T01:05:06.422Z | Adresse | 575de6c4-24a7-4a95-96d1-d5f54d8a0b43 (code: ZIG-KBG-6497) | En attente de nettoyage final |
| 2026-10-19T01:05:17.685Z | Adresse | 28f41bc8-2f53-412b-bafe-9f67dcb2a634 (code: ZIG-KBG-2425) | En attente de nettoyage final |
| 2026-10-19T01:05:18.708Z | Adresse | 9b587e51-4309-4b87-8320-aa848d92f02e (code: ZIG-KBG-6922) | En attente de nettoyage final |
| 2026-10-19T01:05:19.667Z | Adresse | dc4f1deb-3ce5-405e-9bc3-e41f955aba74 (code: ZIG-KBG-6547) | En attente de nettoyage final |
| 2026-10-19T01:05:20.963Z | Adresse | 85ddd915-7e94-4670-aca2-a59ff22f3637 (code: ZIG-KBG-2367) | En attente de nettoyage final |
| 2026-10-19T01:05:21.783Z | Adresse | a38dbb69-d6fa-4eb5-9f96-8a55a5087781 (code: ZIG-KBG-6782) | En attente de nettoyage final |
| 2026-10-19T01:05:22.597Z | Adresse | f533ec3f-fbe4-4257-afea-16ce2b650f56 (code: ZIG-KBG-2902) | En attente de nettoyage final |
| 2026-10-19T01:05:23.422Z | Adresse | 81eb6b0d-a081-4cfe-8842-b42fe0ee2aaa (code: ZIG-KBG-5093) | En attente de nettoyage final |
| 2026-10-19T01:05:24.239Z | Adresse | 3d9f3cf3-6644-412d-ad88-e0c25b7331ec (code: ZIG-KBG-2116) | En attente de nettoyage final |
| 2026-10-19T01:07:02.178Z | Compte | test+moduled_1792372019371@example.com | En attente de nettoyage final |
| 2026-10-19T01:07:33.261Z | Adresse | 69db05cc-f7a8-4ffb-9244-c77a25179aeb (code: ZIG-KBG-7334) | En attente de nettoyage final |
| 2026-10-19T01:07:34.079Z | Adresse | 02aeb6aa-5d4a-4e35-9868-834759f8eb16 (code: ZIG-ESC-1390) | En attente de nettoyage final |
| 2026-10-19T01:07:34.724Z | Adresse | db0f5003-a07a-4086-9799-6928ddb0329a (code: ZIG-KND-3100) | En attente de nettoyage final |
| 2026-10-19T01:07:35.517Z | Adresse | 95580b8c-9462-4bd1-be7d-ae1d7f83367a (code: ZIG-NEM-4495) | En attente de nettoyage final |
| 2026-10-19T01:07:36.336Z | Adresse | fad7bc54-5e5b-47ea-b721-b552d05c4c32 (code: ZIG-ESC-6548) | En attente de nettoyage final |
| 2026-10-19T01:07:37.048Z | Adresse | 9df12359-1359-4069-a9c7-a035af8522cd (code: ZIG-KND-5750) | En attente de nettoyage final |
| 2026-10-19T01:07:37.883Z | Adresse | 5dc46bc5-1868-4e54-a2a7-2438b7ebf40c (code: DKR-MED-9551) | En attente de nettoyage final |
| 2026-10-19T01:07:38.603Z | Adresse | 4de5e766-ef84-4346-8dcb-a366bf859104 (code: SL-NDR-4605) | En attente de nettoyage final |
| 2026-10-19T01:07:40.432Z | Adresse | 0b1c71cf-8fe5-43f4-baa2-e1f165539242 (code: ZIG-KBG-6678) | En attente de nettoyage final |
| 2026-10-19T01:07:49.033Z | Adresse | 38b16b5e-7846-4052-9a5e-ba2dc865ab6c (code: ZIG-KBG-5529) | En attente de nettoyage final |
| 2026-10-19T01:07:49.950Z | Adresse | ec144288-69cf-4ec1-b38c-88fdcf6a6299 (code: ZIG-KBG-5112) | En attente de nettoyage final |
| 2026-10-19T01:07:50.727Z | Adresse | 63dfd206-c08e-4107-bda4-a19c3ff3d22d (code: ZIG-KBG-9038) | En attente de nettoyage final |
| 2026-10-19T01:07:51.861Z | Adresse | 2fffa61c-700e-4099-a6a9-506686771481 (code: ZIG-KBG-6501) | En attente de nettoyage final |
| 2026-10-19T01:07:52.613Z | Adresse | eb81e01e-803d-4134-a921-8ce0c03a7ee4 (code: ZIG-KBG-7881) | En attente de nettoyage final |
| 2026-10-19T01:07:53.234Z | Adresse | 517223fd-e074-4cf7-896b-e8aa553fe7f9 (code: ZIG-KBG-5642) | En attente de nettoyage final |
| 2026-10-19T01:07:53.949Z | Adresse | cd94b22b-66b3-46f4-8946-be7f3d155779 (code: ZIG-KBG-8140) | En attente de nettoyage final |
| 2026-10-19T01:07:56.815Z | Adresse | 7d74b301-afca-430f-99d8-83003e10eade (code: ZIG-KBG-4733) | En attente de nettoyage final |
| 2026-10-19T01:07:58.141Z | Adresse | 2fb8ce71-68f7-421c-926a-0482163cb91c (code: ZIG-KBG-9870) | En attente de nettoyage final |
| 2026-10-19T01:07:58.752Z | Adresse | 74551797-9887-421f-8985-d6151e89b198 (code: ZIG-KBG-6880) | En attente de nettoyage final |
| 2026-10-19T01:07:59.478Z | Adresse | a5ed6026-1ed6-47ad-80bf-5a4a1a359834 (code: ZIG-KBG-8333) | En attente de nettoyage final |
| 2026-10-19T01:11:09.022Z | Compte | test+offline_1792372265314@example.com | En attente de nettoyage final |
| 2026-10-19T01:13:41.378Z | Compte | test+offline_1792372416618@example.com | En attente de nettoyage final |
| 2026-10-19T01:15:08.199Z | Compte | test+offline_1792372504763@example.com | En attente de nettoyage final |
| 2026-10-19T01:17:29.581Z | Compte | test+offline_1792372646879@example.com | En attente de nettoyage final |
| 2026-10-19T01:19:50.652Z | Compte | test+offline_1792372786650@example.com | En attente de nettoyage final |
| 2026-10-19T01:21:50.280Z | Compte | test+offline_1792372907444@example.com | En attente de nettoyage final |
| 2026-10-19T01:25:44.693Z | Compte | test+userA_1792373141891@example.com | En attente de nettoyage final |
| 2026-10-19T01:25:46.892Z | Compte | test+userB_victim_1792373141891@example.com | En attente de nettoyage final |
| 2026-10-19T01:25:52.524Z | Adresse | 2498b339-b9ae-4a1c-adab-06048a9476ee (code: ZIG-KBG-5275) | En attente de nettoyage final |
| 2026-10-19T01:26:18.842Z | Adresse | c195f52a-3eb4-48fa-a996-d6e5cf673212 (code: ZIG-KBG-8223) | En attente de nettoyage final |

- Compte test SMS A : `test+sms_1792373535211@example.com`
- Compte test SMS B : `test+sms_b_1792373535211@example.com` (Adresse: `undefined`)
- Compte test SMS C : `test+sms_c_1792373535211@example.com`
- Compte test SMS A : `test+sms_1792373574542@example.com`
- Compte test SMS B : `test+sms_b_1792373574542@example.com` (Adresse: `undefined`)
- Compte test SMS C : `test+sms_c_1792373574542@example.com`
- Compte test SMS A : `test+sms_a_1792373788732@example.com`
- Compte test SMS B : `test+sms_b_1792373788732@example.com` (Adresse: `undefined`)
- Compte test SMS C : `test+sms_c_1792373788732@example.com`
- Adresse créée pour test SMS : `ZIG-KBG-3010` (par compte `test+b1792373843187@example.com`)
- Compte test modération H2 : `test+h2_1792374032359@example.com` (Adresse: `ZIG-KBG-9309`, ID: `ffad5fe7-e633-4e87-8cf9-16dac67730a0`)
- Adresse créée par Newman Parcours démo (I6) : `ZIG-KND-6422` (par compte demo)

---

## 3. Procédure et Script de Purge Automatisé (Lot 12)

Le script automatisé [`scripts/purge-test-data.py`](../../scripts/purge-test-data.py) a été implémenté pour exécuter la purge sélective des entités de test dans le strict respect de la règle R5.

### Commandes d'exécution :
- **En local / Docker :**
  ```bash
  python3 scripts/purge-test-data.py
  ```
- **Sur Neon / Production Render :**
  ```bash
  DATABASE_URL="postgres://user:password@ep-xxx.eu-central-1.aws.neon.tech/samaadresse?sslmode=require" python3 scripts/purge-test-data.py
  ```

### Périmètre de suppression garanti :
1. Suppression des signalements (`address_reports`) ciblant des adresses créées par des comptes `test+%` ou `TEST-%`.
2. Suppression des codes réservés (`reserved_codes`) des comptes de test.
3. Suppression des adresses (`addresses`) associées aux comptes de test.
4. Suppression des jetons de rafraîchissement (`refresh_tokens`) des comptes de test.
5. Suppression des utilisateurs (`users`) dont l'e-mail correspond à `test+%` ou `TEST-%`.
6. **Préservation absolue :** Comptes et adresses de démonstration (`demo@samaadresse.sn`, `admin@samaadresse.sn`, `ZIG-KBG-4271`, `ZIG-ESC-1042`, etc.) strictement préservés.