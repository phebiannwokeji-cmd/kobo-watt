import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EVIDENCE_DIR = join(__dirname, '..', 'evidence');
const AUTH_URL = 'http://127.0.0.1:3001/auth?form=signup';

async function run() {
  console.log('Launching Edge for Step 7 capture...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1000, height: 850, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // 1. Evidence 13: Hidden button version
  console.log('Capturing Evidence 13: Hidden button version...');
  await page.goto(AUTH_URL, { waitUntil: 'networkidle0' });
  // Simulate hidden button experiment
  await page.evaluate(() => {
    const btn = document.getElementById('btn-signup');
    if (btn) btn.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '13-button-hidden-version.png') });

  // 2. Evidence 14: Disabled button version with explanation message
  console.log('Capturing Evidence 14: Disabled button version with explanation...');
  await page.goto(AUTH_URL, { waitUntil: 'networkidle0' });
  // Fill in preliminary fields so the form is partially complete, but terms is NOT checked
  await page.type('#signup-name', 'Adaobi Eze');
  await page.type('#signup-phone', '08012345678');
  await page.type('#signup-email', 'adaobi@example.com');
  await page.type('#signup-address', '14 Isaac John Street, Ikeja, Lagos');
  await page.type('#signup-password', 'KoboWattSolar2026!');
  
  // Attempt to click the submit button / submit area without accepting terms
  await page.click('.kw-field--submit');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: join(EVIDENCE_DIR, '14-button-disabled-version.png') });

  await browser.close();
  console.log('Step 7 capture complete! Files saved in evidence/.');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
