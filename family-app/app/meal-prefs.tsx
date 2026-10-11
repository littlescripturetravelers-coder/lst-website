import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/avatar';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useMeals, MEALS, DIETS, AVOID, MAX_MINUTES, BUDGETS, MealPrefs, Meal, PersonPlan } from '@/lib/meals';

/** Meal preferences: what the family wants and can't have, which meals to plan, how many ideas, and each person's own plan (calories, macros, diet). */
export default function MealPrefsScreen() {
  const { theme: t } = useTheme(); const { family, me } = useFamily(); const m = useMeals(family?.id);
  const [p, setP] = useState<MealPrefs>(m.prefs); const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (m.loaded) setP(m.prefs); }, [m.loaded]);
  const parent = me?.role === 'dad' || me?.role === 'mom';
  const save = () => { if (parent) m.savePrefs(p); router.back(); };
  const toggle = <T,>(list: T[], v: T) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];
  const chips = <T extends string | number | null>(opts: [T, string][], on: (v: T) => boolean, tap: (v: T) => void) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {opts.map(([k, l]) => { const sel = on(k); return <Pressable key={String(k) + l} onPress={() => tap(k)} accessibilityRole="checkbox" accessibilityState={{ checked: sel }} style={{ paddingHorizontal: 12, height: 36, borderRadius: 18, justifyContent: 'center', borderWidth: 1.5, borderColor: sel ? t.brand[500] : t.line[2], backgroundColor: sel ? t.brand[500] : t.paper[0] }}>
      <Text v="subhead" weight="bold" color={sel ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>; })}</View>;
  const H = ({ s, sub }: { s: string; sub?: string }) => <View style={{ marginTop: 14, marginBottom: 8 }}><Text v="headline">{s}</Text>{!!sub && <Text v="footnote" color={t.ink[3]}>{sub}</Text>}</View>;
  const setPerson = (slug: string, x: Partial<PersonPlan>) => setP(q => ({ ...q, people: { ...q.people, [slug]: { ...(q.people[slug] ?? {}), ...x } } }));
  const num = (v: number | undefined, on: (n: number | undefined) => void, ph: string) => <TextInput value={v ? String(v) : ''} onChangeText={x => on(x ? Math.min(9999, Number(x.replace(/\D/g, '')) || 0) : undefined)} keyboardType="number-pad" placeholder={ph} placeholderTextColor={t.ink[4]}
    style={{ width: 84, height: 40, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 10, fontSize: 17, fontFamily: t.font.body, color: t.ink[1], textAlign: 'center' }} />;

  return <ScrollView style={{ backgroundColor: t.paper[1] }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text color={t.brand[500]} onPress={() => router.back()}>Cancel</Text>
      <Text v="headline" style={{ flex: 1, textAlign: 'center' }}>Meal preferences</Text><Text weight="heavy" color={t.brand[500]} onPress={save}>{parent ? 'Save' : 'Done'}</Text></View>
    {!parent && <Text v="footnote" color={t.ink[3]}>Only a parent can change these.</Text>}
    <Card>
      <H s="Meals to plan" />{chips(MEALS, k => p.meals.includes(k as Meal), k => setP({ ...p, meals: toggle(p.meals, k as Meal) }))}
      <H s="How many ideas at a time" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => setP({ ...p, ideas_count: Math.max(1, p.ideas_count - 1) })} accessibilityLabel="Fewer ideas" style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.paper[2] }}><Icon name="minus" size={18} /></Pressable>
        <Text v="title2">{p.ideas_count}</Text>
        <Pressable onPress={() => setP({ ...p, ideas_count: Math.min(10, p.ideas_count + 1) })} accessibilityLabel="More ideas" style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.paper[2] }}><Icon name="plus" size={18} /></Pressable></View>
      <H s="Longest cooking time" />{chips(MAX_MINUTES, k => (p.max_minutes ?? null) === k, k => setP({ ...p, max_minutes: k as number | null }))}
      <H s="Budget" />{chips(BUDGETS, k => (p.budget ?? null) === k, k => setP({ ...p, budget: k as string | null }))}
    </Card>
    <Card>
      <H s="What the family wants" sub="Every family recipe follows these." />{chips(DIETS, k => p.diets.includes(k as string), k => setP({ ...p, diets: toggle(p.diets, k as string) }))}
      <H s="Never include" sub="Allergies and foods someone won’t eat." />{chips(AVOID, k => p.avoid.includes(k as string), k => setP({ ...p, avoid: toggle(p.avoid, k as string) }))}
      <H s="Anything else" />
      <TextInput value={p.notes ?? ''} onChangeText={v => setP({ ...p, notes: v.slice(0, 500) })} multiline placeholder="For example: Mayble won’t eat beans; we love Mexican food; Sunday is slow-cooker day." placeholderTextColor={t.ink[4]}
        style={{ minHeight: 80, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], padding: 12, fontSize: 16, fontFamily: t.font.body, color: t.ink[1], textAlignVertical: 'top' }} />
    </Card>
    <Text v="title3" style={{ marginTop: 6 }}>Each person’s own plan</Text>
    <Text v="footnote" color={t.ink[3]} style={{ marginTop: -8 }}>Turn on a plan for anyone who wants their own calories, macros or diet. Their recipes are one serving that fits.</Text>
    {(family?.members ?? []).map(x => { const pp = p.people[x.id] ?? {}; const isOpen = open === x.id || !!pp.on;
      return <Card key={x.id} padding={0}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}><Avatar name={x.name} color={x.color} size={30} /><Text style={{ flex: 1 }}>{x.name}</Text>
          <Switch value={!!pp.on} onValueChange={v => { setPerson(x.id, { on: v }); setOpen(v ? x.id : null); }} trackColor={{ true: t.brand[500] }} /></View>
        {isOpen && pp.on && <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <H s="Meals" />{chips(MEALS, k => (pp.meals ?? p.meals).includes(k as Meal), k => setPerson(x.id, { meals: toggle(pp.meals ?? p.meals, k as Meal) }))}
          <H s="Diet" />{chips([['', 'No special diet'] as [string, string], ...DIETS], k => (pp.diet ?? '') === k, k => setPerson(x.id, { diet: (k as string) || undefined }))}
          <H s="Daily targets" sub="Leave blank for no target. Grams for protein, carbs and fat." />
          <View style={{ gap: 10 }}>
            {([['calories', 'Calories', '2000'], ['protein', 'Protein (g)', '150'], ['carbs', 'Carbs (g)', '180'], ['fat', 'Fat (g)', '65']] as const).map(([k, l, ph]) =>
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1 }}>{l}</Text>{num(pp[k], n => setPerson(x.id, { [k]: n }), ph)}</View>)}
          </View>
        </View>}
      </Card>; })}
  </ScrollView>;
}
