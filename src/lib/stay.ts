/**
 * The guest's stay: dates, number of rooms and meal plan. It lives in the URL (a link reproduces
 * the search) and in sessionStorage (it survives moving between pages); the URL wins. Client-side.
 */
import { PLANS, RATES, type PlanId } from '../data/site';

/** `room` is the room category's id from the dashboard; absent on the static preview, which has one room. */
export interface Stay { in: string; out: string; rooms: number; plan: PlanId; room?: number }

const KEY = 'rl-stay';
export const MAX_ROOMS = 5;

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s: string) => new Date(s + 'T00:00:00');
export const plusDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/** Dates from today on, check-out after check-in (at most 30 nights), 1..MAX_ROOMS rooms, a known plan. */
export function normalise(s: Partial<Stay>): Stay {
  const t = today();
  const ok = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(+parse(v));
  let a = ok(s.in) ? parse(s.in!) : plusDays(t, 1);
  if (a < t) a = t;
  let b = ok(s.out) ? parse(s.out!) : plusDays(a, 2);
  if (b <= a) b = plusDays(a, 1);
  if (+b - +a > 30 * 864e5) b = plusDays(a, 30);
  const rooms = Math.max(1, Math.min(MAX_ROOMS, Math.round(Number(s.rooms)) || 1));
  const plan = PLANS.some((p) => p.id === s.plan) ? s.plan! : 'bb';
  const room = Math.round(Number(s.room)) || undefined;
  return { in: iso(a), out: iso(b), rooms, plan, ...(room ? { room } : {}) };
}

export function readStay(): Stay {
  let saved: Partial<Stay> = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { /* private window: start fresh */ }
  const q = new URLSearchParams(location.search);
  const url: Partial<Stay> = {};
  if (q.get('in')) url.in = q.get('in')!;
  if (q.get('out')) url.out = q.get('out')!;
  if (q.get('rooms')) url.rooms = Number(q.get('rooms'));
  if (q.get('plan')) url.plan = q.get('plan') as PlanId;
  if (q.get('room')) url.room = Number(q.get('room'));
  return normalise({ ...saved, ...url });
}

export function writeStay(s: Partial<Stay>): Stay {
  const n = normalise(s);
  try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private window: the URL still carries it */ }
  const q = new URLSearchParams(location.search);
  q.set('in', n.in); q.set('out', n.out); q.set('rooms', String(n.rooms)); q.set('plan', n.plan);
  if (n.room) q.set('room', String(n.room)); else q.delete('room');
  history.replaceState(history.state, '', `${location.pathname}?${q}${location.hash}`);
  return n;
}

/** The stay as a query string, for links between pages. */
export const stayQuery = (s: Stay) => new URLSearchParams({ in: s.in, out: s.out, rooms: String(s.rooms), plan: s.plan, ...(s.room ? { room: String(s.room) } : {}) }).toString();

/** The nights of a stay, as the date each night starts. */
export function nightDates(s: Stay): string[] {
  const out: string[] = [];
  for (let d = parse(s.in); d < parse(s.out); d = plusDays(d, 1)) out.push(iso(d));
  return out;
}

/** Price of the stay, or `onRequest` when a night falls after the published prices end. */
export function quote(s: Stay, plan: PlanId = s.plan) {
  const nights = nightDates(s);
  const rate = PLANS.find((p) => p.id === plan)!.price;
  const onRequest = RATES.until !== '' && nights.some((d) => d > RATES.until);
  return { nights: nights.length, rate, total: nights.length * s.rooms * rate, onRequest };
}

export const money = (n: number) => n.toLocaleString('en-US');

/** Arabic is formatted by hand: Safari and Chrome disagree on Arabic day and month names. */
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function fmtDate(s: string, lang: string): string {
  const d = parse(s);
  if (lang === 'ar') return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "1 night|{n} nights"; Arabic has four forms: one | two | 3-10 | 11 and more. */
export function plural(forms: string, n: number, lang: string): string {
  const f = forms.split('|');
  const i = lang === 'ar' && f.length === 4 ? (n === 1 ? 0 : n === 2 ? 1 : n <= 10 ? 2 : 3) : n === 1 ? 0 : f.length - 1;
  return f[i].replace('{n}', String(n));
}
