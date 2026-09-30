import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';
/** { memberSlug: { ruleId: lastDoneISO } } */
export function useHealth(familyId?: string) {
  const [log, setLog] = useState<Record<string, Record<string, string>>>({});
  const load = async () => { if (!familyId) return; const { data } = await supabase.from('health_log').select('member_slug, rule_id, done_on').eq('family_id', familyId).order('done_on');
    const out: Record<string, Record<string, string>> = {}; for (const r of data || []) (out[r.member_slug] ??= {})[r.rule_id] = r.done_on; setLog(out); };
  useEffect(() => { load(); }, [familyId]);
  const markDone = async (slug: string, rule: string, date = todayISO()) => { await supabase.from('health_log').insert({ family_id: familyId, member_slug: slug, rule_id: rule, done_on: date }); load(); };
  return { log, markDone };
}
