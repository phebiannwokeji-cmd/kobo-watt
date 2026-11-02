import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EVIDENCE_DIR = join(__dirname, '..', 'evidence');
const DRILL_URL = 'http://127.0.0.1:3001/drill-number-input';

async function run() {
  console.log('Launching Edge for Step 4 capture...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 900, height: 750, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.goto(DRILL_URL, { waitUntil: 'networkidle0' });

  // 1. Screenshot 09a: Number input showing default zero and browser spinners
  console.log('Capturing 09a: number input default zero...');
  await page.focus('#bad-phone');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '09a-number-input-zero.png') });

  // 2. Screenshot 09b: User types 400 without noticing the 0, producing "0400"
  console.log('Capturing 09b: number input showing 0400...');
  await page.type('#bad-phone', '400');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '09b-number-input-0400.png') });
  // Also save as 09-number-input-annoying.png as primary deliverable filename
  await page.screenshot({ path: join(EVIDENCE_DIR, '09-number-input-annoying.png') });

  // 3. Screenshot 09c: Cursor navigating back to delete the unwanted leading zero
  console.log('Capturing 09c: cursor navigating back to delete zero...');
  // Move cursor back to beginning
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '09c-number-input-delete.png') });

  // 4. Screenshot 10: Clean text input with inputmode="numeric" behaving properly
  console.log('Capturing 10: text input behaving properly...');
  await page.focus('#good-phone');
  await page.type('#good-phone', '08012345678');
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: join(EVIDENCE_DIR, '10-text-input-working.png') });

  await browser.close();
  console.log('Step 4 capture complete! Files saved in evidence/.');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

