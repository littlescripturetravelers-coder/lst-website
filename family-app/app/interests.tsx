import { useEffect, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { supabase, fn } from '@/lib/supabase';
const SUGGEST = [['Hunting', 'crosshair', 'season'], ['Time with my sisters', 'users', 'people'], ['A favorite TV show', 'tv', 'show'], ['Fishing', 'fish', 'season'], ['Working out', 'dumbbell', 'habit'], ['Golf', 'flag', 'habit'], ['Book club', 'book-open', 'people'], ['Temple trips', 'landmark', 'habit'], ['Camping', 'tent', 'season'], ['A sports team', 'trophy', 'team']];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** What matters to each person. Add or remove; each one is scheduled into Calendar + Reminders by functions/interest-plan. */
export default function Interests() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const [list, setList] = useState<any[]>([]);
  const [who, setWho] = useState<string | null>(null); const [d, setD] = useState<any>({ title: '', kind: 'habit', every_days: 7, weekday: 6, at_time: '19:00', add_to_calendar: true, remind: true });
  const load = async () => family && setList((await supabase.from('interests').select('*').eq('family_id', family.id)).data || []);
  useEffect(() => { load(); }, [family?.id]);
  const save = async () => { const { data } = await supabase.from('interests').insert({ ...d, family_id: family!.id, member_slug: who }).select().single(); setWho(null); await load(); if (data) await fn('interest-plan', { id: data.id }); };
  const remove = async (id: string) => { await supabase.from('interests').delete().eq('id', id); load(); }; // cascades to its reminders + events
  if (!family) return null;
  return <Screen title="What matters to us" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Done</Text>}>
    <Gutter><Text v="subhead" color={t.ink[2]}>Hobbies, people and shows. Each one shows up on the calendar and in reminders on its own, and keeps rolling forward.</Text></Gutter>
    {family.members.map(m => <View key={m.id}><SectionHead title={m.name} action="Add" onAction={() => setWho(m.id)} />
      <Gutter><Card padding={12}><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{list.filter(i => i.member_slug === m.id).map(i => <Pressable key={i.id} onLongPress={() => remove(i.id)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: t.area.growth[1] }}>
        <Text v="subhead" weight="bold">{i.detail || i.title}</Text><Text v="caption" color={t.ink[3]} onPress={() => remove(i.id)}>✕</Text></Pressable>)}
        {!list.some(i => i.member_slug === m.id) && <Text color={t.ink[3]}>Nothing yet</Text>}</View></Card></Gutter>
      {who === m.id && <><Rail data={SUGGEST} itemWidth={120} render={([title, icon, kind]) => <ContentTile size="sm" area="growth" icon={icon} title={title} selected={d.title === title} onPress={() => setD({ ...d, title, kind })} />} />
        <Gutter style={{ gap: 10, marginTop: 10 }}>
          <TextInput value={d.title} onChangeText={v => setD({ ...d, title: v })} placeholder="Or type your own" placeholderTextColor={t.ink[4]} style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, color: t.ink[1], backgroundColor: t.paper[0] }} />
          {(d.kind === 'show' || d.kind === 'team') && <TextInput value={d.detail} onChangeText={v => setD({ ...d, detail: v })} placeholder={d.kind === 'show' ? 'Which show?' : 'Which team?'} placeholderTextColor={t.ink[4]} style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, color: t.ink[1], backgroundColor: t.paper[0] }} />}
          {d.kind !== 'season' && <View style={{ flexDirection: 'row', gap: 4 }}>{DAYS.map((x, n) => <Pressable key={x} onPress={() => setD({ ...d, weekday: n })} style={{ flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: d.weekday === n ? t.brand[500] : t.paper[2] }}><Text v="footnote" weight="bold" color={d.weekday === n ? t.ink.inverse : t.ink[2]}>{x}</Text></Pressable>)}</View>}
          {d.kind !== 'season' && <View style={{ flexDirection: 'row', gap: 6 }}>{[[7, 'Weekly'], [14, 'Every 2 weeks'], [30, 'Monthly']].map(([v, l]) => <Pressable key={v} onPress={() => setD({ ...d, every_days: v })} style={{ flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: d.every_days === v ? t.brand[500] : t.paper[2] }}><Text v="footnote" weight="bold" color={d.every_days === v ? t.ink.inverse : t.ink[2]}>{l}</Text></Pressable>)}</View>}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1 }}>Add to calendar</Text><Switch value={d.add_to_calendar} onValueChange={v => setD({ ...d, add_to_calendar: v })} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1 }}>Remind me</Text><Switch value={d.remind} onValueChange={v => setD({ ...d, remind: v })} /></View>
          <Button full title="Add" disabled={!d.title} onPress={save} />
        </Gutter></>}
    </View>)}
  </Screen>;
}
