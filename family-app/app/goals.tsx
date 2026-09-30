import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { kidsLabel } from '@/lib/brand';
import { supabase } from '@/lib/supabase';
/** Franklin Covey roles + Quadrant II planning. */
export default function Goals() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const [goals, setGoals] = useState<any[]>([]);
  useEffect(() => { if (family) supabase.from('goals').select('*').eq('family_id', family.id).then(({ data }) => setGoals(data || [])); }, [family?.id]);
  const Q = [['I', 'Urgent · Important', 'Do now'], ['II', 'Not urgent · Important', 'Schedule'], ['III', 'Urgent · Not important', 'Limit'], ['IV', 'Neither', 'Drop']];
  return <Screen title="Goals" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>More</Text>}>
    <SectionHead title="By role" />
    <Gutter style={{ gap: 10 }}>{goals.map(g => <Card key={g.id} eyebrow={g.area} title={g.title}>{(g.steps || []).map((s: any, i: number) => <Text key={i} v="subhead" color={s.done ? t.ink[3] : t.ink[1]}>{s.done ? '●' : '○'}  {s.title}</Text>)}</Card>)}
      {!goals.length && <Text color={t.ink[3]}>Add your first goal for each role: marriage, {kidsLabel(family)}, faith, money, health, growth and home.</Text>}</Gutter>
    <SectionHead title="This week, by quadrant" />
    <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{Q.map(([q, d, a]) => <View key={q} style={{ width: '48%', padding: 12, borderRadius: 14, backgroundColor: q === 'II' ? t.gold[50] : t.paper[2], borderWidth: q === 'II' ? 1.5 : 0, borderColor: t.gold[600] }}><Text v="title2">Q{q}</Text><Text v="footnote" color={t.ink[2]}>{d}</Text><Text v="footnote" weight="bold">{a}</Text></View>)}</Gutter>
    <Gutter style={{ marginTop: 20 }}><Button full size="lg" variant="cta" icon="compass" title="Plan next week together" onPress={() => router.push({ pathname: '/reminder-sheet', params: { calendar: '1' } })} /></Gutter>
  </Screen>;
}
