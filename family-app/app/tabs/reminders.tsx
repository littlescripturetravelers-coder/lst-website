import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Text } from '@/components/text';
import { Icon } from '@/components/icon';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useReminders, Reminder } from '@/hooks/use-reminders';
import { todayISO } from '@/lib/dates';
import { fmtWhen } from '@/lib/today-helpers';
/** iOS Reminders: smart lists, My lists, list detail with circle checks, inline "New reminder", Details sheet (app/reminder-sheet.tsx). */
export default function RemindersTab() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const rem = useReminders(family?.id); const today = todayISO();
  const [view, setView] = useState<string | null>(null); const [draft, setDraft] = useState('');
  const SMART = [
    { id: 'today', name: 'Today', icon: 'calendar-days', color: t.brand[500], f: (r: Reminder) => !r.done && !!r.due_date && r.due_date <= today },
    { id: 'scheduled', name: 'Scheduled', icon: 'calendar', color: t.danger[0], f: (r: Reminder) => !r.done && !!r.due_date },
    { id: 'all', name: 'All', icon: 'inbox', color: t.ink[2], f: (r: Reminder) => !r.done },
    { id: 'flagged', name: 'Flagged', icon: 'flag', color: t.gold[600], f: (r: Reminder) => !r.done && !!r.flagged },
  ];
  const colorOf = (r: Reminder) => { const l = rem.lists.find(x => x.id === r.list_id); return l ? (t.area as any)[l.color]?.[0] ?? t.brand[500] : t.brand[500]; };
  const Row = ({ r }: { r: Reminder }) => <Pressable onPress={() => router.push({ pathname: '/reminder-sheet', params: { id: r.id } })} style={{ flexDirection: 'row', gap: 12, paddingLeft: 16, paddingTop: 11 }}>
    <Pressable onPress={() => rem.toggle(r)} hitSlop={10} style={{ width: 24, height: 24, borderRadius: 12, borderWidth: r.done ? 2 : 1.5, borderColor: r.done ? colorOf(r) : t.ink[4], alignItems: 'center', justifyContent: 'center' }}>{r.done && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colorOf(r) }} />}</Pressable>
    <View style={{ flex: 1, paddingBottom: 11, paddingRight: 16, borderBottomWidth: .5, borderColor: t.line[2] }}>
      <View style={{ flexDirection: 'row' }}><Text style={{ flex: 1 }} color={r.done ? t.ink[3] : t.ink[1]}>{r.title}</Text>{r.private && <Icon name="lock" size={15} color={t.ink[3]} />}{r.flagged && <Icon name="flag" size={16} color={t.gold[600]} />}</View>
      {r.notes && <Text v="subhead" color={t.ink[3]}>{r.notes}</Text>}
      {r.due_date && <Text v="subhead" color={!r.done && r.due_date < today ? t.danger[0] : t.ink[3]}>{fmtWhen(r)}{r.on_calendar ? '  ·  on calendar' : ''}</Text>}
    </View></Pressable>;
  if (view) {
    const smart = SMART.find(s => s.id === view), list = rem.lists.find(l => l.id === view);
    const rows = rem.items.filter(smart ? smart.f : r => r.list_id === view && !r.done);
    return <Screen title={smart?.name ?? list?.name ?? ''} trailing={<Text v="headline" color={t.brand[500]} onPress={() => setView(null)}>Lists</Text>}>
      {rows.map(r => <Row key={r.id} r={r} />)}
      <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}><View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.ink[4] }} />
        <TextInput value={draft} onChangeText={setDraft} placeholder="New reminder" placeholderTextColor={t.ink[4]} style={{ flex: 1, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }}
          onSubmitEditing={async () => { if (!draft.trim()) return; await rem.add({ title: draft.trim(), list_id: list?.id, due_date: view === 'today' ? today : null, flagged: view === 'flagged' }); setDraft(''); }} /></View>
    </Screen>;
  }
  return <Screen title="Reminders" trailing={<Pressable onPress={() => router.push('/reminder-sheet')}><Icon name="plus" size={26} color={t.brand[500]} /></Pressable>}>
    <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {SMART.map(s => <Pressable key={s.id} onPress={() => setView(s.id)} style={{ width: '48%', backgroundColor: t.paper[0], borderRadius: 12, borderWidth: 1, borderColor: t.line[1], padding: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} size={17} color="#fff" /></View><Text v="title1">{rem.items.filter(s.f).length}</Text></View>
        <Text v="subhead" weight="bold" color={t.ink[2]}>{s.name}</Text></Pressable>)}
    </Gutter>
    <SectionHead title="My lists" />
    <Gutter><Card padding={0}>{rem.lists.map((l, i) => <ListRow key={l.id} icon={l.icon} iconColor={(t.area as any)[l.color]?.[0] ?? t.brand[500]} title={l.name} value={String(rem.items.filter(r => r.list_id === l.id && !r.done).length)} chevron divider={i < rem.lists.length - 1} onPress={() => setView(l.id)} />)}</Card></Gutter>
  </Screen>;
}
