// Work and personal calendars from outside the app, read on this phone only.
// 1) Calendars already on the iPhone (Settings > Calendar > Accounts): Google, Outlook / Microsoft 365, Exchange, iCloud, Yahoo.
// 2) Feed links (.ics / webcal) from task and project tools: Asana, Todoist, Trello, Jira, ClickUp, Monday and others.
// Choices live on this device. Nothing leaves the phone unless the person picks "Family sees busy" or "Family sees details";
// then only the start and end (plus the title for "details") go to busy_blocks for the next two weeks.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { supabase } from './supabase';
import { APP_NAME, OLD_APP_NAMES } from './brand';
import { parseFeed, feedUrl, OutsideItem } from './ics';

export type Share = 'private' | 'busy' | 'details';
export type Feed = { id: string; name: string; url: string; share: Share };
export type Prefs = { calendars: Record<string, Share>; feeds: Feed[] };
export type MyOutside = OutsideItem & { source: string; color: string; share: Share };
const KEY = 'outside-calendars';
export const SHARE_LABEL: Record<Share, string> = { private: 'Only me', busy: 'Family sees “Busy”', details: 'Family sees details' };

export async function loadPrefs(): Promise<Prefs> {
  try { const v = await AsyncStorage.getItem(KEY); if (v) return { calendars: {}, feeds: [], ...JSON.parse(v) }; } catch { /* first run */ }
  return { calendars: {}, feeds: [] };
}
export const savePrefs = (p: Prefs) => AsyncStorage.setItem(KEY, JSON.stringify(p));

/** Every calendar on this iPhone except the app's own family calendar (that one already holds family items). */
export async function deviceCalendars() {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.filter(c => c.title !== APP_NAME && !OLD_APP_NAMES.includes(c.title)).map(c => ({ id: c.id, title: c.title, color: c.color, account: c.source?.name || 'On my iPhone' }));
}

export async function addFeed(p: Prefs, name: string, raw: string): Promise<{ prefs?: Prefs; error?: string }> {
  const url = feedUrl(raw);
  if (!url) return { error: 'That link should start with https:// or webcal://' };
  try {
    const r = await fetch(url); if (!r.ok) return { error: 'That link didn’t open (' + r.status + '). Check it and try again.' };
    parseFeed(await r.text(), new Date(), new Date(Date.now() + 864e5));
  } catch { return { error: 'That link isn’t a calendar feed. Look for “Subscribe”, “iCal” or “Calendar feed” in the other app.' }; }
  const next = { ...p, feeds: [...p.feeds, { id: String(Date.now()), name: name.trim() || 'Work tasks', url, share: 'private' as Share }] };
  await savePrefs(next); return { prefs: next };
}

const feedCache: Record<string, { at: number; text: string }> = {};
async function feedText(url: string) {
  const c = feedCache[url]; if (c && Date.now() - c.at < 15 * 60e3) return c.text;
  const r = await fetch(url); const text = r.ok ? await r.text() : ''; if (text) feedCache[url] = { at: Date.now(), text }; return text;
}

/** This person's outside items between from and to, from the calendars and feeds they turned on. Failures just leave a source out. */
export async function myOutside(from: Date, to: Date, p?: Prefs): Promise<MyOutside[]> {
  p = p ?? await loadPrefs(); const out: MyOutside[] = [];
  const ids = Object.keys(p.calendars);
  if (ids.length) {
    try {
      const perm = await Calendar.getCalendarPermissionsAsync();
      if (perm.status === 'granted') {
        const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT); const byId = Object.fromEntries(cals.map(c => [c.id, c]));
        const evs = await Calendar.getEventsAsync(ids.filter(id => byId[id]), from, to);
        for (const e of evs) { const c = byId[e.calendarId];
          out.push({ key: 'dev:' + e.id + ':' + e.startDate, title: e.title || 'Busy', start: new Date(e.startDate), end: new Date(e.endDate), allDay: !!e.allDay, source: c?.title ?? 'Calendar', color: c?.color ?? '#5A6B93', share: p.calendars[e.calendarId] ?? 'private' }); }
      }
    } catch { /* calendar unavailable */ }
  }
  for (const f of p.feeds) {
    try { const text = await feedText(f.url); if (!text) continue;
      for (const x of parseFeed(text, from, to, f.id + ':')) out.push({ ...x, source: f.name, color: '#5A6B93', share: f.share });
    } catch { /* feed unavailable */ }
  }
  return out.sort((a, b) => +a.start - +b.start);
}

/** Replaces this person's shared busy time for the next 14 days with what they chose to share. */
export async function shareBusyTime(familyId: string, items?: MyOutside[]) {
  const { data: u } = await supabase.auth.getUser(); const uid = u.user?.id; if (!uid) return;
  const from = new Date(); from.setHours(0, 0, 0, 0); const to = new Date(+from + 14 * 864e5);
  items = items ?? await myOutside(from, to);
  const rows = items.filter(x => x.share !== 'private' && x.end > from && x.start < to)
    .map(x => ({ family_id: familyId, owner_id: uid, starts_at: x.start.toISOString(), ends_at: x.end.toISOString(), all_day: x.allDay, label: x.share === 'details' ? x.title : null }));
  await supabase.from('busy_blocks').delete().eq('owner_id', uid).gte('ends_at', from.toISOString());
  if (rows.length) await supabase.from('busy_blocks').insert(rows);
}
