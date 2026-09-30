// Reads tonight's Morning Lantern story (the edition HTML's story card) and builds a play-based activity for each child at her CURRENT stage.
import { claude, text, json } from './claude.ts';
function storyText(html: string) {
  const i = html.indexOf('card-story'); if (i < 0) return '';
  const chunk = html.slice(i, i + 20000);
  return chunk.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, m => ({ '&mdash;': '—', '&ndash;': '–', '&ldquo;': '“', '&rdquo;': '”', '&rsquo;': '’', '&lsquo;': '‘', '&hellip;': '…', '&amp;': '&' } as any)[m] ?? ' ').replace(/\s+/g, ' ').slice(0, 6000);
}
export async function storyActivity(f: any, night: any) {
  if (f.family.faith === 'none') return null;
  if (f.family.faith === 'christian') night = { ...night, edition_url: night.edition_url.replace('morning-lantern-lds.html', 'morning-lantern-christian.html') };
  const { data: have } = await f.db.from('story_activities').select('*').eq('family_id', f.family.id).eq('for_date', f.today).maybeSingle();
  if (have) return have;
  let story = '';
  try { const r = await fetch(night.edition_url, { headers: Deno.env.get('GITHUB_TOKEN') ? { Authorization: 'Bearer ' + Deno.env.get('GITHUB_TOKEN') } : {} }); if (r.ok) story = storyText(await r.text()); } catch (_) { /* fall back to title + scripture */ }
  const kids = f.members.filter((m: any) => m.role === 'daughter' || m.role === 'son');
  const r = await claude({ max_tokens: 2500, system: 'You are a family life educator and early-childhood specialist designing play-based scripture learning for a ' + f.context.faith + ' family. ' + f.context.voice + ' Never mention any brand, product or character names from the source story app; refer only to the scripture story itself.',
    messages: [{ role: 'user', content: `Tonight's scripture story: "${night.title}" (${night.scripture}).${story ? '\nStory text: ' + story : ''}
Children: ${kids.map((k: any) => k.name + ', age ' + k.age).join('; ')}.
Design ONE family activity (15–25 minutes, household materials, can be done after dinner) that teaches the heart of this scripture story, with a version for each child fitted to her developmental stage (motor skills, attention span, language, emotional understanding). Include:
- title (<7 words), icon (lucide name), minutes, materials [..], setup (1 line)
- story_in_one_line: the story retold in one sentence a 3-year-old understands
- together: 4–6 steps everyone does
- per_child: [{ name, age, role_in_activity, how_to_adapt, what_to_say (one line at her level), got_it_if (observable sign) }]
- feelings_link: which feeling from the story to name, and how to help them name it
- scripture_tie: the reference and one question per child (don't quote verse text)
- bedtime_recall: one question to ask at bedtime to lock it in
Reply ONLY JSON with those keys.` }] });
  const row = { family_id: f.family.id, for_date: f.today, slug: night.slug, story_title: night.title, scripture: night.scripture, activity: json(text(r)) };
  await f.db.from('story_activities').upsert(row);
  return row;
}
