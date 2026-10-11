import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useTheme } from '@/theme/theme-provider';
import { supabase } from '@/lib/supabase';
import { FaithKey } from '@/lib/faiths';
import { FaithPicker } from '@/components/faith-picker';
type M = { slug: string; name: string; full_name: string; role: 'dad' | 'mom' | 'daughter' | 'son'; sex: 'm' | 'f'; birthday: string; color: string };
const COLORS = ['#4F63A0', '#B5536B', '#D9823A', '#2E8C94', '#7E6697', '#3D7A58', '#D9A227'];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
/** First run for a new family: name → you → spouse → children → anniversary → faith. Or join with a spouse's invite code. */
export default function Onboarding() {
  const { theme: t } = useTheme(); const [step, setStep] = useState(0); const [err, setErr] = useState('');
  const [surname, setSurname] = useState(''); const [me, setMe] = useState<Partial<M>>({ role: 'dad', sex: 'm' }); const [spouse, setSpouse] = useState<Partial<M>>({ role: 'mom', sex: 'f' });
  const [kids, setKids] = useState<Partial<M>[]>([{ role: 'daughter', sex: 'f' }]); const [anniv, setAnniv] = useState(''); const [faith, setFaith] = useState<FaithKey>('lds'); const [code, setCode] = useState('');
  const Field = ({ label, value, onChange, ph }: any) => <View style={{ gap: 4 }}><Text v="footnote" weight="bold" color={t.ink[2]}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={ph} placeholderTextColor={t.ink[4]} style={{ height: 48, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 14, fontSize: 17, fontFamily: t.font.body, color: t.ink[1], backgroundColor: t.paper[0] }} /></View>;
  const Seg = ({ opts, value, onChange }: any) => <View style={{ flexDirection: 'row', backgroundColor: t.paper[3], borderRadius: 9, padding: 2 }}>{opts.map(([v, l]: any) => <Pressable key={v} onPress={() => onChange(v)} style={{ flex: 1, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: value === v ? '#fff' : 'transparent' }}><Text v="subhead" weight={value === v ? 'bold' : 'regular'}>{l}</Text></Pressable>)}</View>;
  const Person = ({ p, set, title }: { p: Partial<M>; set: (x: Partial<M>) => void; title: string }) => <Card title={title} style={{ gap: 10 }}>
    <View style={{ gap: 10 }}><Field label="Full name" value={p.full_name} onChange={(v: string) => set({ ...p, full_name: v, name: v.split(' ')[0] })} ph="First and last" />
      <Field label="Birthday" value={p.birthday} onChange={(v: string) => set({ ...p, birthday: v })} ph="YYYY-MM-DD" />
      <Seg opts={p.role === 'daughter' || p.role === 'son' ? [['daughter', 'Daughter'], ['son', 'Son']] : [['dad', 'Dad'], ['mom', 'Mom']]} value={p.role} onChange={(r: any) => set({ ...p, role: r, sex: r === 'dad' || r === 'son' ? 'm' : 'f' })} /></View></Card>;
  const create = async () => {
    setErr(''); const all = [me, ...(spouse.full_name ? [spouse] : []), ...kids.filter(k => k.full_name)].map((m, i) => ({ ...m, slug: slug(m.name!), color: COLORS[i % COLORS.length] }));
    if (all.some(m => !/^\d{4}-\d{2}-\d{2}$/.test(m.birthday ?? ''))) return setErr('Please enter every birthday as YYYY-MM-DD.');
    const { error } = await supabase.rpc('create_family', { p: { surname, anniversary: anniv, faith, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, me_slug: all[0].slug, members: all } });
    if (error) return setErr(error.message); router.replace({ pathname: '/setup', params: { first: '1' } });
  };
  const steps = [
    <View key="0" style={{ gap: 14 }}><Text v="hero">Welcome</Text><Text color={t.ink[2]}>Let’s set up your family. It takes about two minutes, and you can change anything later in Settings.</Text>
      <Field label="Family last name" value={surname} onChange={setSurname} ph="Lewis" />
      {!!surname && <Text v="title2">The {surname}’s</Text>}
      <Card variant="sunken"><Text v="footnote" weight="bold" color={t.ink[2]}>Joining your spouse’s family?</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><View style={{ flex: 1 }}><Field label="Invite code" value={code} onChange={setCode} ph="ABC123" /></View></View>
        <View style={{ marginTop: 10 }}><Button variant="secondary" title="Join with code" onPress={async () => { const { error } = await supabase.rpc('accept_invite', { code }); error ? setErr(error.message) : router.replace({ pathname: '/setup', params: { first: '1' } }); }} /></View></Card></View>,
    <Person key="1" p={me} set={setMe} title="You" />,
    <View key="2" style={{ gap: 10 }}><Person p={spouse} set={setSpouse} title="Your spouse (optional)" /><Text v="footnote" color={t.ink[3]}>You’ll get an invite code for them after setup.</Text></View>,
    <View key="3" style={{ gap: 12 }}>{kids.map((k, i) => <Person key={i} p={k} set={x => setKids(ks => ks.map((y, j) => j === i ? x : y))} title={'Child ' + (i + 1)} />)}
      <Button variant="tinted" icon="plus" title="Add another child" onPress={() => setKids(k => [...k, { role: 'daughter', sex: 'f' }])} /></View>,
    <View key="4" style={{ gap: 12 }}><Field label="Wedding anniversary (optional)" value={anniv} onChange={setAnniv} ph="YYYY-MM-DD" />
      <Text v="footnote" weight="bold" color={t.ink[2]}>Your faith</Text>
      <FaithPicker value={faith} onChange={setFaith} />
      <Text v="footnote" color={t.ink[3]}>Sets the daily scripture or sacred text, the quote, and links to your faith’s teachings. You can change it later in Settings.</Text></View>,
  ];
  const canNext = [!!surname, !!me.full_name && !!me.birthday, true, true, true][step];
  return <SafeAreaView style={{ flex: 1, backgroundColor: t.paper[1] }}><ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
    <Text v="overline" color={t.brand[400]}>Step {step + 1} of {steps.length}</Text>
    {steps[step]}
    {!!err && <Text color={t.danger[0]}>{err}</Text>}
    <View style={{ flexDirection: 'row', gap: 8 }}>{step > 0 && <Button variant="secondary" title="Back" onPress={() => setStep(step - 1)} />}
      <View style={{ flex: 1 }}>{step < steps.length - 1 ? <Button full title="Next" disabled={!canNext} onPress={() => setStep(step + 1)} /> : <Button full variant="cta" title="Create our family" onPress={create} />}</View></View>
  </ScrollView></SafeAreaView>;
}
