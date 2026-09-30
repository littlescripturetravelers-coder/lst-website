import { useEffect, useState } from 'react';
import { fn, supabase } from '@/lib/supabase';
export type CoupleStudy = { read: string; says: string; marriage: { who: string; q: string }[]; parenting: { who: string; how: string }[]; act: string; pray: string };
export type StoryActivity = { title: string; icon?: string; minutes?: number; materials: string[]; setup?: string; story_in_one_line: string; together: string[]; per_child: { name: string; age: number; role_in_activity: string; how_to_adapt: string; what_to_say: string; got_it_if: string }[]; feelings_link: string; scripture_tie: { reference: string; questions: { name: string; q: string }[] } | string; bedtime_recall: string };
export function useLantern() {
  const [night, setNight] = useState<any>(null); const [row, setRow] = useState<any>(null); const [act, setAct] = useState<any>(null);
  useEffect(() => { fn('lantern-today', { forMe: true }).then(r => { setNight(r.night); setRow(r.study); setAct(r.activity); }).catch(() => {}); }, []);
  const answer = async (who: string, text: string) => { if (!row) return; const answers = { ...(row.answers || {}), [who]: text }; setRow({ ...row, answers }); await supabase.from('couple_studies').update({ answers }).eq('family_id', row.family_id).eq('for_date', row.for_date); };
  const done = async () => { if (row) await supabase.from('couple_studies').update({ done_at: new Date().toISOString() }).eq('family_id', row.family_id).eq('for_date', row.for_date); };
  const activityDone = async (name: string) => { if (!act) return; const done_by = { ...(act.done_by || {}), [name]: new Date().toISOString() }; setAct({ ...act, done_by }); await supabase.from('story_activities').update({ done_by }).eq('family_id', act.family_id).eq('for_date', act.for_date); };
  return { activity: act?.activity as StoryActivity | undefined, activityRow: act, activityDone, night, study: row?.study as CoupleStudy | undefined, answers: (row?.answers || {}) as Record<string, string>, answer, done };
}
