// Reads a calendar or task "feed" link (.ics / webcal) — the link Asana, Todoist, Trello, Jira, ClickUp, Monday,
// Google and Outlook all offer for subscribing. Runs on the phone, so the link never leaves the device.
import ICAL from 'ical.js';

export type OutsideItem = { key: string; title: string; start: Date; end: Date; allDay: boolean; task?: boolean };

/** Every event (repeats expanded) and dated task in the feed that overlaps [from, to). */
export function parseFeed(text: string, from: Date, to: Date, prefix = ''): OutsideItem[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz);
  const out: OutsideItem[] = [];
  const add = (key: string, title: string, s: any, e: any, task = false) => {
    const start: Date = s.toJSDate(), allDay = !!s.isDate;
    const end: Date = e ? e.toJSDate() : new Date(start.getTime() + (allDay ? 864e5 : 0));
    if (end >= from && start < to) out.push({ key: prefix + key, title: title || 'Busy', start, end, allDay, task });
  };
  for (const v of root.getAllSubcomponents('vevent')) {
    const ev = new ICAL.Event(v);
    if (v.getFirstPropertyValue('status') === 'CANCELLED' || !ev.startDate) continue;
    if (ev.isRecurring()) {
      const it = ev.iterator(); let next: any; let n = 0;
      while ((next = it.next()) && n++ < 1000) {
        const d = ev.getOccurrenceDetails(next);
        if (d.startDate.toJSDate() >= to) break;
        add(ev.uid + '@' + next.toString(), d.item.summary, d.startDate, d.endDate);
      }
    } else add(ev.uid || ev.summary + ev.startDate.toString(), ev.summary, ev.startDate, ev.endDate);
  }
  for (const v of root.getAllSubcomponents('vtodo')) {
    const due = v.getFirstPropertyValue('due') as any; if (!due || v.getFirstPropertyValue('status') === 'COMPLETED') continue;
    add(String(v.getFirstPropertyValue('uid') ?? due.toString()), String(v.getFirstPropertyValue('summary') ?? 'Task'), due, null, true);
  }
  return out.sort((a, b) => +a.start - +b.start);
}

/** Accepts webcal:// and https:// links only; anything else is refused before any request is made. */
export function feedUrl(raw: string) {
  const u = raw.trim().replace(/^webcals?:\/\//i, 'https://');
  try { const p = new URL(u); return p.protocol === 'https:' ? p.toString() : null; } catch { return null; }
}
