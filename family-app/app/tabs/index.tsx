import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
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
import { useSetup } from '@/lib/setup';
import { marriageDaily } from '@/lib/marriage-daily';
import { faithDaily, hasFaith, lanternEdition, readUrl, TEACHINGS, FaithKey } from '@/lib/faiths';
export default function Today() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const rem = useReminders(family?.id); const ideas = useDailyIdeas();
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
  const [menu, setMenu] = useState<{ id: string; meal: string; title: string }[]>([]);
  useEffect(() => { if (!family || family.id === 'local') return; supabase.from('recipes').select('id,meal,title').eq('family_id', family.id).eq('for_whom', 'family').eq('planned_for', today).then(({ data }) => setMenu((data || []).sort((a, b) => MEALS.findIndex(x => x[0] === a.meal) - MEALS.findIndex(x => x[0] === b.meal)))); }, [family?.id, today]);
  return <Screen subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title="Today">
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
    {dates.length > 0 && <Rail title="Coming up" subtitle="Birthdays and anniversaries" data={dates} render={d => <ContentTile area={d.kind === 'anniversary' ? 'marriage' : d.member?.role === 'daughter' || d.member?.role === 'son' ? 'girls' : 'home'} icon={d.kind === 'anniversary' ? 'heart' : 'cake'} title={d.title} meta={fmtLong(d.date) + ' · ' + inDays(d.days)} badge={d.days <= 14 ? 'Soon' : undefined} />} />}
    <Rail title={'Today with ' + kids} subtitle="New every day" action="See all" onAction={() => router.push('/tabs/family')} itemWidth={272}
      data={ideas.girls.slice(0, 3)} render={x => <ContentTile size="wide" area={x.kind === 'couple' ? 'marriage' : 'girls'} icon={x.icon} eyebrow={x.kind === 'couple' ? 'Just us' : 'With ' + kids} title={x.title} meta={x.meta} attachments={x.attachments?.length}
        onPress={() => open({ ...x, area: x.kind === 'couple' ? 'marriage' : 'girls', onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: today, on_calendar: true, alert: '60', source: 'idea' }) })} />} />
    <SectionHead title="Today’s menu" action={menu.length ? 'Meals' : 'Plan meals'} onAction={() => router.push('/meals')} />
    <Gutter>{menu.length ? <Card padding={0}>{menu.map((r, i) => <Pressable key={r.id} onPress={() => router.push({ pathname: '/recipe', params: { id: r.id } })} style={{ padding: 14, borderBottomWidth: i < menu.length - 1 ? .5 : 0, borderColor: t.line[2] }}>
        <Text v="footnote" weight="bold" color={t.brand[400]}>{MEALS.find(x => x[0] === r.meal)?.[1]}</Text><Text v="headline">{r.title}</Text></Pressable>)}</Card>
      : <Text v="subhead" color={t.ink[3]}>No meals planned for today. Tap Plan meals to get recipe ideas.</Text>}</Gutter>
    <SectionHead title="Reminders" action="All" onAction={() => router.push('/tabs/reminders')} />
    <Gutter><Card padding={0}>{rem.items.filter(r => !r.done && r.due_date && r.due_date <= today).map((r, i, a) => <ListRow key={r.id} title={r.title} subtitle={fmtWhen(r)} divider={i < a.length - 1} onPress={() => rem.toggle(r)} leading={<View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: t.ink[4] }} />} />)}</Card></Gutter>
  </Screen>;
}
