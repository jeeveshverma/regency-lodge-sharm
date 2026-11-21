/** Small helpers the page scripts share. Client-side only. */
import { fmtDate, money, plural, quote, type Stay } from './stay';

export type Strings = Record<string, Record<string, string>>;
export const strings = () => JSON.parse(document.getElementById('strings')!.textContent!) as Strings;
export const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element ${sel}`);
  return el;
};
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));

export const stayLine = (s: { rooms: number }, nights: number, S: Strings, lang: string) =>
  `${plural(S.folio.nights, nights, lang)} × ${plural(S.folio.roomsN, s.rooms, lang)}`;

/** Fill a bill (Folio.astro) with a stay; returns the price quote. Unpriced dates hide the money lines. */
export function fillFolio(root: ParentNode, stay: Stay, S: Strings, lang: string) {
  const q = quote(stay);
  const set = (k: string, v: string) => { $(`[data-f=${k}]`, root).textContent = v; };
  set('in', fmtDate(stay.in, lang));
  set('out', fmtDate(stay.out, lang));
  set('stay', stayLine(stay, q.nights, S, lang));
  set('plan', S.plans[stay.plan]);
  set('rate', money(q.rate));
  set('total', money(q.total));
  for (const el of root.querySelectorAll<HTMLElement>('[data-priced]')) el.hidden = q.onRequest;
  $('[data-onreq]', root).hidden = !q.onRequest;
  return q;
}
