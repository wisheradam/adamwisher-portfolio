// Server-side only: also shared by explicit migration/bootstrap CLI commands.
import { Client, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';
neonConfig.webSocketConstructor = WebSocket;

export function databaseMode(env = process.env) {
  const mode = env.ADMIN_DATABASE_DRIVER;
  if (!mode && env.NODE_ENV === 'production') throw new Error('Set ADMIN_DATABASE_DRIVER explicitly in production');
  if (mode && !['pglite', 'aurora-data-api', 'neon'].includes(mode)) throw new Error('Unknown admin database driver');
  return mode || 'pglite';
}
export function neonUrl(env = process.env, direct = false) {
  const raw = direct ? env.ADMIN_DATABASE_DIRECT_URL : env.ADMIN_DATABASE_URL;
  try {
    const url = new URL(raw);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password || !url.pathname.slice(1) || !url.hostname.endsWith('.neon.tech') || url.hash || url.port && url.port !== '5432') throw new Error();
    if (!['require', 'verify-full'].includes(url.searchParams.get('sslmode'))) throw new Error();
    if (direct && url.hostname.includes('-pooler.')) throw new Error();
    return raw;
  } catch { throw new Error(direct ? 'Set a direct Neon ADMIN_DATABASE_DIRECT_URL with TLS' : 'Set a Neon ADMIN_DATABASE_URL with TLS'); }
}
export function createNeonStore({ env = process.env, direct = false, makeClient = config => new Client(config) } = {}) {
  async function connection(fn) {
    const client = makeClient({ connectionString: neonUrl(env, direct), connectionTimeoutMillis: 15000, statement_timeout: 30000, query_timeout: 35000 });
    try { await client.connect(); return await fn(client); }
    finally {
      // A failed WebSocket handshake can leave end() waiting for an event that
      // never arrives. Bound cleanup without retrying an uncertain write.
      let timer;
      try { await Promise.race([client.end().catch(() => {}), new Promise(resolve => { timer = setTimeout(resolve, 2000); })]); }
      finally { clearTimeout(timer); }
    }
  }
  return {
    query: (sql, values = []) => connection(async client => (await client.query(sql, values)).rows),
    transaction: fn => connection(async client => {
      await client.query('BEGIN');
      try {
        const value = await fn(async (sql, values = []) => (await client.query(sql, values)).rows);
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error; // Never retry writes: a failed COMMIT response can have an unknown outcome.
      }
    }),
  };
}
