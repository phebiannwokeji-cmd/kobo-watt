#!/usr/bin/env node
/**
 * inspect-db.mjs — read-only SQLite state inspector for Task 4.
 *
 * This tool never creates, migrates or writes to a database. It is the
 * "database inspector" used for evidence/02-database-state-before.png before
 * the first Task 4 migration is run.
 *
 * Usage:
 *   node tools/inspect-db.mjs
 *   node tools/inspect-db.mjs --db data/kobo-watt-04.db --json
 */

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = path.resolve(__dirname, '..', 'data', 'kobo-watt-04.db');

/** Tables required by docs/schema.md, in the order they are documented. */
export const EXPECTED_TABLES = [
  { name: 'accounts', purpose: 'People who use the system' },
  { name: 'sessions', purpose: 'Server-side authenticated sessions' },
  { name: 'payments', purpose: 'Settled money transactions' },
  { name: 'payment_attempts', purpose: 'Failed, abandoned and timed-out attempts' },
  { name: 'knowledge_chunks', purpose: 'Retrieval chunks for inverter manuals' },
];

const MIGRATION_LEDGER_NAMES = [
  'schema_migrations',
  '_migrations',
  'migrations',
  '__drizzle_migrations',
  '_prisma_migrations',
];

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function safeAll(db, sql) {
  try {
    return db.prepare(sql).all();
  } catch (error) {
    return { error: error.message };
  }
}

function safeGet(db, sql) {
  try {
    return db.prepare(sql).get();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Inspect one SQLite file without mutating it.
 * @param {string} dbPath absolute or relative path to the database file
 */
export function inspectDatabase(dbPath) {
  const resolved = path.resolve(dbPath);
  const result = {
    target: resolved,
    checkedAt: new Date().toISOString(),
    file: {
      exists: existsSync(resolved),
      sizeBytes: null,
    },
    opened: false,
    openMode: 'read-only (fileMustExist)',
    error: null,
    tables: [],
    objects: [],
    userVersion: null,
    journalMode: null,
    foreignKeysEnabled: null,
    integrityCheck: null,
    migrationLedger: { present: false, candidates: [], rows: [] },
    expectedTables: EXPECTED_TABLES.map((table) => ({ ...table, present: false })),
  };

  if (!result.file.exists) {
    return result;
  }

  try {
    result.file.sizeBytes = statSync(resolved).size;
    const db = new DatabaseSync(resolved, { readOnly: true });
    result.opened = true;

    const tables = safeAll(
      db,
      `SELECT name, sql FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name`,
    );
    const indexSql = new Map(
      safeAll(db, `SELECT name, sql FROM sqlite_master WHERE type = 'index'`)
        .map((row) => [row.name, row.sql]),
    );

    if (Array.isArray(tables)) {
      for (const table of tables) {
        const tableName = table.name;
        const count = safeGet(
          db,
          `SELECT COUNT(*) AS rowCount FROM ${quoteIdentifier(tableName)}`,
        );
        const columns = safeAll(db, `PRAGMA table_info(${quoteIdentifier(tableName)})`);
        const indexList = safeAll(db, `PRAGMA index_list(${quoteIdentifier(tableName)})`);
        const indexes = Array.isArray(indexList)
          ? indexList.map((index) => ({
              name: index.name,
              unique: Boolean(index.unique),
              origin: index.origin,
              columns: safeAll(db, `PRAGMA index_info(${quoteIdentifier(index.name)})`),
              sql: indexSql.get(index.name) ?? null,
            }))
          : [];
        const foreignKeys = safeAll(
          db,
          `PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`,
        );

        result.tables.push({
          name: tableName,
          rowCount: Number.isFinite(count?.rowCount) ? count.rowCount : null,
          columns: Array.isArray(columns) ? columns : [],
          indexes,
          foreignKeys: Array.isArray(foreignKeys) ? foreignKeys : [],
          createSql: table.sql,
        });
      }
    }

    result.objects = safeAll(
      db,
      `SELECT type, name, tbl_name, sql FROM sqlite_master
        WHERE name NOT LIKE 'sqlite_%'
        ORDER BY type, name`,
    );

    result.userVersion = safeGet(db, 'PRAGMA user_version')?.user_version ?? null;
    result.journalMode = safeGet(db, 'PRAGMA journal_mode')?.journal_mode ?? null;
    result.foreignKeysEnabled = safeGet(db, 'PRAGMA foreign_keys')?.foreign_keys ?? null;
    result.integrityCheck = safeGet(db, 'PRAGMA integrity_check')?.integrity_check ?? null;

    const tableNames = new Set(result.tables.map((table) => table.name));
    result.expectedTables = EXPECTED_TABLES.map((table) => ({
      ...table,
      present: tableNames.has(table.name),
    }));

    result.migrationLedger.candidates = MIGRATION_LEDGER_NAMES.filter((name) =>
      tableNames.has(name),
    );
    result.migrationLedger.present = result.migrationLedger.candidates.length > 0;
    if (result.migrationLedger.present) {
      const ledger = result.migrationLedger.candidates[0];
      result.migrationLedger.rows = safeAll(
        db,
        `SELECT * FROM ${quoteIdentifier(ledger)}`,
      );
    }

    db.close();
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB (${bytes.toLocaleString('en-NG')} bytes)`;
}

function printHuman(report) {
  console.log('Kobo Watt — Task 4 database state');
  console.log('Target:', report.target);
  console.log('Checked at:', report.checkedAt);
  console.log('File exists:', report.file.exists ? 'yes' : 'NO');
  console.log('File size:', formatBytes(report.file.sizeBytes));
  console.log('Opened read-only:', report.opened ? 'yes' : 'no');
  if (report.error) console.log('Error:', report.error);
  console.log('Tables:', report.tables.length);
  for (const table of report.tables) {
    console.log(`  - ${table.name}: ${table.rowCount} row(s), ${table.columns.length} column(s)`);
  }
  console.log('Migration ledger:', report.migrationLedger.present ? report.migrationLedger.candidates.join(', ') : 'ABSENT');
  console.log('user_version:', report.userVersion ?? '—');
  console.log('journal_mode:', report.journalMode ?? '—');
  console.log('foreign_keys:', report.foreignKeysEnabled ?? '—');
  console.log('integrity_check:', report.integrityCheck ?? '—');
  console.log('Expected Task 4 tables:');
  for (const table of report.expectedTables) {
    console.log(`  - ${table.name}: ${table.present ? 'present' : 'MISSING'}`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const args = process.argv.slice(2);
  const dbFlag = args.indexOf('--db');
  const dbPath = dbFlag === -1 ? DEFAULT_DB : args[dbFlag + 1];
  if (!dbPath) {
    console.error('Usage: node tools/inspect-db.mjs [--db <path>] [--json]');
    process.exit(2);
  }
  const report = inspectDatabase(dbPath);
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
}
