// One child's saved progress (migration 0020): checked skills, saved and done activities, and each parent's one-on-one pick.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type ProgressRow = { key: string; kind: 'skill' | 'activity' | 'one'; status: 'done' | 'saved' | 'cleared' | 'pick'; note?: string | null; updated_at?: string };

export function useKidProgress(familyId?: string, member?: string) {
  const [rows, setRows] = useState<Record<string, ProgressRow>>({}); const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!familyId || familyId === 'local' || !member) { setLoaded(true); return; }
    const { data } = await supabase.from('kid_progress').select('key,kind,status,note,updated_at').eq('family_id', familyId).eq('member', member);
    setRows(Object.fromEntries((data || []).map((r: ProgressRow) => [r.key, r]))); setLoaded(true);
  }, [familyId, member]);
  useEffect(() => { load(); }, [load]);
  /** Saves right away on the phone, then in the database (the whole family sees it). */
  const set = async (key: string, kind: ProgressRow['kind'], status: ProgressRow['status'], note?: string) => {
    const row = { key, kind, status, note: note ?? null, updated_at: new Date().toISOString() };
    setRows(r => ({ ...r, [key]: row }));
    if (!familyId || familyId === 'local' || !member) return;
    const { error } = await supabase.from('kid_progress').upsert({ family_id: familyId, member, ...row });
    if (error) load();
  };
  const status = (key: string) => rows[key]?.status;
  return { loaded, rows, status, set, reload: load };
}
