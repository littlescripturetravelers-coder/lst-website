import * as Notifications from 'expo-notifications';
export const ALERT_OFFSETS: Record<string, number> = { at: 0, '5': 5, '15': 15, '30': 30, '60': 60, '120': 120, '1d': 1440, '2d': 2880, '1w': 10080 };
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function ensurePermission() { const s = await Notifications.getPermissionsAsync(); if (s.granted) return true; return (await Notifications.requestPermissionsAsync()).granted; }
/** Schedules (or reschedules) a local notification for a reminder. Returns the notification id. */
export async function scheduleReminder(r: { id: string; title: string; date?: string | null; time?: string | null; alert?: string | null; list_name?: string }) {
  await Notifications.cancelScheduledNotificationAsync('rem-' + r.id).catch(() => {});
  if (!r.date || !r.alert || r.alert === 'none' || !(await ensurePermission())) return null;
  const at = new Date(r.date + 'T' + (r.time || '09:00') + ':00'); at.setMinutes(at.getMinutes() - (ALERT_OFFSETS[r.alert] ?? 0));
  if (at < new Date()) return null;
  return Notifications.scheduleNotificationAsync({ identifier: 'rem-' + r.id, content: { title: r.title, body: r.list_name ? 'Reminders · ' + r.list_name : 'Reminders', data: { url: 'lewisfamily://reminders' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at } });
}
