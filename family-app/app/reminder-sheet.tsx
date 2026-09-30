import { useEffect, useState } from 'react';
import { ScrollView, Switch, TextInput, View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useReminders, Reminder } from '@/hooks/use-reminders';
import { todayISO } from '@/lib/dates';
const ALERTS = [['none', 'None'], ['at', 'At time of reminder'], ['5', '5 minutes before'], ['15', '15 minutes before'], ['60', '1 hour before'], ['1d', '1 day before']];
/** New / Details sheet. Add to Calendar mirrors into the family calendar + Apple Calendar; Alert schedules a local notification. */
export default function ReminderSheet() {
  const { theme: t } = useTheme(); const p = useLocalSearchParams<{ id?: string; date?: string; calendar?: string }>(); const { family } = useFamily(); const rem = useReminders(family?.id);
  const [d, setD] = useState<Partial<Reminder>>({ title: '', due_date: p.date ?? null, on_calendar: !!p.calendar, alert: 'none' });
  useEffect(() => { const r = rem.items.find(x => x.id === p.id); if (r) setD(r); }, [rem.items.length]);
  const set = (k: keyof Reminder, v: any) => setD(x => ({ ...x, [k]: v }));
  const row = { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 50, paddingHorizontal: 14, borderBottomWidth: .5, borderColor: t.line[2], gap: 12 };
  const cycle = (k: keyof Reminder, opts: string[][]) => { const i = opts.findIndex(o => o[0] === (d[k] ?? opts[0][0])); set(k, opts[(i + 1) % opts.length][0]); };
  const save = async () => { if (!d.title?.trim()) return router.back(); if (d.id) await rem.update(d.id, d); else await rem.add(d); router.back(); };
  return <ScrollView style={{ backgroundColor: t.paper[1] }} contentContainerStyle={{ padding: 16, gap: 16 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text color={t.brand[500]} onPress={() => router.back()}>Cancel</Text><Text v="headline" style={{ flex: 1, textAlign: 'center' }}>{d.id ? 'Details' : 'New Reminder'}</Text><Text weight="heavy" color={t.brand[500]} onPress={save}>{d.id ? 'Done' : 'Add'}</Text></View>
    <Card padding={0}>
      <TextInput value={d.title} onChangeText={v => set('title', v)} placeholder="Title" autoFocus style={{ padding: 14, fontSize: 17, fontFamily: t.font.body, borderBottomWidth: .5, borderColor: t.line[2], color: t.ink[1] }} />
      <TextInput value={d.notes ?? ''} onChangeText={v => set('notes', v)} placeholder="Notes" multiline style={{ padding: 14, fontSize: 17, minHeight: 60, fontFamily: t.font.body, color: t.ink[1] }} />
    </Card>
    <Card padding={0}>
      <View style={row}><Text style={{ flex: 1 }}>Date{d.due_date ? '  ·  ' + d.due_date : ''}</Text><Switch value={!!d.due_date} onValueChange={v => set('due_date', v ? todayISO() : null)} trackColor={{ true: t.brand[500] }} /></View>
      <View style={row}><Text style={{ flex: 1 }}>Time{d.due_time ? '  ·  ' + d.due_time.slice(0, 5) : ''}</Text><Switch value={!!d.due_time} onValueChange={v => setD(x => ({ ...x, due_time: v ? '18:00' : null, due_date: x.due_date ?? todayISO() }))} trackColor={{ true: t.brand[500] }} /></View>
      <View style={[row, { borderBottomWidth: 0 }]}><Text style={{ flex: 1 }}>Add to Calendar</Text><Switch value={!!d.on_calendar} onValueChange={v => setD(x => ({ ...x, on_calendar: v, due_date: x.due_date ?? todayISO() }))} trackColor={{ true: t.brand[500] }} /></View>
    </Card>
    <Card padding={0}>
      <Pressable style={row} onPress={() => cycle('alert', ALERTS)}><Text style={{ flex: 1 }}>Alert</Text><Text color={t.ink[3]}>{ALERTS.find(a => a[0] === (d.alert ?? 'none'))![1]}</Text></Pressable>
      <Pressable style={row} onPress={() => cycle('repeat', [['', 'Never'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']])}><Text style={{ flex: 1 }}>Repeat</Text><Text color={t.ink[3]}>{d.repeat || 'Never'}</Text></Pressable>
      <View style={row}><Text style={{ flex: 1 }}>Flag</Text><Switch value={!!d.flagged} onValueChange={v => set('flagged', v)} trackColor={{ true: t.brand[500] }} /></View>
      <Pressable style={[row, { borderBottomWidth: 0 }]} onPress={() => { const i = rem.lists.findIndex(l => l.id === d.list_id); set('list_id', rem.lists[(i + 1) % rem.lists.length]?.id); }}><Text style={{ flex: 1 }}>List</Text><Text color={t.ink[3]}>{rem.lists.find(l => l.id === d.list_id)?.name ?? rem.lists[0]?.name}</Text></Pressable>
    </Card>
    {d.id && <Text color={t.danger[0]} style={{ textAlign: 'center', padding: 14 }} onPress={async () => { await rem.remove(d.id!); router.back(); }}>Delete Reminder</Text>}
  </ScrollView>;
}
