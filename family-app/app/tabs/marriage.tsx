import { useCallback, useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/list-row';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useDailyIdeas } from '@/hooks/use-daily-ideas';
import { useLantern } from '@/hooks/use-lantern';
import { useReminders } from '@/hooks/use-reminders';
import { useCoupleLock, unlockCouple, setCoupleLock } from '@/lib/couple-lock';
import { marriageDaily } from '@/lib/marriage-daily';
import { LOVE } from '@/lib/love-languages';
import { parents, yearsMarried, nextOccurrence } from '@/lib/family';
import { addDays, todayISO } from '@/lib/dates';
import { setDetail } from '@/lib/detail-store';
import { supabase } from '@/lib/supabase';
import { CalItem, EventRow, expandEvent, hm, setPeek, DAY } from '@/lib/calendar';

/** Everything about the two parents' relationship. Parents only: children's accounts never get this data (RLS, migration 0015),
 *  and on a parent's phone it is locked with Face ID so the kids can't open it. */
export default function MarriageTab() {
  const { theme: t } = useTheme(); const { family, me } = useFamily(); const lock = useCoupleLock();
  const ideas = useDailyIdeas(); const { night } = useLantern(); const rem = useReminders(family?.id);
  const [dates, setDates] = useState<CalItem[]>([]); const [goals, setGoals] = useState<any[]>([]);
  const isParent = me?.role === 'dad' || me?.role === 'mom';
  const open = !lock.locked && isParent;

  // Ask for Face ID as soon as the tab opens.
  useFocusEffect(useCallback(() => { if (lock.ready && lock.locked && isParent) unlockCouple().catch(() => {}); }, [lock.ready, lock.locked, isParent]));
  useEffect(() => {
    if (!family || !open) return; const now = new Date(), to = new Date(+now + 45 * DAY);
    supabase.from('events').select('*').eq('family_id', family.id).eq('area', 'marriage').lt('starts_at', to.toISOString()).or('repeat.not.is.null,starts_at.gte.' + new Date(+now - DAY).toISOString())
      .then(({ data }) => setDates(((data || []) as EventRow[]).flatMap(e => expandEvent(e, now, to)).sort((a, b) => +a.start - +b.start).slice(0, 4)));
    supabase.from('goals').select('*').eq('family_id', family.id).eq('area', 'marriage').eq('private', false).then(({ data }) => setGoals(data || []));
  }, [family?.id, open]);

  if (!family || !me) return <Screen title="Marriage"><View /></Screen>;
  if (!isParent) return <Screen title="Marriage"><Gutter><Text color={t.ink[3]}>This part of the app is just for the parents.</Text></Gutter></Screen>;
  const ps = parents(family); const title = ps.map(p => p.name).join(' & ') || 'Us';
  const ann = family.anniversary ? nextOccurrence(family.anniversary) : null;
  const sub = family.anniversary ? 'Married ' + yearsMarried(family) + ' years · ' + (ann!.days === 0 ? 'happy anniversary' : 'anniversary in ' + ann!.days + (ann!.days === 1 ? ' day' : ' days')) : 'Just the two of you';
  if (lock.locked) return <Screen title={title} subtitle={sub}>
    <Gutter style={{ alignItems: 'center', gap: 14, paddingTop: 40 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.area.marriage[1], alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={42} color={t.area.marriage[0]} /></View>
      <Text v="title2" style={{ textAlign: 'center' }}>Just for the two of you</Text>
      <Text color={t.ink[2]} style={{ textAlign: 'center' }}>Unlock with Face ID to open your Marriage section.</Text>
      <Button title="Unlock" icon="scan-face" onPress={() => unlockCouple()} />
    </Gutter></Screen>;

  const { quote, joke } = marriageDaily(family);
  const coupleList = rem.lists.find(l => l.color === 'marriage');
  const plan = (x: any) => { setDetail({ ...x, area: 'marriage', onPlan: () => rem.add({ title: x.title, notes: x.why, list_id: coupleList?.id, due_date: addDays(todayISO(), 2), on_calendar: true, alert: '60', source: 'idea' }) }); router.push('/detail'); };
  const cards = ps.flatMap((p: any) => { const top = p.love_languages?.ranked?.[0] as keyof typeof LOVE | undefined; if (!top) return []; const day = new Date().getDate(); return [{ p, l: top, idea: LOVE[top].ideas[day % LOVE[top].ideas.length] }]; });
  const quizFor = ps.find((p: any) => !p.love_languages?.ranked);

  return <Screen title={title} subtitle={sub} trailing={<Pressable onPress={() => router.push({ pathname: '/event-edit', params: { area: 'marriage', date: todayISO() } })} accessibilityLabel="Plan a date"><Icon name="plus" size={26} color={t.brand[500]} /></Pressable>}>
    {family.faith !== 'none' && <Gutter><Card variant="inverse" eyebrow="Morning Lantern · 10 min together" title={night?.scripture ?? 'Lighting the lantern…'} onPress={() => router.push('/lantern')}>
      <Text v="subhead" color={t.ink.inverse}>Read it, answer one question each, and pick one way to live it today.</Text></Card></Gutter>}
    <Rail title="Just the two of us" subtitle="A love quote and a joke, new every day" itemWidth={272} data={['quote', 'joke']} render={k => <View style={{ width: 272 }}>{k === 'quote'
      ? <Card variant="accent" eyebrow="Love quote of the day"><Text v="headline" style={quote.scripture ? { fontStyle: 'italic' } : undefined}>“{quote.text}”</Text><Text v="subhead" color={t.ink[3]} style={{ marginTop: 8 }}>{quote.by}</Text></Card>
      : <Card eyebrow="Joke of the day"><Text v="headline">{joke}</Text></Card>}</View>} />
    <SectionHead title="Coming up for us" action="Plan a date" onAction={() => router.push({ pathname: '/event-edit', params: { area: 'marriage', date: todayISO() } })} />
    <Gutter style={{ gap: 8 }}>
      {dates.map(d => <Pressable key={d.key} onPress={() => { setPeek(d); router.push({ pathname: '/event', params: { id: d.id!, occ: d.occ } }); }} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, backgroundColor: t.area.marriage[1] }}>
        <View style={{ width: 4, borderRadius: 2, backgroundColor: t.area.marriage[0] }} />
        <View style={{ flex: 1 }}><Text v="subhead" weight="bold">{d.title}</Text><Text v="footnote" color={t.ink[2]}>{d.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {d.allDay ? 'All day' : hm(d.start)}{d.location ? ' · ' + d.location : ''}</Text></View></Pressable>)}
      {!dates.length && <Text v="subhead" color={t.ink[3]}>Nothing on your Marriage calendar yet. Tap Plan a date, or plan one of the ideas below.</Text>}
    </Gutter>
    {cards.length > 0 && <Rail title="Love each other today" subtitle="Fitted to your love languages" itemWidth={272} data={cards} render={c => <ContentTile size="wide" area="marriage" icon={LOVE[c.l].icon} eyebrow={'For ' + c.p.name + ' · ' + LOVE[c.l].name} title={c.idea} onPress={() => plan({ title: c.idea, why: c.p.name + '’s top love language is ' + LOVE[c.l].name.toLowerCase() + '.', icon: LOVE[c.l].icon })} />} />}
    <Rail title="Date ideas for today" subtitle="New every day" action={ideas.loading ? 'Finding…' : 'More ideas'} onAction={ideas.more} itemWidth={272} data={ideas.couple} render={x => <ContentTile size="wide" area="marriage" icon={x.icon} title={x.title} meta={x.meta} badge="New today" attachments={x.attachments?.length} onPress={() => plan(x)} />} />
    <SectionHead title="Love languages" />
    <Gutter><Card padding={0}>{ps.map((m: any, i, a) => <ListRow key={m.id} icon="heart" iconColor={t.area.marriage[0]} title={m.name} subtitle={m.love_languages?.ranked ? m.love_languages.ranked.slice(0, 2).map((l: any) => LOVE[l as keyof typeof LOVE].name).join(' · ') : 'Take the 2-minute quiz'} chevron divider={i < a.length - 1} onPress={() => router.push({ pathname: '/love-languages', params: { who: m.id } })} />)}</Card>
      {quizFor && <Text v="footnote" color={t.ink[3]} style={{ marginTop: 6 }}>When you both take the quiz, the daily ideas fit how each of you feels most loved.</Text>}</Gutter>
    <SectionHead title="Our marriage goals" action="Goals" onAction={() => router.push('/goals')} />
    <Gutter style={{ gap: 8 }}>{goals.map(g => <Card key={g.id} eyebrow="marriage" title={g.title} />)}
      {!goals.length && <Text v="subhead" color={t.ink[3]}>Set a goal together, like a weekly date night or a yearly getaway.</Text>}</Gutter>
    <SectionHead title="Privacy" />
    <Gutter><Card padding={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}><View style={{ flex: 1 }}><Text>Lock with Face ID</Text><Text v="footnote" color={t.ink[3]}>Locks again whenever you leave this tab or close the app.</Text></View>
        <Switch value={lock.enabled} onValueChange={v => { setCoupleLock(v); }} trackColor={{ true: t.brand[500] }} /></View></Card>
      <Text v="footnote" color={t.ink[3]} style={{ marginTop: 6 }}>Your kids’ own accounts never see anything here: not this tab, your date nights, the Date night list or your couple ideas.</Text></Gutter>
    <View style={{ height: 30 }} />
  </Screen>;
}
