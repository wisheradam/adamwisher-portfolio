import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

let instance: Database.Database | undefined;
export function db(): Database.Database {
  if (instance) return instance;
  const filename = process.env.ADMIN_DB_PATH ?? path.join(process.cwd(), ".data", "admin.sqlite");
  mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  instance = new Database(filename);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  instance.exec(readFileSync(path.join(process.cwd(), "lib/admin/migrations/001_init.sql"), "utf8"));
  return instance;
}
