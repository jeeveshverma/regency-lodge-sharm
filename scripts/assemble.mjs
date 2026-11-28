// Build the folder that goes on the hotel's hosting: the site (built to talk to /api), the PHP API,
// the dashboard, and the first content for a new installation.
//   node scripts/assemble.mjs            -> ./deploy
// Upload the contents of ./deploy to the web root (public_html), then follow server/README.md.
// `uploads/` and `api/config.php` inside ./deploy are left alone, so a running local copy keeps its data.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const at = (p) => root + p;
const out = at('deploy');

execFileSync('npx', ['astro', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, PUBLIC_API: '/api', BASE: '/', SITE: process.env.SITE || 'https://example.com' } });

mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
  if (name === 'uploads') continue;
  if (name === 'api') { for (const f of readdirSync(`${out}/api`)) if (f !== 'config.php') rmSync(`${out}/api/${f}`, { recursive: true, force: true }); continue; }
  rmSync(`${out}/${name}`, { recursive: true, force: true });
}
cpSync(at('dist'), out, { recursive: true });
cpSync(at('server/api'), `${out}/api`, { recursive: true });
cpSync(at('server/admin'), `${out}/admin`, { recursive: true });
cpSync(at('server/config.sample.php'), `${out}/api/config.sample.php`);
mkdirSync(`${out}/uploads`, { recursive: true });
cpSync(at('server/uploads/.htaccess'), `${out}/uploads/.htaccess`);

// first content
const base = JSON.parse(readFileSync(at('server/seed.base.json'), 'utf8'));
const dict = { ar: JSON.parse(readFileSync(at('src/i18n/ar.json'), 'utf8')), en: JSON.parse(readFileSync(at('src/i18n/en.json'), 'utf8')) };
const t = (lang, key) => {
  const v = key.split('.').reduce((o, k) => o?.[k], dict[lang]);
  if (typeof v !== 'string') throw new Error(`Missing text "${key}" for ${lang}`);
  return v;
};
const seedDir = `${out}/api/seed`;
mkdirSync(`${seedDir}/photos`, { recursive: true });
async function photo(name) {
  const src = at(`src/assets/photos/${name}.jpg`);
  if (!existsSync(src)) throw new Error(`Seed photo ${src} is missing`);
  await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(`${seedDir}/photos/${name}.jpg`);
  await sharp(src).rotate().resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(`${seedDir}/photos/${name}-s.jpg`);
  return `${name}.jpg`;
}
const r = base.room;
const facilities = (lang) => r.spec.map((k) => `${t(lang, `room.${k}`)}: ${t(lang, `room.${k}V`)}`).join('\n');
const seed = {
  settings: base.settings,
  rooms: [{
    name_ar: r.name.ar, name_en: r.name.en, desc_ar: t('ar', 'room.lead'), desc_en: t('en', 'room.lead'), facilities_ar: facilities('ar'), facilities_en: facilities('en'),
    adults: r.adults, children: r.children, price_ro: r.price_ro, price_bb: r.price_bb, price_hb: r.price_hb,
    photos: await Promise.all(r.photos.map(async (name, i) => ({ file: await photo(name), cap_ar: t('ar', `room.alt${i + 1}`), cap_en: t('en', `room.alt${i + 1}`) }))),
  }],
  gallery: await Promise.all(base.gallery.map(async ([name, key, wide]) => ({ file: await photo(name), cap_ar: t('ar', `look.${key}`), cap_en: t('en', `look.${key}`), wide: !!wide }))),
};
writeFileSync(`${seedDir}/seed.json`, JSON.stringify(seed, null, 1));
// the texts the dashboard can change, with the site's own wording as the default
writeFileSync(`${seedDir}/texts.json`, JSON.stringify(Object.fromEntries(base.texts.map((k) => [k, { ar: t('ar', k), en: t('en', k) }])), null, 1));
console.log(`deploy/ is ready: ${seed.gallery.length + seed.rooms[0].photos.length} seed photos, ${base.texts.length} editable texts`);
