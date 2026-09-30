import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Text } from '@/components/text';
import { ListRow } from '@/components/list-row';
import { useFamily } from '@/hooks/use-family';
import { useReminders } from '@/hooks/use-reminders';
import { useDailyIdeas } from '@/hooks/use-daily-ideas';
import { useLantern } from '@/hooks/use-lantern';
import { upcomingDates } from '@/lib/family';
import { fmtLong, inDays, todayISO, fmtWhen } from '@/lib/today-helpers';
import { setDetail } from '@/lib/detail-store';
import { useTheme } from '@/theme/theme-provider';
import { kidsLabel } from '@/lib/brand';
export default function Today() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const rem = useReminders(family?.id); const ideas = useDailyIdeas(); const { night } = useLantern();
  const kids = kidsLabel(family); const today = todayISO(); const dates = family ? upcomingDates(family).filter(d => d.days <= 60) : [];
  const open = (x: any) => { setDetail(x); router.push('/detail'); };
  return <Screen subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title="Today">
    <Gutter style={{ gap: 12 }}>
      <Card variant="inverse" eyebrow="Morning Lantern · 10 min together" title={night?.scripture ?? 'Lighting the lantern…'} onPress={() => router.push('/lantern')}>
        <Text v="subhead" color={t.ink.inverse}>Read it, answer one question each, and pick one way to live it with {kids} today.</Text>
      </Card>
    </Gutter>
    {dates.length > 0 && <Rail title="Coming up" subtitle="Birthdays and anniversaries" data={dates} render={d => <ContentTile area={d.kind === 'anniversary' ? 'marriage' : d.member?.role === 'daughter' || d.member?.role === 'son' ? 'girls' : 'home'} icon={d.kind === 'anniversary' ? 'heart' : 'cake'} title={d.title} meta={fmtLong(d.date) + ' · ' + inDays(d.days)} badge={d.days <= 14 ? 'Soon' : undefined} />} />}
    <Rail title="Today’s ideas" subtitle="New every day" action="See all" onAction={() => router.push('/tabs/family')} itemWidth={272}
      data={[...ideas.couple.slice(0, 2), ...ideas.girls.slice(0, 2)]} render={x => <ContentTile size="wide" area={x.kind === 'couple' ? 'marriage' : 'girls'} icon={x.icon} eyebrow={x.kind === 'couple' ? 'Just us' : 'With ' + kids} title={x.title} meta={x.meta} attachments={x.attachments?.length}
        onPress={() => open({ ...x, area: x.kind === 'couple' ? 'marriage' : 'girls', onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: today, on_calendar: true, alert: '60', source: 'idea' }) })} />} />
    <SectionHead title="Reminders" action="All" onAction={() => router.push('/tabs/reminders')} />
    <Gutter><Card padding={0}>{rem.items.filter(r => !r.done && r.due_date && r.due_date <= today).map((r, i, a) => <ListRow key={r.id} title={r.title} subtitle={fmtWhen(r)} divider={i < a.length - 1} onPress={() => rem.toggle(r)} leading={<View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: t.ink[4] }} />} />)}</Card></Gutter>
  </Screen>;
}
