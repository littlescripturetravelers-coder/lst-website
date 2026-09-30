// Turns an interest into dated calendar events + reminders for the next ~90 days (recurring ones) or the next year (seasonal ones).
// Seasonal items (hunting, fishing, camping, a team's games, a show's new season) are looked up by Claude for the family's state; items it isn't sure of are marked "confirm".
import { admin, familyFor, loadFamily, ok, cors } from '../_shared/ctx.ts';
import { claude, text, json } from '../_shared/claude.ts';
async function plan(f: any, i: any) {
  await f.db.from('reminders').delete().eq('interest_id', i.id).eq('done', false);
  await f.db.from('events').delete().eq('interest_id', i.id).gte('starts_at', f.today);
  const r = await claude({ max_tokens: 1500, system: 'You schedule a family member’s personal interests into their calendar. Only give dates you are confident about for the given state and year; otherwise pick a sensible placeholder and add "(confirm date)" to the title. ' + f.context.voice,
    messages: [{ role: 'user', content: `Today: ${f.today}. Family lives in ${f.family.city ?? ''} ${f.family.state ?? ''}. Person: ${i.member_slug}. Interest: "${i.title}"${i.detail ? ' (' + i.detail + ')' : ''}. Kind: ${i.kind}. Preferred cadence: ${i.every_days ? 'every ' + i.every_days + ' days' : 'n/a'}, weekday ${i.weekday ?? 'any'}, time ${i.at_time ?? 'any'}.
Return what should be on their calendar and reminders for the next 12 months (seasonal: permit/application deadlines, license renewals, prep, openers/closers, premieres, game days) or the next 90 days (recurring). Reply ONLY JSON {"events":[{"title","date":"YYYY-MM-DD","time":"HH:MM"|null,"all_day":bool}],"reminders":[{"title","date":"YYYY-MM-DD","time":"HH:MM"|null,"alert":"at"|"60"|"1d","notes"}]}` }] });
  const j = json(text(r)); const tz = f.family.timezone;
  if (i.add_to_calendar) for (const e of j.events || []) await f.db.from('events').insert({ family_id: f.family.id, interest_id: i.id, title: e.title, starts_at: e.date + 'T' + (e.time ?? '09:00') + ':00', all_day: !!e.all_day || !e.time, area: 'growth', who: [i.member_slug] });
  if (i.remind) for (const x of j.reminders || []) await f.db.from('reminders').insert({ family_id: f.family.id, interest_id: i.id, title: x.title, notes: x.notes, due_date: x.date, due_time: x.time, on_calendar: true, alert: x.alert ?? '1d', source: 'interest' });
  await f.db.from('interests').update({ last_planned: f.today }).eq('id', i.id);
  return j;
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const b = await req.json().catch(() => ({}));
  if (b.all) { // monthly cron: keep every family's interests rolling forward
    const db = admin(); const { data: list } = await db.from('interests').select('*');
    for (const i of list || []) { const f = await loadFamily(db, i.family_id); await plan(f, i).catch(console.error); }
    return ok({ ok: true });
  }
  const f = await familyFor(req); const { data: i } = await f.db.from('interests').select('*').eq('id', b.id).single();
  return ok(await plan(f, i));
});
