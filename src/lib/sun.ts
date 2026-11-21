/** Sunrise and sunset for a date and place, in minutes after local midnight: the usual NOAA approximation, good to a few minutes. */
export function sunTimes(date: Date, lat: number, lng: number, utcOffsetHours: number): { rise: number; set: number } {
  const rad = Math.PI / 180;
  const n = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 864e5);
  const g = ((2 * Math.PI) / 365) * (n - 1 + 0.5);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad;
  const noon = 720 - 4 * lng - eqTime + utcOffsetHours * 60;
  return { rise: Math.round(noon - 4 * ha), set: Math.round(noon + 4 * ha) };
}

export const hhmm = (minutes: number) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** Egypt's clock offset from UTC at a moment (2, or 3 in summer time). */
export function cairoOffsetHours(at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', timeZoneName: 'shortOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = name.match(/GMT([+-]\d+)/);
  return m ? Number(m[1]) : 2;
}
