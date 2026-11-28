/**
 * What the hotel manages in its dashboard, read from the backend when the page opens: name, logo,
 * contact details, room categories with prices and photos, the photo wall and some of the texts.
 *
 * The pages are built with the same content inside them, so they still read correctly before this
 * arrives and when it cannot be fetched. Without a backend (PUBLIC_API unset: the static preview)
 * nothing here runs.
 */
import { SITE, PLANS, RATES, type PlanId } from '../data/site';

export const API: string = import.meta.env.PUBLIC_API || '';

type Pair = { ar: string; en: string };
export interface Photo { src: string; small: string; cap: Pair; wide: boolean }
export interface LiveRoom { id: number; name: Pair; desc: Pair; facilities: { ar: string[]; en: string[] }; adults: number; children: number; prices: Record<PlanId, number>; photos: Photo[] }
export interface Live {
  name: Pair | null; logo: string | null; address: Pair | null;
  contact: { phone: string; whatsapp: string; email: string };
  checkIn: string; checkOut: string; ratesUntil: string;
  rooms: LiveRoom[]; gallery: Photo[]; texts: Record<string, Pair>; payOnline: boolean;
}

const digits = (s: string) => s.replace(/\D/g, '');
const fillPrice = (s: string, price: string) => s.replace(/\{price\}/g, price);

let cache: Promise<Live | null> | undefined;
/** The dashboard's content, fetched once per page. `null` on the static preview or when the backend cannot be reached. */
export function loadLive(): Promise<Live | null> {
  if (!API) return Promise.resolve(null);
  return (cache ??= fetch(`${API}/site`)
    .then((r) => { if (!r.ok) throw new Error(`GET ${API}/site answered ${r.status}`); return r.json() as Promise<Live>; })
    .then((live) => {
      if (digits(live.contact.whatsapp)) SITE.whatsapp = digits(live.contact.whatsapp);
      SITE.checkIn = live.checkIn; SITE.checkOut = live.checkOut;
      RATES.until = live.ratesUntil;
      return live;
    })
    // the page keeps the content it was built with; sending a request will report the failure itself
    .catch((e) => { console.error('Live content is unavailable, showing the built-in content.', e); return null; }));
}

/** The room the guest chose (or the first one); its prices become the prices every page works with. */
export function pickRoom(live: Live, id?: number): LiveRoom | null {
  const room = live.rooms.find((r) => r.id === id) ?? live.rooms[0] ?? null;
  if (room) for (const p of PLANS) p.price = room.prices[p.id];
  return room;
}

export const fromPrice = (live: Live) => Math.min(...live.rooms.flatMap((r) => Object.values(r.prices)));

/** A photo from the dashboard as an <img>: the small file on phones, the large one on wide screens. */
export function photoImg(p: Photo, lang: 'ar' | 'en', sizes: string): HTMLImageElement {
  const img = new Image();
  img.loading = 'lazy'; img.decoding = 'async';
  img.alt = p.cap[lang];
  img.sizes = sizes;
  img.srcset = `${p.small} 640w, ${p.src} 1600w`;
  img.src = p.small;
  return img;
}

/** Name, logo, contact details and edited texts: the parts every page has. */
export function applyCommon(live: Live, lang: 'ar' | 'en') {
  const all = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
  const c = live.contact;
  if (c.phone) for (const a of all('[data-live=tel]')) { (a as HTMLAnchorElement).href = `tel:+${digits(c.phone).replace(/^0/, '20')}`; a.textContent = c.phone; }
  if (digits(c.whatsapp)) {
    for (const a of all('[data-live=wa]')) (a as HTMLAnchorElement).href = `https://wa.me/${digits(c.whatsapp)}`;
    for (const a of all('[data-live=wa-text]')) a.textContent = c.whatsapp;
  }
  if (c.email) for (const a of all('[data-live=email]')) { (a as HTMLAnchorElement).href = `mailto:${c.email}`; a.textContent = c.email; }
  if (live.address?.[lang]) for (const el of all('[data-live=address]')) el.textContent = live.address[lang];
  if (live.name) {
    for (const el of all('[data-live=name-ar]')) el.textContent = live.name.ar;
    for (const el of all('[data-live=name-en]')) el.textContent = live.name.en;
  }
  if (live.logo) {
    for (const brand of all('.brand')) {
      const img = new Image();
      img.src = live.logo; img.alt = live.name?.[lang] ?? SITE.name[lang]; img.className = 'brand-logo';
      brand.replaceChildren(img);
    }
  }
  // texts: an edited wording replaces the built-in one; {price} is the lowest nightly price
  const price = live.rooms.length ? fromPrice(live).toLocaleString('en-US') : '';
  for (const el of all('[data-t]')) {
    const tpl = live.texts[el.dataset.t!]?.[lang] || el.dataset.tpl;
    if (tpl && price) el.textContent = fillPrice(tpl, price);
    else if (tpl && !tpl.includes('{price}')) el.textContent = tpl;
  }
  if (price) for (const el of all('[data-live=from]')) el.textContent = price;
}
