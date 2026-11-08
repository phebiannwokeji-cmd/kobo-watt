#!/usr/bin/env node
/**
 * capture-db-state.mjs — render the read-only Task 4 database inspection as
 * evidence/02-database-state-before.png.
 *
 * Run this BEFORE the first migration. It does not create or modify a database.
 *
 * Usage:
 *   node tools/capture-db-state.mjs
 */

import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_TABLES, inspectDatabase } from './inspect-db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASK_DIR = path.resolve(__dirname, '..');
const TARGET_DB = path.resolve(TASK_DIR, 'data', 'kobo-watt-04.db');
const CONTEXT_DB = path.resolve(TASK_DIR, '..', 'task-03-client-validation', 'data', 'kobo-watt-03.db');
const OUTPUT_PNG = path.resolve(TASK_DIR, 'evidence', '02-database-state-before.png');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB <span class="muted">(${bytes.toLocaleString('en-NG')} bytes)</span>`;
}

function statusBadge(present) {
  return present
    ? '<span class="badge badge-good">PRESENT</span>'
    : '<span class="badge badge-bad">MISSING</span>';
}

function tableSummary(report) {
  if (!report.file.exists) return '<p class="empty">No database file — SQLite has nothing to open.</p>';
  if (!report.opened) return `<p class="empty">Could not open read-only: ${escapeHtml(report.error)}</p>`;
  if (report.tables.length === 0) return '<p class="empty">The file is a valid SQLite database but contains no application tables.</p>';
  return `<table class="data-table">
    <thead><tr><th>Table</th><th>Rows</th><th>Columns</th></tr></thead>
    <tbody>
      ${report.tables.map((table) => `<tr><td>${escapeHtml(table.name)}</td><td>${table.rowCount ?? '—'}</td><td>${table.columns.length}</td></tr>`).join('')}
    </tbody>
  </table>`;
}

function expectedTableRows(target) {
  const present = new Map(target.expectedTables.map((table) => [table.name, table.present]));
  return EXPECTED_TABLES.map(
    (table) => `<tr>
      <td><code>${escapeHtml(table.name)}</code></td>
      <td>${escapeHtml(table.purpose)}</td>
      <td>${statusBadge(present.get(table.name) === true)}</td>
    </tr>`,
  ).join('');
}

function renderHtml(target, context) {
  const targetFound = target.file.exists && target.opened;
  const headline = targetFound ? 'Database file found' : 'No Task 4 database exists yet';
  const headlineClass = targetFound ? 'ok' : 'warn';
  const badge = targetFound
    ? '<span class="hero-badge hero-badge-ok">DATABASE PRESENT</span>'
    : '<span class="hero-badge hero-badge-warn">NO DATABASE FILE</span>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Kobo Watt — Task 4 database state before migration</title>
<style>
  :root {
    --ink: #14213d;
    --muted: #5c677d;
    --line: #dbe2ec;
    --paper: #ffffff;
    --wash: #f4f7fb;
    --brand: #0b57d0;
    --warn: #a15c00;
    --warn-bg: #fff4e5;
    --bad: #b42318;
    --bad-bg: #fef3f2;
    --good: #067647;
    --good-bg: #ecfdf3;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--wash); color: var(--ink); }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    padding: 34px 38px 30px;
  }
  .page { max-width: 1360px; margin: 0 auto; }
  .topline { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .mark { width: 38px; height: 38px; border-radius: 10px; background: var(--brand); color: #fff; display: grid; place-items: center; font-weight: 700; letter-spacing: -0.5px; }
  .brand-text { font-weight: 700; letter-spacing: 0.02em; }
  .brand-text span { display: block; font-weight: 500; color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
  .stamp { text-align: right; color: var(--muted); font-size: 12px; }
  .stamp strong { color: var(--ink); font-size: 13px; }
  h1 { font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; margin: 26px 0 8px; }
  .subtitle { color: var(--muted); margin: 0 0 20px; max-width: 900px; }

  .hero {
    background: var(--paper);
    border: 1px solid var(--line);
    border-left: 6px solid ${targetFound ? 'var(--good)' : 'var(--warn)'};
    border-radius: 12px;
    padding: 20px 22px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    box-shadow: 0 1px 2px rgba(20, 33, 61, 0.04);
  }
  .hero h2 { margin: 0 0 6px; font-size: 21px; letter-spacing: -0.01em; }
  .hero p { margin: 0; color: var(--muted); max-width: 850px; }
  .hero-badge { flex: 0 0 auto; border-radius: 999px; padding: 8px 14px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; white-space: nowrap; }
  .hero-badge-warn { background: var(--warn-bg); color: var(--warn); border: 1px solid #f5c26b; }
  .hero-badge-ok { background: var(--good-bg); color: var(--good); border: 1px solid #a6e6c0; }

  .grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 18px; margin-top: 18px; }
  .card { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 2px rgba(20, 33, 61, 0.04); }
  .card h3 { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
  .kv { display: grid; grid-template-columns: 160px 1fr; gap: 8px 14px; margin: 0; }
  .kv dt { color: var(--muted); }
  .kv dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
  .kv dd.mono, code, .mono { font-family: "Cascadia Mono", Consolas, "Courier New", monospace; font-size: 12.5px; }
  .muted { color: var(--muted); font-weight: 400; }

  .data-table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); border-bottom: 1px solid var(--line); padding: 6px 8px; }
  .data-table td { border-bottom: 1px solid #eef2f7; padding: 7px 8px; vertical-align: top; }
  .data-table tr:last-child td { border-bottom: 0; }
  .badge { display: inline-block; border-radius: 999px; padding: 3px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; }
  .badge-bad { background: var(--bad-bg); color: var(--bad); }
  .badge-good { background: var(--good-bg); color: var(--good); }
  .empty { color: var(--muted); margin: 0; }

  .finding { margin-top: 18px; background: var(--warn-bg); border: 1px solid #f5c26b; border-radius: 12px; padding: 16px 20px; }
  .finding strong { color: var(--warn); }
  .finding p { margin: 6px 0 0; }

  .verify { margin-top: 18px; }
  .verify ol { margin: 0; padding-left: 20px; }
  .verify li { margin: 6px 0; }
  .verify code { background: #eef2f7; border-radius: 4px; padding: 1px 5px; }

  .context { margin-top: 18px; border-style: dashed; }
  .context h3 { color: var(--warn); }
  .context-note { margin: 10px 0 0; color: var(--muted); font-size: 12.5px; }

  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 20px; color: var(--muted); font-size: 11.5px; }
  .footer code { background: #eef2f7; border-radius: 4px; padding: 1px 5px; }
</style>
</head>
<body>
<div class="page">
  <div class="topline">
    <div class="brand">
      <div class="mark">KW</div>
      <div class="brand-text">Kobo Watt<span>Task 4 · Server security</span></div>
    </div>
    <div class="stamp">
      <strong>Database inspector — read-only</strong><br>
      ${escapeHtml(target.checkedAt)}
    </div>
  </div>

  <h1>Database state before migration</h1>
  <p class="subtitle">Captured before running the initial migration, starting the server, or writing any schema. This is the state the task says to discover first, not the state we assumed from <code>docs/schema.md</code>.</p>

  <section class="hero">
    <div>
      <h2>${escapeHtml(headline)}</h2>
      <p><code class="mono">${escapeHtml(target.target)}</code></p>
    </div>
    ${badge}
  </section>

  <div class="grid">
    <section class="card">
      <h3>Inspection result — Task 4 database</h3>
      <dl class="kv">
        <dt>File exists</dt><dd>${target.file.exists ? 'Yes' : '<span class="badge badge-bad">NO</span>'}</dd>
        <dt>File size</dt><dd>${formatBytes(target.file.sizeBytes)}</dd>
        <dt>Opened read-only</dt><dd>${target.opened ? 'Yes' : 'No — file does not exist'}</dd>
        <dt>Application tables</dt><dd>${target.tables.length}</dd>
        <dt>Migration ledger</dt><dd>${target.migrationLedger.present ? escapeHtml(target.migrationLedger.candidates.join(', ')) : '<span class="badge badge-bad">ABSENT</span>'}</dd>
        <dt>user_version</dt><dd>${target.userVersion ?? '— <span class="muted">(unreadable: no file)</span>'}</dd>
        <dt>journal_mode</dt><dd>${target.journalMode ?? '—'}</dd>
        <dt>foreign_keys</dt><dd>${target.foreignKeysEnabled ?? '—'}</dd>
        <dt>integrity_check</dt><dd>${target.integrityCheck ?? '—'}</dd>
        <dt>Open mode</dt><dd class="mono">${escapeHtml(target.openMode)}</dd>
      </dl>
    </section>

    <section class="card">
      <h3>Expected by docs/schema.md</h3>
      <table class="data-table">
        <thead><tr><th>Table</th><th>Purpose</th><th>State</th></tr></thead>
        <tbody>${expectedTableRows(target)}</tbody>
      </table>
    </section>
  </div>

  <section class="card verify">
    <h3>How this was verified</h3>
    <ol>
      <li>Checked for <code>task-04-server-security/data/kobo-watt-04.db</code> on disk before running any migration, seed or server command. The file is not there.</li>
      <li>The inspector only opens an existing database with <code>readOnly: true</code>; it never calls <code>CREATE</code>, <code>ALTER</code>, <code>INSERT</code> or a migration runner. No empty database was created to make the screenshot look populated.</li>
      <li>For an existing file it queries <code>sqlite_master</code>, <code>PRAGMA table_info</code>, <code>PRAGMA index_list</code>, <code>PRAGMA foreign_key_list</code>, <code>PRAGMA user_version</code> and <code>PRAGMA integrity_check</code>. With no file, it records the absence and stops.</li>
      <li>The absence of a migration ledger is a real finding, not a rendering gap: the task has a schema document and a hand-drawn design, but no database and no migration history.</li>
    </ol>
  </section>

  <section class="finding">
    <strong>Finding:</strong> Task 4 has no database yet.
    <p>The five-table design exists only in <code>docs/schema.md</code> and <code>evidence/01-schema-drawing.jpg</code>. There are no tables, no rows, no <code>user_version</code> and no migration ledger to inspect. The first migration in step 3 will create this database; until then the application has nothing to connect to.</p>
  </section>

  <section class="card context">
    <h3>Repository context — Task 3 database (not the Task 4 database)</h3>
    ${tableSummary(context)}
    <p class="context-note"><code class="mono">${escapeHtml(context.target)}</code> — ${formatBytes(context.file.sizeBytes)}. This is the legacy Task 3 database. It has one table (<code>accounts</code>) and ${context.tables[0]?.rowCount ?? '—'} row, no migration ledger, and <code>user_version = ${context.userVersion ?? '—'}</code>. It is not connected to Task 4 and is <strong>not</strong> evidence that the Task 4 schema exists. ${context.expectedTables.filter((table) => !table.present).length} of the 5 designed tables are missing from it.</p>
  </section>

  <div class="footer">
    <span>Inspector: <code>node tools/inspect-db.mjs</code> · no writes</span>
    <span>Evidence: <code>evidence/02-database-state-before.png</code></span>
  </div>
</div>
</body>
</html>`;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function main() {
  const target = inspectDatabase(TARGET_DB);
  const context = inspectDatabase(CONTEXT_DB);
  const html = renderHtml(target, context);

  mkdirSync(path.dirname(OUTPUT_PNG), { recursive: true });
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const htmlPath = path.join(os.tmpdir(), `kobo-watt-db-state-${stamp}.html`);
  const profilePath = path.join(os.tmpdir(), `kobo-watt-chrome-profile-${stamp}`);
  writeFileSync(htmlPath, html, 'utf8');

  const chrome = findChrome();
  if (!chrome) {
    throw new Error('Chrome not found. Set CHROME_PATH to chrome.exe and re-run.');
  }

  const fileUrl = new URL(`file:///${htmlPath.replaceAll('\\', '/')}`).href;
  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      '--window-size=1440,1280',
      '--virtual-time-budget=1500',
      `--user-data-dir=${profilePath}`,
      `--screenshot=${OUTPUT_PNG}`,
      fileUrl,
    ],
    { encoding: 'utf8', timeout: 90_000 },
  );

  if (result.status !== 0) {
    throw new Error(`Chrome exited with ${result.status}\n${result.stderr || result.stdout || ''}`);
  }
  if (!existsSync(OUTPUT_PNG) || statSync(OUTPUT_PNG).size === 0) {
    throw new Error(`Chrome did not write a screenshot to ${OUTPUT_PNG}`);
  }

  console.log(`Wrote ${OUTPUT_PNG} (${statSync(OUTPUT_PNG).size.toLocaleString('en-NG')} bytes)`);
  console.log(`HTML report: ${htmlPath}`);
  rmSync(profilePath, { recursive: true, force: true });
}

main();
