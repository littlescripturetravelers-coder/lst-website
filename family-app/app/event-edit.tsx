import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import DateTimePicker from '@/components/date-time-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { saveEvent, deleteEvent } from '@/hooks/use-events';
import { supabase } from '@/lib/supabase';
import { EventRow, REPEATS, EVENT_ALERTS, repeatLabel, alertLabel, allDayDate, allDayStamp, iso, atMidnight } from '@/lib/calendar';
import { todayISO } from '@/lib/dates';

const AREAS: [string, string][] = [['home', 'Family'], ['marriage', 'Marriage'], ['girls', 'Kids'], ['faith', 'Faith'], ['money', 'Money'], ['health', 'Health'], ['growth', 'Growth']];
/** New Event / Edit Event, laid out like Apple Calendar's. */
export default function EventEdit() {
  const { theme: t } = useTheme(); const p = useLocalSearchParams<{ id?: string; occ?: string; date?: string; hour?: string; minute?: string; area?: string; title?: string }>(); const { family, uid, canPrivate } = useFamily();
  const first = (() => { const d = p.date ?? todayISO(); const s = atMidnight(d);
    if (p.hour != null) s.setHours(+p.hour, +(p.minute ?? 0)); else { const n = new Date(); s.setHours(d === todayISO() ? Math.min(23, n.getHours() + 1) : 9, 0); } return s; })();
  const [row, setRow] = useState<EventRow | null>(null); const [shown, setShown] = useState(0); // days between the series start and the occurrence being edited
  const [title, setTitle] = useState(p.title ?? ''); const [location, setLocation] = useState(''); const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState(first); const [end, setEnd] = useState(new Date(+first + 3600e3));
  const [repeat, setRepeat] = useState(''); const [until, setUntil] = useState<Date | null>(null); const [alert, setAlert] = useState('none');
  const [area, setArea] = useState(p.area ?? 'home'); const [who, setWho] = useState<string[]>([]); const [priv, setPriv] = useState(false);
  const [url, setUrl] = useState(''); const [notes, setNotes] = useState(''); const [openList, setOpenList] = useState<'' | 'repeat' | 'alert'>(''); const [busy, setBusy] = useState(false);

  useEffect(() => { if (!p.id) return; supabase.from('events').select('*').eq('id', p.id).maybeSingle().then(({ data: e }) => { if (!e) return; setRow(e);
    setTitle(e.title); setLocation(e.location ?? ''); setAllDay(!!e.all_day); setRepeat(e.repeat ?? ''); setUntil(e.repeat_until ? atMidnight(e.repeat_until) : null); setAlert(e.alert ?? 'none');
    setArea(e.area ?? 'home'); setWho(e.who ?? []); setPriv(!!e.private); setUrl(e.url ?? ''); setNotes(e.notes ?? '');
    let s0: Date, e0: Date;
    if (e.all_day) { s0 = atMidnight(allDayDate(e.starts_at)); e0 = atMidnight(allDayDate(e.ends_at ?? e.starts_at)); }
    else { s0 = new Date(e.starts_at); e0 = e.ends_at ? new Date(e.ends_at) : new Date(+s0 + 3600e3); }
    // A repeating event opens on the day that was tapped, the way Apple does. Changes still apply to every repeat.
    const k = e.repeat && p.occ ? Math.round((+atMidnight(p.occ) - +atMidnight(iso(s0))) / 864e5) : 0; setShown(k);
    const sh = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() + k); return x; };
    setStart(sh(s0)); setEnd(sh(e0)); }); }, [p.id]);

  // Moving the start keeps the same length, the way Apple does.
  const moveStart = (d: Date) => { const len = +end - +start; setStart(d); setEnd(new Date(+d + Math.max(0, len))); };
  const bad = allDay ? iso(end) < iso(start) : end < start;
  const save = async () => {
    if (!family || !title.trim() || bad || busy) return; setBusy(true);
    try {
      const un = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - shown); return x; }; const s1 = un(start), e1 = un(end);
      await saveEvent({ id: row?.id, family_id: family.id, title: title.trim(), location: location.trim() || null, all_day: allDay,
        starts_at: allDay ? allDayStamp(iso(s1)) : s1.toISOString(), ends_at: allDay ? allDayStamp(iso(e1)) : e1.toISOString(),
        repeat: repeat || null, repeat_until: repeat && until ? iso(until) : null, alert, area, who, private: priv, url: url.trim() || null, notes: notes.trim() || null } as any);
      router.back();
    } catch (e: any) { setBusy(false); Alert.alert('That didn’t save', e?.message ?? 'Please try again.'); }
  };
  const row1 = { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 50, paddingHorizontal: 14, borderBottomWidth: .5, borderColor: t.line[2], gap: 10 };
  const field = { padding: 14, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] };
  const pick = (mode: 'date' | 'time', v: Date, set: (d: Date) => void) => <DateTimePicker value={v} mode={mode} display="compact" minuteInterval={5} accentColor={t.brand[500]} themeVariant={t.dark ? 'dark' : 'light'}
    onChange={(_, d) => { if (!d) return; const n = new Date(v); if (mode === 'date') n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); else n.setHours(d.getHours(), d.getMinutes()); set(n); }} />;
  const list = (opts: [string, string][], v: string, set: (x: string) => void) => opts.map(([k, l]) => <Pressable key={k} onPress={() => { set(k); setOpenList(''); }} style={[row1, { paddingLeft: 28 }]}>
    <Text style={{ flex: 1 }}>{l}</Text>{v === k && <Icon name="check" size={18} color={t.brand[500]} />}</Pressable>);

  return <ScrollView style={{ backgroundColor: t.paper[1] }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text color={t.brand[500]} onPress={() => router.back()}>Cancel</Text>
      <Text v="headline" style={{ flex: 1, textAlign: 'center' }}>{row ? 'Edit Event' : 'New Event'}</Text>
      <Text weight="heavy" color={title.trim() && !bad ? t.brand[500] : t.ink[4]} onPress={save}>{row ? 'Done' : 'Add'}</Text></View>
    <Card padding={0}>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" autoFocus={!p.id} style={[field, { borderBottomWidth: .5, borderColor: t.line[2] }]} placeholderTextColor={t.ink[4]} />
      <TextInput value={location} onChangeText={setLocation} placeholder="Location" style={field} placeholderTextColor={t.ink[4]} />
    </Card>
    <Card padding={0}>
      <View style={row1}><Text style={{ flex: 1 }}>All-day</Text><Switch value={allDay} onValueChange={setAllDay} trackColor={{ true: t.brand[500] }} /></View>
      <View style={row1}><Text style={{ flex: 1 }}>Starts</Text>{pick('date', start, moveStart)}{!allDay && pick('time', start, moveStart)}</View>
      <View style={[row1, { borderBottomWidth: 0 }]}><Text style={{ flex: 1, textDecorationLine: bad ? 'line-through' : 'none' }} color={bad ? t.danger[0] : t.ink[1]}>Ends</Text>{pick('date', end, setEnd)}{!allDay && pick('time', end, setEnd)}</View>
    </Card>
    {bad && <Text v="footnote" color={t.danger[0]} style={{ marginTop: -10, paddingHorizontal: 4 }}>The end is before the start.</Text>}
    {!!row?.repeat && <Text v="footnote" color={t.ink[3]} style={{ marginTop: -10, paddingHorizontal: 4 }}>Changes apply to every time this event repeats.</Text>}
    <Card padding={0}>
      <Pressable style={row1} onPress={() => setOpenList(openList === 'repeat' ? '' : 'repeat')}><Text style={{ flex: 1 }}>Repeat</Text><Text color={t.ink[3]}>{repeatLabel(repeat)}</Text><Icon name={openList === 'repeat' ? 'chevron-down' : 'chevron-right'} size={16} color={t.ink[4]} /></Pressable>
      {openList === 'repeat' && list(REPEATS, repeat, setRepeat)}
      {!!repeat && <View style={row1}><Text style={{ flex: 1 }}>End Repeat</Text>
        {until ? <>{pick('date', until, setUntil)}<Pressable onPress={() => setUntil(null)} hitSlop={8} accessibilityLabel="Repeat forever"><Icon name="x" size={18} color={t.ink[3]} /></Pressable></> : <Text color={t.brand[500]} onPress={() => { const d = new Date(start); d.setMonth(d.getMonth() + 3); setUntil(d); }}>Never</Text>}</View>}
      <Pressable style={[row1, { borderBottomWidth: openList === 'alert' ? .5 : 0 }]} onPress={() => setOpenList(openList === 'alert' ? '' : 'alert')}><Text style={{ flex: 1 }}>Alert</Text><Text color={t.ink[3]}>{alertLabel(alert)}</Text><Icon name={openList === 'alert' ? 'chevron-down' : 'chevron-right'} size={16} color={t.ink[4]} /></Pressable>
      {openList === 'alert' && list(EVENT_ALERTS, alert, setAlert)}
    </Card>
    <Card padding={0}>
      <View style={{ padding: 14, gap: 8, borderBottomWidth: .5, borderColor: t.line[2] }}><Text>Calendar</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{AREAS.map(([k, l]) => { const c = t.area[k as keyof typeof t.area][0];
          return <Pressable key={k} onPress={() => setArea(k)} accessibilityRole="button" accessibilityState={{ selected: area === k }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: area === k ? c : t.line[2], backgroundColor: area === k ? t.area[k as keyof typeof t.area][1] : 'transparent' }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} /><Text v="footnote" weight="bold">{l}</Text></Pressable>; })}</View></View>
      <View style={{ padding: 14, gap: 8, borderBottomWidth: (canPrivate || priv) ? .5 : 0, borderColor: t.line[2] }}><Text>Who’s going</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(family?.members ?? []).map(m => { const on = who.includes(m.id);
          return <Pressable key={m.id} onPress={() => setWho(on ? who.filter(x => x !== m.id) : [...who, m.id])} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 10, paddingLeft: 3, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: on ? m.color : t.line[2] }}>
            <Avatar name={m.name} color={m.color} size={22} /><Text v="footnote" weight="bold">{m.name}</Text></Pressable>; })}</View></View>
      {(canPrivate || priv) && <View style={[row1, { borderBottomWidth: 0 }]}><View style={{ flex: 1 }}><Text>Just for me</Text><Text v="footnote" color={t.ink[3]}>{priv ? 'Only you will see this event.' : 'Everyone in the family will see this event.'}</Text></View>
        <Switch value={priv} onValueChange={setPriv} disabled={!canPrivate || (!!row && row.owner_id !== uid)} trackColor={{ true: t.brand[500] }} /></View>}
    </Card>
    <Card padding={0}>
      <TextInput value={url} onChangeText={setUrl} placeholder="URL" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={[field, { borderBottomWidth: .5, borderColor: t.line[2] }]} placeholderTextColor={t.ink[4]} />
      <TextInput value={notes} onChangeText={setNotes} placeholder="Notes" multiline style={[field, { minHeight: 90, textAlignVertical: 'top' }]} placeholderTextColor={t.ink[4]} />
    </Card>
    {row && <Pressable onPress={() => Alert.alert(row.repeat ? 'Delete every time this event repeats?' : 'Are you sure you want to delete this event?', undefined, [
      { text: 'Delete Event', style: 'destructive', onPress: () => deleteEvent(row, 'all').then(() => { router.back(); router.back(); }) }, { text: 'Cancel', style: 'cancel' }])}>
      <Text color={t.danger[0]} style={{ textAlign: 'center', padding: 14 }}>Delete Event</Text></Pressable>}
  </ScrollView>;
}
