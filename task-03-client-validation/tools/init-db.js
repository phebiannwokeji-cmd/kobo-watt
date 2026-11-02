'use strict';
/**
 * init-db.js — Create Task 3 database schema
 * Run once: node tools/init-db.js
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');
const DB_PATH   = join(DATA_DIR, 'kobo-watt-03.db');

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    phone           TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    address         TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    terms_accepted  INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log('Database initialised:', DB_PATH);
db.close();
