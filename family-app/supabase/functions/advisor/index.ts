// Financial advisor bot: Claude with tools over the family's real (Plaid-synced) data. Educational guidance, read-only access.
import { familyFor, ok, cors, underLimit } from '../_shared/ctx.ts';
import { claude, text } from '../_shared/claude.ts';

const SYSTEM = (ctx: any) => `You are this family's personal financial advisor inside their family app. Family: ${JSON.stringify(ctx)}.
How you work:
- Always look at their real data with the tools before answering. Use exact numbers and show simple math.
- Give one clear recommendation and one next step they can do this week. Offer to save a plan.
- Default philosophy: starter emergency fund, then pay off high-interest debt (snowball for motivation or avalanche for savings; say which saves more), then a 3–6 month fund, then retirement match, then the children's education and other goals. Adjust to what they tell you they value.
- If they give to their church (tithing, offerings), treat it as a fixed first line of the budget.
- Warm, plain, no shame. You are educational, not a licensed fiduciary. For investments, taxes, insurance or legal decisions, say to confirm with a licensed professional. Never ask for passwords. You cannot move money.`;

const tools = [
  { name: 'get_accounts', description: 'All linked accounts with balances; credit cards and loans include APR, minimum payment and due date.', input_schema: { type: 'object', properties: {} } },
  { name: 'get_spending', description: 'Spending totals by category for a date range, plus top merchants.', input_schema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } },
  { name: 'get_budget', description: 'This month’s budget limits vs actual by category.', input_schema: { type: 'object', properties: {} } },
  { name: 'get_goals', description: 'Family money goals and saved plans.', input_schema: { type: 'object', properties: {} } },
  { name: 'simulate_payoff', description: 'Month-by-month debt payoff simulation.', input_schema: { type: 'object', properties: { strategy: { type: 'string', enum: ['snowball', 'avalanche'] }, extra_per_month: { type: 'number' } }, required: ['strategy', 'extra_per_month'] } },
  { name: 'save_plan', description: 'Save a plan (and optional reminders) the family agreed to.', input_schema: { type: 'object', properties: { kind: { type: 'string' }, summary: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, reminders: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, due_date: { type: 'string' } } } } }, required: ['kind', 'summary'] } },
];

function simulate(debts: any[], strategy: string, extra: number) {
  const ds = debts.map(d => ({ name: d.name, bal: Number(d.balance), apr: Number(d.apr ?? 0), min: Number(d.min_payment ?? Math.max(25, d.balance * 0.02)) }))
    .sort((a, b) => strategy === 'snowball' ? a.bal - b.bal : b.apr - a.apr);
  let month = 0, interest = 0; const payoff: any[] = []; let roll = extra;
  while (ds.some(d => d.bal > 0.01) && month < 600) {
    month++; let pool = roll;
    for (const d of ds) if (d.bal > 0) { const i = d.bal * d.apr / 1200; interest += i; d.bal += i; const p = Math.min(d.bal, d.min); d.bal -= p; }
    for (const d of ds) if (d.bal > 0 && pool > 0) { const p = Math.min(d.bal, pool); d.bal -= p; pool -= p; }
    for (const d of ds) if (d.bal <= 0.01 && !payoff.find(p => p.name === d.name)) { payoff.push({ name: d.name, month }); roll += d.min; }
  }
  return { months: month, total_interest: Math.round(interest), payoff_order: payoff };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const f = await familyFor(req); const { db, family } = f;
  const { message } = await req.json();
  if (!await underLimit(db, family.id, 'advisor', 20)) return ok({ answer: 'You have reached today\u2019s limit for the money coach. It resets tomorrow.' });
  await db.from('advisor_messages').insert({ family_id: family.id, user_id: f.uid, role: 'user', content: message });
  const { data: hist } = await db.from('advisor_messages').select('role, content').eq('family_id', family.id).order('created_at', { ascending: false }).limit(16);
  const messages: any[] = (hist || []).reverse().map(m => ({ role: m.role, content: m.content }));
  const run = async (name: string, input: any) => {
    if (name === 'get_accounts') return (await db.from('accounts').select('institution,name,mask,type,subtype,balance,available,credit_limit,apr,min_payment,next_due').eq('family_id', family.id)).data;
    if (name === 'get_spending') { const { data } = await db.from('transactions').select('amount,category,merchant,date').eq('family_id', family.id).gte('date', input.from).lte('date', input.to).gt('amount', 0);
      const by: Record<string, number> = {}, merch: Record<string, number> = {}; for (const t of data || []) { by[t.category ?? 'OTHER'] = (by[t.category ?? 'OTHER'] ?? 0) + Number(t.amount); if (t.merchant) merch[t.merchant] = (merch[t.merchant] ?? 0) + Number(t.amount); }
      return { by_category: by, top_merchants: Object.entries(merch).sort((a, b) => b[1] - a[1]).slice(0, 10) }; }
    if (name === 'get_budget') { const month = f.today.slice(0, 7) + '-01'; return (await db.from('budgets').select('category,limit_amount').eq('family_id', family.id).eq('month', month)).data; }
    if (name === 'get_goals') return { goals: (await db.from('goals').select('*').eq('family_id', family.id).eq('area', 'money')).data, plans: (await db.from('money_plans').select('*').eq('family_id', family.id).order('created_at', { ascending: false }).limit(5)).data };
    if (name === 'simulate_payoff') { const { data } = await db.from('accounts').select('name,balance,apr,min_payment,type').eq('family_id', family.id).in('type', ['credit', 'loan']); return simulate((data || []).filter(d => !/mortgage/i.test(d.name)), input.strategy, input.extra_per_month); }
    if (name === 'save_plan') { await db.from('money_plans').insert({ family_id: family.id, kind: input.kind, plan: input });
      for (const r of input.reminders || []) await db.from('reminders').insert({ family_id: family.id, title: r.title, due_date: r.due_date, on_calendar: true, alert: '1d', source: 'advisor' }); return { saved: true }; }
    return { error: 'unknown tool' };
  };
  let r: any;
  for (let i = 0; i < 6; i++) {
    r = await claude({ system: SYSTEM(f.context), messages, tools, max_tokens: 1200 });
    if (r.stop_reason !== 'tool_use') break;
    messages.push({ role: 'assistant', content: r.content });
    const results = [];
    for (const b of r.content) if (b.type === 'tool_use') results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(await run(b.name, b.input)) });
    messages.push({ role: 'user', content: results });
  }
  const answer = text(r);
  await db.from('advisor_messages').insert({ family_id: family.id, role: 'assistant', content: answer });
  return ok({ answer });
});
