import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'evidence');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dbPath = path.join(root, 'data', `enquiries-browser-${stamp}.db`);
const outputs = {
  successLog: path.join(evidenceDir, '18-browser-write-succeeded-logs.txt'),
  failureLog: path.join(evidenceDir, '19-browser-write-failed-logs.txt'),
  rowsPng: path.join(evidenceDir, '20-browser-database-rows.png'),
  checks: path.join(evidenceDir, '21-browser-checks.txt'),
  rowsJson: path.join(evidenceDir, '22-browser-database-rows.json'),
  rowsHtml: path.join(evidenceDir, '23-browser-database-rows.html'),
  restoredPng: path.join(evidenceDir, '24-browser-database-rows-after-restoration.png'),
  restoredJson: path.join(evidenceDir, '25-browser-database-rows-after-restoration.json'),
  restoredHtml: path.join(evidenceDir, '26-browser-database-rows-after-restoration.html')
};

for (const file of Object.values(outputs)) {
  if (existsSync(file)) throw new Error(`Refusing to overwrite existing evidence: ${file}`);
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const checks = [];
const record = message => { checks.push(message); console.log(message); };

function rows() {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    return db.prepare('SELECT id, name, phone, business_type, created_at FROM enquiries ORDER BY id').all();
  } finally {
    db.close();
  }
}

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function startServer(readonly) {
  const port = await freePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: dbPath,
      DB_READONLY: readonly ? '1' : '0'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  child.stdout.on('data', chunk => { log += chunk.toString(); });
  child.stderr.on('data', chunk => { log += chunk.toString(); });
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited before becoming ready:\n${log}`);
    try {
      const response = await fetch(`${url}/`, { signal: AbortSignal.timeout(1000) });
      await response.text();
      if (response.status === 200) return { child, url, log: () => log };
    } catch {}
    await wait(100);
  }
  child.kill();
  throw new Error(`Server startup timed out:\n${log}`);
}

async function stopServer(server) {
  if (!server || server.child.exitCode !== null) return;
  server.child.kill();
  await Promise.race([
    new Promise(resolve => server.child.once('exit', resolve)),
    wait(5000).then(() => {
      server.child.kill('SIGKILL');
      throw new Error(`Owned server PID ${server.child.pid} did not stop`);
    })
  ]);
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Avast Software/Browser/Application/AvastBrowser.exe'
  ];
  return candidates.find(candidate => candidate && existsSync(candidate));
}

async function launchBrowser() {
  const browserPath = findBrowser();
  if (!browserPath) throw new Error('No Chrome, Edge or configured CHROME_PATH browser was found');
  const port = await freePort();
  const profile = mkdtempSync(path.join(tmpdir(), 'kw-enquiry-browser-'));
  const child = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank'
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let browserStderr = '';
  child.stderr.on('data', chunk => { browserStderr += chunk.toString(); });

  let target;
  for (let i = 0; i < 150; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(item => item.type === 'page');
      if (target) break;
    } catch {}
    await wait(100);
  }
  if (!target) {
    child.kill();
    throw new Error(`Browser did not expose a debugging target. stderr: ${browserStderr}`);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let serial = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);
  };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); }
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const setViewport = (width, height) => cdp('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false
  });
  const navigate = async url => {
    await cdp('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      const ready = await evaluate("document.readyState === 'complete' && !!document.querySelector('#enquiry-form')");
      if (ready) return;
      await wait(100);
    }
    throw new Error(`Form did not load at ${url}`);
  };
  const submit = async (name, businessType) => {
    const expression = `(() => {
      document.querySelector('#enquiry-name').value = ${JSON.stringify(name)};
      document.querySelector('#enquiry-phone').value = '00000000000';
      document.querySelector('#enquiry-business').value = ${JSON.stringify(businessType)};
      document.querySelector('#enquiry-form').requestSubmit();
      return true;
    })()`;
    await evaluate(expression);
    for (let i = 0; i < 100; i++) {
      const state = await evaluate("document.querySelector('#enquiry-status').dataset.state || ''");
      if (state === 'success' || state === 'error') {
        return {
          state,
          text: await evaluate("document.querySelector('#enquiry-status').textContent"),
          name: await evaluate("document.querySelector('#enquiry-name').value"),
          phone: await evaluate("document.querySelector('#enquiry-phone').value"),
          businessType: await evaluate("document.querySelector('#enquiry-business').value")
        };
      }
      await wait(100);
    }
    throw new Error('Form submission did not produce a success or error state');
  };
  const screenshot = async filePath => {
    const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(filePath, Buffer.from(result.data, 'base64'), { flag: 'wx' });
  };
  const close = async () => {
    try { socket.close(); } catch {}
    if (child.exitCode === null) child.kill();
  };

  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setCacheDisabled', { cacheDisabled: true });
  return { browserPath, cdp, evaluate, setViewport, navigate, submit, screenshot, close };
}

function writeRowsFiles(savedRows, jsonPath, htmlPath) {
  const captured = new Date().toISOString();
  writeFileSync(jsonPath, JSON.stringify(savedRows, null, 2), { flag: 'wx' });
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Persisted SQLite rows</title>
<style>
  body { font: 18px Arial, sans-serif; padding: 24px; color: #111; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #888; padding: 12px; text-align: left; }
  caption { text-align: left; margin: 16px 0; }
</style>
<h1>Task 2 — actual persisted enquiries</h1>
<p>Read-only SELECT from ${escape(path.relative(root, dbPath))} — captured ${escape(captured)}</p>
<p>Fictional data only. Successful submissions were at least three minutes apart.</p>
<table>
  <caption>SELECT id, name, phone, business_type, created_at FROM enquiries ORDER BY id</caption>
  <tr>${Object.keys(savedRows[0]).map(key => `<th>${escape(key)}</th>`).join('')}</tr>
  ${savedRows.map(row => `<tr>${Object.values(row).map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('\n  ')}
</table>`;
  writeFileSync(htmlPath, html, { flag: 'wx' });
  return { captured, html };
}

async function showRowsInBrowser(browser, html) {
  await browser.setViewport(1400, 700);
  await browser.cdp('Page.navigate', { url: 'about:blank' });
  await wait(200);
  await browser.evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close();`);
  await wait(300);
}

let server = null;
let browser = null;
let successLog = '';
let failureLog = '';
const startedAt = new Date().toISOString();

try {
  const init = spawnSync(process.execPath, ['tools/init-db.js'], {
    cwd: root,
    env: { ...process.env, DATABASE_PATH: dbPath },
    encoding: 'utf8'
  });
  assert.equal(init.status, 0, init.stderr || init.stdout);
  record(`Initialised schema separately before server startup: ${init.stdout.trim()}`);
  assert.equal(rows().length, 0, 'Fresh verification database must start empty');

  browser = await launchBrowser();
  record(`Browser: ${browser.browserPath}`);
  server = await startServer(false);
  successLog += `--- writable server PID ${server.child.pid}, ${server.url} ---\n`;
  await browser.navigate(server.url);
  record(`Writable server: form loaded at ${server.url}`);

  for (const width of [320, 390]) {
    await browser.setViewport(width, 844);
    assert.equal(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    record(`No page overflow at ${width}px`);
  }
  await browser.setViewport(390, 844);

  const invalid = await fetch(`${server.url}/api/enquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', phone: 'bad', business_type: 'invalid' })
  });
  assert.equal(invalid.status, 400);
  assert.equal(rows().length, 0);
  record('Invalid input: HTTP 400 and zero rows');

  const malformed = await fetch(`${server.url}/api/enquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  });
  assert.equal(malformed.status, 400);
  assert.equal(rows().length, 0);
  record('Malformed JSON: HTTP 400 and zero rows');

  for (const route of ['/data/enquiries.db', '/tools/inspect-db.js', '/evidence/database-rows.json', '/server.js']) {
    assert.equal((await fetch(`${server.url}${route}`)).status, 404);
  }
  record('Database, tools, evidence and source routes return 404');

  const first = await browser.submit('Fictional Browser Alpha', 'salon');
  assert.equal(first.state, 'success');
  const firstRows = rows();
  assert.equal(firstRows.length, 1);
  assert.equal(firstRows[0].id, 1);
  assert.ok(Math.abs(Date.now() - Date.parse(firstRows[0].created_at)) < 60000);
  record(`First browser form success: ${JSON.stringify(firstRows[0])}`);

  record('Waiting 185 real seconds before the second successful browser submission.');
  await wait(185000);

  const second = await browser.submit('Fictional Browser Beta', 'shop');
  assert.equal(second.state, 'success');
  const successRows = rows();
  assert.equal(successRows.length, 2);
  assert.equal(successRows[1].id, 2);
  assert.ok(Date.parse(successRows[1].created_at) - Date.parse(successRows[0].created_at) >= 180000);
  record(`Second browser form success: ${JSON.stringify(successRows[1])}`);
  record(`Persisted timestamp gap: ${Date.parse(successRows[1].created_at) - Date.parse(successRows[0].created_at)} ms`);

  const rendered = writeRowsFiles(successRows, outputs.rowsJson, outputs.rowsHtml);
  await showRowsInBrowser(browser, rendered.html);
  await browser.screenshot(outputs.rowsPng);
  record(`Wrote ${path.basename(outputs.rowsPng)} from a direct read-only database query`);

  await wait(250);
  successLog += server.log();
  await stopServer(server);
  record(`Stopped owned writable server PID ${server.child.pid}`);
  server = null;

  server = await startServer(true);
  failureLog += `--- read-only server PID ${server.child.pid}, ${server.url}, DB_READONLY=1 ---\n`;
  await browser.navigate(server.url);
  record(`Read-only server: form still loaded at ${server.url}`);
  const beforeFailure = rows();
  const rejected = await browser.submit('Fictional Browser Rejected', 'other');
  assert.equal(rejected.state, 'error');
  assert.equal(rejected.name, 'Fictional Browser Rejected');
  assert.equal(rejected.phone, '00000000000');
  assert.equal(rejected.businessType, 'other');
  record(`Read-only form error shown: ${rejected.text}`);
  record('Submitted values were retained after the failed save');

  const directFailure = await fetch(`${server.url}/api/enquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Fictional Direct Rejection', phone: '00000000000', business_type: 'salon' })
  });
  record(`Direct valid POST while read-only: HTTP ${directFailure.status}`);
  assert.equal(directFailure.status, 500);

  await wait(500);
  failureLog += server.log();
  assert.match(failureLog, /SQLITE_READONLY/);
  assert.match(failureLog, /"status":500/);
  const afterFailure = rows();
  assert.deepEqual(afterFailure, beforeFailure);
  record(`Read-only rejection: row count unchanged at ${afterFailure.length}`);

  await stopServer(server);
  record(`Stopped owned read-only server PID ${server.child.pid}`);
  server = null;

  server = await startServer(false);
  successLog += `--- restored writable server PID ${server.child.pid}, ${server.url} ---\n`;
  await browser.navigate(server.url);
  const restored = await browser.submit('Fictional Browser Restored', 'salon');
  assert.equal(restored.state, 'success');
  const restoredRows = rows();
  assert.equal(restoredRows.length, 3);
  assert.equal(restoredRows[2].id, 3);
  record(`Writable restoration success: ${JSON.stringify(restoredRows[2])}`);
  await wait(500);
  successLog += server.log();

  const restoredRendered = writeRowsFiles(restoredRows, outputs.restoredJson, outputs.restoredHtml);
  await showRowsInBrowser(browser, restoredRendered.html);
  await browser.screenshot(outputs.restoredPng);
  record(`Wrote ${path.basename(outputs.restoredPng)} after writable restoration`);

  await stopServer(server);
  record(`Stopped owned writable server PID ${server.child.pid}`);
  server = null;

  record('PASS: browser form submissions, persistence, validation, read-only failure, retention and restoration');
} catch (error) {
  record(`FAIL: ${error.stack}`);
  process.exitCode = 1;
} finally {
  await stopServer(server).catch(error => record(error.message));
  if (browser) await browser.close();
  const finishedAt = new Date().toISOString();
  writeFileSync(outputs.successLog, [
    `Started at (UTC): ${startedAt}`,
    `Finished at (UTC): ${finishedAt}`,
    `Database: ${dbPath}`,
    'Actual stdout/stderr from owned writable server runs. The first two successes were browser form submissions; the third is writable restoration.',
    '',
    successLog
  ].join('\n'), { flag: 'wx' });
  writeFileSync(outputs.failureLog, [
    `Started at (UTC): ${startedAt}`,
    `Finished at (UTC): ${finishedAt}`,
    `Database: ${dbPath}`,
    'Actual stdout/stderr from the owned read-only server run.',
    '',
    failureLog
  ].join('\n'), { flag: 'wx' });
  writeFileSync(outputs.checks, [
    `Started at (UTC): ${startedAt}`,
    `Finished at (UTC): ${finishedAt}`,
    `Database: ${dbPath}`,
    '',
    checks.join('\n'),
    ''
  ].join('\n'), { flag: 'wx' });
}
