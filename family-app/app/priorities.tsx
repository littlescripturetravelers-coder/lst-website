import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Button } from '@/components/button';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useSetup, label, PRIORITIES, MY_PRIORITIES, priorityGroup } from '@/lib/setup';

/** Priorities in order (Covey: put first things first). The family's priorities and your own, ranked; Today's big rocks follow this order. */
export default function PrioritiesScreen() {
  const { theme: t } = useTheme(); const { family, me } = useFamily(); const s = useSetup(family?.id);
  const parent = me?.role === 'dad' || me?.role === 'mom';
  const fam = s.setup?.priorities ?? []; const mine = s.mine.myPriorities ?? [];
  const move = (xs: string[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= xs.length) return xs; const out = xs.slice(); [out[i], out[j]] = [out[j], out[i]]; return out; };
  const row = (k: string, i: number, n: number, text: string, sub: string, onMove: (d: number) => void) => <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < n - 1 ? .5 : 0, borderColor: t.line[2] }}>
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i < 3 ? t.brand[500] : t.paper[2], alignItems: 'center', justifyContent: 'center' }}><Text v="footnote" weight="heavy" color={i < 3 ? t.ink.inverse : t.ink[2]}>{i + 1}</Text></View>
    <View style={{ flex: 1 }}><Text v="headline">{text}</Text>{!!sub && <Text v="footnote" color={t.ink[3]}>{sub}</Text>}</View>
    {parent && <><Pressable onPress={() => onMove(-1)} disabled={i === 0} accessibilityRole="button" accessibilityLabel={'Move ' + text + ' up'} style={{ padding: 6, opacity: i === 0 ? .3 : 1 }}><Icon name="chevron-up" /></Pressable>
      <Pressable onPress={() => onMove(1)} disabled={i === n - 1} accessibilityRole="button" accessibilityLabel={'Move ' + text + ' down'} style={{ padding: 6, opacity: i === n - 1 ? .3 : 1 }}><Icon name="chevron-down" /></Pressable></>}
  </View>;
  return <ScrollView style={{ backgroundColor: t.paper[1] }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 60 }} /><Text v="headline" style={{ flex: 1, textAlign: 'center' }}>Priorities in order</Text><Text weight="heavy" color={t.brand[500]} onPress={() => router.back()} style={{ width: 60, textAlign: 'right' }}>Done</Text></View>
    <Text v="subhead" color={t.ink[3]}>Put first things first. Move what matters most to the top. Today’s big rocks follow this order.</Text>
    <Card eyebrow="Our family" title={fam.length ? undefined : 'No family priorities yet'}>
      {fam.map((k, i) => row(k, i, fam.length, label(PRIORITIES, k), priorityGroup(k), d => s.rankFamily(move(fam, i, d))))}
      {!fam.length && <Text v="subhead" color={t.ink[3]}>Choose them in the check-in, then put them in order here.</Text>}
    </Card>
    <Card eyebrow="Just you" title={mine.length ? undefined : 'No personal priorities yet'}>
      {mine.map((k, i) => row(k, i, mine.length, label(MY_PRIORITIES, k), '', d => s.saveMine({ ...s.mine, myPriorities: move(mine, i, d) })))}
      {!mine.length && <Text v="subhead" color={t.ink[3]}>Only you see these.</Text>}
    </Card>
    {parent && <Button full variant="secondary" icon="list-checks" title="Change which priorities" onPress={() => router.push('/setup')} />}
  </ScrollView>;
}
