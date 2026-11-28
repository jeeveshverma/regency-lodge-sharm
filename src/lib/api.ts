/**
 * The reservation API as the pages see it: send a request, find it, cancel it.
 *
 * The hotel checks availability by hand, so a request starts as `pending` and the booking team
 * confirms or declines it. Nothing here knows which rooms are free.
 *
 * PREVIEW implementation: requests are kept in this browser's localStorage, so the whole flow can be
 * tried on a static page. The real backend replaces the bodies of these three functions with calls
 * to /api/*; the pages do not change.
 */
import { quote, type Stay } from './stay';
import type { PlanId } from '../data/site';

export type Pay = 'arrival' | 'online';
export type Status = 'pending' | 'confirmed' | 'declined' | 'cancelled';
export interface Guest { name: string; phone: string; email: string; adults: number; children: number; bed: 'double' | 'twin'; arrival: string; pay: Pay; note: string }
export interface Booking extends Guest { ref: string; in: string; out: string; rooms: number; plan: PlanId; nights: number; rate: number; total: number; status: Status; created: string }

export type BookingErrorCode = 'on_request' | 'not_found' | 'storage';
export class BookingError extends Error {
  constructor(public code: BookingErrorCode, cause?: unknown) { super(code, { cause }); }
}

const KEY = 'rr-requests';
function load(): Booking[] {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch (e) { throw new BookingError('storage', e); }
  return raw ? (JSON.parse(raw) as Booking[]) : [];
}
function save(list: Booking[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { throw new BookingError('storage', e); }
}

/** Phone numbers compare by their digits, without a leading 0, 20 or 0020. */
export const phoneKey = (p: string) => p.replace(/\D/g, '').replace(/^(0020|20|0)/, '');

function newRef(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
  return 'RR-' + [...crypto.getRandomValues(new Uint8Array(5))].map((b) => abc[b % abc.length]).join('');
}

/** Record the request as pending. Fails with `on_request` if the dates have no price. */
export async function createBooking(s: Stay, g: Guest): Promise<Booking> {
  const q = quote(s);
  if (q.onRequest) throw new BookingError('on_request');
  const b: Booking = { ...g, ref: newRef(), in: s.in, out: s.out, rooms: s.rooms, plan: s.plan, nights: q.nights, rate: q.rate, total: q.total, status: 'pending', created: new Date().toISOString() };
  save([...load(), b]);
  return b;
}

const same = (b: Booking, ref: string, phone: string) => b.ref === ref.trim().toUpperCase() && phoneKey(b.phone) === phoneKey(phone);

/** A request by its number and the phone it was made with. */
export async function findBooking(ref: string, phone: string): Promise<Booking> {
  const b = load().find((x) => same(x, ref, phone));
  if (!b) throw new BookingError('not_found');
  return b;
}

export async function cancelBooking(ref: string, phone: string): Promise<Booking> {
  const list = load();
  const b = list.find((x) => same(x, ref, phone));
  if (!b) throw new BookingError('not_found');
  b.status = 'cancelled';
  save(list);
  return b;
}
