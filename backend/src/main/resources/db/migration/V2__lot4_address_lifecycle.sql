-- Migration Lot 4 : Cycle de vie des adresses, signalements anonymes et journal d'audit admin
-- Compatible PostgreSQL 16 (complète le schéma géré par Hibernate JPA)

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS suspended_reason VARCHAR(500);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_status_check;
ALTER TABLE addresses ADD CONSTRAINT addresses_status_check
    CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED', 'SIGNALED'));

CREATE TABLE IF NOT EXISTS address_reports (
    id UUID PRIMARY KEY,
    address_id UUID NOT NULL REFERENCES addresses(id),
    reason VARCHAR(40) NOT NULL CHECK (reason IN ('POSITION_INCORRECTE', 'CONTENU_INAPPROPRIE', 'PHOTO_INAPPROPRIEE', 'AUTRE')),
    comment VARCHAR(300),
    ip_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_address ON address_reports(address_id);
CREATE INDEX IF NOT EXISTS idx_report_status ON address_reports(status);
CREATE INDEX IF NOT EXISTS idx_report_created_at ON address_reports(created_at);

CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY,
    admin_id UUID,
    admin_email VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL,
    address_id UUID NOT NULL,
    address_code VARCHAR(20) NOT NULL,
    report_id UUID,
    reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_action_address ON admin_actions(address_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_created_at ON admin_actions(created_at);
