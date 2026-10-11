import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { scheduleReminder } from '@/lib/notifications';
import { upsertAppleReminder, pullAppleReminders } from '@/lib/eventkit';
export type Reminder = { id: string; family_id: string; list_id: string | null; title: string; notes?: string | null; due_date?: string | null; due_time?: string | null; on_calendar?: boolean; alert?: string; repeat?: string | null; flagged?: boolean; priority?: string | null; done?: boolean; apple_id?: string | null; source?: string; private?: boolean; owner_id?: string | null };
export type ReminderList = { id: string; name: string; color: string; icon: string };
export function useReminders(familyId?: string) {
  const [items, setItems] = useState<Reminder[]>([]); const [lists, setLists] = useState<ReminderList[]>([]);
  const load = useCallback(async () => {
    if (!familyId) return;
    const [{ data: r }, { data: l }] = await Promise.all([supabase.from('reminders').select('*').eq('family_id', familyId).order('due_date', { nullsFirst: false }), supabase.from('reminder_lists').select('*').eq('family_id', familyId).order('sort')]);
    setItems(r || []); setLists(l || []);
  }, [familyId]);
  useEffect(() => {
    load(); if (!familyId) return;
    const ch = supabase.channel('rem-' + familyId).on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: 'family_id=eq.' + familyId }, load).subscribe();
    importFromApple(familyId).then(load);
    return () => { supabase.removeChannel(ch); };
  }, [familyId]);
  const afterWrite = async (r: Reminder) => {
    const list = lists.find(l => l.id === r.list_id);
    await scheduleReminder({ id: r.id, title: r.title, date: r.due_date, time: r.due_time, alert: r.alert, list_name: list?.name });
    const apple_id = await upsertAppleReminder({ apple_id: r.apple_id, title: r.title, notes: r.notes, date: r.due_date, time: r.due_time, done: r.done });
    if (apple_id && apple_id !== r.apple_id) await supabase.from('reminders').update({ apple_id }).eq('id', r.id);
  };
  return {
    items, lists, reload: load,
    add: async (r: Partial<Reminder>) => { const { data } = await supabase.from('reminders').insert({ family_id: familyId, list_id: r.list_id ?? lists[0]?.id, ...r }).select().single(); if (data) await afterWrite(data); return data; },
    update: async (id: string, patch: Partial<Reminder>) => { const { data } = await supabase.from('reminders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (data) await afterWrite(data); },
    toggle: async (r: Reminder) => { const done = !r.done; await supabase.from('reminders').update({ done, completed_at: done ? new Date().toISOString() : null }).eq('id', r.id); await afterWrite({ ...r, done }); },
    remove: async (id: string) => { await supabase.from('reminders').delete().eq('id', id); },
  };
}
/** Brings in reminders added through Siri or Apple Reminders ("remind me … in the app"). */
async function importFromApple(familyId: string) {
  const apple = await pullAppleReminders().catch(() => []);
  if (!apple.length) return;
  const { data: known } = await supabase.from('reminders').select('apple_id').eq('family_id', familyId).not('apple_id', 'is', null);
  const have = new Set((known || []).map(k => k.apple_id));
  const fresh = apple.filter((a: any) => !have.has(a.id)).map((a: any) => ({ family_id: familyId, title: a.title, notes: a.notes, apple_id: a.id, done: a.completed, due_date: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : null, source: 'siri' }));
  if (fresh.length) await supabase.from('reminders').insert(fresh);
}
