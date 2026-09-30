import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useHealth } from '@/hooks/use-health';
import { useReminders } from '@/hooks/use-reminders';
import { screeningsFor, fitnessFocus } from '@/lib/health-rules';
import { ageOn } from '@/lib/family';
import { addDays, monthYear, todayISO } from '@/lib/dates';
import { setDetail } from '@/lib/detail-store';
export default function Health() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const { log, markDone } = useHealth(family?.id); const rem = useReminders(family?.id);
  const [who, setWho] = useState('levi'); if (!family) return null;
  const m = family.members.find(x => x.id === who) ?? family.members[0]; const { age, now, later } = screeningsFor(m, log[m.id] || {});
  const healthList = rem.lists.find(l => l.name === 'Health')?.id;
  const remind = (r: any) => rem.add({ title: r.title + ' — ' + m.name, notes: r.why, list_id: healthList, due_date: r.status === 'ok' ? r.due : addDays(todayISO(), 3), on_calendar: true, alert: '1d', source: 'health' });
  const tone: any = { overdue: t.danger, due: t.warning, soon: t.warning, ok: t.success };
  const label = (r: any) => r.status === 'overdue' ? 'Overdue' : r.status === 'due' ? 'Due now' : r.status === 'soon' ? 'Due ' + monthYear(r.due) : 'Up to date';
  return <Screen title="Health" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>More</Text>}>
    <Rail data={family.members} itemWidth={120} render={x => <ContentTile size="sm" selected={x.id === who} leading={<Avatar name={x.name} color={x.color} size={48} />} title={x.name} meta={String(ageOn(x.birthday))} onPress={() => setWho(x.id)} />} />
    <SectionHead title={'To do for ' + m.name + ' · ' + age} />
    <Gutter><Card padding={0}>{now.filter(r => r.status !== 'ok').map((r, i, a) => <ListRow key={r.id} icon={r.icon} iconColor={t.area.health[0]} title={r.title} subtitle={r.last ? 'Last: ' + monthYear(r.last) : 'No record yet'} divider={i < a.length - 1}
      trailing={<View style={{ backgroundColor: tone[r.status][1], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}><Text v="caption" weight="heavy" color={tone[r.status][0]}>{label(r)}</Text></View>}
      onPress={() => { setDetail({ title: r.title, icon: r.icon, area: 'health', eyebrow: m.name, meta: label(r), why: r.why, steps: r.steps, actions: [{ title: 'Remind me', icon: 'bell', onPress: () => remind(r) }, { title: 'Done today', icon: 'check', onPress: () => markDone(m.id, r.id) }] }); router.push('/detail'); }} />)}</Card>
      <View style={{ marginTop: 10 }}><Button full variant="tinted" icon="bell-plus" title="Add reminders for all of these" onPress={() => now.filter(r => r.status !== 'ok').forEach(remind)} /></View></Gutter>
    <SectionHead title="Up to date" />
    <Gutter><Card padding={0}>{now.filter(r => r.status === 'ok').map((r, i, a) => <ListRow key={r.id} icon={r.icon} iconColor={t.success[0]} title={r.title} subtitle={'Next: ' + monthYear(r.due)} divider={i < a.length - 1} />)}</Card></Gutter>
    {later.length > 0 && <><SectionHead title="Coming in future years" /><Gutter><Card padding={0}>{later.slice(0, 5).map((r, i, a) => <ListRow key={r.id} icon={r.icon} iconColor={t.ink[4]} title={r.title} subtitle={'Starts at ' + r.min + ' · ' + monthYear(r.startsOn)} divider={i < a.length - 1} />)}</Card></Gutter></>}
    <Rail title={'Stay healthy at ' + age} data={fitnessFocus(m)} itemWidth={272} render={x => <ContentTile size="wide" area="health" icon="activity" title={x} />} />
    <Gutter><Text v="caption" color={t.ink[3]} style={{ marginTop: 16 }}>Based on general US guidelines (USPSTF, AAP, CDC). Your doctors may recommend a different schedule based on your history.</Text></Gutter>
  </Screen>;
}
