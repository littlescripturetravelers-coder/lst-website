import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useHome } from '@/hooks/use-home';
import { ageOn, children } from '@/lib/family';
import { todayISO } from '@/lib/dates';
import { WEEKDAY_FOCUS, allHomeTasks, taskDue, climateFor, VEHICLE_TASKS, vehicleDue, choresFor, STATE_CLIMATE } from '@/lib/home-schedule';
/** Home upkeep: today (dishes + laundry daily, weekday focus, due items, vehicles, kids' chores), schedule by climate, vehicles, kids. */
export default function Home() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const h = useHome(family?.id); const today = todayISO();
  const [seg, setSeg] = useState<'today' | 'schedule' | 'vehicles' | 'kids'>('today'); const [pick, setPick] = useState<string | null>(null);
  if (!family) return null;
  const dow = new Date(today + 'T12:00:00').getDay(); const [dayName, focus, focusTasks] = WEEKDAY_FOCUS[dow];
  const tasks = allHomeTasks(h.state); const daily = tasks.filter(x => x.cat === 'daily'); const due = tasks.filter(x => x.cat !== 'daily' && taskDue(x, h.last[x.id], today));
  const kids = children(family); const clim = climateFor(h.state); const month = +today.slice(5, 7);
  const Row = ({ id, title, meta, who }: { id: string; title: string; meta?: string; who?: string }) => { const done = h.todayDone[id] !== undefined; const m = family.members.find(x => x.id === (who ?? h.assign[id]));
    return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: .5, borderColor: t.line[2] }}>
      <Pressable onPress={() => h.check(id)} hitSlop={8} style={{ width: 24, height: 24, borderRadius: 12, borderWidth: done ? 7 : 1.5, borderColor: done ? t.area.home[0] : t.ink[4] }} />
      <View style={{ flex: 1 }}><Text color={done ? t.ink[3] : t.ink[1]} style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{title}</Text>{meta && <Text v="footnote" color={t.ink[3]}>{meta}</Text>}</View>
      <Pressable onPress={() => setPick(id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: t.line[2], borderRadius: 13, paddingHorizontal: 8, height: 26 }}>{m ? <><Avatar name={m.name} color={m.color} size={18} /><Text v="caption" weight="bold">{m.name}</Text></> : <Text v="caption" weight="bold">{h.assign[id] === 'all' ? 'Everyone' : 'Assign'}</Text>}</Pressable>
    </View>; };
  return <Screen title="Home" subtitle={dayName + ' · ' + focus} trailing={<Text color={t.brand[500]} onPress={() => router.back()}>More</Text>}>
    <Gutter><View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>{(['today', 'schedule', 'vehicles', 'kids'] as const).map(s => <Pressable key={s} onPress={() => setSeg(s)} style={{ flex: 1, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: seg === s ? t.paper[0] : 'transparent' }}><Text v="footnote" weight="bold" style={{ textTransform: 'capitalize' }}>{s}</Text></Pressable>)}</View></Gutter>
    {seg === 'today' && <>
      <SectionHead title="Every day" /><Gutter><Card padding={0}>{daily.map(x => <Row key={x.id} id={x.id} title={x.title} />)}</Card></Gutter>
      <SectionHead title={dayName + '’s focus · ' + focus} /><Gutter><Card padding={0}>{focusTasks.map((x, i) => <Row key={i} id={'focus:' + dow + ':' + i} title={x} />)}</Card></Gutter>
      {!!due.length && <><SectionHead title="Also due" /><Gutter><Card padding={0}>{due.map(x => <Row key={x.id} id={x.id} title={x.title} meta={x.why} />)}</Card></Gutter></>}
      {h.vehicles.map(v => { const items = VEHICLE_TASKS.filter(x => vehicleDue(v, x, h.vlog.find(l => l.vehicle_id === v.id && l.task_id === x.id) && { date: h.vlog.find(l => l.vehicle_id === v.id && l.task_id === x.id).done_on, miles: h.vlog.find(l => l.vehicle_id === v.id && l.task_id === x.id).miles }, today));
        return items.length ? <View key={v.id}><SectionHead title={v.name} /><Gutter><Card padding={0}>{items.map(x => <Pressable key={x.id} onPress={() => h.serviceDone(v.id, x.id, v.miles)}><View style={{ flexDirection: 'row', gap: 10, padding: 12, borderBottomWidth: .5, borderColor: t.line[2] }}><Icon name={x.icon} size={18} color={t.warning[0]} /><Text style={{ flex: 1 }}>{x.title}</Text><Text v="footnote" weight="bold" color={t.brand[500]}>Done</Text></View></Pressable>)}</Card></Gutter></View> : null; })}
      {!!kids.length && <><SectionHead title="Kids’ chores" /><Gutter><Card padding={0}>{h.kidChores.map(c => <Row key={c.id} id={'kid:' + c.id} title={c.title} who={c.member_slug} />)}</Card></Gutter></>}
    </>}
    {seg === 'schedule' && <>
      <Gutter style={{ marginTop: 16 }}><Card eyebrow="Where you live" title={clim.name}><Text v="subhead" color={t.ink[2]}>{clim.blurb}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{Object.keys(STATE_CLIMATE).sort().map(s => <Pressable key={s} onPress={() => h.setLocation(s)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: h.state === s ? t.brand[500] : t.paper[2] }}><Text v="caption" weight="bold" color={h.state === s ? t.ink.inverse : t.ink[2]}>{s}</Text></Pressable>)}</View></Card></Gutter>
      <Rail title="This month where you live" data={tasks.filter(x => x.seasonal && (x.freq as any).months?.includes(month))} render={x => <ContentTile area="money" icon={x.icon} title={x.title} badge={taskDue(x, h.last[x.id], today) ? 'Due' : undefined} />} />
      <Rail title="Weekly cleaning rhythm" data={WEEKDAY_FOCUS} render={([d, f, ts], i) => <ContentTile area="home" icon="sparkles" eyebrow={d} title={f} meta={ts.length + ' tasks'} selected={i === dow} />} />
    </>}
    {seg === 'vehicles' && <Gutter style={{ gap: 12, marginTop: 16 }}>{h.vehicles.map(v => <Card key={v.id} title={v.name}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text v="footnote" color={t.ink[3]}>Odometer</Text>
      <TextInput keyboardType="number-pad" defaultValue={String(v.miles)} onEndEditing={e => h.setMiles(v.id, Number(e.nativeEvent.text))} style={{ width: 110, height: 36, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 10, color: t.ink[1] }} /></View></Card>)}
      <Pressable onPress={() => h.addVehicle('New vehicle', 0)}><Text weight="bold" color={t.brand[500]}>+ Add a vehicle</Text></Pressable></Gutter>}
    {seg === 'kids' && kids.map(k => { const age = ageOn(k.birthday); const mine = h.kidChores.filter(c => c.member_slug === k.id);
      return <View key={k.id}><SectionHead title={k.name + ' · ' + age} /><Gutter><Card padding={0}>{mine.map(c => <View key={c.id} style={{ flexDirection: 'row', padding: 12, borderBottomWidth: .5, borderColor: t.line[2] }}><Text style={{ flex: 1 }}>{c.title}</Text><Text color={t.ink[3]} onPress={() => h.removeKidChore(c.id)}>Remove</Text></View>)}</Card></Gutter>
        <Rail title={'Good fits at ' + age} data={choresFor(age).filter(c => !mine.some(m => m.title === c))} itemWidth={120} render={c => <ContentTile size="sm" area="girls" icon="plus" title={c} onPress={() => h.addKidChore(k.id, c)} />} /></View>; })}
    {pick && <Gutter style={{ marginTop: 16 }}><Card title="Who’s doing it?"><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[...family.members.map(m => [m.id, m.name]), ['all', 'Everyone']].map(([id, n]) => <Pressable key={id} onPress={() => { h.setAssignee(pick, id); setPick(null); }} style={{ padding: 10, borderRadius: 8, backgroundColor: t.paper[2] }}><Text weight="bold">{n}</Text></Pressable>)}</View></Card></Gutter>}
  </Screen>;
}
