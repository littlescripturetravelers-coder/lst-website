// Calendar building blocks shared by the Day, Week, Month and Year views and the event screens.
// Family events can repeat (daily, weekly, every 2 weeks, monthly, yearly) and skip single days (exdates).
// All-day events are stored at noon UTC on their date(s) so the date is the same in every time zone.
import { todayISO } from './dates';

export type CalKind = 'event' | 'outside' | 'busy' | 'annual' | 'reminder';
export type CalItem = {
  key: string; kind: CalKind; id?: string; title: string; start: Date; end: Date; allDay: boolean;
  color?: string; area?: string; lock?: boolean; sub?: string; location?: string | null; occ: string; done?: boolean; source?: string; row?: any;
};
export type EventRow = {
  id: string; family_id: string; title: string; starts_at: string; ends_at?: string | null; all_day?: boolean; area?: string | null; who?: string[] | null;
  alert?: string | null; repeat?: string | null; repeat_until?: string | null; exdates?: string[] | null; notes?: string | null; location?: string | null; url?: string | null;
  private?: boolean; owner_id?: string | null; interest_id?: string | null;
};

export const REPEATS: [string, string][] = [['', 'Never'], ['daily', 'Every Day'], ['weekly', 'Every Week'], ['biweekly', 'Every 2 Weeks'], ['monthly', 'Every Month'], ['yearly', 'Every Year']];
export const EVENT_ALERTS: [string, string][] = [['none', 'None'], ['at', 'At time of event'], ['5', '5 minutes before'], ['15', '15 minutes before'], ['30', '30 minutes before'], ['60', '1 hour before'], ['120', '2 hours before'], ['1d', '1 day before'], ['2d', '2 days before'], ['1w', '1 week before']];
export const repeatLabel = (r?: string | null) => REPEATS.find(x => x[0] === (r ?? ''))?.[1] ?? 'Never';
export const alertLabel = (a?: string | null) => EVENT_ALERTS.find(x => x[0] === (a ?? 'none'))?.[1] ?? 'None';

export const DAY = 864e5;
export const iso = (d: Date) => todayISO(d);
export const atMidnight = (s: string) => new Date(s + 'T00:00:00');
export const startOfWeek = (s: string) => { const d = atMidnight(s); d.setDate(d.getDate() - d.getDay()); return iso(d); };
export const shiftDays = (s: string, n: number) => { const d = atMidnight(s); d.setDate(d.getDate() + n); return iso(d); };
export const hm = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const hourLabel = (h: number) => h === 0 || h === 24 ? '12 AM' : h === 12 ? 'Noon' : (h % 12) + (h < 12 ? ' AM' : ' PM');
/** The date an all-day row is on (stored at noon UTC, so the UTC date is the intended date). */
export const allDayDate = (ts: string) => ts.slice(0, 10);
/** What an all-day date is stored as. */
export const allDayStamp = (s: string) => s + 'T12:00:00Z';

/** The real start/end of an event's first occurrence. All-day events cover whole local days. */
function baseTimes(e: EventRow) {
  if (e.all_day) {
    const s = atMidnight(allDayDate(e.starts_at)); const last = e.ends_at ? allDayDate(e.ends_at) : allDayDate(e.starts_at);
    const end = atMidnight(last); end.setDate(end.getDate() + 1); return { start: s, end: end > s ? end : new Date(+s + DAY) };
  }
  const s = new Date(e.starts_at); const end = e.ends_at ? new Date(e.ends_at) : new Date(+s + 3600e3);
  return { start: s, end: end > s ? end : new Date(+s + 15 * 60e3) };
}

/** The nth occurrence's start, or null when that month has no such day (Apple skips the 31st in short months). */
function nth(start: Date, repeat: string, n: number): Date | null {
  const d = new Date(start);
  if (repeat === 'daily') d.setDate(d.getDate() + n);
  else if (repeat === 'weekly') d.setDate(d.getDate() + 7 * n);
  else if (repeat === 'biweekly') d.setDate(d.getDate() + 14 * n);
  else if (repeat === 'monthly') { d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); if (start.getDate() > last) return null; d.setDate(start.getDate()); }
  else if (repeat === 'yearly') { d.setDate(1); d.setFullYear(d.getFullYear() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); if (start.getDate() > last) return null; d.setDate(start.getDate()); }
  else return n === 0 ? d : null;
  return d;
}
const STEP_DAYS: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 31, yearly: 366 }; // upper bounds, so the jump never skips an occurrence

/** Every occurrence of a family event that overlaps [from, to). */
export function expandEvent(e: EventRow, from: Date, to: Date): CalItem[] {
  const { start, end } = baseTimes(e); const dur = +end - +start; const out: CalItem[] = [];
  const make = (s: Date): CalItem => ({ key: 'ev:' + e.id + ':' + iso(s), kind: 'event', id: e.id, title: e.title, start: s, end: new Date(+s + dur), allDay: !!e.all_day,
    area: e.area ?? 'home', lock: !!e.private, location: e.location, occ: iso(s), row: e });
  if (!e.repeat) { if (start < to && end > from) out.push(make(start)); return out; }
  const skip = new Set(e.exdates || []);
  // Jump close to the window instead of walking every occurrence since the first one.
  let n = Math.max(0, Math.floor((+from - +start - dur) / (STEP_DAYS[e.repeat] * DAY)) - 2);
  for (let guard = 0; guard < 800; guard++, n++) {
    const s = nth(start, e.repeat, n); if (!s) continue;
    if (s >= to) break;
    if (e.repeat_until && iso(s) > e.repeat_until) break;
    if (+s + dur > +from && !skip.has(iso(s))) out.push(make(s));
  }
  return out;
}

/** Does the item touch this local day? */
export function onDay(it: { start: Date; end: Date; allDay: boolean }, s: string) {
  const d0 = atMidnight(s), d1 = new Date(+d0 + DAY);
  return it.allDay ? it.start < d1 && it.end > d0 : it.start < d1 && (it.end > d0 || +it.start === +d0);
}

export type Placed = { it: CalItem; top: number; height: number; col: number; cols: number };
/** Side-by-side columns for overlapping timed items on one day, like Apple Calendar. Positions are in minutes from midnight. */
export function layoutDay(items: CalItem[], s: string): Placed[] {
  const d0 = +atMidnight(s), MIN = 60e3;
  const rows = items.filter(i => !i.allDay && onDay(i, s)).map(it => {
    const a = Math.max(0, (+it.start - d0) / MIN), b = Math.min(1440, (+it.end - d0) / MIN);
    return { it, a, b: Math.max(b, a + 20) };
  }).sort((x, y) => x.a - y.a || y.b - x.b);
  const out: Placed[] = []; let group: (typeof rows[0] & { col: number })[] = []; let groupEnd = -1;
  const flush = () => { const cols = Math.max(1, ...group.map(g => g.col + 1)); for (const g of group) out.push({ it: g.it, top: g.a, height: g.b - g.a, col: g.col, cols }); group = []; };
  for (const r of rows) {
    if (r.a >= groupEnd && group.length) flush();
    const used = new Set(group.filter(g => g.b > r.a).map(g => g.col)); let col = 0; while (used.has(col)) col++;
    group.push({ ...r, col }); groupEnd = Math.max(groupEnd, r.b);
  }
  if (group.length) flush();
  return out;
}

/** Hand an item to the event screen (for items that aren't family events: work calendars, busy time, birthdays). */
let peek: CalItem | null = null;
export const setPeek = (it: CalItem) => { peek = it; };
export const getPeek = () => peek;

/** "Tuesday, October 13, 2026" and "from 2:00 PM to 3:00 PM", the way Apple Calendar words it. */
export function whenLines(it: { start: Date; end: Date; allDay: boolean }) {
  const long = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (it.allDay) {
    const last = new Date(+it.end - DAY);
    return iso(last) === iso(it.start) ? [long(it.start), 'all-day'] : ['all-day from ' + long(it.start), 'to ' + long(last)];
  }
  if (iso(it.start) === iso(new Date(+it.end - 1))) return [long(it.start), 'from ' + hm(it.start) + ' to ' + hm(it.end)];
  return ['from ' + hm(it.start) + ' ' + long(it.start), 'to ' + hm(it.end) + ' ' + long(it.end)];
}
