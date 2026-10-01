// Siri / Shortcuts endpoint. The iOS App Intents call this with the user's Supabase JWT (shared via the app group keychain).
// Also handles the 7 AM morning-summary push from cron.
import { admin, familyFor, loadFamily, ok, cors, isService, underLimit } from '../_shared/ctx.ts';
import { addReminder, todaySummary, dateIdea, lanternVerse, askAnything } from '../_shared/voice-actions.ts';

async function pushMorning() {
  const db = admin(); const { data: fams } = await db.from('families').select('id');
  for (const x of fams || []) {
    const f = await loadFamily(db, x.id); const body = await todaySummary(f);
    const { data: prefs } = await db.from('member_prefs').select('expo_push_token, notify, user_id').in('user_id', f.members.map((m: any) => m.user_id).filter(Boolean));
    const msgs = (prefs || []).filter((p: any) => p.expo_push_token && p.notify?.morning).map((p: any) => ({ to: p.expo_push_token, title: 'Good morning', body, data: { url: 'lewisfamily://' } }));
    if (msgs.length) await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(msgs) });
  }
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const b = await req.json().catch(() => ({}));
  if (b.action === 'push_morning_summary') { if (!isService(req)) return ok({ error: 'forbidden' }, 403); await pushMorning(); return ok({ ok: true }); }
  const f = await familyFor(req);
  if (!await underLimit(f.db, f.family.id, 'voice', 40)) return ok({ say: 'That\u2019s all for today. Ask me again tomorrow.' });
  const say = b.action === 'add_reminder' ? await addReminder(f, b.title, b.when, b.list)
    : b.action === 'today' ? await todaySummary(f)
    : b.action === 'date_idea' ? await dateIdea(f, b.kind ?? 'couple')
    : b.action === 'lantern' ? await lanternVerse(f)
    : await askAnything(f, b.question ?? '');
  return ok({ say });
});
