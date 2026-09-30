import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';
export function useHome(familyId?: string) {
  const [last, setLast] = useState<Record<string, string>>({}); const [todayDone, setTodayDone] = useState<Record<string, string>>({});
  const [assign, setAssign] = useState<Record<string, string>>({}); const [kidChores, setKidChores] = useState<{ id: string; member_slug: string; title: string }[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]); const [vlog, setVlog] = useState<any[]>([]); const [state, setState] = useState<string | null>(null);
  const today = todayISO();
  const load = useCallback(async () => {
    if (!familyId) return;
    const [l, a, k, v, vl, f] = await Promise.all([
      supabase.from('home_task_log').select('task_id, done_on, done_by').eq('family_id', familyId).order('done_on', { ascending: false }).limit(1000),
      supabase.from('home_assignments').select('*').eq('family_id', familyId), supabase.from('kid_chores').select('*').eq('family_id', familyId).order('sort'),
      supabase.from('vehicles').select('*').eq('family_id', familyId), supabase.from('vehicle_log').select('*').eq('family_id', familyId).order('done_on', { ascending: false }),
      supabase.from('families').select('state').eq('id', familyId).single()]);
    const lst: Record<string, string> = {}, td: Record<string, string> = {};
    for (const r of l.data || []) { lst[r.task_id] ??= r.done_on; if (r.done_on === today) td[r.task_id] = r.done_by ?? ''; }
    setLast(lst); setTodayDone(td); setAssign(Object.fromEntries((a.data || []).map(x => [x.task_id, x.member_slug])));
    setKidChores(k.data || []); setVehicles(v.data || []); setVlog(vl.data || []); setState(f.data?.state ?? null);
  }, [familyId]);
  useEffect(() => { load(); if (!familyId) return; const ch = supabase.channel('home-' + familyId).on('postgres_changes', { event: '*', schema: 'public', table: 'home_task_log', filter: 'family_id=eq.' + familyId }, load).subscribe(); return () => { supabase.removeChannel(ch); }; }, [familyId]);
  return { last, todayDone, assign, kidChores, vehicles, vlog, state, reload: load,
    check: async (taskId: string, by?: string) => { if (todayDone[taskId] !== undefined) await supabase.from('home_task_log').delete().eq('family_id', familyId).eq('task_id', taskId).eq('done_on', today); else await supabase.from('home_task_log').insert({ family_id: familyId, task_id: taskId, done_on: today, done_by: by }); load(); },
    setAssignee: async (taskId: string, slug: string) => { await supabase.from('home_assignments').upsert({ family_id: familyId, task_id: taskId, member_slug: slug }); load(); },
    addKidChore: async (slug: string, title: string) => { await supabase.from('kid_chores').insert({ family_id: familyId, member_slug: slug, title }); load(); },
    removeKidChore: async (id: string) => { await supabase.from('kid_chores').delete().eq('id', id); load(); },
    setLocation: async (st: string, city?: string) => { await supabase.from('families').update({ state: st, city }).eq('id', familyId); load(); },
    addVehicle: async (name: string, miles: number) => { await supabase.from('vehicles').insert({ family_id: familyId, name, miles }); load(); },
    setMiles: async (id: string, miles: number) => { await supabase.from('vehicles').update({ miles }).eq('id', id); load(); },
    serviceDone: async (vehicleId: string, taskId: string, miles: number) => { await supabase.from('vehicle_log').insert({ vehicle_id: vehicleId, family_id: familyId, task_id: taskId, done_on: today, miles }); load(); } };
}
