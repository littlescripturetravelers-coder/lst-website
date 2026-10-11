import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CATALOG, Wish, WishKind } from '@/lib/wish-catalog';

export type Vote = 'yes' | 'maybe' | 'no';
/** "Our list": this parent's private answers, ideas either parent added, and the ideas you BOTH said yes to.
 *  The other person's answers are never loaded; wish_matches() only reveals mutual yeses. */
export function useWishes(familyId?: string, uid?: string | null) {
  const [custom, setCustom] = useState<any[]>([]); const [mine, setMine] = useState<Record<string, Vote>>({}); const [matches, setMatches] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!familyId || familyId === 'local') return;
    const [c, v, m] = await Promise.all([
      supabase.from('couple_wishes').select('*').eq('family_id', familyId).order('created_at'),
      supabase.from('wish_votes').select('item_key, vote').eq('family_id', familyId),
      supabase.rpc('wish_matches', { p_family: familyId })]);
    setCustom(c.data || []); setMine(Object.fromEntries((v.data || []).map((x: any) => [x.item_key, x.vote])));
    setMatches(new Set((m.data || []).map((x: any) => x.item_key))); setLoaded(true);
  }, [familyId]);
  useEffect(() => {
    load(); if (!familyId) return;
    // Your own answers and new ideas arrive live; the shared list refreshes with them and every 30 seconds while open.
    const ch = supabase.channel('wishes-' + familyId).on('postgres_changes', { event: '*', schema: 'public', table: 'couple_wishes', filter: 'family_id=eq.' + familyId }, load).subscribe();
    const i = setInterval(load, 30e3);
    return () => { supabase.removeChannel(ch); clearInterval(i); };
  }, [load]);

  const itemsFor = (kind: WishKind): Wish[] => [...CATALOG[kind], ...custom.filter(c => c.kind === kind).map(c => ({ key: 'c:' + c.id, title: c.title, detail: c.detail ?? undefined, custom: true, mine: c.added_by === uid, group: 'Ideas you added' }))];
  const vote = async (key: string, v: Vote) => {
    if (!familyId) return; setMine(x => ({ ...x, [key]: v }));
    await supabase.from('wish_votes').upsert({ family_id: familyId, item_key: key, vote: v, updated_at: new Date().toISOString() }, { onConflict: 'family_id,item_key,user_id' });
    load();
  };
  const add = async (kind: WishKind, title: string, detail?: string) => {
    if (!familyId || !title.trim()) return null;
    const { data } = await supabase.from('couple_wishes').insert({ family_id: familyId, kind, title: title.trim().slice(0, 140), detail: detail?.trim() || null }).select().single();
    if (data) await vote('c:' + data.id, 'yes'); // you obviously want what you added
    return data;
  };
  const remove = async (id: string) => { await supabase.from('couple_wishes').delete().eq('id', id); load(); };
  const counts = (kind: WishKind) => { const items = itemsFor(kind); return { both: items.filter(i => matches.has(i.key)).length, toAnswer: items.filter(i => !mine[i.key]).length }; };
  return { loaded, itemsFor, mine, matches, vote, add, remove, counts, reload: load };
}
