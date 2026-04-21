import Database from "better-sqlite3";
import path from "path";

const globalForDb = globalThis as unknown as { db: Database.Database | undefined };

const db =
  globalForDb.db ??
  new Database(path.join(process.cwd(), "investimentos.db"));

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    ticker TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    current_price REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    quantity REAL NOT NULL,
    price_per_unit REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS targets (
    class TEXT PRIMARY KEY,
    target_pct REAL NOT NULL DEFAULT 0
  );


`);

export default db;
