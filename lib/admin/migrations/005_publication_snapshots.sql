-- Separate public representation from mutable working rows. Historical approval
-- cannot be reconstructed: retain precisely the currently PUBLISHED legacy row.
CREATE TABLE IF NOT EXISTS publication_snapshots (
 entity_type TEXT NOT NULL CHECK(entity_type IN ('experience','education_records','certifications','products','releases','timeline_events')),
 entity_id TEXT NOT NULL,
 payload TEXT NOT NULL,
 published_at TEXT NOT NULL,
 published_by TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 PRIMARY KEY(entity_type,entity_id)
);
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'experience',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM experience t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'education_records',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM education_records t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'certifications',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM certifications t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'products',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM products t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'releases',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM releases t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by)
SELECT 'timeline_events',id,row_to_json(t)::text,COALESCE(published_at,updated_at),updated_by FROM timeline_events t WHERE status='PUBLISHED' AND deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM admin_schema_migrations WHERE version='005_publication_snapshots')
ON CONFLICT DO NOTHING;
