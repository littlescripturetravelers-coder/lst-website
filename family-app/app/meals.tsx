import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useMeals, MEALS, Meal, Recipe } from '@/lib/meals';
import { todayISO, fmtDay } from '@/lib/dates';

/** Meal planning: pick who it's for (the family or one person), get recipe ideas for each meal that's turned on, and see what's on the menu. */
export default function Meals() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const m = useMeals(family?.id);
  const [who, setWho] = useState('family'); const [busy, setBusy] = useState<Meal | null>(null);
  useFocusEffect(useCallback(() => { m.reload(); }, [m.reload]));
  const people = (family?.members ?? []).filter(x => m.prefs.people[x.id]?.on);
  const person = who === 'family' ? null : m.prefs.people[who];
  const meals = (person?.meals?.length ? person.meals : m.prefs.meals) as Meal[];
  const today = todayISO(); const mine = m.recipes.filter(r => r.for_whom === who);
  const menu = mine.filter(r => r.planned_for && r.planned_for >= today).sort((a, b) => a.planned_for!.localeCompare(b.planned_for!) || MEALS.findIndex(x => x[0] === a.meal) - MEALS.findIndex(x => x[0] === b.meal));
  const fresh = (meal: Meal) => mine.filter(r => r.meal === meal && !r.planned_for && Date.now() - +new Date(r.created_at) < 14 * 864e5).slice(0, 10);
  const get = async (meal: Meal) => {
    setBusy(meal);
    try { const r = await m.ideas(meal, who, m.prefs.ideas_count); if (r?.error) Alert.alert('Not right now', r.message ?? 'Please try again later.'); }
    catch { Alert.alert('That didn’t work', 'Meal ideas need the AI key in Supabase, or the daily limit was reached. Please try again later.'); }
    setBusy(null);
  };
  const meta = (r: Recipe) => [r.minutes && r.minutes + ' min', r.calories && r.calories + ' cal', r.protein && r.protein + 'g protein'].filter(Boolean).join(' · ');
  const chip = (k: string, l: string) => <Pressable key={k} onPress={() => setWho(k)} accessibilityRole="button" accessibilityState={{ selected: who === k }} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: who === k ? t.brand[500] : t.paper[2] }}>
    <Text v="subhead" weight="bold" color={who === k ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>;

  return <Screen title="Meals" subtitle="Plan, cook, shop" trailing={<Text color={t.brand[500]} onPress={() => router.push('/meal-prefs')}>Preferences</Text>}>
    <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{chip('family', 'Family')}{people.map(p => chip(p.id, p.name))}</Gutter>
    {people.length === 0 && <Gutter style={{ marginTop: 8 }}><Text v="footnote" color={t.ink[3]}>Want a plan with your own calories and macros? Turn it on for each person in Preferences.</Text></Gutter>}
    <SectionHead title="On the menu" action="Shopping list" onAction={() => router.push('/tabs/reminders')} />
    <Gutter style={{ gap: 8 }}>
      {menu.map(r => <Pressable key={r.id} onPress={() => router.push({ pathname: '/recipe', params: { id: r.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: t.paper[0], borderWidth: 1, borderColor: t.line[1] }}>
        <View style={{ flex: 1 }}><Text v="footnote" weight="bold" color={t.brand[400]}>{fmtDay(r.planned_for!)} · {MEALS.find(x => x[0] === r.meal)![1]}</Text><Text v="headline">{r.title}</Text></View><Icon name="chevron-right" size={18} color={t.ink[4]} /></Pressable>)}
      {!menu.length && <Text v="subhead" color={t.ink[3]}>Nothing planned yet. Get ideas below and choose the ones you want.</Text>}
    </Gutter>
    {meals.map(meal => { const list = fresh(meal); const label = MEALS.find(x => x[0] === meal)![1];
      return <View key={meal}>
        <SectionHead title={label} action={busy === meal ? 'Finding…' : list.length ? 'More ideas' : 'Get ' + m.prefs.ideas_count + ' ideas'} onAction={() => busy ? null : get(meal)} />
        <Gutter style={{ gap: 8 }}>
          {busy === meal && <ActivityIndicator color={t.brand[500]} />}
          {list.map(r => <Card key={r.id} onPress={() => router.push({ pathname: '/recipe', params: { id: r.id } })}>
            <Text v="headline">{r.title}</Text>{!!r.summary && <Text v="subhead" color={t.ink[2]} style={{ marginTop: 2 }}>{r.summary}</Text>}
            {!!meta(r) && <Text v="footnote" color={t.ink[3]} style={{ marginTop: 6 }}>{meta(r)}</Text>}</Card>)}
          {!list.length && busy !== meal && <Text v="subhead" color={t.ink[3]}>Tap “Get {m.prefs.ideas_count} ideas” for {label.toLowerCase()} {who === 'family' ? 'for the family' : 'for ' + (family?.members.find(x => x.id === who)?.name ?? '')}.</Text>}
        </Gutter></View>; })}
    <View style={{ height: 30 }} />
  </Screen>;
}
