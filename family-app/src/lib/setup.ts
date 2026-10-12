// The setup questionnaire ("Check in" later). The answers decide which sections show, and every AI prompt reads them.
// Keys are stored in the database: never rename one (old answers would stop matching). Add new options with new keys.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Opt = [key: string, label: string];
export const SECTIONS: Opt[] = [
  ['faith', 'Faith at home'], ['marriage', 'Our marriage'], ['money', 'Money'], ['health', 'Health'], ['home', 'Home upkeep'], ['kids', 'Our kids'], ['work', 'Work schedules'],
];
export const ALL_SECTIONS = SECTIONS.map(s => s[0]);
// Family priorities, grouped so the long list is easy to scan. Keys are permanent; add new ones at the end of a group.
export const PRIORITY_GROUPS: [string, Opt[]][] = [
  ['Family and home', [['family-time', 'More family time'], ['routines', 'Calmer home routines'], ['meals', 'Family dinners together'], ['traditions', 'Family traditions'],
    ['organize', 'A more organized home'], ['projects', 'Home projects'], ['outdoors', 'More time outdoors'], ['travel', 'Travel and adventures'], ['extended', 'Time with grandparents and cousins'], ['less-busy', 'A less busy schedule']]],
  ['Our marriage', [['marriage', 'A stronger marriage'], ['date-nights', 'Regular date nights'], ['communication', 'Better communication'], ['intimacy', 'More intimacy'],
    ['less-arguing', 'Less arguing'], ['teamwork', 'Parenting as a team'], ['couple-fun', 'More fun together'], ['couple-goals', 'Shared goals and dreams']]],
  ['Our kids', [['behavior', 'Kids’ behavior and big feelings'], ['school', 'School and learning'], ['screens', 'Less screen time'], ['reading', 'Reading together'],
    ['one-on-one', 'One-on-one time with each child'], ['kids-sleep', 'Better sleep for the kids'], ['activities', 'Sports and activities'], ['kids-friends', 'Kids’ friendships'],
    ['kindness', 'Kindness and confidence'], ['chores', 'Kids helping at home'], ['life-skills', 'Life skills and responsibility'], ['siblings', 'Siblings getting along']]],
  ['Faith', [['faith', 'Faith at home'], ['scripture', 'Daily scripture study'], ['prayer', 'Family prayer'], ['church', 'Church and worship'], ['serve', 'Serving others'], ['sabbath', 'Keeping the Sabbath'], ['temple', 'Temple or church attendance']]],
  ['Money', [['debt', 'Pay off debt'], ['save', 'Save money'], ['budget', 'Stick to a budget'], ['emergency', 'Emergency fund'], ['home-buy', 'Buy or pay off a home'],
    ['retire', 'Retirement'], ['college', 'Kids’ education fund'], ['income', 'Grow our income'], ['giving', 'Giving and tithing'], ['spend-less', 'Spend less on little things']]],
  ['Health', [['health', 'Health and fitness'], ['rest', 'More rest'], ['our-sleep', 'Better sleep for us'], ['eat-well', 'Healthier eating'], ['stress', 'Less stress and better mental health'],
    ['exercise-together', 'Exercise together'], ['checkups', 'Keep up with check-ups'], ['weight', 'Reach a healthy weight']]],
  ['Work and growth', [['balance', 'Balance work and family'], ['career', 'Career growth'], ['business', 'Grow a business'], ['learning', 'Learn new skills'],
    ['hobbies', 'Time for hobbies'], ['our-friends', 'Friendships for us'], ['community', 'Community and neighbors'], ['volunteer', 'Volunteering']]],
];
export const PRIORITIES: Opt[] = PRIORITY_GROUPS.flatMap(g => g[1]);
/** Which group a priority is in ("Our marriage"); used as the Covey role on Today's big rocks. */
export const priorityGroup = (k: string) => PRIORITY_GROUPS.find(g => g[1].some(o => o[0] === k))?.[0] ?? '';
/** Most picks in each priority group (and in your own priorities). */
export const MAX_PRIORITIES = 5;
export const SEASONS: Opt[] = [
  ['steady', 'Things are steady'], ['new-baby', 'New baby'], ['expecting', 'Expecting a baby'], ['trying', 'Trying for a baby'], ['toddlers', 'Toddler years'], ['moving', 'Moving'],
  ['job-change', 'New job or job change'], ['job-loss', 'Looking for work'], ['money-tight', 'Money is tight'], ['health-challenge', 'A health challenge'], ['grief', 'Grief or loss'],
  ['busy-work', 'A busy work stretch'], ['school-change', 'Big school changes'], ['single-parent', 'Parenting on my own'], ['blended', 'Blending families'],
  ['caregiving', 'Caring for an aging parent'], ['new-marriage', 'Newly married'], ['rough-patch', 'A rough patch in our marriage'], ['teens', 'Raising teenagers'],
  ['empty-nest', 'Kids leaving home'], ['deployment', 'Time apart for work or service'], ['building', 'Building or remodeling a home'],
]
export const COUPLE_WANTS: Opt[] = [
  ['time', 'Time together'], ['romance', 'Romance'], ['fun', 'Fun and laughing'], ['talks', 'Deeper talks'], ['less-conflict', 'Less conflict'],
  ['closeness', 'Physical closeness'], ['teamwork', 'Teamwork with the kids'], ['faith-together', 'Faith together'],
];
export const DATE_BUDGETS: Opt[] = [['free', 'Free'], ['25', 'Under $25'], ['75', 'Under $75'], ['splurge', 'A splurge now and then']];
export const MY_PRIORITIES: Opt[] = [
  ['sleep', 'Sleep'], ['exercise', 'Exercise'], ['eat-well', 'Eating well'], ['faith', 'Faith'], ['scripture', 'Personal scripture study'], ['career', 'Career'],
  ['business', 'A side business'], ['friends', 'Friendships'], ['hobbies', 'Hobbies'], ['learning', 'Learning'], ['reading', 'Reading'], ['rest', 'Rest'],
  ['money', 'Money'], ['stress', 'Less stress'], ['creativity', 'Creativity'], ['outdoors', 'Time outdoors'], ['service', 'Serving others'], ['me-time', 'Time for myself'],
  ['patience', 'Patience with the kids'], ['spouse', 'Being a better spouse'], ['organized', 'Getting organized'], ['screens', 'Less phone time'],
]
export const KID_INTERESTS: Opt[] = [
  ['art', 'Art'], ['music', 'Music'], ['sports', 'Sports'], ['reading', 'Reading'], ['outdoors', 'Outdoors'], ['building', 'Building'], ['animals', 'Animals'],
  ['science', 'Science'], ['dance', 'Dance'], ['pretend', 'Pretend play'], ['cooking', 'Cooking'], ['games', 'Games'],
];
export const KID_FOCUS: Opt[] = [
  ['sleep', 'Sleep'], ['feelings', 'Big feelings'], ['reading', 'Reading'], ['potty', 'Potty training'], ['sharing', 'Sharing'], ['listening', 'Listening'],
  ['screens', 'Screen time'], ['friends', 'Making friends'], ['school', 'School'], ['chores', 'Helping at home'], ['confidence', 'Confidence'],
];
export const label = (opts: Opt[], k: string) => opts.find(o => o[0] === k)?.[1] ?? k;

export type FamilySetup = { family_id: string; sections: string[]; priorities: string[]; season: string[]; updated_at: string };
export type MyAnswers = { coupleWants?: string[]; dateBudget?: string; myPriorities?: string[] };

/** The family's setup (null until someone answers), this person's private answers, and savers. */
export function useSetup(familyId?: string) {
  const [setup, setSetup] = useState<FamilySetup | null>(null); const [mine, setMine] = useState<MyAnswers>({}); const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!familyId || familyId === 'local') return;
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const [{ data: s }, { data: p }] = await Promise.all([supabase.from('family_setup').select('*').eq('family_id', familyId).maybeSingle(), supabase.from('member_profiles').select('answers').eq('user_id', uid).maybeSingle()]);
    setSetup(s ?? null); setMine(p?.answers ?? {}); setLoaded(true);
  }, [familyId]);
  useEffect(() => { load(); }, [load]);
  const saveFamily = async (x: Pick<FamilySetup, 'sections' | 'priorities' | 'season'>) => {
    if (!familyId) return; await supabase.from('family_setup').upsert({ family_id: familyId, ...x, updated_at: new Date().toISOString() }); await load();
  };
  /** Ranks the priorities (the order is the ranking: first = most important). Keeps updated_at, so the 30-day check-in timer doesn't reset. */
  const rankFamily = async (priorities: string[]) => {
    if (!familyId || !setup) return; setSetup({ ...setup, priorities }); await supabase.from('family_setup').update({ priorities }).eq('family_id', familyId);
  };
  const saveMine = async (a: MyAnswers) => {
    if (!familyId) return; await supabase.from('member_profiles').upsert({ family_id: familyId, answers: a, updated_at: new Date().toISOString() }); await load();
  };
  /** A section shows unless the family turned it off. Before anyone answers, everything shows (same as before). */
  const on = (section: string) => !setup || setup.sections.includes(section);
  const stale = !!setup && Date.now() - +new Date(setup.updated_at) > 30 * 864e5;
  return { loaded, setup, mine, on, stale, saveFamily, rankFamily, saveMine, reload: load };
}
