// Records one walkthrough video of the hotel's requirements, against the local docker setup
// (fresh database: docker compose down -v && docker compose up -d). Captions name each requirement.
// Usage: node scripts/record-demo.mjs <outDir> [siteUrl] [mailpitUrl]   -> <outDir>/<random>.webm
import { chromium } from 'playwright';
import sharp from 'sharp';

const outDir = process.argv[2];
if (!outDir) throw new Error('Usage: node scripts/record-demo.mjs <outDir> [siteUrl] [mailpitUrl]');
const base = process.argv[3] || 'http://127.0.0.1:8788';
const mailpit = process.argv[4] || 'http://127.0.0.1:8026';
const root = new URL('..', import.meta.url).pathname;
const USER = { email: 'owner@regency.test', password: 'local-pass-123' };
const W = 1280, H = 720;

// a stand-in logo for the recording; the hotel uploads its approved file the same way
const logo = `${outDir}/sample-logo.png`;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="260"><circle cx="130" cy="130" r="104" fill="#1553b6"/><circle cx="130" cy="130" r="58" fill="#ffc628"/>
  <text x="270" y="122" font-family="Georgia, serif" font-size="78" font-weight="700" fill="#0a2a5e">Regency Royal</text>
  <text x="272" y="204" font-family="Georgia, serif" font-size="64" fill="#1553b6" letter-spacing="14">SHARM</text></svg>`)).png().toFile(logo);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: outDir, size: { width: W, height: H } } });
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);

let caption = ['', ''];
/** The caption bar and a visible pointer; put back after every page load. */
async function hud() {
  await page.evaluate(([step, text]) => {
    let bar = document.getElementById('demo-hud');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'demo-hud';
      bar.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;max-width:92vw;background:#061c42;color:#fff;border:3px solid #ffc628;padding:10px 20px;font:600 19px/1.35 system-ui,Arial,sans-serif;direction:ltr;text-align:center;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.35)';
      document.documentElement.append(bar);
      const dot = document.createElement('div');
      dot.id = 'demo-dot';
      dot.style.cssText = 'position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,80,60,.75);border:2px solid #fff;z-index:2147483647;pointer-events:none;transition:left .25s,top .25s';
      document.documentElement.append(dot);
      addEventListener('mousemove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
    }
    bar.innerHTML = '';
    if (step) { const b = document.createElement('b'); b.textContent = step + '  '; b.style.color = '#ffc628'; bar.append(b); }
    bar.append(text);
    bar.style.display = text ? '' : 'none';
  }, caption);
}
const say = async (step, text, wait = 1800) => { caption = [step, text]; await hud(); await pause(wait); };
const go = async (url) => { await page.goto(url, { waitUntil: 'networkidle' }); await hud(); await pause(900); };
async function click(sel, after = 900) {
  const l = typeof sel === 'string' ? page.locator(sel).first() : sel;
  await l.scrollIntoViewIfNeeded();
  await l.hover();
  await pause(450);
  await l.click();
  await pause(after);
}
async function type(sel, text) {
  const l = page.locator(sel).first();
  await l.scrollIntoViewIfNeeded();
  await l.hover();
  await l.fill('');
  await l.pressSequentially(text, { delay: 28 });
  await pause(250);
}
const show = async (sel, wait = 1500) => { await page.locator(sel).first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })); await pause(wait); };
async function glide(to, ms = 3000) {
  await page.evaluate(([y, t]) => new Promise((done) => {
    const from = scrollY, start = performance.now();
    (function step(now) { const k = Math.min(1, (now - start) / t); scrollTo(0, from + (y - from) * (0.5 - Math.cos(Math.PI * k) / 2)); k < 1 ? requestAnimationFrame(step) : done(); })(start);
  }), [to, ms]);
  await pause(500);
}
async function card(title, lines, wait = 5000) {
  await page.setContent(`<body style="margin:0;height:100vh;display:grid;place-content:center;background:#1553b6;color:#fff;font-family:system-ui,Arial,sans-serif;text-align:center;padding:0 80px">
    <h1 style="font-size:54px;margin:0 0 26px;color:#ffc628">${title}</h1>${lines.map((l) => `<p style="font-size:27px;margin:9px 0;line-height:1.4">${l}</p>`).join('')}</body>`);
  await pause(wait);
}
const api = (path, body) => fetch(`${base}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
async function mailView(match) {
  const list = (await (await fetch(`${mailpit}/api/v1/messages?limit=100`)).json()).messages;
  const m = list.find(match);
  if (!m) throw new Error('Expected email not found in the mail catcher');
  await page.goto(`${mailpit}/view/${m.ID}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.body.style.cssText = 'margin:40px auto;max-width:640px;font-size:17px'; });
  await hud();
}
const tab = (name) => click(`[data-tab=${name}]`, 1300);

// ---------- 0 ----------
await card('Regency Royal Sharm', ['Website and reservation system', 'A walkthrough of each requirement', '<span style="opacity:.8;font-size:22px">Recorded on a test copy. Sample data.</span>'], 4500);

// ---------- 1: the site ----------
caption = ['1', 'Fast, lightweight website in Arabic and English'];
await go(`${base}/`);
await pause(1500);
await glide(2300, 4200);
await glide(5200, 4200);
await glide(0, 1500);
await say('1', 'One press switches between Arabic and English');
await click('.hdr .lang', 1600);
await hud();
await glide(1500, 3000);
await glide(0, 1200);
await page.setViewportSize({ width: 400, height: H });
caption = ['1', 'Mobile-friendly: the same site on a phone'];
await go(`${base}/en/`);
await glide(1700, 3800);
await glide(3600, 3800);
await page.setViewportSize({ width: W, height: H });

// ---------- 2: branding ----------
caption = ['2', 'The dashboard: sign in at /admin/'];
await go(`${base}/admin/`);
await type('input[name=email]', USER.email);
await type('input[name=password]', USER.password);
await click('button[type=submit]', 1500);
await hud();
await say('2', 'The dashboard works in Arabic and in English');
await click('text=English', 1400);
await hud();
await say('2', 'Branding: hotel name and the approved logo');
await tab('settings');
await show('#logo-card', 1400);
await page.setInputFiles('#logo-card input[type=file]', logo);
await page.waitForSelector('#logo-card img.logo-box');
await say('2', 'Logo uploaded (a sample here; the hotel uploads its approved file)', 2600);
await show('input[name=phone]', 600);
await say('2', 'Phone, WhatsApp, emails, address and times are edited here too', 3000);
caption = ['2', 'The logo now shows at the top of the site'];
await go(`${base}/en/`);
await pause(2500);

// ---------- 3: rooms, photos, prices ----------
caption = ['3', 'Room categories, facilities and prices'];
await go(`${base}/admin/`);
await tab('rooms');
await show('[data-room="1"] input[name=price_bb]', 1200);
await say('3', 'Each room has its own three prices: room only, breakfast, breakfast + dinner', 3200);
await show('[data-room="1"] .thumbs', 1200);
await say('3', 'Photos of the room: upload, caption, reorder, delete', 2800);
await click('#add-room', 1000);
await say('3', 'Adding a new room category', 1200);
const nr = '[data-room=new] ';
await type(nr + 'input[name=name_ar]', 'غرفة عائلية');
await type(nr + 'input[name=name_en]', 'Family room');
await type(nr + 'textarea[name=desc_ar]', 'غرفة واسعة لأربعة أشخاص تطل على المسبح.');
await type(nr + 'textarea[name=desc_en]', 'A larger room for four, looking onto the pool.');
await page.fill(nr + 'textarea[name=facilities_ar]', 'تتسع لـ: 4 أشخاص\nالإطلالة: المسبح\nتكييف: في الغرفة\nشرفة');
await page.fill(nr + 'textarea[name=facilities_en]', 'Sleeps: 4 guests\nView: The pool\nAir conditioning: In the room\nBalcony');
await pause(900);
await type(nr + 'input[name=price_ro]', '2500');
await type(nr + 'input[name=price_bb]', '2700');
await type(nr + 'input[name=price_hb]', '3000');
await type(nr + 'input[name=adults]', '4');
await click(nr + 'form button[type=submit]', 1500);
const famRoom = page.locator('section[data-room]').last();
await famRoom.locator('input[type=file]').setInputFiles([`${root}src/assets/photos/room-triple.jpg`, `${root}src/assets/photos/room-lamps.jpg`]);
await page.waitForFunction(() => document.querySelectorAll('section[data-room]:last-of-type .thumb').length === 2);
await famRoom.locator('.thumbs').evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
await say('3', 'Two photos added to the new room', 2500);
await tab('photos');
await say('3', 'The photo wall of the site is managed the same way', 1200);
await glide(900, 2500);
caption = ['3', 'On the site: the guest chooses the room, prices follow'];
await go(`${base}/en/?in=2026-12-10&out=2026-12-13&rooms=1&plan=bb`);
await show('.plans [data-roomtabs]', 1500);
await click('.plans [data-roomtabs] button:nth-child(2)', 2200);
await show('#room-name', 2800);
await click('#room [data-roomtabs] button:nth-child(1)', 1800);

// ---------- 4 + 5: the request ----------
caption = ['4', 'Reservation request: dates, rooms, meals'];
await go(`${base}/en/?in=2026-12-10&out=2026-12-13&rooms=2&plan=bb&room=1`);
await pause(1500);
await show('#cta', 2200);
await click('#cta', 1200);
await page.waitForSelector('#step-1:not([hidden])');
await say('4', 'A simple request form', 800);
await type('#g-name', 'Mona Hassan');
await type('#g-phone', '0100 123 4567');
await type('#g-email', 'mona@example.com');
await show('#g-pay', 700);
await say('7', 'Two payment options: on arrival, or online by card in EGP (Paymob)', 1500);
await page.locator('#g-pay').hover();
await page.selectOption('#g-pay', 'online');
await pause(2200);
await type('#g-note', 'We arrive on a late flight.');
await say('4', 'The guest reviews the request before sending', 600);
await click('#step-1 button[type=submit]', 2600);
await show('#confirm', 1500);
await click('#confirm', 800);
await page.waitForSelector('#step-3:not([hidden])');
const ref = await page.textContent('#ref');
await say('5', 'The guest is told: the request is pending hotel confirmation', 4200);
caption = ['5', 'The guest also gets this by email'];
await mailView((m) => m.Subject.includes(ref) && m.To[0].Address === 'mona@example.com');
await pause(4200);
caption = ['4', 'The booking team gets the full request by email'];
await mailView((m) => m.Subject.includes(ref) && m.To[0].Address !== 'mona@example.com');
await pause(4500);

// ---------- 6: confirm / decline ----------
const other = await api('requests', { in: '2026-12-18', out: '2026-12-20', rooms: 1, plan: 'ro', room: 1, name: 'Omar Adel', phone: '0111 222 3344', email: 'omar@example.com', adults: 2, children: 1, bed: 'twin', arrival: 'arr3', pay: 'arrival', note: '', lang: 'ar' });
caption = ['6', 'New requests wait in the dashboard'];
await go(`${base}/admin/`);
await pause(2500);
await say('6', 'The team checks availability in its own sheet, then confirms or declines', 3000);
await type(`[data-ref="${ref}"] textarea[name=note]`, 'Welcome! Your rooms are held. Late check-in is fine.');
await click(`[data-ref="${ref}"] [data-move=confirmed]`, 1800);
await say('6', 'Another request is declined, with a message to the guest', 1200);
await type(`[data-ref="${other.ref}"] textarea[name=note]`, 'Sorry, we are full on these dates.');
await click(`[data-ref="${other.ref}"] [data-move=declined]`, 1800);
await click('.chips button:nth-child(2)', 1500);
await say('6', 'Confirmed requests. One press writes the guest on WhatsApp', 3200);

// ---------- 7: payment ----------
caption = ['7', 'After confirmation, the guest receives the payment link'];
await mailView((m) => m.Subject.includes(ref) && m.Subject.includes('confirmed'));
await pause(4800);
caption = ['7', '"My reservation" on the site: status and Pay now'];
await go(`${base}/en/booking/?ref=${ref}`);
await type('#m-phone', '0100 123 4567');
await click('#find button[type=submit]', 800);
await page.waitForSelector('#pay-now:not([hidden])');
await show('#pay-now', 3200);
await click('#pay-now', 600);
await page.waitForSelector('#fake-pay');
await say('7', "Test payment page. With the hotel's Paymob keys, Paymob's own card page opens here", 4800);
await click('#fake-pay', 600);
await page.waitForSelector('#found:not([hidden])');
await hud();
await say('7', 'Paid. The guest and the booking team both get a payment email', 600);
await show('#m-msg', 3800);
caption = ['7', 'The dashboard shows the reservation as paid'];
await go(`${base}/admin/`);
await click('.chips button:nth-child(2)', 3200);

// ---------- 8: content ----------
await say('8', 'Website content: texts can be changed without a developer', 800);
await tab('texts');
await pause(1600);
await type('textarea[name="hero.h1a|en"]', 'Your room by the pool.');
await type('textarea[name="hero.h1a|ar"]', 'غرفتك على المسبح.');
await click('#view form button[type=submit]', 1600);
caption = ['8', 'The new headline is on the site at once'];
await go(`${base}/en/`);
await pause(3200);
await go(`${base}/`);
await pause(3000);

// ---------- close ----------
await card('Ready for your domain', [
  'Runs on ordinary hosting (PHP + MySQL), in the hotel\'s own account:',
  'full administrative access and ownership stay with the hotel.',
  '&nbsp;',
  'To go live we need: 1) the login of the hosting for your existing domain',
  '2) your Paymob keys &nbsp; 3) the approved logo file',
], 9000);

await ctx.close();
await browser.close();
console.log('recorded', await page.video().path());
