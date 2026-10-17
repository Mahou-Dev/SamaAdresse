-- =============================================================================
-- V1__init.sql — Schéma initial SamaAdresse (généré depuis pg_dump --schema-only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(255) NOT NULL UNIQUE,
    enabled boolean NOT NULL,
    full_name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'PROPRIETAIRE'))
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users (email);

CREATE TABLE IF NOT EXISTS addresses (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) with time zone NOT NULL,
    owner_id uuid NOT NULL REFERENCES users(id),
    code character varying(20) NOT NULL UNIQUE,
    description character varying(500),
    latitude double precision NOT NULL,
    location_type character varying(30) NOT NULL,
    longitude double precision NOT NULL,
    photo_url character varying(255),
    quartier character varying(20) NOT NULL,
    status character varying(30) NOT NULL,
    updated_at timestamp(6) with time zone,
    zone character varying(20) NOT NULL,
    archived_at timestamp(6) with time zone,
    suspended_at timestamp(6) with time zone,
    suspended_reason character varying(500),
    listed boolean DEFAULT false NOT NULL,
    show_owner_name boolean DEFAULT false NOT NULL,
    search_text character varying(1000),
    client_request_id uuid,
    CONSTRAINT addresses_location_type_check CHECK (location_type IN ('MAISON', 'COMMERCE', 'INSTITUTION')),
    CONSTRAINT addresses_status_check CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED', 'SIGNALED'))
);

CREATE INDEX IF NOT EXISTS idx_address_owner ON addresses (owner_id);
CREATE INDEX IF NOT EXISTS idx_address_status ON addresses (status);
CREATE INDEX IF NOT EXISTS idx_address_directory ON addresses (status, listed);
CREATE INDEX IF NOT EXISTS idx_address_client_request ON addresses (owner_id, client_request_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) with time zone NOT NULL,
    expiry_date timestamp(6) with time zone NOT NULL,
    revoked boolean NOT NULL,
    token_hash character varying(255) NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_tokens (token_hash);

CREATE TABLE IF NOT EXISTS address_reports (
    id uuid NOT NULL PRIMARY KEY,
    comment character varying(300),
    created_at timestamp(6) with time zone NOT NULL,
    ip_hash character varying(64) NOT NULL,
    reason character varying(40) NOT NULL,
    resolved_at timestamp(6) with time zone,
    status character varying(20) NOT NULL,
    address_id uuid NOT NULL REFERENCES addresses(id),
    CONSTRAINT address_reports_reason_check CHECK (reason IN ('POSITION_INCORRECTE', 'CONTENU_INAPPROPRIE', 'PHOTO_INAPPROPRIEE', 'AUTRE')),
    CONSTRAINT address_reports_status_check CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED'))
);

CREATE INDEX IF NOT EXISTS idx_report_address ON address_reports (address_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON address_reports (status);
CREATE INDEX IF NOT EXISTS idx_report_created_at ON address_reports (created_at);

CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid NOT NULL PRIMARY KEY,
    action character varying(50) NOT NULL,
    address_code character varying(20) NOT NULL,
    address_id uuid NOT NULL,
    admin_email character varying(150) NOT NULL,
    admin_id uuid,
    created_at timestamp(6) with time zone NOT NULL,
    reason character varying(500),
    report_id uuid
);

CREATE INDEX IF NOT EXISTS idx_admin_action_address ON admin_actions (address_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_created_at ON admin_actions (created_at);

CREATE TABLE IF NOT EXISTS reserved_codes (
    id uuid NOT NULL PRIMARY KEY,
    code character varying(20) NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES users(id),
    zone character varying(10) NOT NULL,
    quartier character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'RESERVED' NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    address_id uuid,
    CONSTRAINT reserved_codes_status_check CHECK (status IN ('RESERVED', 'USED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_reserved_codes_user_status ON reserved_codes (user_id, status);
CREATE INDEX IF NOT EXISTS idx_reserved_codes_user_zq ON reserved_codes (user_id, zone, quartier, status);
