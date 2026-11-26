#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_PASS="${DEMO_PASSWORD:-$(python3 -c "
import os
if os.path.exists('$ROOT_DIR/.env'):
    for line in open('$ROOT_DIR/.env'):
        line = line.strip()
        if line.startswith('DEMO_PASSWORD='):
            print(line.split('=', 1)[1].strip())
            break
")}"
if [ -z "$DEMO_PASS" ]; then
  echo "ERREUR : DEMO_PASSWORD doit être défini dans .env ou l'environnement." >&2
  exit 1
fi

echo "=== Réinitialisation de la base de démonstration SamaAdresse ==="

reset_database() {
  local CONTAINER="$1"
  local DB_USER="$2"
  local DB_NAME="$3"
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    return 0
  fi
  echo "--- Configuration et réinitialisation de $DB_NAME ($CONTAINER) ---"
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v demo_pass="$DEMO_PASS" << 'EOF'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reserved_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  zone VARCHAR(10) NOT NULL,
  quartier VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  address_id UUID
);
CREATE TABLE IF NOT EXISTS photo_blobs (
  id UUID PRIMARY KEY,
  data BYTEA NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS listed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS show_owner_name BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS search_text VARCHAR(1000);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS client_request_id UUID;
TRUNCATE TABLE reserved_codes, address_reports, admin_actions, refresh_tokens, addresses, users CASCADE;
DELETE FROM photo_blobs WHERE id NOT IN (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004'
);

INSERT INTO users (id, email, full_name, phone_number, password_hash, role, enabled, created_at, updated_at)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@samaadresse.sn', 'Admin SamaAdresse', '+221770000000', crypt(:'demo_pass', gen_salt('bf', 12)), 'ADMIN', true, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'demo@samaadresse.sn', 'Mamadou Diallo', '+221771234567', crypt(:'demo_pass', gen_salt('bf', 12)), 'PROPRIETAIRE', true, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000003', 'fatou@samaadresse.sn', 'Fatou Ndiaye', '+221772345678', crypt(:'demo_pass', gen_salt('bf', 12)), 'PROPRIETAIRE', true, NOW(), NOW());

INSERT INTO addresses (id, code, latitude, longitude, zone, quartier, description, photo_url, location_type, status, listed, show_owner_name, search_text, owner_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'ZIG-KBG-4271', 12.5738, -16.2650, 'ZIG', 'KBG', 'Maison familiale au portail vert face a la grande mosquee', '/uploads/00000000-0000-4000-8000-000000000001.jpg', 'MAISON', 'ACTIVE', true, true, 'maison familiale au portail vert face a la grande mosquee kbg mamadou diallo', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-ESC-1042', 12.5852, -16.2684, 'ZIG', 'ESC', 'Pharmacie de l''Escale et cabinet de soins', '/uploads/00000000-0000-4000-8000-000000000002.jpg', 'COMMERCE', 'ACTIVE', true, false, 'pharmacie de l''escale et cabinet de soins esc', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3015', 12.5654, -16.2948, 'ZIG', 'TIL', 'Boutique d''alimentation generale et depot de gaz', '/uploads/00000000-0000-4000-8000-000000000003.jpg', 'COMMERCE', 'ACTIVE', false, false, 'boutique d''alimentation generale et depot de gaz til', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KND-5012', 12.5542, -16.2731, 'ZIG', 'KND', 'Grande concession familiale avec manguier dans la cour', null, 'MAISON', 'ACTIVE', false, false, 'grande concession familiale avec manguier dans la cour knd', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-NEM-6021', 12.5583, -16.2455, 'ZIG', 'NEM', 'Poste de sante communautaire de Nema Kadialang', null, 'INSTITUTION', 'ACTIVE', false, false, 'poste de sante communautaire de nema kadialang nem', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KBG-4272', 12.5715, -16.2680, 'ZIG', 'KBG', 'Atelier de menuiserie metallique et ferronnerie', '/uploads/00000000-0000-4000-8000-000000000004.jpg', 'COMMERCE', 'ACTIVE', true, false, 'atelier de menuiserie metallique et ferronnerie kbg', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-ESC-1088', 12.5880, -16.2645, 'ZIG', 'ESC', 'Residence fleurie pres du debarcadere', null, 'MAISON', 'ACTIVE', false, false, 'residence fleurie pres du debarcadere esc', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3040', 12.5620, -16.2980, 'ZIG', 'TIL', 'Maison familiale avec veranda bleue', '/uploads/00000000-0000-4000-8000-000000000003.jpg', 'MAISON', 'ACTIVE', true, false, 'maison familiale avec veranda bleue til', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KND-5080', 12.5480, -16.2800, 'ZIG', 'KND', 'Quincaillerie generale et materiaux de construction', null, 'COMMERCE', 'ACTIVE', false, false, 'quincaillerie generale et materiaux de construction knd', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-NEM-6055', 12.5510, -16.2520, 'ZIG', 'NEM', 'Concession avec puits et portail en fer forge', null, 'MAISON', 'ACTIVE', false, false, 'concession avec puits et portail en fer forge nem', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-KBG-4300', 12.5780, -16.2620, 'ZIG', 'KBG', 'Ecole elementaire publique de Boucotte', null, 'INSTITUTION', 'ACTIVE', false, false, 'ecole elementaire publique de boucotte kbg', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW()),
  (gen_random_uuid(), 'ZIG-TIL-3099', 12.5690, -16.2890, 'ZIG', 'TIL', 'Maison a etage crepie ocre face au grand baobab', null, 'MAISON', 'ACTIVE', false, false, 'maison a etage crepie ocre face au grand baobab til', 'c0000000-0000-0000-0000-000000000003', NOW(), NOW());
EOF
}

reset_database "samaadresse-postgres" "samaadresse" "samaadresse"
reset_database "samaadresse-postgres" "samaadresse" "samaadresse_e2e"
reset_database "samaadresse-prod-test-db" "samaadresse_prod_user" "samaadresse_prod"

# Réinitialisation des limiteurs de débit mémoire dans le backend si actif
for PORT_CHECK in 8080; do
  ADMIN_TOKEN=$(curl -s -X POST "http://127.0.0.1:${PORT_CHECK}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@samaadresse.sn\",\"password\":\"$DEMO_PASS\"}" 2>/dev/null | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4 || true)

  if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
    curl -s -X POST "http://127.0.0.1:${PORT_CHECK}/api/admin/reset-rate-limits" \
      -H "Authorization: Bearer $ADMIN_TOKEN" >/dev/null 2>&1 || true
    echo "Limiteurs de débit du backend réinitialisés sur le port ${PORT_CHECK}."
  fi
done

if docker ps --format '{{.Names}}' | grep -qx "samaadresse-prod-test-app"; then
  docker restart samaadresse-prod-test-app >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do
    if curl -sf "http://127.0.0.1:8082/api/health" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
  echo "Conteneur de production samaadresse-prod-test-app redémarré (limiteurs en mémoire réinitialisés)."
fi

for dir in "$ROOT_DIR/uploads" "$ROOT_DIR/uploads-e2e" "$ROOT_DIR/backend/uploads" "$ROOT_DIR/backend/uploads-e2e"; do
  mkdir -p "$dir"
  cp -f "$ROOT_DIR/backend/src/main/resources/demo-photos/demo-facade-1.jpg" "$dir/00000000-0000-4000-8000-000000000001.jpg" 2>/dev/null || true
  cp -f "$ROOT_DIR/backend/src/main/resources/demo-photos/demo-facade-2.jpg" "$dir/00000000-0000-4000-8000-000000000002.jpg" 2>/dev/null || true
  cp -f "$ROOT_DIR/backend/src/main/resources/demo-photos/demo-facade-3.jpg" "$dir/00000000-0000-4000-8000-000000000003.jpg" 2>/dev/null || true
  cp -f "$ROOT_DIR/backend/src/main/resources/demo-photos"/demo-facade-*.jpg "$dir/" 2>/dev/null || true
done

echo "Jeu de données de démonstration réinitialisé avec succès (1 admin, 2 utilisateurs, 12 adresses Ziguinchor)."
