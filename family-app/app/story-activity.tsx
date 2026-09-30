import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useLantern } from '@/hooks/use-lantern';
import { useFamily } from '@/hooks/use-family';
/** Tonight's story activity: built nightly from the Morning Lantern story, adapted to each daughter's current developmental stage. */
export default function StoryActivityScreen() {
  const { theme: t } = useTheme(); const { activity: a, activityRow, activityDone, night } = useLantern(); const { family } = useFamily();
  if (!a) return <Screen title="Story activity"><Gutter><Text color={t.ink[3]}>Getting tonight’s activity ready…</Text></Gutter></Screen>;
  const L = (s: string) => <Text v="overline" color={t.brand[400]} style={{ marginTop: 22, marginBottom: 8 }}>{s}</Text>;
  const tie: any = a.scripture_tie;
  return <Screen title={a.title} subtitle={(night?.title ?? '') + ' · ' + (a.minutes ?? 20) + ' min'} trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Done</Text>}>
    <Gutter>
      <View style={{ height: 180, borderRadius: 10, backgroundColor: t.area.girls[1], alignItems: 'center', justifyContent: 'center' }}><Icon name={a.icon ?? 'sparkles'} size={64} color={t.area.girls[0]} /></View>
      <Text v="title3" style={{ marginTop: 16 }}>{a.story_in_one_line}</Text>
      {L('You’ll need')}<Text>{a.materials.join(' · ')}</Text>{a.setup && <Text v="subhead" color={t.ink[3]} style={{ marginTop: 4 }}>{a.setup}</Text>}
      {L('Together')}
      <View style={{ gap: 10 }}>{a.together.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.brand[500], alignItems: 'center', justifyContent: 'center' }}><Text v="footnote" weight="heavy" color={t.ink.inverse}>{i + 1}</Text></View><Text v="callout" style={{ flex: 1 }}>{s}</Text></View>)}</View>
      {L('For each child')}
      <View style={{ gap: 12 }}>{a.per_child.map(c => { const m = family?.members.find(x => x.name === c.name); const done = activityRow?.done_by?.[c.name]; return <Card key={c.name}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}><Avatar name={c.name} color={m?.color} size={36} /><View style={{ flex: 1 }}><Text weight="heavy">{c.name} · {c.age}</Text><Text v="footnote" color={t.ink[3]}>{c.role_in_activity}</Text></View></View>
        <Text v="subhead" color={t.ink[2]}>{c.how_to_adapt}</Text>
        <Text v="overline" color={t.success[0]} style={{ marginTop: 10 }}>Say</Text><Text weight="bold">“{c.what_to_say}”</Text>
        <Text v="overline" color={t.brand[400]} style={{ marginTop: 10 }}>Got it if</Text><Text v="subhead">{(c as any).got_it_if ?? (c as any).she_got_it_if}</Text>
        <View style={{ marginTop: 12 }}><Button size="sm" variant={done ? 'tinted' : 'secondary'} icon={done ? 'check' : undefined} title={done ? 'Done tonight' : 'Mark done'} onPress={() => activityDone(c.name)} /></View>
      </Card>; })}</View>
      {L('Name the feeling')}<Card variant="accent"><Text>{a.feelings_link}</Text></Card>
      {L('Tie it to the scripture')}
      {typeof tie === 'string' ? <Text>{tie}</Text> : <Card><Text weight="bold" style={{ fontStyle: 'italic' }}>{tie.reference}</Text>{tie.questions?.map((q: any) => <Text key={q.name} v="subhead" style={{ marginTop: 6 }}><Text v="subhead" weight="bold">{q.name}: </Text>{q.q}</Text>)}</Card>}
      {L('At bedtime')}<Text>{a.bedtime_recall}</Text>
    </Gutter>
  </Screen>;
}
