#!/usr/bin/env bash
set -e

echo "=== Réinitialisation de la base de démonstration SamaAdresse ==="

# 1. Troncature des tables dans la base dev PostgreSQL
docker exec -i samaadresse-postgres psql -U samaadresse -d samaadresse -c "TRUNCATE TABLE address_reports, admin_actions, refresh_tokens, addresses, users CASCADE;"

echo "Tables vidées dans samaadresse."

# 2. Troncature dans la base e2e également si elle existe
docker exec -i samaadresse-postgres psql -U samaadresse -d samaadresse_e2e -c "TRUNCATE TABLE address_reports, admin_actions, refresh_tokens, addresses, users CASCADE;" 2>/dev/null || true

# 3. Assurer l'existence des colonnes Lot 6 (listed, show_owner_name, search_text)
docker exec -i samaadresse-postgres psql -U samaadresse -d samaadresse << 'EOF'
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS listed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS show_owner_name BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS search_text VARCHAR(1000);
EOF

# 4. Insertion SQL directe du jeu de démonstration complet (1 admin, 2 utilisateurs, 12 adresses Ziguinchor)
docker exec -i samaadresse-postgres psql -U samaadresse -d samaadresse << 'EOF'
-- Mot de passe commun : Password123! ($2a$12$fuOBWMhTZdUVa9e1NAr3Xevsiew9AatBV/ppG2RDq/RgspRuHLtEC)
INSERT INTO users (id, email, full_name, phone_number, password_hash, role, enabled, created_at, updated_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@samaadresse.sn', 'Admin SamaAdresse', '+221770000000', '$2a$12$fuOBWMhTZdUVa9e1NAr3Xevsiew9AatBV/ppG2RDq/RgspRuHLtEC', 'ADMIN', true, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'demo@samaadresse.sn', 'Mamadou Diallo', '+221771234567', '$2a$12$fuOBWMhTZdUVa9e1NAr3Xevsiew9AatBV/ppG2RDq/RgspRuHLtEC', 'PROPRIETAIRE', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'fatou@samaadresse.sn', 'Fatou Ndiaye', '+221772345678', '$2a$12$fuOBWMhTZdUVa9e1NAr3Xevsiew9AatBV/ppG2RDq/RgspRuHLtEC', 'PROPRIETAIRE', true, NOW(), NOW());

INSERT INTO addresses (id, code, latitude, longitude, zone, quartier, description, photo_url, location_type, status, listed, show_owner_name, search_text, owner_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'ZIG-KBG-4271', 12.5738, -16.2650, 'ZIG', 'KBG', 'Maison familiale au portail vert face a la grande mosquee', '/uploads/demo-facade-1.jpg', 'MAISON', 'ACTIVE', true, true, 'maison familiale au portail vert face a la grande mosquee kbg mamadou diallo', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-ESC-1042', 12.5852, -16.2684, 'ZIG', 'ESC', 'Pharmacie de l''Escale et cabinet de soins', '/uploads/demo-facade-2.jpg', 'COMMERCE', 'ACTIVE', true, false, 'pharmacie de l''escale et cabinet de soins esc', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3015', 12.5654, -16.2948, 'ZIG', 'TIL', 'Boutique d''alimentation generale et depot de gaz', '/uploads/demo-facade-3.jpg', 'COMMERCE', 'ACTIVE', false, false, 'boutique d''alimentation generale et depot de gaz til', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KND-5012', 12.5542, -16.2731, 'ZIG', 'KND', 'Grande concession familiale avec manguier dans la cour', null, 'MAISON', 'ACTIVE', false, false, 'grande concession familiale avec manguier dans la cour knd', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-NEM-6021', 12.5583, -16.2455, 'ZIG', 'NEM', 'Poste de sante communautaire de Nema Kadialang', null, 'INSTITUTION', 'ACTIVE', false, false, 'poste de sante communautaire de nema kadialang nem', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KBG-4272', 12.5715, -16.2680, 'ZIG', 'KBG', 'Atelier de menuiserie metallique et ferronnerie', null, 'COMMERCE', 'ACTIVE', false, false, 'atelier de menuiserie metallique et ferronnerie kbg', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-ESC-1088', 12.5880, -16.2645, 'ZIG', 'ESC', 'Residence fleurie pres du debarcadere', null, 'MAISON', 'ACTIVE', false, false, 'residence fleurie pres du debarcadere esc', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3040', 12.5620, -16.2980, 'ZIG', 'TIL', 'Maison familiale avec veranda bleue', null, 'MAISON', 'ACTIVE', false, false, 'maison familiale avec veranda bleue til', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KND-5080', 12.5480, -16.2800, 'ZIG', 'KND', 'Quincaillerie generale et materiaux de construction', null, 'COMMERCE', 'ACTIVE', false, false, 'quincaillerie generale et materiaux de construction knd', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-NEM-6055', 12.5510, -16.2520, 'ZIG', 'NEM', 'Concession avec puits et portail en fer forge', null, 'MAISON', 'ACTIVE', false, false, 'concession avec puits et portail en fer forge nem', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KBG-4300', 12.5780, -16.2620, 'ZIG', 'KBG', 'Ecole elementaire publique de Boucotte', null, 'INSTITUTION', 'ACTIVE', false, false, 'ecole elementaire publique de boucotte kbg', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3099', 12.5690, -16.2890, 'ZIG', 'TIL', 'Maison a etage crepie ocre face au grand baobab', null, 'MAISON', 'ACTIVE', false, false, 'maison a etage crepie ocre face au grand baobab til', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW());
EOF

echo "Jeu de données de démonstration réinitialisé avec succès (1 admin, 2 utilisateurs, 12 adresses Ziguinchor)."
