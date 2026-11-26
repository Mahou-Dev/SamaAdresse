-- ==============================================================================
-- scripts/purge-test-data.sql
-- Purge ciblée et sécurisée des comptes et adresses de test (SamaAdresse)
-- RÈGLE ABSOLUE : Exclut strictement les 3 comptes et les 13 adresses d'origine.
-- ==============================================================================

\set ON_ERROR_STOP on

-- 1. ÉTAT AVANT PURGE (SELECT pré-purge)
\echo '=== [PRÉ-PURGE] INVENTAIRE DES COMPTES DE TEST CIBLÉS ==='
SELECT u.id, u.email, u.full_name, COUNT(a.id) AS nb_adresses
FROM users u
LEFT JOIN addresses a ON a.owner_id = u.id
WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
  AND u.email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
GROUP BY u.id, u.email, u.full_name
ORDER BY u.email;

\echo '=== [PRÉ-PURGE] INVENTAIRE DES ADRESSES DE TEST CIBLÉES ==='
SELECT a.id, a.code, a.zone, a.quartier, a.status, u.email AS proprietaire
FROM addresses a
JOIN users u ON a.owner_id = u.id
WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
  AND u.email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
  AND a.code NOT IN (
    'ZIG-KBG-4271', 'ZIG-ESC-1042', 'ZIG-TIL-3015', 'ZIG-KND-5012', 'ZIG-NEM-6021',
    'ZIG-KBG-4272', 'ZIG-ESC-1088', 'ZIG-TIL-3040', 'ZIG-KND-5080', 'ZIG-NEM-6055',
    'ZIG-KBG-4300', 'ZIG-TIL-3099', 'ZIG-KND-8319'
  )
ORDER BY a.code;

\echo '=== [PRÉ-PURGE] VÉRIFICATION DES DONNÉES PROTÉGÉES (NE DOIVENT PAS BOUGER) ==='
SELECT
  (SELECT COUNT(*) FROM users WHERE email IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')) AS comptes_proteges_presents,
  (SELECT COUNT(*) FROM addresses WHERE code IN (
    'ZIG-KBG-4271', 'ZIG-ESC-1042', 'ZIG-TIL-3015', 'ZIG-KND-5012', 'ZIG-NEM-6021',
    'ZIG-KBG-4272', 'ZIG-ESC-1088', 'ZIG-TIL-3040', 'ZIG-KND-5080', 'ZIG-NEM-6055',
    'ZIG-KBG-4300', 'ZIG-TIL-3099', 'ZIG-KND-8319'
  )) AS adresses_protegees_presentes;

-- 2. SUPPRESSIONS EN CASCADE DANS UNE TRANSACTION UNIQUE
BEGIN;

-- 2a. Signalements associés aux adresses de test ciblées
DELETE FROM address_reports
WHERE address_id IN (
    SELECT a.id FROM addresses a
    JOIN users u ON a.owner_id = u.id
    WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
      AND u.email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
      AND a.code NOT IN (
        'ZIG-KBG-4271', 'ZIG-ESC-1042', 'ZIG-TIL-3015', 'ZIG-KND-5012', 'ZIG-NEM-6021',
        'ZIG-KBG-4272', 'ZIG-ESC-1088', 'ZIG-TIL-3040', 'ZIG-KND-5080', 'ZIG-NEM-6055',
        'ZIG-KBG-4300', 'ZIG-TIL-3099', 'ZIG-KND-8319'
      )
);

-- 2b. Adresses créées par les utilisateurs de test ciblés
DELETE FROM addresses
WHERE owner_id IN (
    SELECT id FROM users
    WHERE (email LIKE 'test+%' OR email LIKE '%@example.com' OR email LIKE 'test-%')
      AND email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
)
AND code NOT IN (
    'ZIG-KBG-4271', 'ZIG-ESC-1042', 'ZIG-TIL-3015', 'ZIG-KND-5012', 'ZIG-NEM-6021',
    'ZIG-KBG-4272', 'ZIG-ESC-1088', 'ZIG-TIL-3040', 'ZIG-KND-5080', 'ZIG-NEM-6055',
    'ZIG-KBG-4300', 'ZIG-TIL-3099', 'ZIG-KND-8319'
);

-- 2c. Codes réservés par les comptes de test ciblés
DELETE FROM reserved_codes
WHERE user_id IN (
    SELECT id FROM users
    WHERE (email LIKE 'test+%' OR email LIKE '%@example.com' OR email LIKE 'test-%')
      AND email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
);

-- 2d. Jetons de rafraîchissement des comptes de test ciblés
DELETE FROM refresh_tokens
WHERE user_id IN (
    SELECT id FROM users
    WHERE (email LIKE 'test+%' OR email LIKE '%@example.com' OR email LIKE 'test-%')
      AND email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')
);

-- 2e. Comptes utilisateurs de test ciblés
DELETE FROM users
WHERE (email LIKE 'test+%' OR email LIKE '%@example.com' OR email LIKE 'test-%')
  AND email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn');

COMMIT;

-- 3. ÉTAT APRÈS PURGE (SELECT post-purge de contrôle)
\echo '=== [POST-PURGE] CONTRÔLE DES COMPTES DE TEST RESTANTS (DOIT ÊTRE 0) ==='
SELECT u.id, u.email, u.full_name
FROM users u
WHERE (u.email LIKE 'test+%' OR u.email LIKE '%@example.com' OR u.email LIKE 'test-%')
  AND u.email NOT IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn');

\echo '=== [POST-PURGE] VÉRIFICATION DE LA CONSERVATION DES DONNÉES PROTÉGÉES ==='
SELECT
  (SELECT COUNT(*) FROM users WHERE email IN ('admin@samaadresse.sn', 'demo@samaadresse.sn', 'fatou@samaadresse.sn')) AS comptes_proteges_conserves,
  (SELECT COUNT(*) FROM addresses WHERE code IN (
    'ZIG-KBG-4271', 'ZIG-ESC-1042', 'ZIG-TIL-3015', 'ZIG-KND-5012', 'ZIG-NEM-6021',
    'ZIG-KBG-4272', 'ZIG-ESC-1088', 'ZIG-TIL-3040', 'ZIG-KND-5080', 'ZIG-NEM-6055',
    'ZIG-KBG-4300', 'ZIG-TIL-3099', 'ZIG-KND-8319'
  )) AS adresses_protegees_conservees;
