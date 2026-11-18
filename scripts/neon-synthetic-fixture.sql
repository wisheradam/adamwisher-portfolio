-- Seed only a freshly migrated, dedicated synthetic source. No valid login secrets.
BEGIN;
DO $fixture$
BEGIN
  IF current_database() <> 'recovery_synthetic_source_pr14_7955d1df'
     OR (SELECT count(*) FROM public.admin_schema_migrations) <> 5 THEN
    RAISE EXCEPTION 'Dedicated migrated synthetic source required';
  END IF;
END
$fixture$;

-- Normalize the timestamps produced by the migration runner for reproducible fixtures.
UPDATE public.admin_schema_migrations SET applied_at = '2026-01-01T00:00:00Z';
INSERT INTO public.experience(id,company,title,status,visibility,created_at,updated_at,updated_by)
VALUES ('synthetic','Synthetic','Draft v2','DRAFT','PUBLIC','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z','fixture');
INSERT INTO public.publication_snapshots(entity_type,entity_id,payload,revision,published_at,published_by)
VALUES ('experience','synthetic','{"title":"Public v1"}',1,'2026-01-01T00:00:00Z','fixture');
INSERT INTO public.admin_users(id,email,password_hash,role,created_at,updated_at)
VALUES ('synthetic','synthetic@example.test','synthetic-not-a-real-password','READ_ONLY','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO public.admin_sessions(token_hash,user_id,session_version,expires_at,created_at)
VALUES ('synthetic-not-real','synthetic',1,'2027-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO public.audit_events(id,actor_id,action,entity_type,entity_id,created_at)
VALUES ('synthetic','fixture','PUBLISHED','experience','synthetic','2026-01-01T00:00:00Z');
COMMIT;
