import { Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { Family, ageOn } from '@/lib/family';
import { myOutside, shareBusyTime } from '@/lib/connections';
import { ALERT_OFFSETS, ensurePermission } from '@/lib/notifications';
import { appleFamilyCalendar } from '@/lib/eventkit';
import { Reminder } from './use-reminders';
import { CalItem, EventRow, expandEvent, iso, DAY } from '@/lib/calendar';

export type CalView = 'everyone' | 'me';

/** Every calendar item between from and to: family events (repeats expanded), birthdays, the anniversary,
 *  calendar reminders, this person's work and personal calendars, and the busy time others share.
 *  "me" keeps only this person's own items. */
export function useCalendarItems(family: Family | null | undefined, uid: string | null | undefined, reminders: Reminder[], from: Date, to: Date, view: CalView) {
  const [events, setEvents] = useState<EventRow[]>([]); const [outside, setOutside] = useState<CalItem[]>([]); const [busy, setBusy] = useState<any[]>([]);
  const fid = family?.id, a = +from, b = +to;
  const load = useCallback(async () => {
    if (!fid) return; const f = new Date(a), t = new Date(b);
    const [{ data: ev }, { data: bb }] = await Promise.all([
      supabase.from('events').select('*').eq('family_id', fid).lt('starts_at', new Date(b + DAY).toISOString())
        .or('repeat.not.is.null,starts_at.gte.' + new Date(a - DAY).toISOString() + ',ends_at.gte.' + new Date(a - DAY).toISOString()),
      supabase.from('busy_blocks').select('*').eq('family_id', fid).lt('starts_at', t.toISOString()).gt('ends_at', f.toISOString())]);
    setEvents(ev || []); setBusy(bb || []);
    myOutside(f, t).then(xs => setOutside(xs.map(x => ({ key: 'out:' + x.key, kind: 'outside' as const, title: x.title, start: x.start, end: x.end, allDay: x.allDay, color: x.color, lock: x.share === 'private', sub: x.source, source: x.source, occ: iso(x.start) })))).catch(() => setOutside([]));
  }, [fid, a, b]);
  useEffect(() => {
    load(); if (!fid) return;
    const ch = supabase.channel('ev-' + fid + '-' + a).on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: 'family_id=eq.' + fid }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const f = new Date(a), t = new Date(b); const items: CalItem[] = [];
  for (const e of events) for (const x of expandEvent(e, f, t)) if (view === 'everyone' || x.lock) items.push(x);
  items.push(...outside.filter(x => x.end > f && x.start < t));
  if (view === 'everyone' && family) {
    for (const x of busy) if (x.owner_id !== uid) { const who = family.members.find((m: any) => m.user_id === x.owner_id);
      items.push({ key: 'busy:' + x.id, kind: 'busy', title: (who?.name ?? 'Family') + ' · ' + (x.label || 'Busy'), start: new Date(x.starts_at), end: new Date(x.ends_at), allDay: !!x.all_day, color: who?.color, occ: iso(new Date(x.starts_at)), sub: who ? who.name + ' chose to share this' : undefined }); }
    for (let y = f.getFullYear(); y <= t.getFullYear(); y++) {
      const add = (md: string, title: string, area: string) => { const d = new Date(y + '-' + md + 'T00:00:00'); if (d >= new Date(+f - DAY) && d < t) items.push({ key: 'ann:' + title + y, kind: 'annual', title, start: d, end: new Date(+d + DAY), allDay: true, area, occ: iso(d) }); };
      for (const m of family.members) add(m.birthday.slice(5), m.name + '’s birthday · ' + ageOn(m.birthday, y + m.birthday.slice(4)), m.role === 'daughter' || m.role === 'son' ? 'girls' : 'home');
      if (family.anniversary) add(family.anniversary.slice(5), 'Anniversary · ' + ageOn(family.anniversary, y + family.anniversary.slice(4)) + ' years', 'marriage');
    }
  }
  for (const r of reminders) if (r.on_calendar && r.due_date && (view === 'everyone' || r.private)) {
    const s = new Date(r.due_date + 'T' + (r.due_time ? r.due_time.slice(0, 5) : '00:00') + ':00');
    if (s < t && +s + DAY > +f) items.push({ key: 'rem:' + r.id, kind: 'reminder', id: r.id, title: r.title, start: s, end: r.due_time ? new Date(+s + 30 * 60e3) : new Date(+s + DAY), allDay: !r.due_time, lock: !!r.private, done: !!r.done, occ: r.due_date, row: r });
  }
  items.sort((x, y) => Number(y.allDay) - Number(x.allDay) || +x.start - +y.start);
  return { items, reload: load };
}

/** Save a family event. Returns the saved row. */
export async function saveEvent(e: Partial<EventRow> & { family_id: string }) {
  const { id, ...rest } = e;
  const q = id ? supabase.from('events').update(rest).eq('id', id) : supabase.from('events').insert(rest);
  const { data, error } = await q.select().single(); if (error) throw error;
  syncEventsToPhone(e.family_id).catch(() => {}); return data as EventRow;
}

/** Apple's three delete choices for a repeating event. */
export async function deleteEvent(e: EventRow, mode: 'all' | 'one' | 'future', occ?: string) {
  if (mode === 'one' && occ) await supabase.from('events').update({ exdates: [...(e.exdates || []), occ] }).eq('id', e.id);
  else if (mode === 'future' && occ && occ > (e.all_day ? e.starts_at.slice(0, 10) : iso(new Date(e.starts_at)))) {
    const d = new Date(occ + 'T12:00:00'); d.setDate(d.getDate() - 1); await supabase.from('events').update({ repeat_until: iso(d) }).eq('id', e.id);
  } else await supabase.from('events').delete().eq('id', e.id);
  syncEventsToPhone(e.family_id).catch(() => {});
}

const MAP_KEY = 'apple-event-map';
/** Keeps this phone up to date: alerts for the next two weeks of family events, and a copy of each family event in the
 *  app's own calendar inside Apple Calendar (so Siri, widgets and CarPlay see them). Also refreshes this person's shared busy time.
 *  Safe to call often: it only rewrites what changed. */
export async function syncEventsToPhone(familyId: string) {
  if (Platform.OS === 'web') return; // the web app has no phone alerts or Apple Calendar
  const now = new Date(), soon = new Date(+now + 14 * DAY);
  const { data } = await supabase.from('events').select('*').eq('family_id', familyId)
    .or('repeat.not.is.null,starts_at.gte.' + new Date(+now - DAY).toISOString() + ',ends_at.gte.' + now.toISOString());
  const rows = (data || []) as EventRow[];
  shareBusyTime(familyId).catch(() => {});

  // Alerts (identifiers start with "ev-" so reminder alerts are never touched).
  try {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(pending.filter(n => n.identifier.startsWith('ev-')).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    const want = rows.filter(r => r.alert && r.alert !== 'none').flatMap(r => expandEvent(r, now, soon).map(o => ({ o, r })))
      .map(({ o, r }) => ({ o, at: new Date(+o.start - (ALERT_OFFSETS[r.alert!] ?? 0) * 60e3) })).filter(x => x.at > now).sort((x, y) => +x.at - +y.at).slice(0, 40);
    if (want.length && await ensurePermission()) for (const { o, at } of want) await Notifications.scheduleNotificationAsync({
      identifier: 'ev-' + o.key, content: { title: o.title, body: o.allDay ? 'All day' : o.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + (o.location ? ' · ' + o.location : ''), data: { url: 'lewisfamily://tabs/calendar' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at } });
  } catch { /* notifications unavailable */ }

  // Copy to Apple Calendar.
  try {
    const cal = await appleFamilyCalendar(); if (!cal) return;
    let map: Record<string, { apple: string; sig: string }> = {}; try { map = JSON.parse((await AsyncStorage.getItem(MAP_KEY)) || '{}'); } catch { map = {}; }
    const seen = new Set<string>();
    for (const r of rows) {
      seen.add(r.id);
      const sig = JSON.stringify([r.title, r.starts_at, r.ends_at, r.all_day, r.repeat, r.repeat_until, r.exdates, r.location, r.notes, r.url]);
      if (map[r.id]?.sig === sig) continue;
      if (map[r.id]) await Calendar.deleteEventAsync(map[r.id].apple, { futureEvents: true }).catch(() => {});
      const first = expandEvent({ ...r, repeat: null }, new Date(0), new Date(8.64e15))[0]; if (!first) continue;
      const freq = r.repeat === 'daily' ? Calendar.Frequency.DAILY : r.repeat === 'weekly' || r.repeat === 'biweekly' ? Calendar.Frequency.WEEKLY : r.repeat === 'monthly' ? Calendar.Frequency.MONTHLY : r.repeat === 'yearly' ? Calendar.Frequency.YEARLY : null;
      const apple = await Calendar.createEventAsync(cal, { title: r.title, startDate: first.start, endDate: r.all_day ? new Date(+first.end - 1) : first.end, allDay: !!r.all_day, location: r.location ?? undefined, notes: r.notes ?? undefined, url: r.url ?? undefined,
        recurrenceRule: freq ? { frequency: freq, interval: r.repeat === 'biweekly' ? 2 : 1, endDate: r.repeat_until ? new Date(r.repeat_until + 'T23:59:59') : undefined } : undefined } as any);
      for (const x of r.exdates || []) { const inst = expandEvent({ ...r, exdates: [] }, new Date(x + 'T00:00:00'), new Date(x + 'T23:59:59')).find(o => o.occ === x); if (inst) await Calendar.deleteEventAsync(apple, { instanceStartDate: inst.start, futureEvents: false }).catch(() => {}); }
      map[r.id] = { apple, sig };
    }
    // Stop tracking events that are now in the past; remove the copy when the event itself was deleted.
    for (const id of Object.keys(map)) if (!seen.has(id)) { const { data: still } = await supabase.from('events').select('id').eq('id', id).maybeSingle(); if (!still) await Calendar.deleteEventAsync(map[id].apple, { futureEvents: true }).catch(() => {}); delete map[id]; }
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch { /* calendar access off */ }
}
