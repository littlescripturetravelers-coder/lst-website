// Shared actions for Siri (App Intents → /voice) and Alexa (/alexa). Each returns plain speech text.
import { claude, text, MODEL_FAST } from './claude.ts';

export async function addReminder(f: any, title: string, when?: string, list?: string) {
  const due = when ? parseWhen(when, f.today) : null;
  const { data: lists } = await f.db.from('reminder_lists').select('id,name').eq('family_id', f.family.id);
  const l = (lists || []).find((x: any) => list && x.name.toLowerCase().includes(list.toLowerCase())) || (lists || [])[0];
  await f.db.from('reminders').insert({ family_id: f.family.id, list_id: l?.id, title, due_date: due?.date ?? null, due_time: due?.time ?? null, on_calendar: !!due, alert: due ? 'at' : 'none', source: 'voice', created_by: f.uid });
  return `Okay, I added "${title}"${due ? ' for ' + speakDate(due.date, f.today) + (due.time ? ' at ' + speakTime(due.time) : '') : ''} to ${l?.name ?? 'your family list'}.`;
}
export async function todaySummary(f: any) {
  const { db, family, today } = f;
  // Private items belong to one person: only the person asking hears theirs.
  const mine = 'private.is.false' + (f.uid ? ',owner_id.eq.' + f.uid : '');
  const [{ data: ev }, { data: rem }, { data: study }] = await Promise.all([
    db.from('events').select('title,starts_at,all_day').eq('family_id', family.id).gte('starts_at', today).lt('starts_at', today + 'T23:59:59').or(mine).order('starts_at'),
    db.from('reminders').select('title,due_time').eq('family_id', family.id).eq('done', false).lte('due_date', today).or(mine),
    db.from('couple_studies').select('scripture').eq('family_id', family.id).eq('for_date', today).maybeSingle(),
  ]);
  const parts = [];
  parts.push(ev?.length ? `You have ${ev.length} thing${ev.length > 1 ? 's' : ''} on the calendar: ` + ev.map((e: any) => e.title + (e.all_day ? '' : ' at ' + new Date(e.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: family.timezone }))).join(', ') + '.' : 'Nothing is on the calendar today.');
  if (rem?.length) parts.push(`${rem.length} reminder${rem.length > 1 ? 's' : ''} due, starting with ${rem[0].title}.`);
  if (study?.scripture) parts.push(`Today's Morning Lantern scripture is ${study.scripture}.`);
  return parts.join(' ');
}
export async function dateIdea(f: any, kind: 'couple' | 'girls' = 'couple') {
  const { data } = await f.db.from('daily_ideas').select('title,why').eq('family_id', f.family.id).eq('for_date', f.today).eq('kind', kind).limit(4);
  const x = data?.[Math.floor(Math.random() * (data?.length || 1))];
  return x ? `Here's one for today: ${x.title}. ${x.why}` : 'Today’s ideas aren’t ready yet. Try again in a minute.';
}
export async function lanternVerse(f: any) {
  const { data } = await f.db.from('couple_studies').select('scripture, study').eq('family_id', f.family.id).eq('for_date', f.today).maybeSingle();
  if (!data) return 'Today’s Morning Lantern isn’t ready yet.';
  const me = (data.study.marriage || []).find((m: any) => m.who === f.members.find((x: any) => x.user_id === f.uid)?.name);
  return `Today's scripture is ${data.scripture}. ${data.study.says} ${me ? 'Your question today: ' + me.q : ''}`;
}
export async function askAnything(f: any, q: string) {
  const r = await claude({ model: MODEL_FAST, max_tokens: 300, system: 'You are this family\u2019s family app speaking through a voice assistant. Answer in 2–3 short spoken sentences. ' + f.context.voice + ' Family: ' + JSON.stringify(f.context), messages: [{ role: 'user', content: q }] });
  return text(r);
}
// "tomorrow at 5", "friday", "october 21 at 7 pm", ISO from Alexa AMAZON.DATE / AMAZON.TIME
export function parseWhen(s: string, today: string): { date: string; time: string | null } | null {
  const t = s.toLowerCase(); let date: string | null = null, time: string | null = null;
  const iso = t.match(/\d{4}-\d{2}-\d{2}/); if (iso) date = iso[0];
  if (!date && t.includes('today')) date = today;
  if (!date && t.includes('tomorrow')) date = shift(today, 1);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const di = days.findIndex(d => t.includes(d)); if (!date && di >= 0) { const cur = new Date(today + 'T12:00:00').getDay(); date = shift(today, ((di - cur + 7) % 7) || 7); }
  const tm = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/); const tIso = t.match(/\b(\d{2}):(\d{2})\b/);
  if (tIso) time = tIso[0]; else if (tm && (tm[3] || t.includes(' at '))) { let h = Number(tm[1]); if (tm[3] === 'pm' && h < 12) h += 12; if (!tm[3] && h < 7) h += 12; time = String(h).padStart(2, '0') + ':' + (tm[2] ?? '00'); }
  if (!date && time) date = today;
  return date ? { date, time } : null;
}
const shift = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const speakDate = (iso: string, today: string) => iso === today ? 'today' : iso === shift(today, 1) ? 'tomorrow' : new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const speakTime = (t: string) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap; };
