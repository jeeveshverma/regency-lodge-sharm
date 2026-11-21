// Home page behaviour: prices, rooms asked vs free, and a stay past the published prices.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4341';
const browser = await chromium.launch();
const page = await browser.newPage();
const read = () => page.evaluate(() => ({
  count: document.querySelector('#count').textContent, keys: document.querySelectorAll('.slot:not(.taken)').length, mine: document.querySelectorAll('.slot.mine').length,
  total: document.querySelector('[data-f=total]').textContent, priced: !document.querySelector('.folio-total').hidden, cta: document.querySelector('#cta').textContent, href: document.querySelector('#cta').getAttribute('href').slice(0, 30), off: document.querySelector('#cta').classList.contains('off'),
}));
await page.goto(`${base}/en/?in=2026-12-01&out=2026-12-04&rooms=3&plan=hb`, { waitUntil: 'networkidle' });
console.log('3 nights, 3 rooms, half board (expect 16,200):', JSON.stringify(await read()));
await page.locator('input[name=plan][value=ro]').check({ force: true });
console.log('room only (expect 13,500):', JSON.stringify(await read()));
await page.fill('#f-out', '2026-12-23'); await page.dispatchEvent('#f-out', 'change');
console.log('to 23 Dec (expect on request, WhatsApp):', JSON.stringify(await read()));
await page.goto(`${base}/en/?in=2026-12-20&out=2026-12-22&rooms=1&plan=bb`, { waitUntil: 'networkidle' });
console.log('20-22 Dec, last priced night is the 21st (expect 3,200):', JSON.stringify(await read()));
for (let d = 1; d <= 20; d++) { // find a date range where fewer than 5 rooms are free
  await page.goto(`${base}/en/?in=2026-12-${String(d).padStart(2, '0')}&out=2026-12-21&rooms=5&plan=bb`, { waitUntil: 'networkidle' });
  const r = await read(); if (r.keys < 5 && r.keys > 0) { console.log(`from ${d} Dec, 5 rooms asked:`, JSON.stringify(r)); break; }
}
await browser.close();
