CREATE TABLE IF NOT EXISTS admin_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 featured INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0,
 seo_title TEXT, seo_description TEXT, published_at TEXT, deleted_at TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS projects_listing ON projects(status,visibility,deleted_at,sort_order);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('MOBILE_APP','WEB_APP','AI_TOOL','INTERNAL_TOOL','SAAS','PROTOTYPE','EXPERIMENT')),
 summary TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'CONCEPT' CHECK(status IN ('CONCEPT','DEVELOPMENT','BETA','RELEASED','PAUSED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 version TEXT, website_url TEXT, github_url TEXT, featured INTEGER NOT NULL DEFAULT 0,
 deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS products_listing ON products(status,visibility,deleted_at,updated_at);
CREATE TABLE IF NOT EXISTS audit_events (
 id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL,
 entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
 before_state TEXT, after_state TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_recent ON audit_events(created_at DESC);
