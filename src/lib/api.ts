/**
 * The booking API as the pages see it: availability, create, find, cancel.
 *
 * PREVIEW implementation: bookings are kept in this browser's localStorage on top of the sample
 * availability in avail.ts, so the whole flow can be tried on a static page. The real backend
 * replaces the bodies of these four functions with calls to /api/*; the pages do not change.
 */
import { freeRooms as sampleFree } from './avail';
import { quote, type Stay } from './stay';
import type { PlanId } from '../data/site';

export interface Guest { name: string; phone: string; email: string; adults: number; children: number; bed: 'double' | 'twin'; arrival: string; note: string }
export interface Booking extends Guest { ref: string; in: string; out: string; rooms: number; plan: PlanId; nights: number; rate: number; total: number; status: 'confirmed' | 'cancelled'; created: string; roomNos: number[] }

export type BookingErrorCode = 'no_rooms' | 'on_request' | 'not_found' | 'storage';
export class BookingError extends Error {
  constructor(public code: BookingErrorCode, cause?: unknown) { super(code, { cause }); }
}

const KEY = 'rl-bookings';
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
const overlaps = (b: { in: string; out: string }, s: { in: string; out: string }) => b.in < s.out && s.in < b.out;

/** Room numbers free on every night of the stay. */
export async function availability(s: Stay): Promise<number[]> {
  const held = new Set(load().filter((b) => b.status === 'confirmed' && overlaps(b, s)).flatMap((b) => b.roomNos));
  return sampleFree(s).filter((r) => !held.has(r));
}

function newRef(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
  return 'RL-' + [...crypto.getRandomValues(new Uint8Array(5))].map((b) => abc[b % abc.length]).join('');
}

/** Hold the rooms. Fails with `no_rooms` if they went in the meantime, `on_request` if the dates have no price. */
export async function createBooking(s: Stay, g: Guest): Promise<Booking> {
  const q = quote(s);
  if (q.onRequest) throw new BookingError('on_request');
  const free = await availability(s);
  if (free.length < s.rooms) throw new BookingError('no_rooms');
  const b: Booking = { ...g, ref: newRef(), in: s.in, out: s.out, rooms: s.rooms, plan: s.plan, nights: q.nights, rate: q.rate, total: q.total, status: 'confirmed', created: new Date().toISOString(), roomNos: free.slice(0, s.rooms) };
  save([...load(), b]);
  return b;
}

const same = (b: Booking, ref: string, phone: string) => b.ref === ref.trim().toUpperCase() && phoneKey(b.phone) === phoneKey(phone);

/** A booking by its number and the phone it was made with. */
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
