import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useReminders } from '@/hooks/use-reminders';
import { supabase } from '@/lib/supabase';
import { todayISO, fmtTime } from '@/lib/dates';
import { ageOn } from '@/lib/family';
import { myOutside, shareBusyTime, MyOutside } from '@/lib/connections';
type Item = { title: string; area?: string; color?: string; time: string; lock?: boolean; sub?: string };
const hm = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const localISO = (d: Date) => todayISO(d);
/** Apple-Calendar-style month grid. Merges family events, calendar-linked reminders, birthdays/anniversary, this person's work calendars and task feeds,
 *  and the busy time other family members chose to share. "Just me" shows only this person's own items. */
export default function CalendarTab() {
  const { theme: t } = useTheme(); const { family, uid } = useFamily(); const rem = useReminders(family?.id);
  const today = todayISO(); const [ym, setYm] = useState<[number, number]>([+today.slice(0, 4), +today.slice(5, 7)]); const [sel, setSel] = useState(today);
  const [view, setView] = useState<'everyone' | 'me'>('everyone');
  const [events, setEvents] = useState<any[]>([]); const [outside, setOutside] = useState<MyOutside[]>([]); const [busy, setBusy] = useState<any[]>([]);
  const [y, m] = ym; const iso = (d: number) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  useEffect(() => { if (!family) return; supabase.from('events').select('*').eq('family_id', family.id).gte('starts_at', iso(1)).lte('starts_at', iso(31) + 'T23:59').then(({ data }) => setEvents(data || [])); }, [family?.id, y, m]);
  useEffect(() => {
    if (!family) return; const from = new Date(y, m - 1, 1), to = new Date(y, m, 1);
    myOutside(from, to).then(setOutside).catch(() => setOutside([]));
    supabase.from('busy_blocks').select('*').eq('family_id', family.id).lt('starts_at', to.toISOString()).gt('ends_at', from.toISOString()).then(({ data }) => setBusy(data || []));
  }, [family?.id, y, m]);
  useEffect(() => { if (family) shareBusyTime(family.id).catch(() => {}); }, [family?.id]);
  const nameOf = (owner: string) => family?.members.find((x: any) => x.user_id === owner);
  const annual = (s: string): Item[] => !family ? [] : [
    ...family.members.filter(x => x.birthday.slice(5) === s.slice(5)).map(x => ({ title: x.name + '’s birthday · ' + ageOn(x.birthday, s), area: x.role === 'daughter' || x.role === 'son' ? 'girls' : 'home', time: 'All day' })),
    ...(family.anniversary?.slice(5) === s.slice(5) ? [{ title: 'Anniversary · ' + ageOn(family.anniversary, s) + ' years', area: 'marriage', time: 'All day' }] : [])];
  const overlaps = (start: Date, end: Date, allDay: boolean, s: string) => { const d0 = new Date(s + 'T00:00:00'), d1 = new Date(+d0 + 864e5); return allDay ? localISO(start) <= s && s <= localISO(new Date(Math.max(+start, +end - 1))) : start < d1 && end > d0; };
  const mine = (s: string): Item[] => outside.filter(x => overlaps(x.start, x.end, x.allDay, s)).map(x => ({ title: x.title, color: x.color, time: (x.allDay ? 'All day' : hm(x.start) + (x.task ? '' : ' – ' + hm(x.end))) + ' · ' + x.source, lock: x.share === 'private' }));
  const dayItems = (s: string): Item[] => {
    const fam = events.filter(e => e.starts_at.slice(0, 10) === s && (view === 'everyone' ? true : e.private)).map(e => ({ title: e.title, area: e.area ?? 'home', time: e.all_day ? 'All day' : new Date(e.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), lock: !!e.private }));
    const others = view === 'everyone' ? busy.filter(b => b.owner_id !== uid && overlaps(new Date(b.starts_at), new Date(b.ends_at), b.all_day, s)).map(b => { const who: any = nameOf(b.owner_id);
      return { title: (who?.name ?? 'Family') + ' · ' + (b.label || 'Busy'), color: who?.color ?? t.ink[3], time: b.all_day ? 'All day' : hm(new Date(b.starts_at)) + ' – ' + hm(new Date(b.ends_at)) }; }) : [];
    return [...(view === 'everyone' ? annual(s) : []), ...fam, ...mine(s), ...others];
  };
  const dayRems = (s: string) => rem.items.filter(r => r.on_calendar && r.due_date === s && (view === 'everyone' || r.private));
  const start = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
  const cells = useMemo(() => [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)], [y, m]);
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); setYm([d.getFullYear(), d.getMonth() + 1]); };
  const colorOf = (e: Item) => e.color ?? t.area[e.area as keyof typeof t.area]?.[0] ?? t.ink[3];
  return <Screen title={new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })} subtitle={String(y)}
    trailing={<Pressable onPress={() => router.push({ pathname: '/reminder-sheet', params: { date: sel, calendar: '1' } })}><Icon name="plus" size={26} color={t.brand[500]} /></Pressable>}>
    <Gutter style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>{([['everyone', 'Everyone'], ['me', 'Just me']] as const).map(([v, l]) => <Pressable key={v} onPress={() => setView(v)} style={{ flex: 1, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: view === v ? t.paper[0] : 'transparent' }}><Text v="subhead" weight={view === v ? 'bold' : 'regular'}>{l}</Text></Pressable>)}</View></Gutter>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} v="caption" weight="bold" color={t.ink[3]} style={{ width: '14.28%', textAlign: 'center', paddingVertical: 4 }}>{d}</Text>)}
      {cells.map((d, i) => { if (!d) return <View key={i} style={{ width: '14.28%', height: 50 }} />; const s = iso(d), isT = s === today, on = s === sel;
        const dots = [...dayItems(s).map(colorOf), ...dayRems(s).filter(r => !r.done).map(() => t.ink[3])].slice(0, 3);
        return <Pressable key={i} onPress={() => setSel(s)} style={{ width: '14.28%', height: 50, alignItems: 'center', paddingTop: 5, borderTopWidth: .5, borderColor: t.line[1] }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (isT ? t.gold[500] : t.brand[500]) : 'transparent', borderWidth: isT && !on ? 2 : 0, borderColor: t.gold[500] }}>
            <Text weight={isT || on ? 'heavy' : 'regular'} color={on && !isT ? t.ink.inverse : t.ink[1]}>{d}</Text></View>
          <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>{dots.map((c, j) => <View key={j} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }} />)}</View>
        </Pressable>; })}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 6 }}><Button size="sm" variant="ghost" icon="chevron-left" title="Previous" onPress={() => shift(-1)} /><Button size="sm" variant="ghost" title="Next" onPress={() => shift(1)} /></View>
    <View style={{ backgroundColor: t.paper[0], paddingTop: 12, paddingBottom: 40, borderTopWidth: .5, borderColor: t.line[2] }}><Gutter style={{ gap: 6 }}>
      <Text v="subhead" weight="bold" color={t.ink[2]}>{new Date(sel + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      {dayItems(sel).map((e, i) => { const c = colorOf(e); const tint = e.area ? t.area[e.area as keyof typeof t.area]?.[1] ?? t.paper[2] : t.paper[2]; return <View key={i} style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8, backgroundColor: tint }}><View style={{ width: 4, borderRadius: 2, backgroundColor: c }} /><View style={{ flex: 1 }}><Text v="subhead" weight="bold">{e.title}</Text><Text v="footnote" color={t.ink[2]}>{e.time}</Text></View>{e.lock && <Icon name="lock" size={15} color={t.ink[3]} />}</View>; })}
      {dayRems(sel).map(r => <Pressable key={r.id} onPress={() => rem.toggle(r)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: t.line[1] }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: r.done ? 6 : 1.5, borderColor: r.done ? t.brand[500] : t.ink[4] }} />
        <View style={{ flex: 1 }}><Text v="subhead" weight="bold" color={r.done ? t.ink[3] : t.ink[1]}>{r.title}</Text><Text v="footnote" color={t.ink[2]}>{r.due_time ? fmtTime(r.due_time.slice(0, 5)) : 'All day'} · Reminders</Text></View>{r.private && <Icon name="lock" size={15} color={t.ink[3]} />}</Pressable>)}
      {!dayItems(sel).length && !dayRems(sel).length && <Text v="subhead" color={t.ink[3]}>{view === 'me' ? 'Nothing of yours today. Connect work calendars in Settings.' : 'Nothing planned. Tap + to add something.'}</Text>}
    </Gutter></View>
  </Screen>;
}
