// Mirrors today's Morning Lantern night from the lantern repo, then writes each family's couple study.
// Nights publish to lantern/<slug>/night.json with publish_date; a night is for that day after 5 AM Mountain.
import { admin, familyFor, loadFamily, ok, cors, isService, lanternEdition } from '../_shared/ctx.ts';
import { claude, text, json } from '../_shared/claude.ts';
import { storyActivity } from '../_shared/story-activity.ts';
const REPO = Deno.env.get('LANTERN_REPO') ?? 'littlescripturetravelers-coder/lst-website';
const gh = (p: string) => fetch('https://api.github.com/repos/' + REPO + '/contents/' + p, { headers: { Accept: 'application/vnd.github.raw+json', ...(Deno.env.get('GITHUB_TOKEN') ? { Authorization: 'Bearer ' + Deno.env.get('GITHUB_TOKEN') } : {}) } });
async function syncNight(db: ReturnType<typeof admin>, today: string) {
  const { data: have } = await db.from('lantern_nights').select('*').eq('publish_date', today).maybeSingle();
  if (have) return await withTexts(db, have);
  const dirs = await (await gh('lantern')).json();
  const slugs = (Array.isArray(dirs) ? dirs : []).filter((d: any) => d.type === 'dir').map((d: any) => d.name).slice(-21);
  const nights = (await Promise.all(slugs.map(async (s: string) => { const r = await gh('lantern/' + s + '/night.json'); return r.ok ? r.json() : null; }))).filter(Boolean);
  for (const n of nights) await db.from('lantern_nights').upsert({ publish_date: n.publish_date, slug: n.slug, title: n.title, scripture: n.scripture, book_page: n.book_page ?? null,
    edition_url: 'https://raw.githubusercontent.com/' + REPO + '/main/lantern/' + n.slug + '/morning-lantern-lds.html', raw: n });
  const { data } = await db.from('lantern_nights').select('*').lte('publish_date', today).order('publish_date', { ascending: false }).limit(1).maybeSingle();
  return data ? await withTexts(db, data) : data;
}
// The verse text and "Remember this" quote from each edition of the night, for the Today card (fetched once per night, then stored).
const TAG = (cls: string, html: string) => { const m = html.match(new RegExp('class="' + cls + '"[^>]*>([\\s\\S]*?)</(?:p|div|span|blockquote|cite|h\\d)>')); return m ? clean(m[1]) : null; };
const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, m => ({ '&mdash;': '—', '&ndash;': '–', '&ldquo;': '“', '&rdquo;': '”', '&rsquo;': '’', '&lsquo;': '‘', '&hellip;': '…', '&amp;': '&', '&quot;': '"', '&#39;': '’', '&nbsp;': ' ' } as Record<string, string>)[m.toLowerCase()] ?? m).replace(/\s+/g, ' ').trim().replace(/^["“]|["”]$/g, '');
async function withTexts(db: ReturnType<typeof admin>, night: any) {
  if (night.texts || !night.edition_url) return night;
  const texts: Record<string, unknown> = {};
  for (const ed of ['lds', 'christian'] as const) {
    try {
      const r = await fetch(night.edition_url.replace('morning-lantern-lds.html', 'morning-lantern-' + ed + '.html'), { headers: Deno.env.get('GITHUB_TOKEN') ? { Authorization: 'Bearer ' + Deno.env.get('GITHUB_TOKEN') } : {} });
      if (!r.ok) continue; const html = await r.text();
      texts[ed] = { verse: TAG('verse-text', html), ref: TAG('verse-ref', html) ?? night.scripture, quote: TAG('quote-text', html), quote_by: 'Remember this, from tonight’s story' };
    } catch (_) { /* edition unavailable: the app falls back to its own daily list */ }
  }
  if (!Object.keys(texts).length) return night;
  await db.from('lantern_nights').update({ texts }).eq('publish_date', night.publish_date);
  return { ...night, texts };
}
async function study(f: Awaited<ReturnType<typeof loadFamily>>, night: any) {
  const ed = lanternEdition(f.family.faith); if (!ed) return null;
  if (ed === 'christian') night = { ...night, edition_url: night.edition_url.replace('morning-lantern-lds.html', 'morning-lantern-christian.html') };
  const { data: have } = await f.db.from('couple_studies').select('*').eq('family_id', f.family.id).eq('for_date', f.today).maybeSingle();
  if (have) return have;
  const r = await claude({ system: 'You write a 10-minute daily scripture study for a married couple to do together. ' + f.context.voice,
    messages: [{ role: 'user', content: `Family: ${JSON.stringify(f.context)}. Scripture of the day (from tonight's Morning Lantern children's story "${night.title}"): ${night.scripture}.
Don't quote the verse text; refer to it by reference. Build: read (how to read it together), says (2 sentences: what it teaches), marriage (one question for each parent by name, tied to their season of marriage), parenting (one concrete way to teach/apply it for each child at her CURRENT age and stage), act (one small act of love today, fitted to each spouse's top love language), pray (one line).
Reply ONLY JSON {"read":"","says":"","marriage":[{"who":"","q":""}],"parenting":[{"who":"","how":""}],"act":"","pray":""}.` }] });
  const row = { family_id: f.family.id, for_date: f.today, scripture: night.scripture, study: json(text(r)) };
  await f.db.from('couple_studies').upsert(row);
  return row;
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const body = await req.json().catch(() => ({}));
  const db = admin(); const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
  const night = await syncNight(db, today);
  if (body.forMe) { const f = await familyFor(req); const [s, a] = night ? await Promise.all([study(f, night), storyActivity(f, night)]) : [null, null]; return ok({ night, study: s, activity: a }); }
  if (body.study) { if (!isService(req)) return ok({ error: 'forbidden' }, 403); const { data: fams } = await db.from('families').select('id'); for (const x of fams || []) { const f = await loadFamily(db, x.id); await study(f, night).catch(console.error); await storyActivity(f, night).catch(console.error); } }
  return ok({ night });
});
