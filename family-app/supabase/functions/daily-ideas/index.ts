// Generates a fresh set of couple + girls ideas for today. Cron runs it for every family at ~3 AM; the app calls it with {round} for "More ideas".
import { admin, familyFor, loadFamily, ok, cors } from '../_shared/ctx.ts';
import { claude, text, json, MODEL_FAST } from '../_shared/claude.ts';
async function generate(f: Awaited<ReturnType<typeof loadFamily>>, round = 0) {
  const { db, family, today, context } = f;
  const since = new Date(Date.parse(today) - 30 * 864e5).toISOString().slice(0, 10);
  const { data: recent } = await db.from('daily_ideas').select('title').eq('family_id', family.id).gte('for_date', since);
  const { data: dismissed } = await db.from('idea_actions').select('daily_ideas(title)').eq('action', 'dismissed').limit(40);
  const weekday = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const r = await claude({ model: MODEL_FAST, max_tokens: 2000, system: 'You plan family life for a Latter-day Saint family. ' + context.voice,
    messages: [{ role: 'user', content: `Today is ${weekday}. Family: ${JSON.stringify(context)}.
Give 4 date ideas for the parents (fit to BOTH spouses' love languages), plus 2 \"for_spouse\" ideas (one small thing each spouse can do today for the other, fitted to the receiver's top love language; set for to the receiver's name and love_language), and 4 activities for a parent with the daughters, fitted to the season, weekday and the girls' CURRENT ages and stages. Mix free/cheap, home/out. Do not repeat any of these: ${(recent || []).map((x: any) => x.title).join('; ')}. Avoid anything like: ${(dismissed || []).map((x: any) => x.daily_ideas?.title).join('; ')}.
For each: title (<7 words), meta ("Free · 45 min · Home"), why (<16 words), icon (a lucide icon name), steps (3–4 short), min_age (girls only), attachments: 1–2 of {type:"questions"|"checklist"|"guide"|"scripture", title, meta, body:[strings]}. For scripture attachments give only a reference plus a question; don't quote verse text.
Reply ONLY JSON {"couple":[...],"for_spouse":[...],"girls":[...]}.` }] });
  const j = json(text(r));
  const rows = [...j.couple.map((x: any) => ({ ...x, kind: 'couple' })), ...(j.for_spouse || []).map((x: any) => ({ ...x, kind: 'couple', meta: 'For ' + x.for + ' · ' + (x.love_language ?? '') }) ), ...j.girls.map((x: any) => ({ ...x, kind: 'girls' }))]
    .map((x: any) => ({ family_id: family.id, for_date: today, round, kind: x.kind, title: x.title, meta: x.meta, why: x.why, icon: x.icon, min_age: x.min_age ?? null, steps: x.steps, attachments: x.attachments }));
  await db.from('daily_ideas').insert(rows);
  return rows;
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const body = await req.json().catch(() => ({}));
  if (body.all) { const db = admin(); const { data: fams } = await db.from('families').select('id'); for (const f of fams || []) await generate(await loadFamily(db, f.id)).catch(console.error); return ok({ ok: true }); }
  const f = await familyFor(req);
  const { data: existing } = await f.db.from('daily_ideas').select('*').eq('family_id', f.family.id).eq('for_date', f.today).eq('round', body.round ?? 0);
  return ok(existing?.length ? existing : await generate(f, body.round ?? 0));
});
