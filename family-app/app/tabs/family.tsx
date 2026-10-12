import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useDailyIdeas } from '@/hooks/use-daily-ideas';
import { useLantern } from '@/hooks/use-lantern';
import { useReminders } from '@/hooks/use-reminders';
import { ageOn, children, stageFor } from '@/lib/family';
import { addDays, todayISO } from '@/lib/dates';
import { setDetail } from '@/lib/detail-store';
import { kidsLabel } from '@/lib/brand';
import { useSetup } from '@/lib/setup';
import { lanternEdition } from '@/lib/faiths';
export default function FamilyTab() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const s = useSetup(family?.id); const faithOn = s.on('faith') && !!lanternEdition(family?.faith); const ideas = useDailyIdeas(); const { activity, night } = useLantern(); const rem = useReminders(family?.id);
  const kids = family ? children(family) : [];
  const open = (x: any, area: any) => { setDetail({ ...x, area, onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: addDays(todayISO(), area === 'girls' ? 1 : 2), on_calendar: true, alert: '60', source: 'idea' }) }); router.push('/detail'); };
  return <Screen title="Family">
    {faithOn && activity && <Gutter><Card variant="accent" eyebrow={'Tonight’s story · ' + (night?.title ?? '')} title={activity.title} onPress={() => router.push('/story-activity')}><Text v="subhead" color={t.ink[2]}>{activity.story_in_one_line}</Text></Card></Gutter>}
    <Rail title="Our girls" itemWidth={150} data={kids} render={(k, i) => <ContentTile size="tall" area={i % 2 ? 'health' : 'girls'} leading={<Avatar name={k.name} color={k.color} size={72} />} eyebrow={ageOn(k.birthday) + ' years'} title={k.name} meta={stageFor(ageOn(k.birthday)).label} onPress={() => router.push({ pathname: '/child', params: { id: k.id } })} />} />
    <Rail title={'Today with ' + kidsLabel(family)} subtitle="New every day" action={ideas.loading ? 'Finding…' : 'More ideas'} onAction={ideas.more} data={ideas.girls} render={x => <ContentTile area="girls" icon={x.icon} title={x.title} meta={x.meta} badge="New" attachments={x.attachments?.length} onPress={() => open(x, 'girls')} />} />
    {faithOn && activity && <Rail title="Family faith" data={[activity]} itemWidth={272} render={a => <ContentTile size="wide" area="girls" icon={a.icon ?? 'sparkles'} badge="Tonight" title={a.title} meta={'Story activity with ' + kidsLabel(family)} onPress={() => router.push('/story-activity')} />} />}
    <View style={{ height: 20 }} />
  </Screen>;
}
