import { useCallback } from 'react';
import { View } from 'react-native';
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
import { useSetup, PRIORITIES, label } from '@/lib/setup';
export default function Today() {
  const { theme: t } = useTheme(); const { family, me } = useFamily(); const setup = useSetup(family?.id); const parent = me?.role === 'dad' || me?.role === 'mom';
  useFocusEffect(useCallback(() => { setup.reload(); }, [setup.reload])); const rem = useReminders(family?.id); const ideas = useDailyIdeas();
  const kids = kidsLabel(family); const today = todayISO(); const dates = family ? upcomingDates(family).filter(d => d.days <= 60) : [];
  const open = (x: any) => { setDetail(x); router.push('/detail'); };
  return <Screen subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title="Today">
    {parent && setup.loaded && (!setup.setup
      ? <Gutter><Card variant="accent" eyebrow="Make the app yours" title="Tell us what matters most" onPress={() => router.push('/setup')}><Text v="subhead" color={t.ink[2]}>About 3 minutes of tapping. Sections, ideas and advice will fit your family.</Text></Card></Gutter>
      : setup.stale ? <Gutter><Card variant="accent" eyebrow="Check in" title="Anything changed?" onPress={() => router.push('/setup')}><Text v="subhead" color={t.ink[2]}>A quick check in keeps ideas and advice fitting your life right now.</Text></Card></Gutter>
      : setup.setup.priorities.length > 0 ? <Gutter><Card eyebrow="Our focus right now" onPress={() => router.push('/setup')}><Text v="headline">{setup.setup.priorities.map(k => label(PRIORITIES, k)).join(' · ')}</Text><Text v="footnote" color={t.brand[500]} style={{ marginTop: 4 }}>Change</Text></Card></Gutter> : null)}
    {dates.length > 0 && <Rail title="Coming up" subtitle="Birthdays and anniversaries" data={dates} render={d => <ContentTile area={d.kind === 'anniversary' ? 'marriage' : d.member?.role === 'daughter' || d.member?.role === 'son' ? 'girls' : 'home'} icon={d.kind === 'anniversary' ? 'heart' : 'cake'} title={d.title} meta={fmtLong(d.date) + ' · ' + inDays(d.days)} badge={d.days <= 14 ? 'Soon' : undefined} />} />}
    <Rail title={'Today with ' + kids} subtitle="New every day" action="See all" onAction={() => router.push('/tabs/family')} itemWidth={272}
      data={ideas.girls.slice(0, 3)} render={x => <ContentTile size="wide" area={x.kind === 'couple' ? 'marriage' : 'girls'} icon={x.icon} eyebrow={x.kind === 'couple' ? 'Just us' : 'With ' + kids} title={x.title} meta={x.meta} attachments={x.attachments?.length}
        onPress={() => open({ ...x, area: x.kind === 'couple' ? 'marriage' : 'girls', onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: today, on_calendar: true, alert: '60', source: 'idea' }) })} />} />
    <SectionHead title="Reminders" action="All" onAction={() => router.push('/tabs/reminders')} />
    <Gutter><Card padding={0}>{rem.items.filter(r => !r.done && r.due_date && r.due_date <= today).map((r, i, a) => <ListRow key={r.id} title={r.title} subtitle={fmtWhen(r)} divider={i < a.length - 1} onPress={() => rem.toggle(r)} leading={<View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: t.ink[4] }} />} />)}</Card></Gutter>
  </Screen>;
}
