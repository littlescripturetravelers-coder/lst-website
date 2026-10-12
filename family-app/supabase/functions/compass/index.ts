// "First things first" (Today tab): a parent's big rocks for today, after Covey's 7 Habits and time-management matrix.
// Suggestions are important-but-not-urgent (Quadrant II), follow the family's priorities in their ranked order, fit around
// today's calendar, credit what already got done, and keep the four dimensions of "sharpen the saw" in balance.
// The app sends today's schedule, menu and due reminders (already filtered to what this person may see) and the priority labels.
// One set a day per person is made when Today first opens; "New suggestions" makes another. Capped per family per day.
import { familyFor, ok, cors, underLimit, privateAnswers } from '../_shared/ctx.ts';
import { claude, text, json, MODEL_FAST } from '../_shared/claude.ts';

const DIMS = ['body', 'mind', 'heart', 'spirit'];
const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);
const list = (x: unknown, n: number, len = 120) => (Array.isArray(x) ? x : []).slice(0, n).map(v => typeof v === 'string' ? clip(v, len) : v);

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const b = await req.json().catch(() => ({}));
  const f = await familyFor(req); const { db, family, context, members, uid } = f;
  const me = members.find((m: any) => m.user_id === uid);
  if (!me || (me.role !== 'dad' && me.role !== 'mom')) return ok({ error: 'parents_only' }, 403);
  // The person's own date (the app knows the phone's day; fall back to the family's time zone).
  const today = /^\d{4}-\d{2}-\d{2}$/.test(b.today) ? b.today : f.today;

  const load = async () => {
    const [{ data: items }, { data: day }] = await Promise.all([
      db.from('compass_items').select('*').eq('owner_id', uid).eq('for_date', today).order('rank'),
      db.from('compass_days').select('focus, look_back').eq('owner_id', uid).eq('for_date', today).maybeSingle()]);
    return { items: items ?? [], day: day ?? null, today };
  };
  const now = await load();
  if (!b.refresh && now.day) return ok(now);
  if (!await underLimit(db, family.id, 'compass', 12)) return ok({ ...now, error: 'daily_limit', message: 'You’ve used today’s suggestions. They reset tomorrow.' }, 429);

  // The last 7 days of this person's big rocks (what got done, what didn't), so suggestions build on progress and don't repeat.
  const since = new Date(Date.parse(today) - 7 * 864e5).toISOString().slice(0, 10);
  const { data: recent } = await db.from('compass_items').select('title, priority, dimension, done, for_date').eq('owner_id', uid).gte('for_date', since).lt('for_date', today).order('for_date');
  const { data: wins } = await db.from('reminders').select('title').eq('family_id', family.id).eq('done', true).gte('completed_at', since)
    .or('private.is.false,owner_id.eq.' + uid).limit(20);
  const mine = await privateAnswers(db, uid);
  const ranked = list(b.ranked, 40).map((p: any, i: number) => ({ rank: i + 1, key: clip(p?.key, 40), label: clip(p?.label, 60), role: clip(p?.group, 40) }));
  const keep = now.items.filter((x: any) => x.done || x.source === 'mine');
  const count = Math.max(2, 5 - keep.length);

  const weekday = new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const r = await claude({ model: MODEL_FAST, max_tokens: 1800,
    system: 'You are a calm, practical family coach who uses Stephen R. Covey’s 7 Habits of Highly Effective People and his time-management matrix: '
      + 'be proactive; begin with the end in mind; put first things first (big rocks before small ones; Quadrant II: important but not urgent); think win-win; seek first to understand; synergize; sharpen the saw (body, mind, heart, spirit). '
      + 'Never quote Covey at length or name the quadrants in jargon; give plain, doable actions. ' + context.voice,
    messages: [{ role: 'user', content: `Today is ${weekday}. This is for ${me.name} (${me.role === 'dad' ? 'dad' : 'mom'}).
Family: ${JSON.stringify(context)}.
The family's priorities IN RANKED ORDER (1 = most important): ${JSON.stringify(ranked)}.
${me.name}'s own priorities in order: ${JSON.stringify(list(b.mine, 10, 60))}. ${mine ? `Their private notes (for them only): ${JSON.stringify(mine)}.` : ''}
Already on today's calendar (urgent/appointments, don't duplicate; fit around them): ${JSON.stringify(list(b.schedule, 20))}.
Today's meals: ${JSON.stringify(list(b.menu, 6))}. Reminders due: ${JSON.stringify(list(b.due, 15))}.
Big rocks they already have today (keep, don't repeat): ${JSON.stringify(keep.map((x: any) => x.title))}.
Their last 7 days of big rocks: ${JSON.stringify(recent ?? [])}. Family things finished this week: ${JSON.stringify((wins ?? []).map((w: any) => w.title))}.

Give ${count} big rocks for today: important-but-not-urgent actions, ordered by the family's priority ranking (the highest-ranked priorities first, but don't give two rocks for the same priority).
Each must be small enough to do today around the calendar (5–60 minutes), concrete, and personal to this family (use names and ages).
Include at least one for their marriage or a child if those are among the priorities, and balance the four dimensions (body, mind, heart, spirit) across the week: favor whichever had the fewest done rocks in the last 7 days.
If something wasn't done yesterday and still matters, you may offer a smaller version of it.
Also: focus (one sentence, under 16 words: the end in mind for today), look_back (one warm sentence under 22 words crediting what got done recently, or "" if nothing yet; no guilt about what didn't).
For each rock: title (<8 words), why (<18 words, name the priority it serves), priority (the key from the ranked list, or from their own priorities), role (Spouse, Parent, Self, Faith, Home, Work or Friend), dimension (body|mind|heart|spirit), minutes, steps (2–4 short).
Reply ONLY JSON {"focus":"","look_back":"","rocks":[...]}.` }] });
  const j = json(text(r));

  // Replace today's unfinished suggestions; keep what's done and what the person added.
  await db.from('compass_items').delete().eq('owner_id', uid).eq('for_date', today).eq('source', 'ai').eq('done', false);
  const start = keep.length;
  const rows = (j.rocks || []).slice(0, count).map((x: any, i: number) => ({
    family_id: family.id, owner_id: uid, for_date: today, rank: start + i, source: 'ai', title: clip(x.title, 140) || 'One thing that matters', why: clip(x.why, 300) || null,
    priority: clip(x.priority, 40) || null, role: clip(x.role, 40) || null, dimension: DIMS.includes(x.dimension) ? x.dimension : null,
    minutes: Math.max(0, Math.min(1440, Number(x.minutes) || 0)) || null, steps: list(x.steps, 4, 200) }));
  if (rows.length) await db.from('compass_items').insert(rows);
  await db.from('compass_days').upsert({ owner_id: uid, for_date: today, family_id: family.id, focus: clip(j.focus, 300) || null, look_back: clip(j.look_back, 400) || null });
  return ok(await load());
});
