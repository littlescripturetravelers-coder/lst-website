import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { deleteEvent } from '@/hooks/use-events';
import { supabase } from '@/lib/supabase';
import { CalItem, EventRow, expandEvent, getPeek, whenLines, repeatLabel, alertLabel, atMidnight, DAY, iso } from '@/lib/calendar';

const AREA_NAME: Record<string, string> = { home: 'Family', marriage: 'Marriage', girls: 'Kids', faith: 'Faith', money: 'Money', health: 'Health', growth: 'Growth' };
/** Event details, like tapping an event in Apple Calendar: when, where, repeat, calendar, who, alert, link, notes, Edit and Delete. */
export default function EventScreen() {
  const { theme: t } = useTheme(); const p = useLocalSearchParams<{ id?: string; occ?: string }>(); const { family, uid } = useFamily();
  const [row, setRow] = useState<EventRow | null>(null); const [gone, setGone] = useState(false);
  useFocusEffect(useCallback(() => { if (!p.id) return; supabase.from('events').select('*').eq('id', p.id).maybeSingle().then(({ data }) => { setRow(data); setGone(!data); }); }, [p.id]));
  const peek = getPeek();
  let it: CalItem | null = null;
  if (p.id && row) { const occ = p.occ ?? iso(new Date(row.starts_at)); it = expandEvent(row, new Date(+atMidnight(occ) - DAY), new Date(+atMidnight(occ) + 2 * DAY)).find(x => x.occ === occ) ?? expandEvent({ ...row, repeat: null }, new Date(0), new Date(8.64e15))[0] ?? null; }
  else if (!p.id) it = peek;
  const row1 = { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 48, paddingHorizontal: 14, borderBottomWidth: .5, borderColor: t.line[2], gap: 10 };
  const back = <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 }}>
    <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button"><Icon name="chevron-left" size={24} color={t.brand[500]} /><Text color={t.brand[500]}>Calendar</Text></Pressable>
    <View style={{ flex: 1 }} />
    {row && it && (!row.private || row.owner_id === uid) && <Text weight="bold" color={t.brand[500]} onPress={() => router.push({ pathname: '/event-edit', params: { id: row.id, occ: it!.occ } })}>Edit</Text>}</View>;
  if (!it) return <SafeAreaView style={{ flex: 1, backgroundColor: t.paper[1] }}>{back}<Text color={t.ink[3]} style={{ padding: 20 }}>{gone ? 'This event was deleted.' : ''}</Text></SafeAreaView>;

  const [l1, l2] = whenLines(it);
  const who = (row?.who || []).map(s => family?.members.find(m => m.id === s)).filter(Boolean) as any[];
  const remove = () => {
    if (!row) return; const done = () => router.back();
    if (row.repeat) Alert.alert('This is a repeating event.', undefined, [
      { text: 'Delete This Event Only', style: 'destructive', onPress: () => deleteEvent(row, 'one', it!.occ).then(done) },
      { text: 'Delete All Future Events', style: 'destructive', onPress: () => deleteEvent(row, 'future', it!.occ).then(done) },
      { text: 'Cancel', style: 'cancel' }]);
    else Alert.alert('Are you sure you want to delete this event?', undefined, [{ text: 'Delete Event', style: 'destructive', onPress: () => deleteEvent(row, 'all').then(done) }, { text: 'Cancel', style: 'cancel' }]);
  };
  const calName = it.kind === 'event' ? (row?.private ? 'Only me' : AREA_NAME[row?.area ?? 'home'] ?? 'Family') : it.kind === 'outside' ? it.source ?? 'Calendar' : it.kind === 'busy' ? 'Shared busy time' : 'Birthdays and anniversaries';
  const color = it.color ?? t.area[(it.area ?? 'home') as keyof typeof t.area]?.[0] ?? t.brand[500];

  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.paper[1] }}>{back}
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}>
      <View style={{ gap: 4 }}>
        <Text v="title1">{it.title}</Text>
        {!!it.location && <Pressable onPress={() => Linking.openURL('maps://?q=' + encodeURIComponent(it!.location!))}><Text color={t.brand[500]}>{it.location}</Text></Pressable>}
        <Text color={t.ink[2]} style={{ marginTop: 6 }}>{l1}</Text><Text color={t.ink[2]}>{l2}</Text>
        {!!row?.repeat && <Text color={t.ink[2]}>{'Repeats ' + repeatLabel(row.repeat).toLowerCase()}{row.repeat_until ? ' until ' + atMidnight(row.repeat_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</Text>}
      </View>
      <Card padding={0}>
        <View style={row1}><Text style={{ flex: 1 }}>Calendar</Text><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} /><Text color={t.ink[3]}>{calName}</Text></View>
        {it.lock && <View style={row1}><Icon name="lock" size={16} color={t.ink[3]} /><Text v="subhead" color={t.ink[2]} style={{ flex: 1 }}>Only you can see this.</Text></View>}
        {it.kind === 'outside' && !it.lock && <View style={row1}><Icon name="users" size={16} color={t.ink[3]} /><Text v="subhead" color={t.ink[2]} style={{ flex: 1 }}>Your family sees this time as busy. Change it in Settings, Work calendars.</Text></View>}
        {!!it.sub && it.kind === 'busy' && <View style={row1}><Text v="subhead" color={t.ink[2]} style={{ flex: 1 }}>{it.sub}. The details stay on their phone.</Text></View>}
        {who.length > 0 && <View style={[row1, { paddingVertical: 8 }]}><Text style={{ flex: 1 }}>Who</Text>{who.map(m => <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Avatar name={m.name} color={m.color} size={22} /><Text v="subhead">{m.name}</Text></View>)}</View>}
        {row && <View style={[row1, { borderBottomWidth: 0 }]}><Text style={{ flex: 1 }}>Alert</Text><Text color={t.ink[3]}>{alertLabel(row.alert)}</Text></View>}
      </Card>
      {(row?.url || row?.notes) && <Card padding={0}>
        {!!row?.url && <Pressable style={row1} onPress={() => Linking.openURL(row.url!)}><Text style={{ flex: 1 }} numberOfLines={1} color={t.brand[500]}>{row.url}</Text><Icon name="external-link" size={16} color={t.brand[500]} /></Pressable>}
        {!!row?.notes && <View style={{ padding: 14 }}><Text v="footnote" weight="bold" color={t.ink[3]}>Notes</Text><Text style={{ marginTop: 4 }}>{row.notes}</Text></View>}
      </Card>}
      {it.kind === 'outside' && <Pressable onPress={() => Linking.openURL('calshow:' + Math.floor((+it!.start - Date.UTC(2001, 0, 1)) / 1000))}><Text color={t.brand[500]} style={{ textAlign: 'center' }}>Open in Apple Calendar</Text></Pressable>}
      {it.kind === 'annual' && <Text v="subhead" color={t.ink[3]} style={{ textAlign: 'center' }}>Birthdays and the anniversary come from Settings, Our family.</Text>}
      {row && (!row.private || row.owner_id === uid) && <Pressable onPress={remove}><Text color={t.danger[0]} style={{ textAlign: 'center', padding: 14 }}>Delete Event</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}
