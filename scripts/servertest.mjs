// The backend end to end, against the local docker setup (npm run assemble && docker compose up -d):
// request -> emails -> dashboard confirm -> online payment (test page) -> paid; decline; guest cancel;
// and the dashboard's content tools (prices, a second room, photos, logo, texts, contact) showing on the site.
// Usage: node scripts/servertest.mjs [siteUrl] [mailpitUrl] [shotsDir]
// The dashboard user is owner@regency.test / local-pass-123 (created on first run with the docker install key).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const base = process.argv[2] || 'http://127.0.0.1:8788';
const mailpit = process.argv[3] || 'http://127.0.0.1:8026';
const shots = process.argv[4];
const USER = { email: 'owner@regency.test', password: 'local-pass-123' };
let failed = 0;
const check = (name, ok, got) => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` -> ${JSON.stringify(got)}`}`); };
const post = (path, body, headers = {}) => fetch(`${base}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const stayBody = (over = {}) => ({ in: '2026-12-01', out: '2026-12-04', rooms: 1, plan: 'bb', name: 'Server Test', phone: '0100 765 4321', email: 'guest@example.test', adults: 2, children: 0, bed: 'double', arrival: 'arr2', pay: 'arrival', note: '', lang: 'en', ...over });
async function mails(ref) {
  const list = (await (await fetch(`${mailpit}/api/v1/messages?limit=200`)).json()).messages;
  return Promise.all(list.filter((m) => m.Subject.includes(ref)).map(async (m) => ({ to: m.To[0].Address, subject: m.Subject, html: (await (await fetch(`${mailpit}/api/v1/message/${m.ID}`)).json()).HTML })));
}

// first run: create the dashboard user (a second run answers "already installed")
const inst = await post('install', { key: 'local-install-key', name: 'Owner', ...USER });
check('install answers created or already installed', [201, 409].includes(inst.status), inst.status);

// ---- guards
check('dashboard data needs a sign-in', (await fetch(`${base}/api/admin/requests`)).status === 401, null);
check('payment callback with a wrong signature is refused', (await post('paymob/callback?hmac=abc', { type: 'TRANSACTION', obj: { success: true } })).status === 400, null);
const cheap = await (await post('requests', stayBody({ total: 1, rate: 1 }))).json();
check('the server works out the price itself', cheap.total === 4800 && cheap.rate === 1600, cheap);
check('online payment cannot be asked for a past date', (await post('requests', stayBody({ in: '2020-01-01', out: '2020-01-03' }))).status === 400, null);
check('unpriced dates are refused', (await post('requests', stayBody({ in: '2026-12-20', out: '2026-12-24' }))).status === 409, null);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true }); };

// ---- guest sends a request to be paid online
await page.goto(`${base}/en/?in=2026-12-01&out=2026-12-04&rooms=2&plan=bb`, { waitUntil: 'networkidle' });
check('home shows the room from the dashboard', (await page.textContent('#room-name')) === 'Standard double room' && (await page.locator('#room-photos img').count()) === 6, await page.textContent('#room-name'));
check('home shows the photo wall from the dashboard', (await page.locator('#look-grid figure').count()) === 17, await page.locator('#look-grid figure').count());
await shot('home-en');
await page.click('#cta');
await page.waitForSelector('#step-1:not([hidden])');
await page.fill('#g-name', 'Mona Guest'); await page.fill('#g-phone', '0100 123 4567'); await page.fill('#g-email', 'mona@example.test');
await page.selectOption('#g-pay', 'online'); await page.fill('#g-note', 'Late flight');
await page.click('#step-1 button[type=submit]');
await page.click('#confirm');
await page.waitForSelector('#step-3:not([hidden])');
const ref = await page.textContent('#ref');
check('request number given by the server', /^RR-[A-Z2-9]{5}$/.test(ref), ref);
check('the pending screen says the booking team has it', (await page.textContent('#done-lead')).includes('booking team'), null);
let m = await mails(ref);
check('booking team is emailed the new request', m.some((x) => x.to === 'regencylodge@royalhils.com' || x.to === 'Regencylodge@royalhils.com') && m.some((x) => x.html.includes('Mona Guest') && x.html.includes('9,600')), m.map((x) => [x.to, x.subject]));
check('guest is emailed that the request is pending', m.some((x) => x.to === 'mona@example.test' && x.html.includes('pending hotel confirmation')), m.map((x) => [x.to, x.subject]));

// ---- dashboard: sign in, confirm with a message
const admin = await ctx.newPage();
admin.on('pageerror', (e) => errors.push('admin: ' + e.message));
await admin.goto(`${base}/admin/`, { waitUntil: 'networkidle' });
await admin.fill('input[name=email]', USER.email); await admin.fill('input[name=password]', 'wrong-password-1');
await admin.click('button[type=submit]');
await admin.waitForSelector('#toast.bad:not([hidden])');
check('wrong password is refused with a message', await admin.locator('.login').count() === 1, null);
await admin.fill('input[name=password]', USER.password);
await admin.click('button[type=submit]');
await admin.waitForSelector(`[data-ref="${ref}"]`);
await admin.click('text=English').catch(() => {}); // dashboard opens in Arabic; the checks below read English
await admin.waitForSelector(`[data-ref="${ref}"]`);
check('new request is in the pending list', (await admin.textContent(`[data-ref="${ref}"]`)).includes('Mona Guest'), null);
if (shots) await admin.screenshot({ path: `${shots}/admin-requests.png`, fullPage: true });
await admin.fill(`[data-ref="${ref}"] textarea[name=note]`, 'Room 12 is ready for you.');
await admin.click(`[data-ref="${ref}"] [data-move=confirmed]`);
await admin.waitForSelector(`[data-ref="${ref}"]`, { state: 'detached' });
await admin.click('.chips button:nth-child(2)');
await admin.waitForSelector(`[data-ref="${ref}"] .badge.confirmed`);
const wa = decodeURIComponent(await admin.getAttribute(`[data-ref="${ref}"] [data-wa]`, 'href'));
check('WhatsApp message to the guest carries the payment link', wa.startsWith('https://wa.me/201001234567?text=') && wa.includes('/api/pay?ref=' + ref), wa.slice(0, 120));
m = await mails(ref);
const confirmedMail = m.find((x) => x.to === 'mona@example.test' && x.subject.includes('confirmed'));
check('guest is emailed the confirmation with the payment link and the note', !!confirmedMail && confirmedMail.html.includes('/api/pay?ref=' + ref) && confirmedMail.html.includes('Room 12'), m.map((x) => x.subject));

// ---- guest pays
await page.goto(`${base}/en/booking/?ref=${ref}`, { waitUntil: 'networkidle' });
await page.fill('#m-phone', '+20 100 123 4567'); await page.click('#find button[type=submit]');
await page.waitForSelector('#pay-now:not([hidden])');
check('my reservation: confirmed, with the hotel note and a pay button', (await page.textContent('[data-m=status]')).includes('Confirmed') && (await page.textContent('#m-note')).includes('Room 12'), await page.textContent('[data-m=status]'));
await shot('mine-confirmed');
await page.click('#pay-now');
await page.waitForSelector('#fake-pay');
check('payment page shows the amount', (await page.textContent('#amount')).includes('9,600'), await page.textContent('#amount'));
await page.click('#fake-pay');
await page.waitForSelector('#found:not([hidden])');
check('back on my reservation: paid, no pay or cancel button', (await page.textContent('#m-msg')).includes('received your payment') && !(await page.isVisible('#pay-now')) && !(await page.isVisible('#cancel')), await page.textContent('#m-msg'));
await shot('mine-paid');
m = await mails(ref);
check('payment emails go to the guest and the booking team', m.some((x) => x.to === 'mona@example.test' && x.subject.includes('Payment received')) && m.some((x) => x.subject.includes('تم الدفع')), m.map((x) => x.subject));
check('a paid request cannot be cancelled by the guest', (await post('requests/cancel', { ref, phone: '01001234567' })).status === 409, null);

// ---- decline, and a guest cancelling
const second = await (await post('requests', stayBody({ name: 'Declined Guest', email: 'no@example.test' }))).json();
await admin.click('.chips button:nth-child(1)');
await admin.waitForSelector(`[data-ref="${second.ref}"]`);
await admin.fill(`[data-ref="${second.ref}"] textarea[name=note]`, 'We are full on these dates.');
await admin.click(`[data-ref="${second.ref}"] [data-move=declined]`);
await admin.waitForSelector(`[data-ref="${second.ref}"]`, { state: 'detached' });
const declined = await (await post('requests/find', { ref: second.ref, phone: '01007654321' })).json();
check('declined request shows as declined with the note', declined.status === 'declined' && declined.hotelNote.includes('full') && declined.payUrl === null, declined);
check('guest is emailed the decline', (await mails(second.ref)).some((x) => x.to === 'no@example.test' && x.html.includes('We are full')), null);
const cancelled = await (await post('requests/cancel', { ref: cheap.ref, phone: '0100 765 4321' })).json();
check('guest can cancel a pending request', cancelled.status === 'cancelled', cancelled.status);
check('booking team is emailed the cancellation', (await mails(cheap.ref)).some((x) => x.subject.includes('ألغى')), null);

// ---- rooms and prices
await admin.click('[data-tab=rooms]');
await admin.waitForSelector('[data-room="1"]');
await admin.fill('[data-room="1"] input[name=price_bb]', '1700');
await admin.click('[data-room="1"] form button[type=submit]');
await admin.waitForSelector('#toast:not([hidden]):not(.bad)');
await admin.click('#add-room');
await admin.waitForSelector('[data-room=new]');
const nr = '[data-room=new] ';
await admin.fill(nr + 'input[name=name_ar]', 'غرفة عائلية'); await admin.fill(nr + 'input[name=name_en]', 'Family room');
await admin.fill(nr + 'textarea[name=desc_en]', 'Two rooms with a door between them.'); await admin.fill(nr + 'textarea[name=desc_ar]', 'غرفتان بينهما باب.');
await admin.fill(nr + 'textarea[name=facilities_en]', 'Sleeps: 4 adults\nBalcony'); await admin.fill(nr + 'textarea[name=facilities_ar]', 'تتسع لـ: 4 بالغين\nشرفة');
await admin.fill(nr + 'input[name=price_ro]', '2500'); await admin.fill(nr + 'input[name=price_bb]', '2700'); await admin.fill(nr + 'input[name=price_hb]', '3000');
await admin.fill(nr + 'input[name=adults]', '4');
await admin.click(nr + 'form button[type=submit]');
await admin.waitForSelector('[data-room=new]', { state: 'detached' });
if (shots) await admin.screenshot({ path: `${shots}/admin-rooms.png`, fullPage: true });
await page.goto(`${base}/en/?in=2026-12-01&out=2026-12-04&rooms=1&plan=bb`, { waitUntil: 'networkidle' });
check('changed price shows on the site', (await page.textContent('[data-price=bb]')) === '1,700' && (await page.textContent('[data-f=total]')) === '5,100', await page.textContent('[data-price=bb]'));
check('two rooms give a room chooser', (await page.locator('.plans [data-roomtabs] button').count()) === 2, null);
await page.click('.plans [data-roomtabs] button:nth-child(2)');
check('choosing the family room changes prices, bill and room text', (await page.textContent('[data-price=bb]')) === '2,700' && (await page.textContent('[data-f=room]')) === 'Family room' && (await page.textContent('#room-name')) === 'Family room' && (await page.textContent('#room-spec')).includes('Balcony'), await page.textContent('[data-f=room]'));
await shot('home-family');
await page.click('#cta');
await page.waitForSelector('#step-1:not([hidden])');
check('request form carries the family room', (await page.textContent('[data-f=room]')) === 'Family room' && (await page.textContent('[data-f=total]')) === '8,100' && (await page.locator('#g-adults option').count()) === 4, await page.textContent('[data-f=total]'));
await page.fill('#g-name', 'Family Guest'); await page.fill('#g-phone', '01005550000');
await page.click('#step-1 button[type=submit]'); await page.click('#confirm');
await page.waitForSelector('#step-3:not([hidden])');
const fam = await (await post('requests/find', { ref: await page.textContent('#ref'), phone: '01005550000' })).json();
check('family request stored with its room and price', fam.roomName.en === 'Family room' && fam.total === 8100, fam);

// ---- photos, logo, texts, contact
const dir = mkdtempSync(tmpdir() + '/rr-');
await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#1553b6' } }).jpeg().toFile(`${dir}/photo.jpg`);
await sharp({ create: { width: 800, height: 300, channels: 4, background: { r: 21, g: 83, b: 182, alpha: 0.5 } } }).png().toFile(`${dir}/logo.png`);
await admin.click('[data-tab=photos]');
await admin.waitForSelector('.thumb');
const before = await admin.locator('.thumb').count();
await admin.setInputFiles('#view input[type=file]', `${dir}/photo.jpg`);
await admin.waitForFunction((n) => document.querySelectorAll('.thumb').length === n + 1, before);
await admin.setInputFiles('#view input[type=file]', { name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a picture') });
await admin.waitForSelector('#toast.bad:not([hidden])');
check('a file that is not a picture is refused with a message', (await admin.locator('.thumb').count()) === before + 1, await admin.textContent('#toast'));
await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
check('uploaded photo is on the site', (await page.locator('#look-grid figure').count()) === before + 1, await page.locator('#look-grid figure').count());
const newThumb = admin.locator('.thumb').last();
await newThumb.locator('button.danger').click(); await newThumb.locator('button.danger').click();
await admin.waitForFunction((n) => document.querySelectorAll('.thumb').length === n, before);

await admin.click('[data-tab=settings]');
await admin.waitForSelector('#logo-card');
await admin.setInputFiles('#logo-card input[type=file]', `${dir}/logo.png`);
await admin.waitForSelector('#logo-card img.logo-box');
await admin.fill('input[name=phone]', '+20 100 000 0001');
await admin.click('#view form button[type=submit]');
await admin.waitForSelector('#toast:not([hidden]):not(.bad)');
check('online payment shows as test mode', (await admin.textContent('#pay-state')).includes('Test mode'), await admin.textContent('#pay-state'));
if (shots) await admin.screenshot({ path: `${shots}/admin-settings.png`, fullPage: true });
await admin.click('[data-tab=texts]');
await admin.waitForSelector('textarea[name="hero.h1a|en"]');
await admin.fill('textarea[name="hero.h1a|en"]', 'Stay by the pool.');
await admin.click('#view form button[type=submit]');
await admin.waitForSelector('#toast:not([hidden]):not(.bad)');
await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
check('logo replaces the written name', (await page.locator('.brand img.brand-logo').count()) === 1, null);
check('edited headline shows', (await page.textContent('[data-t="hero.h1a"]')) === 'Stay by the pool.', await page.textContent('[data-t="hero.h1a"]'));
check('edited phone shows in header and footer', (await page.locator('[data-live=tel]').allTextContents()).every((x) => x === '+20 100 000 0001') && (await page.getAttribute('.hdr [data-live=tel]', 'href')) === 'tel:+201000000001', await page.locator('[data-live=tel]').allTextContents());
await shot('home-edited');
await page.goto(`${base}/?room=1`, { waitUntil: 'networkidle' });
check('Arabic page takes the dashboard content too', (await page.textContent('#room-name')) === 'غرفة مزدوجة قياسية' && (await page.locator('.plans [data-roomtabs] button').count()) === 2, await page.textContent('#room-name'));
await shot('home-ar');

// ---- put the content back as it was, then sign out
await admin.fill('textarea[name="hero.h1a|en"]', '');
await admin.click('#view form button[type=submit]');
await admin.waitForSelector('#toast:not([hidden]):not(.bad)');
await admin.click('[data-tab=settings]');
await admin.waitForSelector('#logo-card img.logo-box');
await admin.fill('input[name=phone]', '+20 103 665 4930');
await admin.click('#view form button[type=submit]');
await admin.click('#logo-card button.danger'); await admin.click('#logo-card button.danger');
await admin.waitForSelector('#logo-card img.logo-box', { state: 'detached' });
await admin.click('[data-tab=rooms]');
await admin.waitForSelector('[data-room="1"]');
await admin.fill('[data-room="1"] input[name=price_bb]', '1600');
await admin.click('[data-room="1"] form button[type=submit]');
await admin.waitForSelector('#toast:not([hidden]):not(.bad)');
const famCard = admin.locator('section[data-room]').last();
await famCard.locator('form button.danger').click(); await famCard.locator('form button.danger').click();
await admin.waitForFunction(() => document.querySelectorAll('section[data-room]').length === 1);
await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
check('site is back to one room, written name, own headline', (await page.locator('.plans [data-roomtabs] button').count()) === 0 && (await page.locator('.brand img').count()) === 0 && (await page.textContent('[data-t="hero.h1a"]')) === 'Sleep here.' && (await page.textContent('[data-price=bb]')) === '1,600', null);
if (shots) { await admin.click('[data-tab=requests]'); await admin.click('text=العربية'); await admin.waitForSelector('.chips'); await admin.screenshot({ path: `${shots}/admin-ar.png`, fullPage: true }); }
await admin.click('#sign-out');
await admin.waitForSelector('.login');
check('signed out: dashboard data is closed again', (await admin.evaluate(() => fetch('../api/admin/requests').then((r) => r.status))) === 401, null);
check('no page errors', errors.length === 0, errors);
await browser.close();
console.log(failed ? `${failed} FAILED` : 'all passed');
process.exit(failed ? 1 : 0);
