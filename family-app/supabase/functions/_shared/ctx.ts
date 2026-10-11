import { createClient } from 'npm:@supabase/supabase-js@2';
export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey' };
export const ok = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
/** Every faith a family can choose. Latter-day Saint and Christian families (Catholic and Orthodox use the Christian edition) follow the Morning Lantern. */
export const FAITH_NAMES: Record<string, string> = { lds: 'The Church of Jesus Christ of Latter-day Saints', christian: 'Christian (non-denominational)', catholic: 'Catholic', orthodox: 'Orthodox Christian',
  jewish: 'Jewish', muslim: 'Muslim', hindu: 'Hindu', buddhist: 'Buddhist', sikh: 'Sikh', bahai: 'Bahá’í', spiritual: 'Spiritual, no single tradition', none: 'No faith content' };
export const lanternEdition = (f?: string | null): 'lds' | 'christian' | null => f === 'lds' ? 'lds' : f === 'christian' || f === 'catholic' || f === 'orthodox' ? 'christian' : null;
const faithVoice = (f: string) => f === 'lds' ? ' Say "Heavenly Father", never "God".' : f === 'none' ? ' Do not include faith or scripture content.'
  : lanternEdition(f) ? ' Use warm Christian language that fits a ' + FAITH_NAMES[f] + ' family.'
  : ' Use only the language, texts and practices of the ' + (FAITH_NAMES[f] ?? 'family’s') + ' faith, respectfully; never bring in another religion’s scripture.';
/** True only for the scheduled jobs (cron), which call with the service-role key. Guards the run-for-every-family paths. */
export const isService = (req: Request) => { const k = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); return !!k && req.headers.get('authorization') === 'Bearer ' + k; };
export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
/** Daily per-family cap on AI calls so one family can't run up the bill. Returns false once the limit is reached. */
export async function underLimit(db: ReturnType<typeof admin>, familyId: string, kind: string, limit: number) {
  const { data } = await db.rpc('bump_ai_usage', { fid: familyId, k: kind, lim: limit });
  return data !== false;
}
/** Resolves the caller (user JWT) to their family + members with CURRENT ages. */
export async function familyFor(req: Request, userId?: string) {
  const db = admin();
  let uid = userId;
  if (!uid) { const jwt = req.headers.get('authorization')?.replace('Bearer ', ''); const { data } = await db.auth.getUser(jwt!); uid = data.user?.id; }
  if (!uid) throw new Error('unauthorized');
  const { data: me } = await db.from('family_members').select('family_id, slug, name').eq('user_id', uid).single();
  return loadFamily(db, me!.family_id, uid, me!.slug);
}
export async function loadFamily(db: ReturnType<typeof admin>, familyId: string, uid?: string, meSlug?: string) {
  const [{ data: fam }, { data: members }, { data: setup }] = await Promise.all([db.from('families').select('*').eq('id', familyId).single(), db.from('family_members').select('*').eq('family_id', familyId), db.from('family_setup').select('sections, priorities, season').eq('family_id', familyId).maybeSingle()]);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: fam!.timezone });
  const age = (b: string) => { const [by, bm, bd] = b.split('-').map(Number), [y, m, d] = today.split('-').map(Number); return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0); };
  const ms = members!.map((m: any) => ({ ...m, age: age(m.birthday) }));
  return { db, uid, meSlug, family: fam, members: ms, today,
    context: { today, surname: fam!.surname, yearsMarried: fam!.anniversary ? age(fam!.anniversary) : null, faith: FAITH_NAMES[fam!.faith] ?? 'No faith content',
      members: ms.map((m: any) => ({ name: m.name, role: m.role, sex: m.sex, age: m.age, love_languages: m.love_languages?.ranked?.slice(0, 2),
        ...(m.about?.interests?.length ? { loves: m.about.interests } : {}), ...(m.about?.focus?.length ? { working_on: m.about.focus } : {}) })),
      // From the setup questionnaire: only suggest things in these sections; lean toward the priorities; fit the season of life.
      ...(setup ? { sections: setup.sections, priorities: setup.priorities, season: setup.season } : {}),
      loveLanguageRule: 'When suggesting anything one spouse can do for the other, fit it to the RECEIVING spouse’s top love languages (words, service, gifts, time, touch) and say whose it is for.', voice: 'Warm, plain, practical. No guilt, no emoji.' + faithVoice(fam!.faith) } };
}

/** The caller's own PRIVATE questionnaire answers (what they want more of with their spouse, date budget, personal priorities).
 *  Only for replies that go back to that same person (educator, advisor). Never put these into anything the family shares. */
export async function privateAnswers(db: ReturnType<typeof admin>, uid?: string) {
  if (!uid) return null; const { data } = await db.from('member_profiles').select('answers').eq('user_id', uid).maybeSingle();
  return data?.answers && Object.keys(data.answers).length ? data.answers : null;
}
