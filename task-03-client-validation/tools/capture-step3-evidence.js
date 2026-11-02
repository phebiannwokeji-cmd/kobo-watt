import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EVIDENCE_DIR = join(__dirname, '..', 'evidence');
const BASE_URL = 'http://127.0.0.1:3001/auth';

async function run() {
  console.log('Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1000, height: 800, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // 1. Evidence 03: URL states composite / active tab state
  console.log('Capturing Evidence 03: URL states...');
  await page.goto(`${BASE_URL}?form=signup`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: join(EVIDENCE_DIR, '03-url-states.png') });

  // 2. Evidence 05: Empty field error (Category 1)
  // Focus the name field and then blur without typing
  console.log('Capturing Evidence 05: Empty field error...');
  await page.goto(`${BASE_URL}?form=signup`, { waitUntil: 'networkidle0' });
  await page.focus('#signup-name');
  await page.focus('#signup-phone'); // causes blur on #signup-name
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '05-empty-field-error.png') });

  // 3. Evidence 06: Length rule blocking (Category 2)
  // Type a single token "Tunde" in name (violating the minimum two words / space rule)
  console.log('Capturing Evidence 06: Length/structure rule blocking...');
  await page.goto(`${BASE_URL}?form=signup`, { waitUntil: 'networkidle0' });
  await page.type('#signup-name', 'Tunde');
  await page.focus('#signup-phone'); // trigger blur validation
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '06-length-rule-blocking.png') });

  // 4. Evidence 07: Real-time email validation on signup (Category 3)
  // Type incomplete email "tunde@" on signup -> error appears in real-time
  console.log('Capturing Evidence 07: Email real-time validation on signup...');
  await page.goto(`${BASE_URL}?form=signup`, { waitUntil: 'networkidle0' });
  await page.type('#signup-email', 'tunde@');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '07-email-realtime-signup.png') });

  // 5. Evidence 08: Email on submit on login (Category 3)
  // On login form, type incomplete email "tunde@" -> no error while typing. Click submit -> error appears!
  console.log('Capturing Evidence 08: Email on-submit validation on login...');
  await page.goto(`${BASE_URL}?form=login`, { waitUntil: 'networkidle0' });
  await page.type('#login-email', 'tunde@');
  await page.click('#btn-login'); // submit form
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '08-email-on-submit-login.png') });

  await browser.close();
  console.log('Evidence capture complete! All screenshots saved in evidence/.');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

