import { useState } from 'react';
import { Linking, Pressable, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { useTheme, PRESETS, DisplayFont, UiFont } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { ageOn, yearsMarried } from '@/lib/family';
import { APP_NAME } from '@/lib/brand';
import { fmtLong } from '@/lib/dates';
import { LOVE } from '@/lib/love-languages';
import { KID_SECTIONS } from '@/lib/home-schedule';
import { supabase } from '@/lib/supabase';
import { Share } from 'react-native';
const ACCENTS = ['#1B2D5F', '#2E6E8E', '#355845', '#A8502F', '#B5536B', '#4E3563'], HIGHLIGHTS = ['#F5C518', '#5BD3DC', '#F0B37E', '#E9C46A'];
const DISPLAY: [DisplayFont, string][] = [['fredoka', 'Fredoka'], ['youngSerif', 'Young Serif'], ['lora', 'Lora'], ['nunito', 'Nunito']];
const UI: [UiFont, string][] = [['nunito', 'Nunito'], ['figtree', 'Figtree'], ['atkinson', 'Atkinson Hyperlegible'], ['system', 'iPhone system']];
export default function Settings() {
  const { theme: t, setChoice } = useTheme(); const c = t.choice; const { family, saveMember, saveAnniversary, setPrivateOk } = useFamily();
  const [edit, setEdit] = useState<string | null>(null); const [val, setVal] = useState(''); const [invite, setInvite] = useState<string | null>(null);
  const makeInvite = async (slug: string) => { const { data, error } = await supabase.from('family_invites').insert({ family_id: family!.id, member_slug: slug }).select('code').single(); if (!error) setInvite(data.code); };
  const Sw = ({ color, on, onPress }: any) => <Pressable onPress={onPress} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color, borderWidth: on ? 3 : 0, borderColor: t.ink[1] }} />;
  const Lbl = ({ s }: { s: string }) => <Text v="footnote" weight="heavy" color={t.ink[3]} style={{ marginTop: 14, marginBottom: 8, textTransform: 'uppercase' }}>{s}</Text>;
  return <Screen title="Settings" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>More</Text>}>
    <SectionHead title="Our family" />
    {family && <Gutter><Card padding={0}>
      {family.members.map(m => <View key={m.id}><ListRow leading={<Avatar name={m.name} color={m.color} size={30} />} title={m.full} subtitle={'Born ' + fmtLong(m.birthday)} value={String(ageOn(m.birthday))} chevron onPress={() => { setEdit(m.id); setVal(m.birthday); }} />
        {edit === m.id && <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}><TextInput value={val} onChangeText={setVal} placeholder="YYYY-MM-DD" style={{ flex: 1, height: 40, borderWidth: 1, borderColor: t.line[2], borderRadius: 8, paddingHorizontal: 10, color: t.ink[1] }} /><Button size="sm" title="Save" onPress={() => { saveMember(m.id, { birthday: val }); setEdit(null); }} /></View>}</View>)}
      <ListRow icon="heart" iconColor={t.area.marriage[0]} title="Anniversary" subtitle={fmtLong(family.anniversary)} value={yearsMarried(family) + ' yrs'} divider={false} onPress={() => { setEdit('anniv'); setVal(family.anniversary); }} />
      {edit === 'anniv' && <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}><TextInput value={val} onChangeText={setVal} style={{ flex: 1, height: 40, borderWidth: 1, borderColor: t.line[2], borderRadius: 8, paddingHorizontal: 10, color: t.ink[1] }} /><Button size="sm" title="Save" onPress={() => { saveAnniversary(val); setEdit(null); }} /></View>}
    </Card>
      {family.members.filter((m: any) => (m.role === 'dad' || m.role === 'mom') && !m.user_id).map(m => <View key={'inv' + m.id} style={{ marginTop: 10 }}><Button full variant="tinted" icon="user-plus" title={'Invite ' + m.name} onPress={() => makeInvite(m.id)} /></View>)}
      {invite && <Card variant="accent" style={{ marginTop: 10 }}><Text v="footnote" color={t.ink[2]}>Invite code (good for 14 days)</Text><Text v="title1" style={{ letterSpacing: 4 }}>{invite}</Text><View style={{ marginTop: 8 }}><Button size="sm" variant="secondary" icon="share" title="Share" onPress={() => Share.share({ message: 'Join our family in the app. Sign in, tap “I have an invite code” and enter ' + invite })} /></View></Card>}
      <Text v="caption" color={t.ink[3]} style={{ marginTop: 6 }}>Ages, stages, health checks, ideas and studies all update from these dates.</Text></Gutter>}
    <SectionHead title="Work & personal schedules" />
    <Gutter><Card padding={0}><ListRow icon="briefcase" iconColor={t.area.growth[0]} title="Work calendars & tasks" subtitle="Google, Outlook, Asana, Todoist and more. Private unless you share." chevron divider={false} onPress={() => router.push('/connections')} /></Card></Gutter>
    <SectionHead title="What matters to each of us" />
    <Gutter><Card padding={0}><ListRow icon="star" iconColor={t.area.growth[0]} title="Hobbies, people & shows" subtitle="Added to the calendar and reminders on their own" chevron divider={false} onPress={() => router.push('/interests')} /></Card></Gutter>
    <SectionHead title="Kids’ profiles" />
    {family && <Gutter style={{ gap: 10 }}>{family.members.filter(m => m.role === 'daughter' || m.role === 'son').map((k: any) => <Card key={k.id} title={k.name + '’s profile'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><Text style={{ flex: 1 }}>Can sign in on own device</Text><Switch value={!!k.can_login} onValueChange={async v => { await supabase.from('family_members').update({ can_login: v }).eq('family_id', family.id).eq('slug', k.id); }} /></View>
      <Text v="footnote" weight="heavy" color={t.ink[3]}>WHAT THEY CAN SEE</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{KID_SECTIONS.map(([id, label]) => { const on = (k.kid_sections || ['chores', 'story', 'feelings']).includes(id); return <Pressable key={id} onPress={async () => { const cur = k.kid_sections || ['chores', 'story', 'feelings']; await supabase.from('family_members').update({ kid_sections: on ? cur.filter((x: string) => x !== id) : [...cur, id] }).eq('family_id', family.id).eq('slug', k.id); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: on ? t.brand[500] : t.paper[2] }}><Text v="footnote" weight="bold" color={on ? t.ink.inverse : t.ink[2]}>{label}</Text></Pressable>; })}</View>
      <Text v="caption" color={t.ink[3]} style={{ marginTop: 8 }}>Money, health records, marriage check-ins and the advisor are never shown to kids.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}><View style={{ flex: 1 }}><Text>Can keep private goals and plans</Text><Text v="caption" color={t.ink[3]}>When on, {k.name} can make goals, reminders and plans only {k.sex === 'm' ? 'he' : 'she'} can see.</Text></View><Switch value={!!k.private_ok} onValueChange={v => setPrivateOk(k.id, v)} /></View>
      {k.can_login && <View style={{ marginTop: 10 }}><Button size="sm" variant="tinted" icon="user-plus" title={'Invite code for ' + k.name} onPress={() => makeInvite(k.id)} /></View>}
    </Card>)}</Gutter>}
    <SectionHead title="Love languages" />
    {family && <Gutter><Card padding={0}>{family.members.filter(m => m.role === 'dad' || m.role === 'mom').map((m: any, i, a) => <ListRow key={m.id} icon="heart" iconColor={t.area.marriage[0]} title={m.name} subtitle={m.love_languages?.ranked ? m.love_languages.ranked.slice(0, 2).map((l: any) => LOVE[l as keyof typeof LOVE].name).join(' · ') : 'Take the 2-minute quiz'} chevron divider={i < a.length - 1} onPress={() => router.push({ pathname: '/love-languages', params: { who: m.id } })} />)}</Card></Gutter>}
    <SectionHead title="Appearance" />
    <Gutter><Card>
      <Lbl s="Light or dark" />
      <View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>{([['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match iPhone']] as const).map(([v, l]) => <Pressable key={v} onPress={() => setChoice({ ...c, mode: v })} style={{ flex: 1, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: (c.mode ?? 'auto') === v ? t.paper[0] : 'transparent' }}><Text v="subhead" weight={(c.mode ?? 'auto') === v ? 'bold' : 'regular'}>{l}</Text></Pressable>)}</View>
      <Lbl s="Text size" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => setChoice({ ...c, textScale: Math.max(.85, +((c.textScale ?? 1) - .05).toFixed(2)) })} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.paper[2], alignItems: 'center', justifyContent: 'center' }}><Text v="footnote" weight="heavy">A−</Text></Pressable>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.paper[3] }}><View style={{ width: `${((c.textScale ?? 1) - .85) / .5 * 100}%`, height: 6, borderRadius: 3, backgroundColor: t.brand[500] }} /></View>
        <Pressable onPress={() => setChoice({ ...c, textScale: Math.min(1.35, +((c.textScale ?? 1) + .05).toFixed(2)) })} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.paper[2], alignItems: 'center', justifyContent: 'center' }}><Text v="headline" weight="heavy">A+</Text></Pressable>
      </View>
      <Text v="caption" color={t.ink[3]} style={{ textAlign: 'center', marginTop: 4 }}>{Math.round((c.textScale ?? 1) * 100)}% · also follows your iPhone’s text size setting</Text>
      <Lbl s="Theme" /><View style={{ flexDirection: 'row', gap: 8 }}>{PRESETS.map(p => <Pressable key={p.preset} onPress={() => setChoice({ ...p, display: c.display, ui: c.ui, mode: c.mode, textScale: c.textScale })} style={{ flex: 1, borderRadius: 10, overflow: 'hidden', borderWidth: c.preset === p.preset ? 2 : 1, borderColor: c.preset === p.preset ? t.ink[1] : t.line[2], backgroundColor: p.paper }}>
        <View style={{ height: 30, backgroundColor: p.brand }}><View style={{ position: 'absolute', left: 8, bottom: 6, width: 20, height: 3, backgroundColor: p.highlight }} /></View><Text v="footnote" weight="bold" color={p.ink} style={{ textAlign: 'center', paddingVertical: 6, textTransform: 'capitalize' }}>{p.preset}</Text></Pressable>)}</View>
      <Lbl s="Main color" /><View style={{ flexDirection: 'row', gap: 12 }}>{ACCENTS.map(a => <Sw key={a} color={a} on={c.brand === a} onPress={() => setChoice({ ...c, brand: a, preset: 'custom' })} />)}</View>
      <Lbl s="Highlight color" /><View style={{ flexDirection: 'row', gap: 12 }}>{HIGHLIGHTS.map(a => <Sw key={a} color={a} on={c.highlight === a} onPress={() => setChoice({ ...c, highlight: a, preset: 'custom' })} />)}</View>
      <Lbl s="Title font" /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DISPLAY.map(([id, n]) => <Pressable key={id} onPress={() => setChoice({ ...c, display: id })} style={{ width: '48%', padding: 10, borderRadius: 8, borderWidth: c.display === id ? 2 : 1, borderColor: c.display === id ? t.brand[500] : t.line[2] }}><Text v="title3">{n}</Text></Pressable>)}</View>
      <Lbl s="Text font" />{UI.map(([id, n]) => <Pressable key={id} onPress={() => setChoice({ ...c, ui: id })} style={{ padding: 10, marginBottom: 6, borderRadius: 8, borderWidth: c.ui === id ? 2 : 1, borderColor: c.ui === id ? t.brand[500] : t.line[2] }}><Text>{n}</Text></Pressable>)}
    </Card></Gutter>
    <SectionHead title="Voice assistants" />
    <Gutter><Card padding={0}>
      <ListRow icon="mic" iconColor={t.ink[1]} title="Siri & Shortcuts" subtitle={'“Add a family reminder in ' + APP_NAME + '”'} chevron onPress={() => Linking.openURL('shortcuts://')} />
      <ListRow icon="speaker" iconColor={t.area.growth[0]} title="Alexa" subtitle={'Enable the ' + APP_NAME + ' skill, then link your account'} chevron divider={false} onPress={() => Linking.openURL('https://alexa.amazon.com/spa/index.html#skills')} />
    </Card></Gutter>
  </Screen>;
}
