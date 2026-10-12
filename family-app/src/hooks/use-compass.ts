// "First things first" on Today (migration 0021, function `compass`): this parent's big rocks for today, the day's focus,
// and what the family got done this week. Suggestions are made once a day when Today opens; "New suggestions" asks again.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, fn } from '@/lib/supabase';
import { mondayOf } from '@/lib/kid-growth';

export type Rock = { id: string; title: string; why?: string | null; priority?: string | null; role?: string | null; dimension?: 'body' | 'mind' | 'heart' | 'spirit' | null;
  steps?: string[]; minutes?: number | null; source: 'ai' | 'mine'; done: boolean; rank: number };
export type CompassDay = { focus?: string | null; look_back?: string | null };
export type Week = { rocks: number; body: number; mind: number; heart: number; spirit: number; mine: number; reminders: number; kids: number };
/** What the app sends so suggestions fit today: priorities in ranked order, today's calendar, menu and due reminders. */
export type CompassInput = { ranked: { key: string; label: string; group: string }[]; mine: string[]; schedule: string[]; menu: string[]; due: string[] };

/** ready: wait until today's calendar, menu and priorities have loaded, so the first suggestions can fit around them. */
export function useCompass(familyId: string | undefined, enabled: boolean, ready: boolean, today: string, input: () => CompassInput) {
  const inp = useRef(input); inp.current = input;
  const [rocks, setRocks] = useState<Rock[]>([]); const [day, setDay] = useState<CompassDay | null>(null); const [week, setWeek] = useState<Week | null>(null);
  const [loading, setLoading] = useState(false); const [note, setNote] = useState(''); const asked = useRef('');
  const live = !!familyId && familyId !== 'local' && enabled;
  const loadWeek = useCallback(async () => {
    if (!live) return; const { data } = await supabase.rpc('compass_week', { p_family: familyId, p_from: mondayOf(today) });
    setWeek((Array.isArray(data) ? data[0] : data) ?? null);
  }, [live, familyId, today]);
  const ask = useCallback(async (refresh: boolean) => {
    setLoading(true); setNote('');
    try { const r = await fn<{ items: Rock[]; day: CompassDay | null; error?: string; message?: string }>('compass', { ...inp.current(), today, refresh }); setRocks(r.items ?? []); setDay(r.day ?? null); }
    catch (e: any) {
      const body = await e?.context?.json?.().catch(() => null);
      setNote(body?.message ?? 'Suggestions aren’t available right now. Your priorities are below, in order.');
    } finally { setLoading(false); }
  }, [today]);
  // Today's saved rocks first (instant); suggestions are made only if this person has none yet today.
  useEffect(() => {
    if (!live || !ready) return; let gone = false;
    (async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const [{ data: items }, { data: d }] = await Promise.all([
        supabase.from('compass_items').select('*').eq('owner_id', uid).eq('for_date', today).order('rank'),
        supabase.from('compass_days').select('focus, look_back').eq('owner_id', uid).eq('for_date', today).maybeSingle()]);
      if (gone) return; setRocks(items ?? []); setDay(d ?? null);
      if (!d && asked.current !== today) { asked.current = today; ask(false); }
    })();
    loadWeek(); return () => { gone = true; };
  }, [live, ready, today, ask, loadWeek]);
  const toggle = async (r: Rock) => {
    const done = !r.done; setRocks(xs => xs.map(x => x.id === r.id ? { ...x, done } : x));
    await supabase.from('compass_items').update({ done, done_at: done ? new Date().toISOString() : null }).eq('id', r.id); loadWeek();
  };
  const add = async (title: string) => {
    if (!familyId || !title.trim()) return;
    const { data } = await supabase.from('compass_items').insert({ family_id: familyId, for_date: today, title: title.trim().slice(0, 140), source: 'mine', rank: rocks.length }).select().single();
    if (data) setRocks(xs => [...xs, data]);
  };
  const remove = async (r: Rock) => { setRocks(xs => xs.filter(x => x.id !== r.id)); await supabase.from('compass_items').delete().eq('id', r.id); loadWeek(); };
  return { rocks, day, week, loading, note, toggle, add, remove, refresh: () => ask(true), reloadWeek: loadWeek };
}
