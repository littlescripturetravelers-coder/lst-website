// Meal planning choices and helpers. Option keys are stored in meal_prefs: never rename one.
import { useCallback, useEffect, useState } from 'react';
import { supabase, fn } from './supabase';
import { todayISO } from './dates';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export const MEALS: [Meal, string][] = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
export const DIETS: [string, string][] = [['kid-friendly', 'Kid-friendly'], ['high-protein', 'High protein'], ['low-carb', 'Low carb'], ['keto', 'Keto'], ['paleo', 'Paleo'],
  ['mediterranean', 'Mediterranean'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['pescatarian', 'Pescatarian'], ['gluten-free', 'Gluten-free'], ['dairy-free', 'Dairy-free'],
  ['low-sodium', 'Low sodium'], ['heart-healthy', 'Heart healthy'], ['diabetic-friendly', 'Diabetic-friendly'], ['whole30', 'Whole30'], ['halal', 'Halal'], ['kosher', 'Kosher'], ['budget', 'Budget-friendly']];
export const AVOID: [string, string][] = [['peanuts', 'Peanuts'], ['tree nuts', 'Tree nuts'], ['dairy', 'Dairy'], ['eggs', 'Eggs'], ['gluten', 'Gluten'], ['shellfish', 'Shellfish'],
  ['fish', 'Fish'], ['soy', 'Soy'], ['sesame', 'Sesame'], ['pork', 'Pork'], ['beef', 'Beef'], ['mushrooms', 'Mushrooms'], ['onions', 'Onions'], ['spicy food', 'Spicy food'], ['coconut', 'Coconut'], ['corn', 'Corn']];
export const MAX_MINUTES: [number | null, string][] = [[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 hour'], [null, 'Any']];
export const BUDGETS: [string | null, string][] = [['tight', 'Tight'], ['moderate', 'Moderate'], ['flexible', 'Flexible'], [null, 'Any']];

export type PersonPlan = { on?: boolean; meals?: Meal[]; diet?: string; calories?: number; protein?: number; carbs?: number; fat?: number };
export type MealPrefs = { meals: Meal[]; diets: string[]; avoid: string[]; notes?: string | null; ideas_count: number; max_minutes?: number | null; budget?: string | null; people: Record<string, PersonPlan> };
export type Ingredient = { name: string; qty: number | null; unit: string; aisle: string };
export type Recipe = { id: string; meal: Meal; for_whom: string; title: string; summary?: string; minutes?: number; servings: number; calories?: number; protein?: number; carbs?: number; fat?: number;
  ingredients: Ingredient[]; steps: string[]; tags: string[]; planned_for?: string | null; chosen_at?: string | null; created_at: string };
export const DEFAULT_PREFS: MealPrefs = { meals: ['breakfast', 'lunch', 'dinner', 'snacks'], diets: [], avoid: [], notes: null, ideas_count: 4, max_minutes: null, budget: null, people: {} };

/** "1.5" -> "1½", 0.333 -> "⅓": friendly kitchen amounts. */
export function fmtQty(q: number | null) {
  if (q == null) return '';
  const whole = Math.floor(q), frac = q - whole;
  const f = [[.125, '⅛'], [.25, '¼'], [.333, '⅓'], [.5, '½'], [.667, '⅔'], [.75, '¾']].reduce((b: any, x: any) => Math.abs(frac - x[0]) < Math.abs(frac - b[0]) ? x : b, [0, '']);
  if (frac > .9) return String(whole + 1);
  if (Math.abs(frac - f[0]) > .06) return String(Math.round(q * 10) / 10);
  return (whole ? String(whole) : '') + f[1] || '0';
}
export const ingredientLine = (g: Ingredient, scale = 1) => { const q = g.qty == null ? null : g.qty * scale; return [fmtQty(q), g.unit, g.name].filter(Boolean).join(' ').trim(); };

/** Meal settings, recent ideas and the plan, with actions to get ideas and choose a recipe. */
export function useMeals(familyId?: string) {
  const [prefs, setPrefs] = useState<MealPrefs>(DEFAULT_PREFS); const [recipes, setRecipes] = useState<Recipe[]>([]); const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!familyId || familyId === 'local') return;
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('meal_prefs').select('*').eq('family_id', familyId).maybeSingle(),
      supabase.from('recipes').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(120)]);
    setPrefs(p ? { ...DEFAULT_PREFS, ...p, people: p.people ?? {} } : DEFAULT_PREFS); setRecipes(r || []); setLoaded(true);
  }, [familyId]);
  useEffect(() => { load(); }, [load]);
  const savePrefs = async (p: MealPrefs) => { if (!familyId) return; setPrefs(p); await supabase.from('meal_prefs').upsert({ family_id: familyId, ...p, updated_at: new Date().toISOString() }); };
  const ideas = async (meal: Meal, forWhom: string, count?: number) => { const r = await fn<{ recipes?: Recipe[]; error?: string; message?: string }>('meal-ideas', { meal, for_whom: forWhom, count }); await load(); return r; };
  /** Puts a recipe on the plan for a day and adds its ingredients (scaled) to the Groceries list, combining with what's already there. */
  const choose = async (r: Recipe, date = todayISO(), scale = 1) => {
    if (!familyId) return 0;
    await supabase.from('recipes').update({ planned_for: date, chosen_at: new Date().toISOString() }).eq('id', r.id);
    const added = await addToShopping(familyId, r.ingredients, scale, r.title);
    await load(); return added;
  };
  const unplan = async (r: Recipe) => { await supabase.from('recipes').update({ planned_for: null, chosen_at: null }).eq('id', r.id); await load(); };
  return { loaded, prefs, recipes, savePrefs, ideas, choose, unplan, reload: load };
}

/** Adds ingredients to the Groceries reminder list as "Milk · 2 cups". The same item (same unit) already on the list gets its amount added instead of a second line. */
export async function addToShopping(familyId: string, items: Ingredient[], scale = 1, from?: string) {
  const { data: lists } = await supabase.from('reminder_lists').select('id,name,color').eq('family_id', familyId);
  const list = (lists || []).find(l => /grocer|shop/i.test(l.name)) ?? (lists || [])[0]; if (!list) return 0;
  const { data: open } = await supabase.from('reminders').select('id,title,notes').eq('family_id', familyId).eq('list_id', list.id).eq('done', false);
  const key = (name: string, unit: string) => name.toLowerCase().trim() + '|' + unit.toLowerCase().trim();
  const parse = (title: string) => { const [name, rest = ''] = title.split(' · '); const m = rest.match(/^([\d.]+)\s*(.*)$/); return { name, qty: m ? Number(m[1]) : null, unit: m ? m[2] : rest }; };
  const have = new Map((open || []).map(x => { const p = parse(x.title); return [key(p.name, p.unit), { ...x, ...p }]; }));
  let n = 0;
  for (const g of items) {
    // Whole items (eggs, avocados, tortillas) round up; everything else to the nearest quarter.
    const raw = g.qty == null ? null : g.qty * scale; const qty = raw == null ? null : g.unit ? Math.max(.25, Math.round(raw * 4) / 4) : Math.ceil(raw - .01); const name = g.name.charAt(0).toUpperCase() + g.name.slice(1);
    const k = key(name, g.unit || ''); const ex = have.get(k);
    if (ex && ex.qty != null && qty != null) {
      const total = Math.round((ex.qty + qty) * 4) / 4;
      await supabase.from('reminders').update({ title: name + ' · ' + [total, g.unit].filter(Boolean).join(' '), notes: [ex.notes, from].filter(Boolean).join(', ') }).eq('id', ex.id);
      ex.qty = total;
    } else if (!ex) {
      const title = name + (qty != null || g.unit ? ' · ' + [qty, g.unit].filter(x => x != null && x !== '').join(' ') : '');
      const notes = [g.aisle, from ? 'for ' + from : ''].filter(Boolean).join(' · ');
      const { data: row } = await supabase.from('reminders').insert({ family_id: familyId, list_id: list.id, title, notes, source: 'meal' }).select('id').single();
      if (row) have.set(k, { id: row.id, title, notes, name, qty, unit: g.unit });
    }
    n++;
  }
  return n;
}
