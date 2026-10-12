import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import DateTimePicker from '@/components/date-time-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { supabase } from '@/lib/supabase';
import { useMeals, ingredientLine, fmtQty, MEALS, Recipe, addToShopping } from '@/lib/meals';
import { todayISO, fmtDay } from '@/lib/dates';
import { iso } from '@/lib/calendar';

/** One recipe: how much you need for how many people, the steps, calories and macros, and "Add to the menu and shopping list". */
export default function RecipeScreen() {
  const { theme: t } = useTheme(); const { id } = useLocalSearchParams<{ id: string }>(); const { family } = useFamily(); const m = useMeals(family?.id);
  const [r, setR] = useState<Recipe | null>(null); const [servings, setServings] = useState(1); const [day, setDay] = useState(new Date()); const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from('recipes').select('*').eq('id', id).maybeSingle().then(({ data }) => { if (data) { setR(data); setServings(Number(data.servings) || 1); if (data.planned_for) setDay(new Date(data.planned_for + 'T12:00:00')); } }); }, [id]);
  if (!r) return <Screen title="Recipe"><View /></Screen>;
  const scale = servings / (Number(r.servings) || 1);
  const who = r.for_whom === 'family' ? 'the family' : family?.members.find(x => x.id === r.for_whom)?.name ?? '';
  const aisles = [...new Set(r.ingredients.map(g => g.aisle))];
  const add = async () => {
    if (r.planned_for) { // already on the menu: just move it, don't add the ingredients twice
      await supabase.from('recipes').update({ planned_for: iso(day) }).eq('id', r.id); setR({ ...r, planned_for: iso(day) }); Alert.alert('Moved', r.title + ' is now planned for ' + fmtDay(iso(day)).toLowerCase() + '.'); return;
    }
    setBusy(true); const n = await m.choose(r, iso(day), scale); setBusy(false);
    setR({ ...r, planned_for: iso(day) });
    Alert.alert('On the menu', `${r.title} is planned for ${fmtDay(iso(day)).toLowerCase()}, and ${n} ingredient${n === 1 ? '' : 's'} went on your Groceries list.`, [{ text: 'Done', onPress: () => router.back() }, { text: 'Stay here' }]);
  };
  const step = (d: number) => setServings(s => Math.max(1, Math.round((s + d) * 2) / 2));
  return <Screen title={r.title} subtitle={MEALS.find(x => x[0] === r.meal)![1] + ' · for ' + who} trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Meals</Text>}>
    {!!r.summary && <Gutter><Text color={t.ink[2]}>{r.summary}</Text></Gutter>}
    <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {[r.minutes && ['clock', r.minutes + ' min'], r.calories && ['flame', r.calories + ' cal'], r.protein != null && ['beef', r.protein + 'g protein'], r.carbs != null && ['wheat', r.carbs + 'g carbs'], r.fat != null && ['droplet', r.fat + 'g fat']]
        .filter(Boolean).map((x: any) => <View key={x[1]} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: t.paper[2] }}><Icon name={x[0]} size={14} color={t.ink[2]} /><Text v="footnote" weight="bold">{x[1]}</Text></View>)}
    </Gutter>
    {(r.calories || r.protein) && <Gutter><Text v="caption" color={t.ink[3]} style={{ marginTop: 6 }}>Calories and macros are per serving.</Text></Gutter>}
    <SectionHead title="Ingredients" />
    <Gutter><Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}><Text style={{ flex: 1 }}>Servings</Text>
        <Pressable onPress={() => step(-1)} accessibilityLabel="Fewer servings" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.paper[2] }}><Icon name="minus" size={18} /></Pressable>
        <Text v="headline" style={{ width: 48, textAlign: 'center' }}>{fmtQty(servings)}</Text>
        <Pressable onPress={() => step(1)} accessibilityLabel="More servings" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.paper[2] }}><Icon name="plus" size={18} /></Pressable></View>
      {aisles.map(a => <View key={a} style={{ marginTop: 8 }}><Text v="footnote" weight="heavy" color={t.ink[3]} style={{ textTransform: 'uppercase', letterSpacing: .6 }}>{a}</Text>
        {r.ingredients.filter(g => g.aisle === a).map((g, i) => <Text key={i} style={{ marginTop: 4 }}>• {ingredientLine(g, scale)}</Text>)}</View>)}
    </Card></Gutter>
    <SectionHead title="How to make it" />
    <Gutter style={{ gap: 10 }}>{r.steps.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.brand[500], alignItems: 'center', justifyContent: 'center' }}><Text v="footnote" weight="heavy" color={t.ink.inverse}>{i + 1}</Text></View>
      <Text style={{ flex: 1 }}>{s}</Text></View>)}</Gutter>
    <SectionHead title={r.planned_for ? 'On the menu' : 'Add to the menu'} />
    <Gutter style={{ gap: 10 }}>
      <Card><View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1 }}>Day</Text>
        <DateTimePicker value={day} mode="date" display="compact" minimumDate={new Date(todayISO() + 'T00:00:00')} accentColor={t.brand[500]} themeVariant={t.dark ? 'dark' : 'light'} onChange={(_, d) => d && setDay(d)} /></View></Card>
      <Button full variant="cta" icon="shopping-cart" title={busy ? 'Adding…' : r.planned_for ? 'Move to this day' : 'Add to the menu and shopping list'} disabled={busy} onPress={add} />
      {!!r.planned_for && <Button full variant="secondary" title="Add the ingredients again" onPress={async () => { if (!family) return; const n = await addToShopping(family.id, r.ingredients, scale, r.title); Alert.alert('Added', n + ' ingredients went on your Groceries list.'); }} />}
      {!!r.planned_for && <Text color={t.danger[0]} style={{ textAlign: 'center', padding: 10 }} onPress={async () => { await m.unplan(r); setR({ ...r, planned_for: null }); }}>Take off the menu</Text>}
    </Gutter>
    <View style={{ height: 30 }} />
  </Screen>;
}
