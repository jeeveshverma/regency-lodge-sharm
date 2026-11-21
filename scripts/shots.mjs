// Screenshots of the home page in both languages at phone and desktop widths, with page errors and overflow reported.
// Usage: node scripts/shots.mjs <outDir> [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [out, base = 'http://127.0.0.1:4341'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [lang, url] of [['ar', '/'], ['en', '/en/']]) for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const info = await page.evaluate(() => ({ count: document.querySelector('#count').textContent, total: document.querySelector('[data-f=total]').textContent, stay: document.querySelector('[data-f=stay]').textContent, sunset: document.querySelector('#sunset').textContent }));
  await page.screenshot({ path: `${out}/${lang}-${w}.png`, fullPage: true });
  console.log(lang, w, 'overflow', over, 'errors', errors.length ? errors : 'none', JSON.stringify(info));
  await page.close();
}
await browser.close();
