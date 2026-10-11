// Meal ideas: real recipes for one meal (breakfast, lunch, dinner or snacks), for the whole family or one person.
// Family recipes are scaled to everyone eating; a person's recipes are one serving that fits their calories, macros and diet.
// Every family's wants and restrictions (diets, allergies, dislikes, time, budget) are followed. Capped per family per day.
import { familyFor, ok, cors, underLimit } from '../_shared/ctx.ts';
import { claude, text, json, MODEL_FAST } from '../_shared/claude.ts';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];
const SHARE: Record<string, number> = { breakfast: .25, lunch: .3, dinner: .35, snacks: .1 };
const AISLES = ['Produce', 'Meat and seafood', 'Dairy and eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'];

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const b = await req.json().catch(() => ({}));
  const meal = MEALS.includes(b.meal) ? b.meal : 'dinner';
  const f = await familyFor(req); const { db, family, context, members, today } = f;
  if (!await underLimit(db, family.id, 'meals', 15)) return ok({ error: 'daily_limit', message: 'You’ve used today’s meal ideas. They reset tomorrow.' }, 429);
  const { data: prefs } = await db.from('meal_prefs').select('*').eq('family_id', family.id).maybeSingle();
  const p = prefs ?? { diets: [], avoid: [], notes: null, ideas_count: 4, max_minutes: null, budget: null, people: {}, meals: MEALS };
  const count = Math.max(1, Math.min(10, Number(b.count) || p.ideas_count || 4));
  const who = typeof b.for_whom === 'string' && b.for_whom !== 'family' ? members.find((m: any) => m.slug === b.for_whom) : null;
  const person = who ? (p.people?.[who.slug] ?? {}) : null;

  // Daily targets split across the meals this person has turned on, so each recipe fits.
  let target = '';
  if (who && person) {
    const on = (person.meals?.length ? person.meals : p.meals) as string[]; const total = on.reduce((s, m) => s + (SHARE[m] ?? 0), 0) || 1; const part = (SHARE[meal] ?? .3) / total;
    const t = (k: string) => person[k] ? Math.round(person[k] * part) : null;
    target = `This is ONE serving for ${who.name} only (age ${who.age}). Aim per serving for` + [t('calories') && ` about ${t('calories')} calories`, t('protein') && ` ${t('protein')} g protein`, t('carbs') && ` ${t('carbs')} g carbs`, t('fat') && ` ${t('fat')} g fat`].filter(Boolean).join(',') + '.' + (person.diet ? ` Diet: ${person.diet}.` : '');
  }
  const eaters = members.filter((m: any) => m.role !== 'pet');
  const servings = who ? 1 : Math.max(2, eaters.reduce((s: number, m: any) => s + (m.age < 6 ? .5 : m.age < 12 ? .75 : 1), 0));
  const { data: recent } = await db.from('recipes').select('title').eq('family_id', family.id).gte('created_at', new Date(Date.now() - 21 * 864e5).toISOString()).limit(80);

  const r = await claude({ model: MODEL_FAST, max_tokens: 3500, system: 'You are a practical family meal planner and home cook. ' + context.voice + ' Follow every diet and restriction exactly; never include an avoided ingredient, even as a garnish.',
    messages: [{ role: 'user', content: `Family: ${JSON.stringify({ ...context, eaters: eaters.map((m: any) => ({ name: m.name, age: m.age })) })}.
Give ${count} different ${meal} ${meal === 'snacks' ? 'ideas' : 'recipes'} for ${who ? who.name : 'the whole family (kid-friendly where there are young children)'}.
${who ? target : `Scale to ${servings} servings (young children count as smaller portions).`}
Family diets: ${(p.diets || []).join(', ') || 'none'}. Never use: ${(p.avoid || []).join(', ') || 'nothing listed'}. Notes: ${p.notes || 'none'}.${p.max_minutes ? ` Ready in ${p.max_minutes} minutes or less.` : ''}${p.budget ? ` Budget: ${p.budget}.` : ''}
Use common grocery-store ingredients. Vary proteins and cuisines. Don't repeat: ${(recent || []).map((x: any) => x.title).join('; ') || 'nothing yet'}.
For each recipe: title (<6 words), summary (<16 words), minutes, servings (${who ? 1 : servings}), calories, protein, carbs, fat (per serving, whole numbers), ingredients for ALL servings [{name (lowercase, singular), qty (number), unit ("" for whole items), aisle (one of ${AISLES.join(', ')})}], steps (4–8 short steps), tags (2–3).
Reply ONLY JSON {"recipes":[...]}.` }] });
  const j = json(text(r));
  const rows = (j.recipes || []).slice(0, count).map((x: any) => ({
    family_id: family.id, meal, for_whom: who ? who.slug : 'family', title: String(x.title).slice(0, 80), summary: x.summary ?? null, minutes: Number(x.minutes) || null,
    servings: Number(x.servings) || (who ? 1 : servings), calories: Number(x.calories) || null, protein: Number(x.protein) || null, carbs: Number(x.carbs) || null, fat: Number(x.fat) || null,
    ingredients: (x.ingredients || []).map((g: any) => ({ name: String(g.name).toLowerCase(), qty: Number(g.qty) || null, unit: g.unit ?? '', aisle: AISLES.includes(g.aisle) ? g.aisle : 'Other' })),
    steps: x.steps || [], tags: x.tags || [] }));
  const { data } = await db.from('recipes').insert(rows).select();
  return ok({ recipes: data ?? [], today });
});
