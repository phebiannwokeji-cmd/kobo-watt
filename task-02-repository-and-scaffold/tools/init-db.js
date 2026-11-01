'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { dbPath } = require('./database');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
try {
  db.exec(`CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
    phone TEXT NOT NULL CHECK(length(phone) BETWEEN 7 AND 20),
    business_type TEXT NOT NULL CHECK(business_type IN ('salon','shop','other')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`);
  console.log(JSON.stringify({ event: 'database_initialised', path: dbPath }));
} finally { db.close(); }
