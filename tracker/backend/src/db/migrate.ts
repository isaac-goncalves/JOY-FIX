import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function migrate(dbPath?: string) {
  const path = dbPath || join(__dirname, '../../joyfix.db');
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  
  console.log('Migrations completed successfully.');
  return db;
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  const db = migrate();
  db.close();
}
