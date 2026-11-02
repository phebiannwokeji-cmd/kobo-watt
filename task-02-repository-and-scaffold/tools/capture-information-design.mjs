import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(root, 'evidence');
const outputs = {
  headOne: path.join(evidenceDir, '16-head-route-one.png'),
  headTwo: path.join(evidenceDir, '17-head-route-two.png'),
  good: path.join(evidenceDir, '19-heading-wrap-good.png'),
  responsive: path.join(evidenceDir, '20-responsive-three-widths.png'),
  checks: path.join(evidenceDir, '21-information-design-checks.txt')
};
for (const file of Object.values(outputs)) {
  if (existsSync(file)) throw new Error(`Refusing to overwrite existing evidence: ${file}`);
}
if (!existsSync(path.join(evidenceDir, '18-heading-wrap-bad.png'))) {
  throw new Error('Preserve the pre-fix 18-heading-wrap-bad.png capture');
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const checks = [];
const record = message => { checks.push(message); console.log(message); };
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

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
assert.match(serverLog, /Kobo Watt listening/);

const profile = mkdtempSync(path.join(tmpdir(), 'kw-info-design-'));
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
  for (let i = 0; i < 120; i++) {
    if (await evaluate("document.readyState === 'complete'")) break;
    await wait(100);
  }
  await evaluate('document.fonts.ready.then(() => true)');
  await wait(100);
};
const screenshot = async filePath => {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(filePath, Buffer.from(result.data, 'base64'), { flag: 'wx' });
};
const getHead = () => evaluate(`(() => ({
  url: location.href,
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content || null,
  robots: document.querySelector('meta[name="robots"]')?.content || null,
  themeColor: document.querySelector('meta[name="theme-color"]')?.content || null,
  icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || null,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
  ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
  ogType: document.querySelector('meta[property="og:type"]')?.content || null,
  ogUrl: document.querySelector('meta[property="og:url"]')?.content || null,
  ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
  twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || null
}))()`);
const renderHeadInspection = async (head, label, filePath) => {
  const rows = [
    ['Route label', label],
    ['Live URL', head.url],
    ['document.title', head.title],
    ['meta description', head.description],
    ['meta robots', head.robots],
    ['meta theme-color', head.themeColor],
    ['favicon link', head.icon],
    ['og:title', head.ogTitle],
    ['og:description', head.ogDescription],
    ['og:type', head.ogType],
    ['og:url', head.ogUrl],
    ['og:image', head.ogImage],
    ['twitter:card', head.twitterCard]
  ];
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Head inspection</title>
<style>
  body { margin: 0; padding: 28px; background: #f4f4f4; color: #111; font: 17px Arial, sans-serif; }
  h1 { margin: 0 0 8px; font-size: 30px; }
  p { margin: 0 0 18px; }
  table { border-collapse: collapse; background: #fff; width: 1120px; }
  th, td { border: 1px solid #888; padding: 10px 12px; text-align: left; vertical-align: top; }
  th { width: 210px; background: #e8e8e8; }
  code { font: 14px Consolas, monospace; overflow-wrap: anywhere; }
</style>
<h1>Task 2 head inspection — ${escapeHtml(label)}</h1>
<p>Values read from the live <code>document.head</code> after navigation. Screenshot generated from that live DOM, not typed by hand.</p>
<table>${rows.map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td><code>${escapeHtml(value ?? '—')}</code></td></tr>`).join('')}</table>`;
  await cdp('Page.navigate', { url: 'about:blank' });
  await wait(200);
  await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close();`);
  await wait(300);
  await screenshot(filePath);
};

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('DOM.enable');
await cdp('CSS.enable');
await cdp('Network.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });

await setViewport(1200, 700);
await navigate(`http://127.0.0.1:${port}/`);
const homeHead = await getHead();
await screenshot(outputs.headOne);
record(`Home head: ${JSON.stringify(homeHead)}`);

await navigate(`http://127.0.0.1:${port}/demo/`);
const demoHead = await getHead();
await screenshot(outputs.headTwo);
record(`Demo head: ${JSON.stringify(demoHead)}`);
assert.notEqual(homeHead.title, demoHead.title);
record('Titles differ between the two routes.');

for (const route of ['/assets/favicon.svg', '/favicon.ico', '/assets/og-image.png', '/assets/home.css', '/assets/layout-tokens.css', '/assets/enquiry.js']) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`);
  await response.text();
  assert.equal(response.status, 200, `${route} should return 200`);
  record(`Route ${route}: HTTP ${response.status}, content-type ${response.headers.get('content-type')}`);
}

await navigate(`http://127.0.0.1:${port}/`);
await setViewport(768, 600);
await navigate(`http://127.0.0.1:${port}/`);
const h1 = await evaluate(`(() => {
  const element = document.querySelector('h1');
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    text: element.textContent.trim(),
    maxWidth: style.maxWidth,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth
  };
})()`);
assert.equal(h1.maxWidth, '288px');
assert.equal(h1.fontSize, '40px');
assert.ok(h1.scrollWidth <= h1.width);
record(`Heading at 768px: ${JSON.stringify(h1)}`);
await screenshot(outputs.good);

const styleNodes = {};
const documentNode = await cdp('DOM.getDocument');
for (const selector of ['.brand', '.text-link', '.demo-link']) {
  const found = await cdp('DOM.querySelector', { nodeId: documentNode.root.nodeId, selector });
  assert.ok(found.nodeId, `${selector} not found`);
  styleNodes[selector] = found.nodeId;
}
const computed = async nodeId => {
  const result = await cdp('CSS.getComputedStyleForNode', { nodeId });
  return Object.fromEntries(result.computedStyle.map(property => [property.name, property.value]));
};
const brandStyle = await computed(styleNodes['.brand']);
const textLinkStyle = await computed(styleNodes['.text-link']);
const buttonStyle = await computed(styleNodes['.demo-link']);
assert.equal(brandStyle['cursor'], 'pointer');
record(`Brand link cursor: ${brandStyle['cursor']}; font-size=${brandStyle['font-size']}`);
for (const [name, style] of [['text-link', textLinkStyle], ['demo-link', buttonStyle]]) {
  assert.match(style['font-family'], /Source Sans Pro/);
  assert.equal(style['font-size'], '14px');
  assert.equal(style['font-weight'], '600');
  assert.equal(style['cursor'], 'pointer');
  record(`${name} label style: font-family=${style['font-family']}; font-size=${style['font-size']}; font-weight=${style['font-weight']}; cursor=${style['cursor']}`);
}
assert.notEqual(textLinkStyle['background-color'], buttonStyle['background-color']);
record(`Secondary link background ${textLinkStyle['background-color']} differs from primary button background ${buttonStyle['background-color']}.`);

for (const [selector, nodeId] of Object.entries(styleNodes)) {
  await cdp('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
  const hoverStyle = await computed(nodeId);
  const decoration = hoverStyle['text-decoration-line'] || hoverStyle['text-decoration'];
  assert.match(decoration, /underline/);
  record(`${selector} forced hover text decoration: ${decoration}; thickness: ${hoverStyle['text-decoration-thickness'] || 'default'}`);
}

const images = [];
for (const width of [320, 390, 768]) {
  await setViewport(width, 844);
  await navigate(`http://127.0.0.1:${port}/`);
  const metrics = await evaluate(`(() => {
    const element = document.querySelector('h1');
    return {
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      h1Width: element.getBoundingClientRect().width,
      h1ScrollWidth: element.scrollWidth,
      h1FontSize: getComputedStyle(element).fontSize
    };
  })()`);
  assert.ok(metrics.scrollWidth <= width);
  assert.ok(metrics.h1ScrollWidth <= metrics.h1Width);
  record(`Responsive width ${width}: ${JSON.stringify(metrics)}`);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  images.push({ width, data: shot.data });
}

const composite = `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; font: 18px Arial, sans-serif; background: #f4f4f4; color: #111; }
  h1 { margin: 0 0 16px; font-size: 26px; }
  .row { display: flex; gap: 18px; align-items: flex-start; }
  figure { margin: 0; background: #fff; border: 1px solid #888; padding: 10px; }
  figcaption { font-weight: 700; margin-bottom: 8px; }
  img { display: block; height: 620px; width: auto; }
</style>
<h1>Kobo Watt home at three viewport widths</h1>
<div class="row">
${images.map(image => `<figure><figcaption>${image.width} px</figcaption><img src="data:image/png;base64,${image.data}" alt="Home at ${image.width} px"></figure>`).join('\n')}
</div>`;
await cdp('Emulation.setDeviceMetricsOverride', { width: 1400, height: 760, deviceScaleFactor: 1, mobile: false });
await cdp('Page.navigate', { url: 'about:blank' });
await wait(200);
await evaluate(`document.open(); document.write(${JSON.stringify(composite)}); document.close();`);
await wait(300);
const compositeShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(outputs.responsive, Buffer.from(compositeShot.data, 'base64'), { flag: 'wx' });
record('Wrote 20-responsive-three-widths.png from the three live viewport captures.');

const header = [
  'TASK 2 INFORMATION DESIGN CHECKS',
  `Recorded at (UTC): ${new Date().toISOString()}`,
  `Server: http://127.0.0.1:${port}/ (PID ${server.pid})`,
  `Browser: ${browserPath}`,
  '',
  '18-heading-wrap-bad.png was captured before the CSS change at a 180 px viewport: the 40 px heading had h1Width 133 px and h1ScrollWidth 143 px, so the text overflowed its box.',
  ''
];
writeFileSync(outputs.checks, [...header, ...checks, ''].join('\n'), { flag: 'wx' });

socket.close();
chrome.kill();
server.kill();
await wait(500);
console.log(JSON.stringify({ port, serverPid: server.pid, homeHead, demoHead, h1, evidence: Object.keys(outputs) }, null, 2));
