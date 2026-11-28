// Home page behaviour: prices, yellow keys for the rooms asked, and a stay past the published prices.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4341';
const browser = await chromium.launch();
const page = await browser.newPage();
const read = () => page.evaluate(() => ({
  mine: document.querySelectorAll('.slot.mine').length,
  total: document.querySelector('[data-f=total]').textContent, priced: !document.querySelector('.folio-total').hidden, cta: document.querySelector('#cta').textContent, href: document.querySelector('#cta').getAttribute('href').slice(0, 30),
}));
await page.goto(`${base}/en/?in=2026-12-01&out=2026-12-04&rooms=3&plan=hb`, { waitUntil: 'networkidle' });
console.log('3 nights, 3 rooms, half board (expect 16,200):', JSON.stringify(await read()));
await page.locator('input[name=plan][value=ro]').check({ force: true });
console.log('room only (expect 13,500):', JSON.stringify(await read()));
await page.fill('#f-out', '2026-12-23'); await page.dispatchEvent('#f-out', 'change');
console.log('to 23 Dec (expect on request, WhatsApp):', JSON.stringify(await read()));
await page.goto(`${base}/en/?in=2026-12-20&out=2026-12-22&rooms=1&plan=bb`, { waitUntil: 'networkidle' });
console.log('20-22 Dec, last priced night is the 21st (expect 3,200):', JSON.stringify(await read()));
await browser.close();
