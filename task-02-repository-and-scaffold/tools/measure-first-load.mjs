import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'evidence');
const evidencePath = path.join(evidenceDir, '04d-first-load-browser.txt');
if (existsSync(evidencePath)) throw new Error(`Refusing to overwrite ${evidencePath}`);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
  ];
  return candidates.find(candidate => candidate && existsSync(candidate));
}

const port = await freePort();
const browserPath = findBrowser();
if (!browserPath) throw new Error('No Chrome/Edge browser found');

const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    DATABASE_PATH: path.join(root, 'data', 'enquiries.db'),
    DB_READONLY: '0'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk.toString(); });
server.stderr.on('data', chunk => { serverLog += chunk.toString(); });

for (let i = 0; i < 150; i++) {
  if (serverLog.includes('Kobo Watt listening')) break;
  if (server.exitCode !== null) throw new Error(`Server exited:\n${serverLog}`);
  await wait(100);
}
if (!serverLog.includes('Kobo Watt listening')) throw new Error(`Server did not start:\n${serverLog}`);

const profile = mkdtempSync(path.join(tmpdir(), 'kw-first-load-'));
const debugPort = await freePort();
const chrome = spawn(browserPath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${debugPort}`,
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

let target;
for (let i = 0; i < 150; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    target = list.find(item => item.type === 'page');
    if (target) break;
  } catch {}
  await wait(100);
}
if (!target) {
  chrome.kill();
  server.kill();
  throw new Error('Browser debugging target did not appear');
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let serial = 0;
const pending = new Map();
let mainDocumentStatus = null;
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Network.responseReceived' &&
      message.params.type === 'Document' &&
      message.params.response.url === `http://127.0.0.1:${port}/`) {
    mainDocumentStatus = message.params.response.status;
  }
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

await cdp('Page.enable');
await cdp('Network.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });

const navigationStarted = new Date().toISOString();
await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/` });
for (let i = 0; i < 150; i++) {
  if (await evaluate("document.readyState === 'complete'")) break;
  await wait(100);
}
await evaluate('document.fonts.ready.then(() => true)');
await wait(100);
const navigation = await evaluate(`(() => {
  const entry = performance.getEntriesByType('navigation')[0];
  return entry ? {
    duration: entry.duration,
    domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
    loadEventEnd: entry.loadEventEnd,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    type: entry.type
  } : null;
})()`);
const resourceCount = await evaluate("performance.getEntriesByType('resource').length");
const title = await evaluate('document.title');
const finishedAt = new Date().toISOString();
await wait(300);

assert.ok(mainDocumentStatus === 200, `Expected HTTP 200 for main document, got ${mainDocumentStatus}`);
assert.ok(navigation && navigation.loadEventEnd > 0, 'Navigation timing was not available');

const lines = [
  'TASK 2 FIRST BROWSER LOAD - FRESH PROFILE, CACHE DISABLED',
  `Recorded at (UTC): ${finishedAt}`,
  `Navigation started at (UTC): ${navigationStarted}`,
  `URL: http://127.0.0.1:${port}/`,
  `Server PID: ${server.pid}`,
  `Browser: ${browserPath}`,
  `Document title: ${title}`,
  `Main document HTTP status: ${mainDocumentStatus}`,
  `Viewport: 390 x 844 CSS px`,
  `Resource entries: ${resourceCount}`,
  '',
  'Navigation timing from the browser Performance API (milliseconds unless stated):',
  JSON.stringify(navigation, null, 2),
  '',
  'Interpretation: duration is the navigation duration; domContentLoadedEventEnd and loadEventEnd are measured from navigation start. transferSize/encodedBodySize/decodedBodySize are byte counts.',
  '',
  'Actual server stdout/stderr for the first load:',
  serverLog.trim(),
  '',
  'Limitations: one local loopback run on this machine with a fresh headless Chrome profile, no network throttling, and no repeat runs. This is not a mobile-network or production measurement.'
];
writeFileSync(evidencePath, lines.join('\n') + '\n', { flag: 'wx' });

socket.close();
chrome.kill();
server.kill();
await wait(500);
console.log(JSON.stringify({ port, serverPid: server.pid, status: mainDocumentStatus, navigation, resourceCount, title, evidence: path.relative(root, evidencePath) }, null, 2));
