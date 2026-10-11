import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, PanResponder } from 'react-native';
import { Text } from './text';
import { Icon } from './icon';
import { useTheme } from '@/theme/theme-provider';
import { CalItem, layoutDay, onDay, hourLabel, hm, atMidnight, iso, shiftDays, DAY } from '@/lib/calendar';
import { todayISO } from '@/lib/dates';

/** A see-through version of an item color for block backgrounds. */
const soft = (c: string) => /^#[0-9a-f]{6}$/i.test(c) ? c + '33' : c;
const HOUR = 52, GUTTER = 50, DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export function useItemColor() {
  const { theme: t } = useTheme();
  return (it: CalItem) => it.color ?? (it.area ? t.area[it.area as keyof typeof t.area]?.[0] : undefined) ?? (it.kind === 'reminder' ? t.ink[3] : t.brand[500]);
}
/** Swipe left/right to move forward/back (day, week or month), like Apple Calendar. */
export function useSwipe(onPrev: () => void, onNext: () => void) {
  const cb = useRef({ onPrev, onNext }); cb.current = { onPrev, onNext };
  return useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_, g) => { if (g.dx > 60) cb.current.onPrev(); else if (g.dx < -60) cb.current.onNext(); },
  }), []).panHandlers;
}

/** The S M T W T F S strip above Day view. */
export function WeekStrip({ sel, onSelect, hasItems }: { sel: string; onSelect: (s: string) => void; hasItems: (s: string) => boolean }) {
  const { theme: t } = useTheme(); const today = todayISO(); const w0 = shiftDays(sel, -atMidnight(sel).getDay());
  return <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 6 }}>
    {Array.from({ length: 7 }, (_, i) => { const s = shiftDays(w0, i), on = s === sel, isT = s === today;
      return <Pressable key={s} onPress={() => onSelect(s)} style={{ flex: 1, alignItems: 'center', gap: 2 }} accessibilityLabel={atMidnight(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}>
        <Text v="caption" weight="bold" color={t.ink[3]}>{DOW[i]}</Text>
        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (isT ? t.gold[500] : t.brand[500]) : 'transparent', borderWidth: isT && !on ? 2 : 0, borderColor: t.gold[500] }}>
          <Text weight={on || isT ? 'heavy' : 'regular'} color={on ? (isT ? t.highlightInk : t.ink.inverse) : t.ink[1]}>{+s.slice(8)}</Text></View>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: hasItems(s) && !on ? t.ink[4] : 'transparent' }} />
      </Pressable>; })}
  </View>;
}

/** Day and Week views: an all-day row, then the hours with each item placed at its time. Long-press an empty time to add an event there. */
export function TimeGrid({ days, items, onPressItem, onLongPressSlot, onPressDay, swipe }: { days: string[]; items: CalItem[]; onPressItem: (it: CalItem) => void; onLongPressSlot: (day: string, hour: number, minute: number) => void; onPressDay?: (s: string) => void; swipe: any }) {
  const { theme: t } = useTheme(); const colorOf = useItemColor(); const today = todayISO(); const scroll = useRef<ScrollView>(null);
  const [now, setNow] = useState(new Date()); useEffect(() => { const i = setInterval(() => setNow(new Date()), 60e3); return () => clearInterval(i); }, []);
  useEffect(() => { const h = days.includes(today) ? Math.max(0, now.getHours() - 1.5) : 7.5; setTimeout(() => scroll.current?.scrollTo({ y: h * HOUR, animated: false }), 0); }, [days[0]]);
  const multi = days.length > 1; const [w, setW] = useState(0); const colW = w ? (w - GUTTER) / days.length : 0;
  const allDay = days.map(s => items.filter(i => i.allDay && onDay(i, s)));
  const maxAll = Math.max(0, ...allDay.map(a => a.length));
  return <View style={{ flex: 1 }} {...swipe}>
    {multi && <View style={{ flexDirection: 'row', paddingLeft: GUTTER, borderBottomWidth: .5, borderColor: t.line[2] }}>{days.map((s, i) => { const isT = s === today;
      return <Pressable key={s} onPress={() => onPressDay?.(s)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}><Text v="caption" weight="bold" color={t.ink[3]}>{DOW[i]}</Text>
        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isT ? t.gold[500] : 'transparent' }}><Text v="subhead" weight="heavy" color={isT ? t.highlightInk : t.ink[1]}>{+s.slice(8)}</Text></View></Pressable>; })}</View>}
    {maxAll > 0 && <View style={{ flexDirection: 'row', borderBottomWidth: .5, borderColor: t.line[2], paddingVertical: 3 }}>
      <Text v="caption" color={t.ink[3]} style={{ width: GUTTER, textAlign: 'right', paddingRight: 6, paddingTop: 3 }}>all-day</Text>
      {allDay.map((list, i) => <View key={i} style={{ flex: 1, gap: 2, paddingHorizontal: 1 }}>{list.slice(0, multi ? 3 : 6).map(it => { const c = colorOf(it);
        return <Pressable key={it.key} onPress={() => onPressItem(it)} style={{ backgroundColor: soft(c), borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text v="caption" weight="bold" numberOfLines={1} style={{ flex: 1 }} color={t.ink[1]}>{it.title}</Text>{it.lock && !multi && <Icon name="lock" size={11} color={t.ink[3]} />}</Pressable>; })}
        {list.length > (multi ? 3 : 6) && <Text v="caption" color={t.ink[3]}>+{list.length - (multi ? 3 : 6)} more</Text>}</View>)}
    </View>}
    <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 110 }} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <View style={{ height: 24 * HOUR + 12, marginTop: 6 }}>
        {Array.from({ length: 25 }, (_, h) => <View key={h} style={{ position: 'absolute', top: h * HOUR, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
          <Text v="caption" color={t.ink[3]} style={{ width: GUTTER, textAlign: 'right', paddingRight: 6, marginTop: -8 }}>{hourLabel(h)}</Text>
          <View style={{ flex: 1, height: .5, backgroundColor: t.line[2] }} /></View>)}
        {days.map((s, di) => <Pressable key={s} delayLongPress={350} onLongPress={e => { const m = Math.floor(e.nativeEvent.locationY / HOUR * 4) * 15; onLongPressSlot(s, Math.min(23, Math.floor(m / 60)), m % 60); }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: GUTTER + di * colW, width: colW, borderLeftWidth: multi ? .5 : 0, borderColor: t.line[1] }}>
          {colW > 0 && layoutDay(items, s).map(p => { const c = colorOf(p.it), wd = (colW - 3) / p.cols, h = p.height / 60 * HOUR;
            return <Pressable key={p.it.key} onPress={() => onPressItem(p.it)} accessibilityLabel={p.it.title + ', ' + hm(p.it.start)}
              style={{ position: 'absolute', top: p.top / 60 * HOUR + 1, height: h - 2, left: p.col * wd + 1, width: wd - 2, borderRadius: 5, backgroundColor: soft(c), borderLeftWidth: 3, borderColor: c, paddingHorizontal: 4, paddingTop: 2, overflow: 'hidden', opacity: p.it.done ? .5 : 1 }}>
              <Text v="caption" weight="heavy" numberOfLines={h < 40 ? 1 : 2} color={t.ink[1]}>{p.it.title}</Text>
              {p.it.lock && !multi && <View style={{ position: 'absolute', top: 3, right: 3 }}><Icon name="lock" size={11} color={t.ink[3]} /></View>}
              {h >= 40 && !multi && <Text v="caption" numberOfLines={1} color={t.ink[2]}>{hm(p.it.start)}{p.it.location ? ' · ' + p.it.location : p.it.sub ? ' · ' + p.it.sub : ''}</Text>}
            </Pressable>; })}
          {s === today && <View pointerEvents="none" style={{ position: 'absolute', left: -4, right: 0, top: (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR - 4, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.danger[0] }} /><View style={{ flex: 1, height: 1.5, backgroundColor: t.danger[0] }} /></View>}
        </Pressable>)}
      </View>
    </ScrollView>
  </View>;
}

/** Month grid with up to three colored dots per day. Tap a day to see its list; tap it again to open Day view. */
export function MonthGrid({ y, m, sel, items, onSelect }: { y: number; m: number; sel: string; items: CalItem[]; onSelect: (s: string) => void }) {
  const { theme: t } = useTheme(); const colorOf = useItemColor(); const today = todayISO();
  const start = new Date(y, m - 1, 1).getDay(), days = new Date(y, m, 0).getDate();
  const cells = [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const byDay = useMemo(() => { const out: Record<string, string[]> = {};
    for (let d = 1; d <= days; d++) { const s = iso(new Date(y, m - 1, d)); out[s] = items.filter(i => onDay(i, s) && !(i.kind === 'reminder' && i.done)).map(colorOf).slice(0, 3); } return out; }, [items, y, m]);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
    {DOW.map((d, i) => <Text key={i} v="caption" weight="bold" color={t.ink[3]} style={{ width: '14.28%', textAlign: 'center', paddingVertical: 4 }}>{d}</Text>)}
    {cells.map((d, i) => { if (!d) return <View key={i} style={{ width: '14.28%', height: 50 }} />; const s = iso(new Date(y, m - 1, d)), isT = s === today, on = s === sel;
      return <Pressable key={i} onPress={() => onSelect(s)} accessibilityLabel={atMidnight(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} style={{ width: '14.28%', height: 50, alignItems: 'center', paddingTop: 5, borderTopWidth: .5, borderColor: t.line[1] }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (isT ? t.gold[500] : t.brand[500]) : 'transparent', borderWidth: isT && !on ? 2 : 0, borderColor: t.gold[500] }}>
          <Text weight={isT || on ? 'heavy' : 'regular'} color={on && !isT ? t.ink.inverse : t.ink[1]}>{d}</Text></View>
        <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>{(byDay[s] || []).map((c, j) => <View key={j} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }} />)}</View>
      </Pressable>; })}
  </View>;
}

/** Twelve small months. Tap one to open it. */
export function YearGrid({ y, onPick }: { y: number; onPick: (m: number) => void }) {
  const { theme: t } = useTheme(); const today = todayISO();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, rowGap: 18 }}>
    {Array.from({ length: 12 }, (_, mi) => { const start = new Date(y, mi, 1).getDay(), n = new Date(y, mi + 1, 0).getDate(), cur = today.slice(0, 7) === y + '-' + String(mi + 1).padStart(2, '0');
      return <Pressable key={mi} onPress={() => onPick(mi + 1)} style={{ width: '33.33%', paddingHorizontal: 4 }} accessibilityLabel={new Date(y, mi, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
        <Text v="headline" color={cur ? t.brand[500] : t.ink[1]} style={{ marginBottom: 4 }}>{new Date(y, mi, 1).toLocaleDateString('en-US', { month: 'short' })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[...Array(start).fill(0), ...Array.from({ length: n }, (_, i) => i + 1)].map((d, i) => { const isT = d && today === iso(new Date(y, mi, d));
            return <View key={i} style={{ width: '14.28%', height: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: isT ? t.gold[500] : 'transparent' }}>
              <Text style={{ fontSize: 9, lineHeight: 12 }} weight={isT ? 'heavy' : 'regular'} color={isT ? t.highlightInk : t.ink[2]}>{d || ''}</Text></View>; })}
        </View></Pressable>; })}
  </View>;
}

/** One line in a day's list (Month view and search). */
export function ItemRow({ it, onPress, onToggle }: { it: CalItem; onPress: () => void; onToggle?: () => void }) {
  const { theme: t } = useTheme(); const c = useItemColor()(it); const tint = it.area ? t.area[it.area as keyof typeof t.area]?.[1] ?? t.paper[2] : t.paper[2];
  if (it.kind === 'reminder') return <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: t.line[1] }}>
    <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: !!it.done }} accessibilityLabel={'Complete ' + it.title} style={{ width: 22, height: 22, borderRadius: 11, borderWidth: it.done ? 6 : 1.5, borderColor: it.done ? t.brand[500] : t.ink[4] }} />
    <View style={{ flex: 1 }}><Text v="subhead" weight="bold" color={it.done ? t.ink[3] : t.ink[1]}>{it.title}</Text><Text v="footnote" color={t.ink[2]}>{it.allDay ? 'All day' : hm(it.start)} · Reminders</Text></View>{it.lock && <Icon name="lock" size={15} color={t.ink[3]} />}</Pressable>;
  const time = it.allDay ? 'All day' : hm(it.start) + ' – ' + hm(it.end);
  return <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 8, backgroundColor: tint }}>
    <View style={{ width: 4, borderRadius: 2, backgroundColor: c }} />
    <View style={{ flex: 1 }}><Text v="subhead" weight="bold">{it.title}</Text><Text v="footnote" color={t.ink[2]}>{time}{it.location ? ' · ' + it.location : it.sub ? ' · ' + it.sub : ''}</Text></View>
    {it.lock && <Icon name="lock" size={15} color={t.ink[3]} />}</Pressable>;
}
export const weekDays = (sel: string) => { const w0 = shiftDays(sel, -atMidnight(sel).getDay()); return Array.from({ length: 7 }, (_, i) => shiftDays(w0, i)); };
export { DAY };
