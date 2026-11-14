ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK(status IN ('DRAFT','CONCEPT','DEVELOPMENT','BETA','PUBLISHED','RELEASED','PAUSED','ARCHIVED'));
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'DRAFT';
CREATE INDEX IF NOT EXISTS products_public ON products(status,visibility,deleted_at,slug);
