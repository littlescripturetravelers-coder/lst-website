import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useWishes, Vote } from '@/hooks/use-wishes';
import { KINDS, MOODS, moodKey, Wish, WishKind } from '@/lib/wish-catalog';
import { todayISO } from '@/lib/dates';

const ANSWERS: [Vote, string][] = [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No thanks']];
type Tab = 'both' | 'answer' | 'mine';
/** One "Our list" (date nights, trips, home projects or intimacy). Each parent answers privately; only ideas you both said yes to show
 *  under "We both want". Your spouse never sees your Maybe or No thanks. Parents only. */
export default function OurList() {
  const { theme: t } = useTheme(); const p = useLocalSearchParams<{ kind?: string }>(); const { family, me, uid } = useFamily();
  const kind = (KINDS.find(k => k.kind === p.kind)?.kind ?? 'date') as WishKind; const info = KINDS.find(k => k.kind === kind)!;
  const w = useWishes(family?.id, uid); const [tab, setTab] = useState<Tab>('answer'); const [title, setTitle] = useState(''); const [detail, setDetail] = useState(''); const [openTips, setOpenTips] = useState<Record<string, boolean>>({});
  if (me && me.role !== 'dad' && me.role !== 'mom') return <Redirect href="/kid" />;
  const items = w.itemsFor(kind), both = items.filter(i => w.matches.has(i.key)), todo = items.filter(i => !w.mine[i.key]), answered = items.filter(i => !!w.mine[i.key]);
  // Tonight: each of you picks privately; only moods you both picked show, with the ideas you both want that fit them.
  const today = todayISO(); const myMoods = MOODS.filter(([f]) => w.mine[moodKey(today, f)] === 'yes').map(([f]) => f);
  const bothMoods = MOODS.filter(([f]) => w.matches.has(moodKey(today, f)));
  const forTonight = both.filter(i => i.focus?.some(f => bothMoods.some(([m]) => m === f)));
  const shown = tab === 'both' ? both : tab === 'answer' ? todo : answered;
  const groups = shown.reduce<Record<string, Wish[]>>((g, i) => { const k = i.group ?? ''; (g[k] = g[k] || []).push(i); return g; }, {});
  const field = { height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] };
  const answerRow = (i: Wish) => <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>{ANSWERS.map(([v, l]) => { const on = w.mine[i.key] === v;
    return <Pressable key={v} onPress={() => w.vote(i.key, v)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.brand[500] : t.paper[2] }}>
      <Text v="subhead" weight="bold" color={on ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>; })}</View>;
  const remove = (i: Wish) => Alert.alert('Remove this idea?', 'It comes off both of your lists.', [{ text: 'Remove', style: 'destructive', onPress: () => w.remove(i.key.slice(2)) }, { text: 'Cancel', style: 'cancel' }]);
  const plan = (i: Wish) => router.push({ pathname: '/event-edit', params: { area: kind === 'project' ? 'home' : 'marriage', date: todayISO(), title: i.title } });

  return <Screen title={info.name} subtitle="Our list" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Marriage</Text>}>
    <Gutter><Card variant="sunken"><Text v="subhead" color={t.ink[2]}>Answer each idea on your own. Your spouse never sees your Maybe or No thanks. An idea shows under “We both want” only when you both say Yes.</Text></Card></Gutter>
    {kind === 'intimacy' && <Gutter style={{ marginTop: 12 }}><Card variant="accent" eyebrow="Tonight I’d love…">
      <Text v="subhead" color={t.ink[2]} style={{ marginBottom: 10 }}>Pick what you’re in the mood for today. Your spouse only sees the ones you both picked.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{MOODS.map(([f, l]) => { const on = myMoods.includes(f);
        return <Pressable key={f} onPress={() => w.vote(moodKey(today, f), on ? 'no' : 'yes')} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: 'center', borderWidth: 1.5, borderColor: on ? t.brand[500] : t.line[2], backgroundColor: on ? t.brand[500] : t.paper[0] }}>
          <Text v="footnote" weight="bold" color={on ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>; })}</View>
      {bothMoods.length > 0 && <View style={{ marginTop: 12, gap: 4 }}><Text v="headline">You’re both in the mood for: {bothMoods.map(m => m[1].toLowerCase()).join(', ')}</Text>
        {forTonight.length ? forTonight.slice(0, 6).map(i => <Text key={i.key} v="subhead" color={t.ink[2]}>• {i.title}</Text>) : <Text v="subhead" color={t.ink[3]}>Say Yes to a few ideas below and the ones that fit will show here.</Text>}</View>}
    </Card></Gutter>}
    <Gutter style={{ marginTop: 12 }}><View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>
      {([['both', 'We both want (' + both.length + ')'], ['answer', 'To answer (' + todo.length + ')'], ['mine', 'My answers']] as [Tab, string][]).map(([k, l]) =>
        <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="button" accessibilityState={{ selected: tab === k }} style={{ flex: 1, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === k ? t.paper[0] : 'transparent' }}>
          <Text v="footnote" weight={tab === k ? 'bold' : 'regular'}>{l}</Text></Pressable>)}</View></Gutter>
    {Object.entries(groups).map(([g, list]) => <View key={g}>
      {!!g && <SectionHead title={g} />}
      <Gutter style={{ gap: 10, marginTop: g ? 0 : 12 }}>{list.map(i => <Card key={i.key} variant={tab === 'both' ? 'accent' : 'plain'}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}><Text v="headline">{i.title}</Text>{!!i.detail && <Text v="subhead" color={t.ink[2]} style={{ marginTop: 2 }}>{i.detail}</Text>}
            {!!i.tips?.length && <Pressable onPress={() => setOpenTips(o => ({ ...o, [i.key]: !o[i.key] }))} hitSlop={6} style={{ marginTop: 6 }}><Text v="footnote" weight="bold" color={t.brand[500]}>{openTips[i.key] ? 'Hide tips' : 'Tips (' + i.tips.length + ')'}</Text></Pressable>}
            {openTips[i.key] && i.tips?.map((x, n) => <Text key={n} v="subhead" color={t.ink[2]} style={{ marginTop: 4 }}>• {x}</Text>)}
            {i.mine && <Text v="caption" color={t.ink[3]} style={{ marginTop: 4 }}>You added this. It stays on your list until you remove it.</Text>}</View>
          {i.mine && <Pressable onPress={() => remove(i)} hitSlop={10} accessibilityLabel={'Remove ' + i.title}><Icon name="x" size={18} color={t.ink[3]} /></Pressable>}
        </View>
        {tab === 'both' ? (kind !== 'intimacy' && <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Button size="sm" icon="calendar-plus" title="Plan it" onPress={() => plan(i)} /></View>) : answerRow(i)}
      </Card>)}</Gutter></View>)}
    {!shown.length && <Gutter style={{ marginTop: 16 }}><Text color={t.ink[3]}>{tab === 'both' ? 'Nothing here yet. Once you both say Yes to an idea, it shows up here.' : tab === 'answer' ? 'You’ve answered everything. Add your own idea below.' : 'Ideas you answer show here so you can change your mind any time.'}</Text></Gutter>}
    <SectionHead title="Add your own idea" />
    <Gutter><Card>
      <TextInput value={title} onChangeText={setTitle} placeholder="Your idea" maxLength={140} placeholderTextColor={t.ink[4]} style={field} />
      <TextInput value={detail} onChangeText={setDetail} placeholder="A few words about it (optional)" maxLength={500} placeholderTextColor={t.ink[4]} style={[field, { marginTop: 8 }]} />
      <Text v="caption" color={t.ink[3]} style={{ marginTop: 8 }}>Your spouse will see it to answer. It counts as a Yes from you.</Text>
      <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Button size="sm" icon="plus" title="Add idea" disabled={!title.trim()} onPress={async () => { await w.add(kind, title, detail); setTitle(''); setDetail(''); }} /></View>
    </Card></Gutter>
    <View style={{ height: 30 }} />
  </Screen>;
}
