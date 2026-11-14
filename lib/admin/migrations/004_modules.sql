CREATE TABLE IF NOT EXISTS media_assets (
 id TEXT PRIMARY KEY,storage_key TEXT NOT NULL UNIQUE,original_filename TEXT NOT NULL,display_name TEXT NOT NULL,
 mime_type TEXT NOT NULL,file_size INTEGER NOT NULL CHECK(file_size>0),width INTEGER,height INTEGER,
 alt_text TEXT NOT NULL DEFAULT '',caption TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 uploaded_by TEXT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS media_assets_recent ON media_assets(deleted_at,created_at DESC);
CREATE TABLE IF NOT EXISTS experience (
 id TEXT PRIMARY KEY,company TEXT NOT NULL,title TEXT NOT NULL,location TEXT,employment_type TEXT,
 start_date TEXT,end_date TEXT,is_current BOOLEAN NOT NULL DEFAULT FALSE,description TEXT,responsibilities TEXT,
 achievements TEXT,technologies TEXT,company_logo_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,
 company_url TEXT,sort_order INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS experience_public ON experience(status,visibility,deleted_at,sort_order);
CREATE TABLE IF NOT EXISTS education_records (
 id TEXT PRIMARY KEY,institution TEXT NOT NULL,program TEXT NOT NULL,degree TEXT,field TEXT,location TEXT,start_date TEXT,end_date TEXT,
 description TEXT,institution_url TEXT,media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,sort_order INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS education_public ON education_records(status,visibility,deleted_at,sort_order);
CREATE TABLE IF NOT EXISTS certifications (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,issuer TEXT NOT NULL,credential_type TEXT,issue_date TEXT,completion_date TEXT,expiration_date TEXT,
 credential_id TEXT,credential_url TEXT,certificate_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,description TEXT,skills TEXT,
 sort_order INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS certifications_public ON certifications(status,visibility,deleted_at,sort_order);
CREATE TABLE IF NOT EXISTS releases (
 id TEXT PRIMARY KEY,product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
 version TEXT NOT NULL,title TEXT NOT NULL,release_date TEXT,platform TEXT,build_number TEXT,notes TEXT,
 media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT,
 CHECK(product_id IS NOT NULL OR project_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS releases_public ON releases(status,visibility,deleted_at,release_date);
CREATE TABLE IF NOT EXISTS timeline_events (
 id TEXT PRIMARY KEY,event_type TEXT NOT NULL CHECK(event_type IN ('CAREER','PROJECT','PRODUCT_RELEASE','EDUCATION','CERTIFICATION','MILESTONE','PUBLICATION','OTHER')),
 title TEXT NOT NULL,description TEXT,event_date TEXT NOT NULL,end_date TEXT,
 project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,
 release_id TEXT REFERENCES releases(id) ON DELETE RESTRICT,media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,
 external_url TEXT,status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PUBLIC','PRIVATE')),
 published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS timeline_public ON timeline_events(status,visibility,deleted_at,event_date);
CREATE TABLE IF NOT EXISTS seo_metadata (
 id TEXT PRIMARY KEY,path TEXT NOT NULL UNIQUE,seo_title TEXT,meta_description TEXT,canonical_url TEXT,
 og_title TEXT,og_description TEXT,og_image_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,
 indexable BOOLEAN NOT NULL DEFAULT TRUE,followable BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS redirects (
 id TEXT PRIMARY KEY,source_path TEXT NOT NULL UNIQUE,destination_path TEXT NOT NULL,
 status_code INTEGER NOT NULL CHECK(status_code IN (301,302)),enabled BOOLEAN NOT NULL DEFAULT FALSE,notes TEXT,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS feature_flags (
 id TEXT PRIMARY KEY,flag_key TEXT NOT NULL UNIQUE,description TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL
);
