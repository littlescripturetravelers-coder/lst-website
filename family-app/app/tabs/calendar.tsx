import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/components/text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useReminders } from '@/hooks/use-reminders';
import { useCalendarItems, syncEventsToPhone, CalView } from '@/hooks/use-events';
import { TimeGrid, MonthGrid, YearGrid, WeekStrip, ItemRow, useSwipe, weekDays } from '@/components/calendar-views';
import { CalItem, onDay, atMidnight, shiftDays, setPeek, iso } from '@/lib/calendar';
import { todayISO } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

type Mode = 'day' | 'week' | 'month' | 'year';
const MODES: [Mode, string][] = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year']];
const mdy = (s: string, o: Intl.DateTimeFormatOptions) => atMidnight(s).toLocaleDateString('en-US', o);

/** Apple-Calendar-style calendar: Day, Week, Month and Year views, search, and Everyone / Just me. */
export default function CalendarTab() {
  const { theme: t } = useTheme(); const { family, uid } = useFamily(); const rem = useReminders(family?.id);
  const today = todayISO(); const [mode, setMode] = useState<Mode>('month'); const [sel, setSel] = useState(today); const [view, setView] = useState<CalView>('everyone');
  const [q, setQ] = useState<string | null>(null); const [hits, setHits] = useState<CalItem[]>([]);
  const y = +sel.slice(0, 4), m = +sel.slice(5, 7);

  // Load a little more than what's on screen so moving one step is instant.
  const [from, to] = useMemo(() => {
    if (mode === 'year') return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
    if (mode === 'month') return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    const w0 = atMidnight(shiftDays(sel, -atMidnight(sel).getDay())); return [w0, new Date(+atMidnight(shiftDays(iso(w0), 7)))];
  }, [mode, mode === 'month' || mode === 'year' ? y * 100 + (mode === 'month' ? m : 0) : shiftDays(sel, -atMidnight(sel).getDay())]);
  const { items } = useCalendarItems(family, uid, rem.items, from, to, view);
  useEffect(() => { if (family) syncEventsToPhone(family.id).catch(() => {}); }, [family?.id]);

  const step = (n: number) => {
    if (mode === 'day') setSel(shiftDays(sel, n));
    else if (mode === 'week') setSel(shiftDays(sel, 7 * n));
    else if (mode === 'month') { const d = new Date(y, m - 1 + n, 1); setSel(iso(d)); }
    else setSel(iso(new Date(y + n, 0, 1)));
  };
  const swipe = useSwipe(() => step(-1), () => step(1));
  const open = (it: CalItem) => {
    if (it.kind === 'reminder') return router.push({ pathname: '/reminder-sheet', params: { id: it.id! } });
    setPeek(it); router.push({ pathname: '/event', params: it.kind === 'event' ? { id: it.id!, occ: it.occ } : {} });
  };
  const newEvent = (date = sel, hour?: number, minute = 0) => router.push({ pathname: '/event-edit', params: { date, ...(hour != null ? { hour: String(hour), minute: String(minute) } : {}) } });
  const toggle = (it: CalItem) => { const r = rem.items.find(x => x.id === it.id); if (r) rem.toggle(r); };

  useEffect(() => {
    if (!q || q.trim().length < 2 || !family) { setHits([]); return; }
    const like = '%' + q.trim().replace(/[%_,()]/g, ' ') + '%';
    const h = setTimeout(() => supabase.from('events').select('*').eq('family_id', family.id).or('title.ilike.' + like + ',location.ilike.' + like + ',notes.ilike.' + like).order('starts_at', { ascending: false }).limit(50)
      .then(({ data }) => setHits((data || []).filter(e => view === 'everyone' || e.private).map(e => { const s = e.all_day ? atMidnight(e.starts_at.slice(0, 10)) : new Date(e.starts_at);
        return { key: 'hit:' + e.id, kind: 'event' as const, id: e.id, title: e.title, start: s, end: e.ends_at ? new Date(e.ends_at) : new Date(+s + 3600e3), allDay: !!e.all_day, area: e.area ?? 'home', lock: !!e.private, location: e.location, occ: iso(s), row: e }; }))), 250);
    return () => clearTimeout(h);
  }, [q, family?.id, view]);

  const title = mode === 'year' ? String(y) : mode === 'month' ? mdy(sel, { month: 'long' }) : mode === 'week' ? mdy(sel, { month: 'long' }) : mdy(sel, { month: 'long', day: 'numeric' });
  const sub = mode === 'year' ? '' : mode === 'day' ? mdy(sel, { weekday: 'long' }) + ', ' + y : String(y);
  const dayList = items.filter(i => onDay(i, sel));
  const seg = (opts: [string, string][], v: string, set: (x: any) => void, h = 30) => <View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>
    {opts.map(([k, l]) => <Pressable key={k} onPress={() => set(k)} accessibilityRole="button" accessibilityState={{ selected: v === k }} style={{ flex: 1, height: h, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: v === k ? t.paper[0] : 'transparent' }}><Text v="subhead" weight={v === k ? 'bold' : 'regular'}>{l}</Text></Pressable>)}</View>;

  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.paper[1] }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 4, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <Pressable onPress={() => { setSel(today); }} accessibilityRole="button"><Text weight="bold" color={t.brand[500]}>Today</Text></Pressable>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => setQ(q === null ? '' : null)} accessibilityLabel="Search" hitSlop={8}><Icon name="search" size={22} color={t.brand[500]} /></Pressable>
      <Pressable onPress={() => newEvent()} accessibilityLabel="New event" hitSlop={8}><Icon name="plus" size={26} color={t.brand[500]} /></Pressable>
    </View>
    {q !== null ? <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search events" placeholderTextColor={t.ink[4]} style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: t.paper[3], paddingHorizontal: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }} />
        <Text color={t.brand[500]} onPress={() => setQ(null)}>Cancel</Text></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 6, paddingBottom: 110 }}>
        {hits.map(it => <View key={it.key}><Text v="footnote" weight="bold" color={t.ink[3]} style={{ marginTop: 6 }}>{it.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text><ItemRow it={it} onPress={() => open(it)} /></View>)}
        {q.trim().length >= 2 && !hits.length && <Text color={t.ink[3]}>No events match “{q.trim()}”.</Text>}
      </ScrollView></View> : <>
      <View style={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 8 }}>
        {!!sub && <Text v="footnote" weight="bold" color={t.brand[400]}>{sub}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text v="largeTitle" style={{ flex: 1 }}>{title}</Text>
          <Pressable onPress={() => step(-1)} hitSlop={8} accessibilityLabel="Previous" style={{ padding: 6 }}><Icon name="chevron-left" size={22} color={t.brand[500]} /></Pressable>
          <Pressable onPress={() => step(1)} hitSlop={8} accessibilityLabel="Next" style={{ padding: 6 }}><Icon name="chevron-right" size={22} color={t.brand[500]} /></Pressable></View>
        <View style={{ gap: 6, marginTop: 6 }}>{seg(MODES, mode, setMode)}{seg([['everyone', 'Everyone'], ['me', 'Just me']], view, setView, 26)}</View>
      </View>
      {mode === 'day' && <><WeekStrip sel={sel} onSelect={setSel} hasItems={s => items.some(i => onDay(i, s))} />
        <TimeGrid days={[sel]} items={items} onPressItem={open} onLongPressSlot={(d, h, mi) => newEvent(d, h, mi)} swipe={swipe} />
        {!dayList.length && <Text v="footnote" color={t.ink[3]} style={{ position: 'absolute', bottom: 96, alignSelf: 'center' }}>{view === 'me' ? 'Nothing of yours today. Connect work calendars in Settings.' : 'Nothing planned. Touch and hold a time to add an event.'}</Text>}</>}
      {mode === 'week' && <TimeGrid days={weekDays(sel)} items={items} onPressItem={open} onLongPressSlot={(d, h, mi) => newEvent(d, h, mi)} onPressDay={s => { setSel(s); setMode('day'); }} swipe={swipe} />}
      {mode === 'month' && <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View {...swipe}><MonthGrid y={y} m={m} sel={sel} items={items} onSelect={s => { if (s === sel) setMode('day'); else setSel(s); }} /></View>
        <View style={{ backgroundColor: t.paper[0], marginTop: 6, paddingTop: 12, paddingBottom: 30, paddingHorizontal: 20, gap: 6, borderTopWidth: .5, borderColor: t.line[2] }}>
          <Pressable onPress={() => setMode('day')} style={{ flexDirection: 'row', alignItems: 'center' }}><Text v="subhead" weight="bold" color={t.ink[2]} style={{ flex: 1 }}>{mdy(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</Text><Text v="footnote" weight="bold" color={t.brand[500]}>Day view</Text></Pressable>
          {dayList.map(it => <ItemRow key={it.key} it={it} onPress={() => open(it)} onToggle={() => toggle(it)} />)}
          {!dayList.length && <Text v="subhead" color={t.ink[3]}>{view === 'me' ? 'Nothing of yours today. Connect work calendars in Settings.' : 'Nothing planned. Tap + to add something.'}</Text>}
        </View></ScrollView>}
      {mode === 'year' && <ScrollView contentContainerStyle={{ paddingBottom: 110 }}><View {...swipe}><YearGrid y={y} onPick={mi => { setSel(iso(new Date(y, mi - 1, 1))); setMode('month'); }} /></View></ScrollView>}
    </>}
  </SafeAreaView>;
}
