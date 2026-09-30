// Two-way-ish sync with Apple Calendar + Apple Reminders so Siri's built-in commands and the iPhone apps see family items.
import * as Calendar from 'expo-calendar';
import { APP_NAME } from './brand';
const CAL_TITLE = APP_NAME;
async function familyCalendar(entity: 'event' | 'reminder') {
  const type = entity === 'event' ? Calendar.EntityTypes.EVENT : Calendar.EntityTypes.REMINDER;
  const perm = entity === 'event' ? await Calendar.requestCalendarPermissionsAsync() : await Calendar.requestRemindersPermissionsAsync();
  if (perm.status !== 'granted') return null;
  const cals = await Calendar.getCalendarsAsync(type);
  const found = cals.find(c => c.title === CAL_TITLE); if (found) return found.id;
  const src = (await Calendar.getDefaultCalendarAsync()).source;
  return Calendar.createCalendarAsync({ title: CAL_TITLE, color: '#1B2D5F', entityType: type, sourceId: src.id, source: src, name: CAL_TITLE, ownerAccount: 'personal', accessLevel: Calendar.CalendarAccessLevel.OWNER });
}
export async function upsertAppleReminder(r: { apple_id?: string | null; title: string; notes?: string | null; date?: string | null; time?: string | null; done?: boolean }) {
  const cal = await familyCalendar('reminder'); if (!cal) return null;
  const due = r.date ? new Date(r.date + 'T' + (r.time || '09:00') + ':00') : undefined;
  const data = { title: r.title, notes: r.notes ?? undefined, dueDate: due, completed: !!r.done, calendarId: cal } as any;
  if (r.apple_id) { await Calendar.updateReminderAsync(r.apple_id, data); return r.apple_id; }
  return Calendar.createReminderAsync(cal, data);
}
export async function upsertAppleEvent(e: { apple_id?: string | null; title: string; start: string; end?: string; allDay?: boolean; notes?: string | null }) {
  const cal = await familyCalendar('event'); if (!cal) return null;
  const data = { title: e.title, startDate: new Date(e.start), endDate: new Date(e.end || e.start), allDay: !!e.allDay, notes: e.notes ?? undefined };
  if (e.apple_id) { await Calendar.updateEventAsync(e.apple_id, data); return e.apple_id; }
  return Calendar.createEventAsync(cal, data);
}
/** Pull reminders created with Siri / the Reminders app into the family list. */
export async function pullAppleReminders() {
  const cal = await familyCalendar('reminder'); if (!cal) return [];
  return Calendar.getRemindersAsync([cal], null, new Date(Date.now() - 30 * 864e5), new Date(Date.now() + 365 * 864e5));
}
