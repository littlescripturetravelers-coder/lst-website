import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { supabase } from '@/lib/supabase';
import { children, parents } from '@/lib/family';
import { useSetup, SECTIONS, ALL_SECTIONS, PRIORITIES, SEASONS, COUPLE_WANTS, DATE_BUDGETS, MY_PRIORITIES, KID_INTERESTS, KID_FOCUS, Opt } from '@/lib/setup';

type Step = 'sections' | 'priorities' | 'season' | 'me' | 'kids';
/** The setup questionnaire, about 3 minutes of tapping. Shown after a family is created, and any time from Settings ("Check in").
 *  Family answers are shared with the other parent; "Just you" answers are private to the person answering. Parents only. */
export default function Setup() {
  const { theme: t } = useTheme(); const p = useLocalSearchParams<{ first?: string }>(); const { family, me } = useFamily(); const s = useSetup(family?.id);
  const [sections, setSections] = useState<string[]>(ALL_SECTIONS); const [priorities, setPriorities] = useState<string[]>([]); const [season, setSeason] = useState<string[]>([]);
  const [wants, setWants] = useState<string[]>([]); const [budget, setBudget] = useState(''); const [mine, setMine] = useState<string[]>([]);
  const [about, setAbout] = useState<Record<string, { interests: string[]; focus: string[] }>>({}); const [i, setI] = useState(0); const [busy, setBusy] = useState(false);
  const kids = family ? children(family) : []; const hasSpouse = family ? parents(family).length > 1 : false;
  useEffect(() => { if (!s.loaded) return;
    if (s.setup) { setSections(s.setup.sections); setPriorities(s.setup.priorities); setSeason(s.setup.season); }
    setWants(s.mine.coupleWants ?? []); setBudget(s.mine.dateBudget ?? ''); setMine(s.mine.myPriorities ?? []); }, [s.loaded]);
  useEffect(() => { if (family) setAbout(Object.fromEntries(children(family).map((k: any) => [k.id, { interests: k.about?.interests ?? [], focus: k.about?.focus ?? [] }]))); }, [family?.id]);
  if (me && me.role !== 'dad' && me.role !== 'mom') return <Redirect href="/kid" />;

  const steps: Step[] = ['sections', 'priorities', 'season', 'me', ...(kids.length ? ['kids' as Step] : [])]; const step = steps[i];
  const toggle = (list: string[], set: (x: string[]) => void, k: string, max?: number) => set(list.includes(k) ? list.filter(x => x !== k) : max && list.length >= max ? [...list.slice(1), k] : [...list, k]);
  const chips = (opts: Opt[], list: string[], set: (x: string[]) => void, max?: number) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {opts.map(([k, l]) => { const on = list.includes(k); return <Pressable key={k} onPress={() => toggle(list, set, k, max)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={{ paddingHorizontal: 14, height: 40, borderRadius: 20, justifyContent: 'center', borderWidth: 1.5, borderColor: on ? t.brand[500] : t.line[2], backgroundColor: on ? t.brand[500] : t.paper[0] }}>
      <Text v="subhead" weight="bold" color={on ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>; })}</View>;
  const finish = async () => {
    if (!family) return; setBusy(true);
    await s.saveFamily({ sections, priorities, season });
    await s.saveMine({ coupleWants: wants, dateBudget: budget || undefined, myPriorities: mine });
    for (const k of kids) await supabase.from('family_members').update({ about: about[k.id] ?? {} }).eq('family_id', family.id).eq('slug', k.id);
    setBusy(false); if (p.first) router.replace('/tabs'); else router.back();
  };
  const head = { sections: ['What do you want help with?', 'Pick every part of family life you want in the app. You can change this any time.'],
    priorities: ['Your family’s top 3 right now', 'Pick up to three. The app puts these first and the ideas lean toward them.'],
    season: ['What season are you in?', 'Pick any that fit. Ideas and advice will fit where you are.'],
    me: ['Just you', 'Only you see these answers. They shape your own ideas and advice.'],
    kids: ['Your kids', 'What each child loves and what you’re working on together. Ideas for them will fit.'] }[step];

  return <SafeAreaView style={{ flex: 1, backgroundColor: t.paper[1] }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
      <Text v="footnote" weight="bold" color={t.brand[400]} style={{ flex: 1 }}>{p.first ? 'Set up' : 'Check in'} · Step {i + 1} of {steps.length}</Text>
      {!p.first && <Text color={t.brand[500]} onPress={() => router.back()}>Cancel</Text>}</View>
    <View style={{ marginHorizontal: 20, marginTop: 8, height: 4, borderRadius: 2, backgroundColor: t.paper[3] }}><View style={{ width: `${(i + 1) / steps.length * 100}%`, height: 4, borderRadius: 2, backgroundColor: t.brand[500] }} /></View>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
      <Text v="title1">{head[0]}</Text><Text color={t.ink[2]}>{head[1]}</Text>
      {step === 'sections' && chips(SECTIONS, sections, setSections)}
      {step === 'priorities' && <>{chips(PRIORITIES, priorities, setPriorities, 3)}<Text v="footnote" color={t.ink[3]}>{priorities.length} of 3 picked</Text></>}
      {step === 'season' && chips(SEASONS, season, setSeason)}
      {step === 'me' && <>
        {hasSpouse && sections.includes('marriage') && <Card><Text v="headline" style={{ marginBottom: 10 }}>What do you want more of with your spouse?</Text>{chips(COUPLE_WANTS, wants, setWants)}
          <Text v="headline" style={{ marginTop: 16, marginBottom: 10 }}>Date budget</Text>{chips(DATE_BUDGETS, budget ? [budget] : [], x => setBudget(x[x.length - 1] ?? ''), 1)}</Card>}
        <Card><Text v="headline" style={{ marginBottom: 10 }}>Your own top 3</Text>{chips(MY_PRIORITIES, mine, setMine, 3)}</Card>
      </>}
      {step === 'kids' && kids.map(k => { const a = about[k.id] ?? { interests: [], focus: [] }; const set = (key: 'interests' | 'focus') => (x: string[]) => setAbout(o => ({ ...o, [k.id]: { ...a, [key]: x } }));
        return <Card key={k.id}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}><Avatar name={k.name} color={k.color} size={32} /><Text v="title3">{k.name}</Text></View>
          <Text v="subhead" weight="bold" color={t.ink[2]} style={{ marginBottom: 8 }}>Loves</Text>{chips(KID_INTERESTS, a.interests, set('interests'))}
          <Text v="subhead" weight="bold" color={t.ink[2]} style={{ marginTop: 14, marginBottom: 8 }}>Working on</Text>{chips(KID_FOCUS, a.focus, set('focus'))}</Card>; })}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 }}>
      {i > 0 && <Button variant="secondary" title="Back" onPress={() => setI(i - 1)} />}
      <View style={{ flex: 1 }}><Button full title={i === steps.length - 1 ? (busy ? 'Saving…' : 'Finish') : 'Next'} disabled={busy || (step === 'sections' && !sections.length)} onPress={() => i === steps.length - 1 ? finish() : setI(i + 1)} /></View>
    </View>
  </SafeAreaView>;
}
