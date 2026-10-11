import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
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
import { LOVE } from '@/lib/love-languages';
import { parents } from '@/lib/family';
import { kidsLabel } from '@/lib/brand';
import { marriageDaily } from '@/lib/marriage-daily';
export default function FamilyTab() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const ideas = useDailyIdeas(); const { activity, night } = useLantern(); const rem = useReminders(family?.id);
  const [girl, setGirl] = useState<string | null>(null);
  const kids = family ? children(family) : [];
  const open = (x: any, area: any) => { setDetail({ ...x, area, onPlan: () => rem.add({ title: x.title, notes: x.why, due_date: addDays(todayISO(), area === 'girls' ? 1 : 2), on_calendar: true, alert: '60', source: 'idea' }) }); router.push('/detail'); };
  if (girl) { const g = kids.find(k => k.id === girl)!; const age = ageOn(g.birthday); const s = stageFor(age);
    return <Screen title={g.name} subtitle={g.full + ' · ' + s.label + ' · ' + age} trailing={<Text color={t.brand[500]} onPress={() => setGirl(null)}>Family</Text>}>
      <SectionHead title="Growing right now" />
      <Gutter style={{ gap: 10 }}>{s.growth.map(([d, m]) => <Card key={d}><Text v="overline" color={t.ink[3]}>{d}</Text><Text>{m}</Text></Card>)}</Gutter>
      <Rail title="Feelings to name" data={s.feelings} itemWidth={120} render={f => <ContentTile size="sm" area="girls" icon="smile" title={f} />} />
      <SectionHead title="How to talk to her" />
      <Gutter style={{ gap: 10 }}>{s.say.map(([no, yes], i) => <Card key={i}><Text v="overline" color={t.danger[0]}>Instead of</Text><Text v="subhead" color={t.ink[3]}>{no}</Text><Text v="overline" color={t.success[0]} style={{ marginTop: 8 }}>Try</Text><Text>{yes}</Text></Card>)}</Gutter>
      <Rail title={'Today with ' + g.name} itemWidth={272} data={ideas.girls.filter(x => !x.min_age || x.min_age <= age)} render={x => <ContentTile size="wide" area="girls" icon={x.icon} title={x.title} meta={x.meta} attachments={x.attachments?.length} onPress={() => open(x, 'girls')} />} />
    </Screen>; }
  return <Screen title="Family">
    {activity && <Gutter><Card variant="accent" eyebrow={'Tonight’s story · ' + (night?.title ?? '')} title={activity.title} onPress={() => router.push('/story-activity')}><Text v="subhead" color={t.ink[2]}>{activity.story_in_one_line}</Text></Card></Gutter>}
    <Rail title="Our girls" itemWidth={150} data={kids} render={(k, i) => <ContentTile size="tall" area={i % 2 ? 'health' : 'girls'} leading={<Avatar name={k.name} color={k.color} size={72} />} eyebrow={ageOn(k.birthday) + ' years'} title={k.name} meta={stageFor(ageOn(k.birthday)).label} onPress={() => setGirl(k.id)} />} />
    <Rail title={'Today with ' + kidsLabel(family)} subtitle="New every day" action={ideas.loading ? 'Finding…' : 'More ideas'} onAction={ideas.more} data={ideas.girls} render={x => <ContentTile area="girls" icon={x.icon} title={x.title} meta={x.meta} badge="New" attachments={x.attachments?.length} onPress={() => open(x, 'girls')} />} />
    {family && (() => { const { quote, joke } = marriageDaily(family);
      return <Rail title="Just the two of us" subtitle="A love quote and a joke, new every day" itemWidth={272} data={['quote', 'joke']} render={k => <View style={{ width: 272 }}>{k === 'quote'
        ? <Card variant="accent" eyebrow="Love quote of the day"><Text v="headline" style={quote.scripture ? { fontStyle: 'italic' } : undefined}>“{quote.text}”</Text><Text v="subhead" color={t.ink[3]} style={{ marginTop: 8 }}>{quote.by}</Text></Card>
        : <Card eyebrow="Joke of the day"><Text v="headline">{joke}</Text></Card>}</View>} />; })()}
    {family && (() => { const ps = parents(family); const cards = ps.flatMap((p: any) => { const top = p.love_languages?.ranked?.[0] as keyof typeof LOVE | undefined; if (!top) return []; const day = new Date().getDate(); return [{ p, l: top, idea: LOVE[top].ideas[day % LOVE[top].ideas.length] }]; });
      return cards.length ? <Rail title="Love each other today" subtitle="Fitted to your love languages" itemWidth={272} data={cards} render={c => <ContentTile size="wide" area="marriage" icon={LOVE[c.l].icon} eyebrow={'For ' + c.p.name + ' · ' + LOVE[c.l].name} title={c.idea} onPress={() => open({ title: c.idea, why: c.p.name + '’s top love language is ' + LOVE[c.l].name.toLowerCase() + '.', icon: LOVE[c.l].icon, steps: LOVE[c.l].ideas }, 'marriage')} />} />
        : <Gutter style={{ marginTop: 20 }}><Card variant="accent" eyebrow="Love languages" title="Take the 2-minute quiz" onPress={() => router.push({ pathname: '/love-languages', params: { who: ps[0]?.id } })}><Text v="subhead" color={t.ink[2]}>Ideas and daily suggestions will fit how each of you feels most loved.</Text></Card></Gutter>; })()}
    <Rail title="Date ideas for today" subtitle="New every day" action={ideas.loading ? 'Finding…' : 'More ideas'} onAction={ideas.more} itemWidth={272} data={ideas.couple} render={x => <ContentTile size="wide" area="marriage" icon={x.icon} title={x.title} meta={x.meta} badge="New today" attachments={x.attachments?.length} onPress={() => open(x, 'marriage')} />} />
    <Rail title="Family faith" data={[{ k: 'lantern' }, ...(activity ? [{ k: 'activity' }] : [])]} itemWidth={272} render={x => x.k === 'lantern'
      ? <ContentTile size="wide" area="faith" icon="lamp" badge="Today" title="Morning Lantern couple study" meta={(night?.scripture ?? '') + ' · 10 min'} onPress={() => router.push('/lantern')} />
      : <ContentTile size="wide" area="girls" icon={activity!.icon ?? 'sparkles'} badge="Tonight" title={activity!.title} meta={'Story activity with ' + kidsLabel(family)} onPress={() => router.push('/story-activity')} />} />
    <View style={{ height: 20 }} />
  </Screen>;
}
