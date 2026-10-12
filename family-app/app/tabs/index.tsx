import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { ListRow } from '@/components/list-row';
import { useFamily } from '@/hooks/use-family';
import { useReminders } from '@/hooks/use-reminders';
import { useDailyIdeas } from '@/hooks/use-daily-ideas';
import { upcomingDates } from '@/lib/family';
import { fmtLong, inDays, todayISO, fmtWhen } from '@/lib/today-helpers';
import { setDetail } from '@/lib/detail-store';
import { useTheme } from '@/theme/theme-provider';
import { kidsLabel } from '@/lib/brand';
import { supabase } from '@/lib/supabase';
import { MEALS } from '@/lib/meals';
import { useLantern } from '@/hooks/use-lantern';
import { useSetup, label, PRIORITIES, MY_PRIORITIES, priorityGroup } from '@/lib/setup';
import { marriageDaily } from '@/lib/marriage-daily';
import { faithDaily, hasFaith, lanternEdition, readUrl, TEACHINGS, FaithKey } from '@/lib/faiths';
import { useCalendarItems } from '@/hooks/use-events';
import { onDay, setPeek, hm, CalItem } from '@/lib/calendar';
import { useCompass, Rock } from '@/hooks/use-compass';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';

const DIMENSIONS: [NonNullable<Rock['dimension']>, string][] = [['body', 'Body'], ['mind', 'Mind'], ['heart', 'Heart'], ['spirit', 'Spirit']];
export default function Today() {
  const { theme: t } = useTheme(); const { family, uid, me } = useFamily(); const rem = useReminders(family?.id); const ideas = useDailyIdeas();
  const kids = kidsLabel(family); const today = todayISO(); const dates = family ? upcomingDates(family).filter(d => d.days <= 60) : [];
  const open = (x: any) => { setDetail(x); router.push('/detail'); };
  // Top of Today: the Morning Lantern scripture (for families who chose a faith and kept it on) and a quote of the day.
  // LDS and Christian families follow the Morning Lantern's verse and "Remember this" quote; every other faith gets its own daily text and quote.
  const setup = useSetup(family?.id); const faith = (family?.faith ?? 'none') as FaithKey; const faithOn = !!family && hasFaith(faith) && setup.on('faith');
  const { night, study } = useLantern(); const ed = lanternEdition(faith); const daily = faithDaily(faith); const lt = ed ? night?.texts?.[ed] : null;
  const ref: string | undefined = lt?.ref ?? (ed ? night?.scripture : undefined) ?? daily?.text?.ref;
  const verse: string | undefined = lt?.verse ?? (ed && night?.scripture ? undefined : daily?.text?.text);
  const readLink = ref ? (lt || (ed && night) ? readUrl(faith, ref) : daily?.text?.url) : undefined;
  const plain = family ? marriageDaily({ ...family, faith: 'none' }).quote : null;
  const quote = lt?.quote ? { text: lt.quote, by: lt.quote_by ?? '' } : daily?.quote ?? plain;
  const teach = TEACHINGS[faith];
  // Today's menu (family meals chosen for today).
  const [menu, setMenu] = useState<{ id: string; meal: string; title: string }[]>([]); const [menuLoaded, setMenuLoaded] = useState(false);
  useEffect(() => { if (!family || family.id === 'local') return; supabase.from('recipes').select('id,meal,title').eq('family_id', family.id).eq('for_whom', 'family').eq('planned_for', today).then(({ data }) => { setMenu((data || []).sort((a, b) => MEALS.findIndex(x => x[0] === a.meal) - MEALS.findIndex(x => x[0] === b.meal))); setMenuLoaded(true); }); }, [family?.id, today]);
  // Today's schedule: everything on the calendar today that this person may see (reminders have their own section below).
  const [dayFrom, dayTo] = useMemo(() => { const a = new Date(today + 'T00:00:00'); return [a, new Date(+a + 864e5)]; }, [today]);
  const cal = useCalendarItems(family, uid, rem.items, dayFrom, dayTo, 'everyone');
  const schedule = cal.items.filter(it => it.kind !== 'reminder' && onDay(it, today));
  const openItem = (it: CalItem) => { setPeek(it); router.push({ pathname: '/event', params: it.kind === 'event' ? { id: it.id!, occ: it.occ } : {} }); };
  const due = rem.items.filter(r => !r.done && r.due_date && r.due_date <= today);
  // First things first (Covey): this parent's big rocks for today, in the order of the family's ranked priorities.
  const parent = me?.role === 'dad' || me?.role === 'mom';
  const ranked = setup.setup?.priorities ?? []; const myRanked = setup.mine.myPriorities ?? [];
  const compass = useCompass(family?.id, parent, setup.loaded && menuLoaded && cal.loaded, today, () => ({
    ranked: ranked.map(k => ({ key: k, label: label(PRIORITIES, k), group: priorityGroup(k) })), mine: myRanked.map(k => label(MY_PRIORITIES, k)),
    schedule: schedule.map(it => (it.allDay ? 'All day' : hm(it.start)) + ' ' + it.title), menu: menu.map(r => r.meal + ': ' + r.title), due: due.map(r => r.title) }));
  const [adding, setAdding] = useState(false); const [draft, setDraft] = useState('');
  const prioLabel = (k?: string | null) => k ? (PRIORITIES.find(o => o[0] === k) ?? MY_PRIORITIES.find(o => o[0] === k))?.[1] : undefined;
  const openRock = (r: Rock) => open({ title: r.title, why: r.why ?? undefined, icon: r.done ? 'circle-check' : 'target', area: r.role === 'Spouse' ? 'marriage' : r.role === 'Parent' ? 'girls' : 'home',
    eyebrow: [r.role, prioLabel(r.priority)].filter(Boolean).join(' · ') || 'Big rock', meta: [DIMENSIONS.find(d => d[0] === r.dimension)?.[1], r.minutes ? r.minutes + ' min' : ''].filter(Boolean).join(' · ') || undefined,
    steps: r.steps ?? [], onPlan: () => rem.add({ title: r.title, notes: r.why ?? undefined, due_date: today, on_calendar: true, alert: '60', source: 'idea' }),
    actions: [{ title: r.done ? 'Not done yet' : 'Done', icon: 'check', onPress: () => { compass.toggle(r); router.back(); } }, { title: 'Remove', icon: 'trash-2', onPress: () => { compass.remove(r); router.back(); } }] });
  // Coming back from Priorities: pick up the new order (and this week's tally).
  const { reload: reloadSetup } = setup; const { reloadWeek } = compass;
  useFocusEffect(useCallback(() => { reloadSetup(); reloadWeek(); }, [reloadSetup, reloadWeek]));
  const wk = compass.week; const doneToday = compass.rocks.filter(r => r.done).length;
  return <Screen subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title="Today">
    {family && parent && <Gutter style={{ marginBottom: 12 }}><Card eyebrow="First things first" title={compass.day?.focus ?? 'Today’s big rocks'}
      action={<Text v="footnote" weight="bold" color={t.brand[500]} onPress={() => router.push('/priorities')} accessibilityRole="link">Priorities</Text>}>
      {!!compass.day?.look_back && <Text v="subhead" color={t.ink[3]} style={{ marginBottom: 8 }}>{compass.day.look_back}</Text>}
      {compass.rocks.map((r, i) => <View key={r.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i ? .5 : 0, borderColor: t.line[2] }}>
        <Pressable onPress={() => compass.toggle(r)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: r.done }} accessibilityLabel={r.title}
          style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: r.done ? t.brand[500] : t.ink[4], backgroundColor: r.done ? t.brand[500] : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          {r.done ? <Icon name="check" size={16} color={t.ink.inverse} /> : <Text v="caption" weight="heavy" color={t.ink[3]}>{i + 1}</Text>}</Pressable>
        <Pressable onPress={() => openRock(r)} style={{ flex: 1 }} accessibilityRole="button">
          <Text v="headline" color={r.done ? t.ink[3] : t.ink[1]} style={{ textDecorationLine: r.done ? 'line-through' : 'none' }}>{r.title}</Text>
          <Text v="footnote" color={t.ink[3]}>{[r.role, prioLabel(r.priority), DIMENSIONS.find(d => d[0] === r.dimension)?.[1], r.minutes ? r.minutes + ' min' : ''].filter(Boolean).join(' · ')}</Text>
        </Pressable></View>)}
      {compass.loading && <Text v="subhead" color={t.ink[3]} style={{ paddingVertical: 8 }}>Choosing today’s big rocks from your priorities…</Text>}
      {!compass.loading && !!compass.note && <View style={{ paddingVertical: 6, gap: 4 }}><Text v="subhead" color={t.ink[3]}>{compass.note}</Text>
        {ranked.slice(0, 3).map((k, i) => <Text key={k} v="subhead">{i + 1}. {label(PRIORITIES, k)}</Text>)}</View>}
      {adding ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput value={draft} onChangeText={setDraft} autoFocus placeholder="One thing that matters today" placeholderTextColor={t.ink[4]} returnKeyType="done"
            onSubmitEditing={() => { compass.add(draft); setDraft(''); setAdding(false); }} style={{ flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, fontSize: 16, fontFamily: t.font.body, color: t.ink[1] }} />
          <Button size="sm" variant="primary" title="Add" onPress={() => { compass.add(draft); setDraft(''); setAdding(false); }} /></View>
        : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <Button size="sm" variant="tinted" icon="plus" title="Add my own" onPress={() => setAdding(true)} />
          <Button size="sm" variant="tinted" icon="refresh-cw" title="New suggestions" onPress={compass.refresh} disabled={compass.loading} /></View>}
      {wk && <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: .5, borderColor: t.line[2], gap: 8 }}>
        <Text v="footnote" weight="heavy" color={t.ink.label} style={{ textTransform: 'uppercase', letterSpacing: .8 }}>This week</Text>
        <Text v="subhead">{wk.rocks} big rocks kept together ({wk.mine} yours{doneToday ? ', ' + doneToday + ' today' : ''}) · {wk.reminders} to-dos done · {wk.kids} wins with the kids</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{DIMENSIONS.map(([k, l]) => <View key={k} style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: wk[k] ? t.brand[50] : t.paper[2], alignItems: 'center' }}>
          <Text v="headline" color={wk[k] ? t.brand[700] : t.ink[3]}>{wk[k]}</Text><Text v="caption" color={t.ink[3]}>{l}</Text></View>)}</View>
      </View>}
    </Card></Gutter>}
    {family && <Gutter>{faithOn && ref
      ? <Card variant="inverse" eyebrow={ed ? 'Morning Lantern · today’s scripture' : 'Today’s reading'} title={ref}>
          {!!verse && <Text v="callout" color={t.ink.inverse} style={{ fontStyle: 'italic' }}>“{verse}”</Text>}
          {!verse && !!study?.says && <Text v="subhead" color={t.ink.inverse}>{study.says}</Text>}
          {!!readLink && <Text v="footnote" weight="bold" color={t.onBrand.highlight} style={{ marginTop: 8 }} onPress={() => Linking.openURL(readLink)} accessibilityRole="link">{faith === 'lds' ? 'Read in Gospel Library' : 'Read it'}</Text>}
          {quote && <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: .5, borderColor: t.ink.inverse + '55' }}><Text v="headline" color={t.ink.inverse}>“{quote.text}”</Text>{!!quote.by && <Text v="footnote" color={t.ink.inverse} style={{ marginTop: 4, opacity: .8 }}>{quote.by}</Text>}</View>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            {!!ed && <Text v="footnote" weight="bold" color={t.ink.inverse} onPress={() => router.push('/lantern')} accessibilityRole="link">Open today’s study</Text>}
            {!!teach && <Text v="footnote" weight="bold" color={t.ink.inverse} onPress={() => Linking.openURL(teach[1])} accessibilityRole="link">{teach[0]}</Text>}
          </View>
        </Card>
      : plain && <Card variant="accent" eyebrow="Quote of the day"><Text v="headline">“{plain.text}”</Text><Text v="footnote" color={t.ink[3]} style={{ marginTop: 4 }}>{plain.by}</Text></Card>}</Gutter>}
    <SectionHead title="Today’s schedule" action="Calendar" onAction={() => router.push('/tabs/calendar')} />
    <Gutter>{schedule.length ? <Card padding={0}>{schedule.map((it, i) => <Pressable key={it.key} onPress={() => openItem(it)} style={{ flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: i < schedule.length - 1 ? .5 : 0, borderColor: t.line[2] }}>
        <View style={{ width: 4, borderRadius: 2, backgroundColor: it.color ?? (it.area ? t.area[it.area as keyof typeof t.area]?.[0] : undefined) ?? t.brand[500] }} />
        <Text v="footnote" weight="bold" color={t.ink[3]} style={{ width: 64 }}>{it.allDay ? 'All day' : hm(it.start)}</Text>
        <View style={{ flex: 1 }}><Text v="headline">{it.title}</Text>{!!(it.location || it.sub) && <Text v="footnote" color={t.ink[3]}>{it.location || it.sub}</Text>}</View></Pressable>)}</Card>
      : <Text v="subhead" color={t.ink[3]}>Nothing on the calendar today.</Text>}</Gutter>
    <SectionHead title="Today’s menu" action={menu.length ? 'Meals' : 'Plan meals'} onAction={() => router.push('/meals')} />
    <Gutter>{menu.length ? <Card padding={0}>{menu.map((r, i) => <Pressable key={r.id} onPress={() => router.push({ pathname: '/recipe', params: { id: r.id } })} style={{ padding: 14, borderBottomWidth: i < menu.length - 1 ? .5 : 0, borderColor: t.line[2] }}>
        <Text v="footnote" weight="bold" color={t.brand[400]}>{MEALS.find(x => x[0] === r.meal)?.[1]}</Text><Text v="headline">{r.title}</Text></Pressable>)}</Card>
      : <Text v="subhead" color={t.ink[3]}>No meals planned for today. Tap Plan meals to get recipe ideas.</Text>}</Gutter>
    {dates.length > 0 && <Rail title="Coming up" subtitle="Birthdays and anniversaries" data={dates} render={d => <ContentTile area={d.kind === 'anniversary' ? 'marriage' : d.member?.role === 'daughter' || d.member?.role === 'son' ? 'girls' : 'home'} icon={d.kind === 'anniversary' ? 'heart' : 'cake'} title={d.title} meta={fmtLong(d.date) + ' · ' + inDays(d.days)} badge={d.days <= 14 ? 'Soon' : undefined} />} />}
    <Rail title={'Today with ' + kids} subtitle="New every day" action="See all" onAction={() => router.push('/tabs/family')} itemWidth={272}
      data={ideas.girls.slice(0, 3)} render={x => <ContentTile size="wide" area={x.kind === 'couple' ? 'marriage' : 'girls'} icon={x.icon} eyebrow={x.kind === 'couple' ? 'Just us' : 'With ' + kids} title={x.title} meta={x.meta} attachments={x.attachments?.length}
        onPress={() => open({ ...x, area: x.kind === 'couple' ? 'marriage' : 'girls', onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: today, on_calendar: true, alert: '60', source: 'idea' }) })} />} />
    <SectionHead title="Reminders" action="All" onAction={() => router.push('/tabs/reminders')} />
    <Gutter><Card padding={0}>{rem.items.filter(r => !r.done && r.due_date && r.due_date <= today).map((r, i, a) => <ListRow key={r.id} title={r.title} subtitle={fmtWhen(r)} divider={i < a.length - 1} onPress={() => rem.toggle(r)} leading={<View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: t.ink[4] }} />} />)}</Card></Gutter>
  </Screen>;
}
