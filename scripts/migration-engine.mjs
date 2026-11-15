import { createHash } from 'node:crypto';
export async function migrate(store, migrations) {
  const applied = [], skipped = [];
  for (const {version, sql} of migrations) {
    await store.transaction(async query => {
      await query('CREATE TABLE IF NOT EXISTS admin_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
      await query('LOCK TABLE admin_schema_migrations IN EXCLUSIVE MODE');
      await query('ALTER TABLE admin_schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const rows = await query('SELECT checksum FROM admin_schema_migrations WHERE version=$1', [version]);
      if (rows.length) {
        if (rows[0].checksum && rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${version}`);
        // Legacy ledger entries are trusted, never replayed; pin their current source checksum.
        if (!rows[0].checksum) await query('UPDATE admin_schema_migrations SET checksum=$1 WHERE version=$2', [checksum, version]);
        skipped.push(version); return;
      }
      // Existing files use simple semicolon-delimited SQL. No procedural SQL is supported.
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await query(statement);
      await query('INSERT INTO admin_schema_migrations(version,checksum) VALUES($1,$2)', [version,checksum]);
      applied.push(version);
    });
  }
  return {applied, skipped};
}
