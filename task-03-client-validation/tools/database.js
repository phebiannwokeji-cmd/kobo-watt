'use strict';
/**
 * database.js — SQLite helper for Task 3
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '..', 'data', 'kobo-watt-03.db');

export function openDatabase() {
  const readonly = process.env.DB_READONLY === '1';
  return new Database(DB_PATH, { readonly });
}

