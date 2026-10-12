import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { useFamily } from '@/hooks/use-family';
import { useDailyIdeas } from '@/hooks/use-daily-ideas';
import { useReminders } from '@/hooks/use-reminders';
import { useKidProgress } from '@/hooks/use-kid-progress';
import { ageOn, parents, stageFor } from '@/lib/family';
import { addDays, todayISO } from '@/lib/dates';
import { setDetail } from '@/lib/detail-store';
import { useSetup } from '@/lib/setup';
import { lanternEdition } from '@/lib/faiths';
import { DOMAINS, Domain, Activity, bandFor, nextBand, named, mondayOf, shuffled } from '@/lib/kid-growth';
import { SKILLS } from '@/lib/kid-skills-data';
import { ACTIVITIES, ONE_ON_ONE } from '@/lib/kid-activities-data';

/** One child's page, built to swipe: one-on-one time with each parent, what they're working on (a checklist per area), things to do together, our list, and how to talk with them.
 * Everything follows the child's age, and each area moves on to the next stage's skills once most are done. */
export default function Child() {
  const { theme: t } = useTheme(); const { id } = useLocalSearchParams<{ id: string }>(); const { family } = useFamily();
  const setup = useSetup(family?.id); const ideas = useDailyIdeas(); const rem = useReminders(family?.id);
  const kid = family?.members.find(m => m.id === id); const p = useKidProgress(family?.id, kid?.id);
  const { width } = useWindowDimensions(); const cardW = width - 56;
  const [area, setArea] = useState<Domain | 'all'>('all'); const [more, setMore] = useState(0); const [ahead, setAhead] = useState<Record<string, boolean>>({});
  const christianOk = !!lanternEdition(family?.faith);
  const domains = DOMAINS.filter(([d]) => d !== 'faith' || setup.on('faith'));
  const week = mondayOf(todayISO());

  const age = kid ? ageOn(kid.birthday) : 0; const band = bandFor(age); const stage = stageFor(age);
  const name = kid?.name ?? '';
  // The stage each area is working on: the child's age band, or the next one once every skill there is checked (or a parent tapped "What's next").
  const working = (d: Domain) => { const cur = SKILLS[band][d]; const nb = nextBand(band);
    return nb && (ahead[d] || cur.every(s => p.status(s.key) === 'done')) ? nb : band; };
  const fits = (a: Activity) => !a.christian || christianOk;
  const pool = useMemo(() => {
    const list = ACTIVITIES.filter(a => fits(a) && domains.some(([d]) => d === a.domain) && (area === 'all' || a.domain === area) && a.bands.includes(working(a.domain)) && p.status(a.key) !== 'done');
    return shuffled(list, week + ':' + id + ':' + area).slice(more * 8 % Math.max(list.length, 1)).concat(shuffled(list, week + ':' + id + ':' + area)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, more, p.rows, band, week, id, christianOk, setup.setup, ahead]);
  if (!family || !kid) return <Screen title=""><View /></Screen>;

  const plan = (title: string, why: string) => rem.add({ title, notes: why, due_date: addDays(todayISO(), 2), on_calendar: true, alert: '60', source: 'idea' });
  const open = (a: Activity, eyebrow: string, planTitle: string) => { const saved = p.status(a.key) === 'saved';
    setDetail({ title: named(a.title, name), eyebrow, area: 'girls', icon: DOMAINS.find(d => d[0] === a.domain)?.[2], meta: a.minutes + ' min · ' + a.cost + ' · ' + a.place,
      why: named(a.summary, name) + ' ' + named(a.why, name), steps: a.steps.map(s => named(s, name)), onPlan: () => plan(planTitle, named(a.summary, name)),
      actions: [{ title: saved ? 'Saved' : 'Save to our list', icon: saved ? 'bookmark-check' : 'bookmark', onPress: () => { p.set(a.key, 'activity', saved ? 'cleared' : 'saved'); router.back(); } },
        { title: 'We did it', icon: 'check', onPress: () => { p.set(a.key, 'activity', 'done'); router.back(); } }] });
    router.push('/detail'); };

  // One-on-one: each parent gets a different idea this week; "Another idea" moves to the next one and is remembered for the week.
  const ones = shuffled(ONE_ON_ONE.filter(a => a.bands.includes(band) && fits(a)), week + ':' + id);
  const pickFor = (slug: string, i: number) => { const r = p.rows['one:' + slug]; const [wk, key] = (r?.note ?? '').split('|');
    return (wk === week && ones.find(a => a.key === key)) || ones[(i * 3) % Math.max(ones.length, 1)]; };
  const nextFor = (slug: string, i: number) => { const cur = pickFor(slug, i); const others = parents(family).filter(x => x.id !== slug).map((x, j) => pickFor(x.id, j)?.key);
    let k = (ones.indexOf(cur!) + 1) % ones.length; while (others.includes(ones[k]?.key) && ones.length > 2) k = (k + 1) % ones.length;
    p.set('one:' + slug, 'one', 'pick', week + '|' + ones[k].key); };
  const saved = ACTIVITIES.concat(ONE_ON_ONE).filter(a => p.status(a.key) === 'saved');
  const doneCount = Object.values(p.rows).filter(r => r.kind === 'activity' && r.status === 'done').length;

  const Check = ({ on }: { on: boolean }) => <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: on ? t.brand[500] : t.line[2], backgroundColor: on ? t.brand[500] : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on && <Icon name="check" size={16} color={t.ink.inverse} />}</View>;
  const Chip = ({ k, label }: { k: Domain | 'all'; label: string }) => { const on = area === k;
    return <Pressable onPress={() => { setArea(k); setMore(0); }} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: on ? t.brand[500] : t.paper[2] }}>
      <Text v="subhead" weight="bold" color={on ? t.ink.inverse : t.ink[2]}>{label}</Text></Pressable>; };

  return <Screen title={kid.name} subtitle={stage.label + ' · ' + age + (age === 1 ? ' year' : ' years')} trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Family</Text>}>
    {/* One-on-one time with each parent */}
    <Rail title="One-on-one this week" subtitle={'Time alone with ' + name} itemWidth={cardW} data={parents(family)} render={(par, i) => { const a = pickFor(par.id, i); if (!a) return <View />;
      const label = (par.role === 'dad' ? 'Dad' : 'Mom') + ' time · ' + par.name;
      return <Card key={par.id} style={{ width: cardW }} onPress={() => open(a, label, par.name + ' and ' + name + ': ' + named(a.title, name))}>
        <Text v="overline" color={t.brand[400]}>{label}</Text>
        <Text v="title2" style={{ marginTop: 4 }}>{named(a.title, name)}</Text>
        <Text v="subhead" color={t.ink[2]} numberOfLines={3} style={{ marginTop: 4 }}>{named(a.summary, name)}</Text>
        <Text v="footnote" color={t.ink[3]} style={{ marginTop: 6 }}>{a.minutes} min · {a.cost} · {a.place}</Text>
        <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
          <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => nextFor(par.id, i)}>Another idea</Text>
          <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => plan(par.name + ' and ' + name + ': ' + named(a.title, name), named(a.summary, name))}>Plan it</Text>
        </View></Card>; }} />

    {/* What they're working on: one swipeable card per area */}
    <View style={{ marginTop: 24, paddingHorizontal: 20 }}><Text v="title2">What {name} is working on</Text><Text v="footnote" color={t.ink[3]}>Swipe through each area. Check a skill when {name} does it most of the time.</Text></View>
    <FlatList horizontal data={domains} keyExtractor={d => d[0]} showsHorizontalScrollIndicator={false} snapToInterval={cardW + 12} decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 10 }}
      renderItem={({ item: [d, label, icon] }) => { const wb = working(d); const list = SKILLS[wb][d]; const done = list.filter(s => p.status(s.key) === 'done').length; const nb = nextBand(wb);
        return <Card style={{ width: cardW }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name={icon} size={20} color={t.brand[500]} /><Text v="title3" style={{ flex: 1 }}>{label}</Text><Text v="footnote" weight="bold" color={t.ink[3]}>{done} of {list.length}</Text></View>
          {wb !== band && <Text v="caption" weight="heavy" color={t.brand[400]} style={{ marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Next stage</Text>}
          <View style={{ height: 4, borderRadius: 2, backgroundColor: t.paper[3], marginTop: 10 }}><View style={{ width: `${done / list.length * 100}%`, height: 4, borderRadius: 2, backgroundColor: t.brand[500] }} /></View>
          {list.map((s, i) => { const on = p.status(s.key) === 'done';
            return <Pressable key={s.key} onPress={() => p.set(s.key, 'skill', on ? 'cleared' : 'done')} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: t.line[1], marginTop: i ? 0 : 6 }}>
              <Check on={on} /><Text style={{ flex: 1 }} color={on ? t.ink[3] : t.ink[1]}>{s.text}</Text></Pressable>; })}
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
            <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => { setArea(d); setMore(0); }}>Ideas for {label.toLowerCase()}</Text>
            {wb === band && nb && done >= Math.ceil(list.length / 2) && <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => setAhead(x => ({ ...x, [d]: true }))}>What’s next</Text>}
            {wb !== band && !list.every(s => p.status(s.key) === 'done') && ahead[d] && <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => setAhead(x => ({ ...x, [d]: false }))}>Back to this stage</Text>}
          </View>
        </Card>; }} />

    {/* Things to do together, filtered by area */}
    <View style={{ marginTop: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1 }}><Text v="title2">Things to do with {name}</Text><Text v="footnote" color={t.ink[3]}>Tap one for how to do it</Text></View>
      <Text v="subhead" weight="bold" color={t.brand[500]} onPress={() => setMore(m => m + 1)}>More ideas</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 10 }}>
      <Chip k="all" label="All" />{domains.map(([d, l]) => <Chip key={d} k={d} label={l} />)}</ScrollView>
    <FlatList horizontal data={pool} keyExtractor={a => a.key} showsHorizontalScrollIndicator={false} snapToInterval={252} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingTop: 12 }}
      ListEmptyComponent={<Text color={t.ink[3]}>You’ve done every idea here. Tap More ideas or pick another area.</Text>}
      renderItem={({ item: a }) => { const lab = DOMAINS.find(d => d[0] === a.domain)![1]; const isSaved = p.status(a.key) === 'saved';
        return <Card style={{ width: 240, minHeight: 190 }} onPress={() => open(a, lab, name + ': ' + named(a.title, name))}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.brand[50] }}><Text v="footnote" weight="bold" color={t.brand[500]}>{lab}</Text></View>
            <View style={{ flex: 1 }} />{isSaved && <Icon name="bookmark-check" size={18} color={t.brand[500]} />}</View>
          <Text v="headline" style={{ marginTop: 8 }}>{named(a.title, name)}</Text>
          <Text v="subhead" color={t.ink[2]} numberOfLines={3} style={{ marginTop: 4 }}>{named(a.summary, name)}</Text>
          <Text v="footnote" color={t.ink[3]} style={{ marginTop: 6 }}>{a.minutes} min · {a.cost}</Text></Card>; }} />

    {/* Our list: saved ideas to come back to */}
    <Rail title={'Our list with ' + name} subtitle={saved.length ? 'Saved to do together' + (doneCount ? ' · ' + doneCount + ' done so far' : '') : 'Tap an idea, then Save to our list'} itemWidth={200}
      data={saved.length ? saved : []} render={a => <Card key={a.key} style={{ width: 200, minHeight: 120 }} onPress={() => open(a, 'Our list', name + ': ' + named(a.title, name))}>
        <Text v="overline" color={t.brand[400]}>{DOMAINS.find(d => d[0] === a.domain)?.[1]}</Text><Text v="headline" style={{ marginTop: 4 }}>{named(a.title, name)}</Text>
        <Text v="footnote" color={t.ink[3]} style={{ marginTop: 4 }}>{a.minutes} min · {a.cost}</Text></Card>} />
    {!saved.length && <Gutter><Text v="subhead" color={t.ink[3]}>Nothing saved yet.</Text></Gutter>}

    {/* How to talk with them, and feelings to name: swipeable too */}
    <Rail title={'How to talk to ' + name} itemWidth={260} data={stage.say} render={([no, yes], i) => <Card key={i} style={{ width: 260 }}>
      <Text v="overline" color={t.danger[0]}>Instead of</Text><Text v="subhead" color={t.ink[3]}>{no}</Text>
      <Text v="overline" color={t.success[0]} style={{ marginTop: 8 }}>Try</Text><Text>{yes}</Text></Card>} />
    <Rail title="Feelings to name" data={stage.feelings} itemWidth={120} render={f => <ContentTile size="sm" area="girls" icon="smile" title={f} />} />
    <Rail title={'Today with ' + name} subtitle="New every day" itemWidth={272} data={ideas.girls.filter(x => !x.min_age || x.min_age <= age)} render={x => <ContentTile size="wide" area="girls" icon={x.icon} title={x.title} meta={x.meta} attachments={x.attachments?.length}
      onPress={() => { setDetail({ ...x, area: 'girls', onPlan: () => plan(x.title, x.why) }); router.push('/detail'); }} />} />
    <View style={{ height: 30 }} />
  </Screen>;
}
