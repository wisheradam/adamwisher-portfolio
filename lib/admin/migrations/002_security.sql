CREATE TABLE IF NOT EXISTS admin_users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','EDITOR','READ_ONLY')),
 active BOOLEAN NOT NULL DEFAULT TRUE, session_version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS admin_users_role_active ON admin_users(role,active);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
 session_version INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_user ON admin_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS admin_login_limits (
 key_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
 window_start TEXT NOT NULL, blocked_until TEXT
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_at TEXT;
