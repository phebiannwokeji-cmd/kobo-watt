'use strict';
/**
 * server.js — Kobo Watt Task 3 server
 * Serves the SPA auth page and stub API endpoints.
 * Binds to 127.0.0.1 only (loopback).
 *
 * NOTE: Server-side validation is deliberately minimal at this stage
 * to demonstrate that client-side rules are not enforced here.
 * Task 4 adds proper server-side enforcement.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { openDatabase } from './tools/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT      = Number(process.env.PORT) || 3001;
const HOST      = '127.0.0.1';

const app = express();
app.use(express.json({ limit: '16kb' }));

// Static assets
app.use('/assets', express.static(join(__dirname, 'public', 'assets')));

// Strict route allow-list
const ALLOWED = new Set([
  'GET /',
  'GET /auth',
  'POST /api/accounts',
  'POST /api/sessions',
  'POST /api/password-resets',
  'GET /favicon.svg',
]);

app.use((req, _res, next) => {
  const key = `${req.method} ${req.path}`;
  if (!ALLOWED.has(key) && !req.path.startsWith('/assets/')) {
    return _res.status(404).json({ error: 'Not found' });
  }
  next();
});

// Homepage redirect to auth
app.get('/', (_req, res) => res.redirect('/auth?form=signup'));

// SPA auth page
app.get('/auth', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'auth.html'));
});

app.get('/favicon.svg', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'assets', 'favicon.svg'));
});

// ── POST /api/accounts ────────────────────────────────────────────────
// Stub: accepts the request, inserts a row, returns id.
// Server-side validation is NOT done here yet — this is Task 3's
// "attack your own form" target. See docs/client-side-is-not-security.md.
app.post('/api/accounts', (req, res) => {
  const { name, phone, email, address, password, terms } = req.body;

  // Only check that required keys exist (not their values — intentionally weak)
  if (!name || !phone || !email || !address || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const db = openDatabase();
  try {
    const stmt = db.prepare(
      `INSERT INTO accounts (name, phone, email, address, password_hash, terms_accepted)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    // Password stored as plain text here ONLY for Task 3 demonstration.
    // Task 4 introduces bcrypt hashing. This is documented in defects.md.
    const result = stmt.run(name, phone, email, address, password, terms ? 1 : 0);
    console.log(`[${new Date().toISOString()}] POST /api/accounts — account created id=${result.lastInsertRowid} name="${name}"`);
    return res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/sessions ────────────────────────────────────────────────
app.post('/api/sessions', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials.' });
  }
  const db = openDatabase();
  const row = db.prepare('SELECT id, password_hash FROM accounts WHERE email = ?').get(email);
  // Generic error — does not reveal whether email or password was wrong (anti-enumeration)
  if (!row || row.password_hash !== password) {
    return res.status(401).json({ error: 'Incorrect details.' });
  }
  console.log(`[${new Date().toISOString()}] POST /api/sessions — sign-in id=${row.id}`);
  return res.status(200).json({ message: 'Signed in.' });
});

// ── POST /api/password-resets ─────────────────────────────────────────
// Always returns the same response to prevent user enumeration via reset form.
app.post('/api/password-resets', (req, res) => {
  const { email } = req.body;
  console.log(`[${new Date().toISOString()}] POST /api/password-resets email="${email || ''}"`);
  // Same response whether email exists or not
  return res.status(202).json({ message: 'If registered, a reset link has been sent.' });
});

// ── Start ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] listening at http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`[${new Date().toISOString()}] ${signal} received — shutting down`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
