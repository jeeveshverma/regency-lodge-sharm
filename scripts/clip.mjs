// Close-up screenshots of one element. Usage: node scripts/clip.mjs <out.png> <path> <selector> [width]
import { chromium } from 'playwright';
const [out, url, sel, w = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: 900 }, deviceScaleFactor: Number(w) < 600 ? 2 : 1 });
await page.goto('http://127.0.0.1:4341' + url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator(sel).first().screenshot({ path: out });
await browser.close();
