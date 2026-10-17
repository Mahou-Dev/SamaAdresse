-- =============================================================================
-- V2__photo_blobs.sql — Stockage en base des photos de façade (STORAGE_TYPE=db)
-- =============================================================================

CREATE TABLE IF NOT EXISTS photo_blobs (
    id uuid NOT NULL PRIMARY KEY,
    data bytea NOT NULL,
    content_type character varying(50) NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL
);
