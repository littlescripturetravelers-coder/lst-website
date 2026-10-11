import { useEffect, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { kidsLabel } from '@/lib/brand';
import { supabase } from '@/lib/supabase';
const AREAS = ['marriage', 'kids', 'faith', 'money', 'health', 'growth', 'home', 'work'];
/** Franklin Covey roles + Quadrant II planning. Family goals (parents) plus each person's own private goals. */
export default function Goals() {
  const { theme: t } = useTheme(); const { family, me, canPrivate } = useFamily(); const [goals, setGoals] = useState<any[]>([]);
  const isParent = me?.role === 'dad' || me?.role === 'mom';
  const [title, setTitle] = useState(''); const [area, setArea] = useState('growth'); const [mineOnly, setMineOnly] = useState(!isParent);
  const load = () => { if (family) supabase.from('goals').select('*').eq('family_id', family.id).order('created_at').then(({ data }) => setGoals(data || [])); };
  useEffect(load, [family?.id]);
  useEffect(() => { setMineOnly(!isParent); }, [isParent]);
  const add = async () => { if (!family || !title.trim()) return; await supabase.from('goals').insert({ family_id: family.id, title: title.trim(), area, private: mineOnly }); setTitle(''); load(); };
  const fam = goals.filter(g => !g.private), mine = goals.filter(g => g.private);
  const GoalCard = ({ g }: { g: any }) => <Card eyebrow={g.area} title={g.title}>{(g.steps || []).map((s: any, i: number) => <Text key={i} v="subhead" color={s.done ? t.ink[3] : t.ink[1]}>{s.done ? '●' : '○'}  {s.title}</Text>)}</Card>;
  const Q = [['I', 'Urgent · Important', 'Do now'], ['II', 'Not urgent · Important', 'Schedule'], ['III', 'Urgent · Not important', 'Limit'], ['IV', 'Neither', 'Drop']];
  return <Screen title="Goals" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>More</Text>}>
    {(isParent || canPrivate) && <Gutter style={{ marginTop: 8 }}><Card>
      <TextInput value={title} onChangeText={setTitle} placeholder="A new goal" placeholderTextColor={t.ink[4]} style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{AREAS.map(a => <Pressable key={a} onPress={() => setArea(a)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: area === a ? t.brand[500] : t.paper[2] }}><Text v="footnote" weight="bold" color={area === a ? t.ink.inverse : t.ink[2]} style={{ textTransform: 'capitalize' }}>{a === 'kids' ? kidsLabel(family) : a}</Text></Pressable>)}</View>
      {isParent && canPrivate && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}><View style={{ flex: 1 }}><Text>Just for me</Text><Text v="caption" color={t.ink[3]}>{mineOnly ? 'Only you will see this goal.' : 'Your spouse will see this goal too.'}</Text></View><Switch value={mineOnly} onValueChange={setMineOnly} trackColor={{ true: t.brand[500] }} /></View>}
      <View style={{ marginTop: 10 }}><Button size="sm" icon="plus" title="Add goal" disabled={!title.trim()} onPress={add} /></View>
    </Card></Gutter>}
    {isParent && <><SectionHead title="Family goals, by role" />
    <Gutter style={{ gap: 10 }}>{fam.map(g => <GoalCard key={g.id} g={g} />)}
      {!fam.length && <Text color={t.ink[3]}>Add your first goal for each role: marriage, {kidsLabel(family)}, faith, money, health, growth and home.</Text>}</Gutter></>}
    {(canPrivate || mine.length > 0) && <><SectionHead title="My goals · only I see these" />
    <Gutter style={{ gap: 10 }}>{mine.map(g => <GoalCard key={g.id} g={g} />)}
      {!mine.length && <Text color={t.ink[3]}>Goals you keep just for yourself show here.</Text>}</Gutter></>}
    <SectionHead title="This week, by quadrant" />
    <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{Q.map(([q, d, a]) => <View key={q} style={{ width: '48%', padding: 12, borderRadius: 14, backgroundColor: q === 'II' ? t.gold[50] : t.paper[2], borderWidth: q === 'II' ? 1.5 : 0, borderColor: t.gold[600] }}><Text v="title2">Q{q}</Text><Text v="footnote" color={t.ink[2]}>{d}</Text><Text v="footnote" weight="bold">{a}</Text></View>)}</Gutter>
    <Gutter style={{ marginTop: 20 }}><Button full size="lg" variant="cta" icon="compass" title="Plan next week together" onPress={() => router.push({ pathname: '/reminder-sheet', params: { calendar: '1' } })} /></Gutter>
  </Screen>;
}
