import { useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme/theme-provider';
import { useLantern } from '@/hooks/use-lantern';
import { useFamily } from '@/hooks/use-family';
import { kidsLabel } from '@/lib/brand';
/** Morning Lantern couple study: scripture of the day, then marriage + parenting application. Links to tonight's story activity for the kids. */
export default function Lantern() {
  const { theme: t } = useTheme(); const { night, study, answers, answer, done, activity } = useLantern(); const { family, me } = useFamily();
  const [local, setLocal] = useState<Record<string, string>>({});
  if (me && me.role !== 'dad' && me.role !== 'mom') return <Redirect href="/kid" />; // couple study is parents-only
  const L = (s: string) => <Text v="overline" color={t.brand[400]} style={{ marginTop: 22, marginBottom: 8 }}>{s}</Text>;
  if (!night || !study) return <Screen title="Morning Lantern"><Gutter><Text color={t.ink[3]}>Lighting the lantern…</Text></Gutter></Screen>;
  return <Screen title="Morning Lantern" subtitle="Couple study · 10 minutes" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Done</Text>}>
    <Gutter>
      <Card variant="inverse" eyebrow="Scripture of the day" title={night.scripture}>
        <View style={{ height: 2, width: 48, backgroundColor: t.onBrand.highlight, marginBottom: 10 }} />
        <Text v="subhead" color={t.ink.inverse}>Tonight’s story for {kidsLabel(family)}: {night.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Button size="sm" variant="cta" onBrand icon="book-open" title="Read the verse" onPress={() => Linking.openURL('https://www.churchofjesuschrist.org/search?query=' + encodeURIComponent(night.scripture))} />
          <Button size="sm" variant="secondary" icon="lamp" title="Tonight’s Lantern" onPress={() => Linking.openURL(night.edition_url)} />
        </View>
      </Card>
      {L('1 · Read together')}<Text>{study.read}</Text>
      {L('2 · What it teaches')}<Text>{study.says}</Text>
      {L('3 · For our marriage')}
      <View style={{ gap: 12 }}>{study.marriage.map(m => { const who = family?.members.find(x => x.name === m.who); return <Card key={m.who}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}><Avatar name={m.who} color={who?.color} size={28} /><Text weight="heavy">{m.who}</Text></View>
        <Text v="callout" style={{ marginBottom: 10 }}>{m.q}</Text>
        <TextInput multiline placeholder="Your answer" value={local[m.who] ?? answers[m.who] ?? ''} onChangeText={v => setLocal(s => ({ ...s, [m.who]: v }))} onEndEditing={() => answer(m.who, local[m.who] ?? '')}
          style={{ minHeight: 64, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], padding: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }} />
      </Card>; })}</View>
      {L('4 · For our parenting')}
      <Card padding={0}>{study.parenting.map((p, i) => <View key={p.who} style={{ padding: 14, borderBottomWidth: i < study.parenting.length - 1 ? .5 : 0, borderColor: t.line[2] }}><Text weight="bold">{p.who}</Text><Text v="subhead" color={t.ink[2]}>{p.how}</Text></View>)}</Card>
      {activity && <Card variant="accent" eyebrow={'Tonight with ' + kidsLabel(family)} title={activity.title} style={{ marginTop: 12 }} onPress={() => router.push('/story-activity')}><Text v="subhead" color={t.ink[2]}>{activity.minutes ?? 20} min · a hands-on way to learn tonight’s story</Text></Card>}
      {L('5 · One small act today')}<Card variant="accent"><Text>{study.act}</Text></Card>
      {L('6 · Pray together')}<Text>{study.pray}</Text>
      <View style={{ marginTop: 22 }}><Button full size="lg" variant="cta" icon="check" title="We did it today" onPress={() => { done(); router.back(); }} /></View>
    </Gutter>
  </Screen>;
}
