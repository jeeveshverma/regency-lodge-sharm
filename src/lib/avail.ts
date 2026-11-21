/**
 * DEMO availability for the design preview: which of the 20 rooms are free for a stay. The pattern
 * is made up from the date (stable, so the same dates always show the same keys). The booking
 * system replaces this one function with a call to GET /api/availability.
 */
import { SITE } from '../data/site';
import { nightDates, parse, type Stay } from './stay';

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) % 100;
}

/** A room is taken in made-up three-night blocks, about one block in three. */
const taken = (room: number, date: string) => hash(room, Math.floor((+parse(date) / 864e5 + room * 2) / 3)) < 34;

/** Room numbers free on every night of the stay. */
export function freeRooms(s: Stay): number[] {
  const nights = nightDates(s);
  const out: number[] = [];
  for (let r = 1; r <= SITE.rooms; r++) if (!nights.some((d) => taken(r, d))) out.push(r);
  return out;
}
