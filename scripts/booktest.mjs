// The booking path end to end, in both languages: home -> details -> review -> confirm -> my booking -> cancel.
// Usage: node scripts/booktest.mjs [baseUrl] [shotsDir]
import { chromium, webkit } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4341';
const shots = process.argv[3];
const engine = process.env.ENGINE === 'webkit' ? webkit : chromium;
const browser = await engine.launch();
let failed = 0;
const check = (name, ok, got) => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` -> ${JSON.stringify(got)}`}`); };
for (const [lang, pre] of [['ar', '/'], ['en', '/en/']]) for (const width of [390, 1280]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const tag = `${lang} ${width}`;
  const q = 'in=2026-12-01&out=2026-12-04&rooms=2&plan=bb';
  await page.goto(`${base}${pre}?${q}`, { waitUntil: 'networkidle' });
  const before = await page.locator('.slot:not(.taken)').count();
  await page.click('#cta');
  await page.waitForSelector('#step-1:not([hidden])');
  check(`${tag} booking page opens with the stay`, page.url().includes('book/') && page.url().includes('rooms=2'), page.url());
  check(`${tag} bill total 9,600`, (await page.textContent('[data-f=total]')) === '9,600', await page.textContent('[data-f=total]'));
  // empty form is refused with messages
  await page.click('#step-1 button[type=submit]');
  check(`${tag} empty form shows errors`, (await page.textContent('[data-err=name]')).length > 3 && await page.isVisible('#step-1'), null);
  await page.fill('#g-name', 'Test Guest'); await page.fill('#g-phone', '0100 123 4567'); await page.fill('#g-email', 'bad');
  await page.click('#step-1 button[type=submit]');
  check(`${tag} bad email refused`, (await page.textContent('[data-err=email]')).length > 3, null);
  await page.fill('#g-email', ''); await page.selectOption('#g-bed', 'twin'); await page.selectOption('#g-children', '1'); await page.fill('#g-note', 'Late flight');
  if (shots) await page.screenshot({ path: `${shots}/book1-${lang}-${width}.png`, fullPage: true });
  await page.click('#step-1 button[type=submit]');
  await page.waitForSelector('#step-2:not([hidden])');
  check(`${tag} review shows the guest`, (await page.textContent('[data-r=guest]')).includes('Test Guest'), null);
  if (shots) await page.screenshot({ path: `${shots}/book2-${lang}-${width}.png`, fullPage: true });
  await page.click('#confirm');
  await page.waitForSelector('#step-3:not([hidden])');
  const ref = await page.textContent('#ref');
  check(`${tag} booking number given`, /^RL-[A-Z2-9]{5}$/.test(ref), ref);
  const wa = decodeURIComponent(await page.getAttribute('#send-wa', 'href'));
  check(`${tag} WhatsApp message carries number and total`, wa.startsWith('https://wa.me/201036654930?text=') && wa.includes(ref) && wa.includes('9,600'), wa.slice(0, 80));
  if (shots) await page.screenshot({ path: `${shots}/book3-${lang}-${width}.png`, fullPage: true });
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`${tag} no sideways scroll`, over <= 0, over);
  // the two rooms are now gone from the key board
  await page.goto(`${base}${pre}?${q}`, { waitUntil: 'networkidle' });
  const after = await page.locator('.slot:not(.taken)').count();
  check(`${tag} key board lost 2 keys (${before} -> ${after})`, after === before - 2, { before, after });
  // my booking: wrong phone refused, right phone found, cancel in two presses
  await page.goto(`${base}${pre}booking/?ref=${ref}`, { waitUntil: 'networkidle' });
  await page.fill('#m-phone', '0111111111'); await page.click('#find button[type=submit]');
  check(`${tag} wrong phone refused`, await page.isVisible('#m-err') && !(await page.isVisible('#found')), null);
  await page.fill('#m-phone', '+20 100 123 4567'); await page.click('#find button[type=submit]');
  await page.waitForSelector('#found:not([hidden])');
  check(`${tag} booking found with other phone format`, (await page.textContent('[data-m=ref]')) === ref, null);
  if (shots) await page.screenshot({ path: `${shots}/mine-${lang}-${width}.png`, fullPage: true });
  await page.click('#cancel');
  check(`${tag} first press only arms the button`, await page.isVisible('#cancel'), null);
  await page.click('#cancel');
  await page.waitForFunction(() => document.querySelector('#cancel').hidden);
  check(`${tag} cancelled`, (await page.textContent('#m-msg')).length > 3, null);
  await page.goto(`${base}${pre}?${q}`, { waitUntil: 'networkidle' });
  check(`${tag} keys back after cancelling`, (await page.locator('.slot:not(.taken)').count()) === before, null);
  // dates without a price cannot reach the form
  await page.goto(`${base}${pre}book/?in=2026-12-20&out=2026-12-24&rooms=1&plan=bb`, { waitUntil: 'networkidle' });
  check(`${tag} unpriced dates are blocked`, await page.isVisible('#blocked') && !(await page.isVisible('#step-1')), null);
  check(`${tag} no page errors`, errors.length === 0, errors);
  await ctx.close();
}
await browser.close();
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
