// The setup questionnaire ("Check in" later). The answers decide which sections show, and every AI prompt reads them.
// Keys are stored in the database: never rename one (old answers would stop matching). Add new options with new keys.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Opt = [key: string, label: string];
export const SECTIONS: Opt[] = [
  ['faith', 'Faith at home'], ['marriage', 'Our marriage'], ['money', 'Money'], ['health', 'Health'], ['home', 'Home upkeep'], ['kids', 'Our kids'], ['work', 'Work schedules'],
];
export const ALL_SECTIONS = SECTIONS.map(s => s[0]);
export const PRIORITIES: Opt[] = [
  ['family-time', 'More family time'], ['marriage', 'A stronger marriage'], ['faith', 'Faith at home'], ['debt', 'Pay off debt'], ['save', 'Save money'],
  ['health', 'Health and fitness'], ['routines', 'Calmer home routines'], ['behavior', 'Kids’ behavior and big feelings'], ['school', 'School and learning'],
  ['screens', 'Less screen time'], ['serve', 'Serving others'], ['balance', 'Balance work and family'], ['projects', 'Home projects'], ['rest', 'More rest'],
];
export const SEASONS: Opt[] = [
  ['steady', 'Things are steady'], ['new-baby', 'New baby'], ['expecting', 'Expecting a baby'], ['toddlers', 'Toddler years'], ['moving', 'Moving'],
  ['job-change', 'New job or job change'], ['money-tight', 'Money is tight'], ['health-challenge', 'A health challenge'], ['grief', 'Grief or loss'],
  ['busy-work', 'A busy work stretch'], ['school-change', 'Big school changes'], ['single-parent', 'Parenting on my own'],
];
export const COUPLE_WANTS: Opt[] = [
  ['time', 'Time together'], ['romance', 'Romance'], ['fun', 'Fun and laughing'], ['talks', 'Deeper talks'], ['less-conflict', 'Less conflict'],
  ['closeness', 'Physical closeness'], ['teamwork', 'Teamwork with the kids'], ['faith-together', 'Faith together'],
];
export const DATE_BUDGETS: Opt[] = [['free', 'Free'], ['25', 'Under $25'], ['75', 'Under $75'], ['splurge', 'A splurge now and then']];
export const MY_PRIORITIES: Opt[] = [
  ['sleep', 'Sleep'], ['exercise', 'Exercise'], ['faith', 'Faith'], ['career', 'Career'], ['friends', 'Friendships'], ['hobbies', 'Hobbies'], ['learning', 'Learning'], ['rest', 'Rest'], ['money', 'Money'],
];
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
  const saveMine = async (a: MyAnswers) => {
    if (!familyId) return; await supabase.from('member_profiles').upsert({ family_id: familyId, answers: a, updated_at: new Date().toISOString() }); await load();
  };
  /** A section shows unless the family turned it off. Before anyone answers, everything shows (same as before). */
  const on = (section: string) => !setup || setup.sections.includes(section);
  const stale = !!setup && Date.now() - +new Date(setup.updated_at) > 30 * 864e5;
  return { loaded, setup, mine, on, stale, saveFamily, saveMine, reload: load };
}
