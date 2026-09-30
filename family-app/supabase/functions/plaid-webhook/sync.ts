import { plaid } from '../_shared/plaid.ts';
export async function accessToken(db: any, item: any) { const { data } = await db.rpc('vault_read_secret', { id: item.vault_secret_id }); return data as string; }
/** Pulls balances, liabilities (APR, minimums, due dates) and new transactions for one Plaid item. */
export async function syncItem(db: any, item: any) {
  const token = await accessToken(db, item);
  const bal = await plaid('/accounts/balance/get', { access_token: token });
  let liab: any = null; try { liab = await plaid('/liabilities/get', { access_token: token }); } catch (_) { /* not every institution supports liabilities */ }
  const credit = new Map((liab?.liabilities?.credit || []).map((c: any) => [c.account_id, c]));
  const student = new Map((liab?.liabilities?.student || []).map((s: any) => [s.account_id, s]));
  const mortgage = new Map((liab?.liabilities?.mortgage || []).map((m: any) => [m.account_id, m]));
  for (const a of bal.accounts) {
    const c: any = credit.get(a.account_id), s: any = student.get(a.account_id), m: any = mortgage.get(a.account_id);
    const apr = c?.aprs?.find((x: any) => x.apr_type === 'purchase_apr')?.apr_percentage ?? s?.interest_rate_percentage ?? m?.interest_rate?.percentage ?? null;
    await db.from('accounts').upsert({
      family_id: item.family_id, plaid_item: item.id, plaid_account_id: a.account_id, institution: item.institution, name: a.official_name || a.name, mask: a.mask,
      type: a.type, subtype: a.subtype, balance: a.balances.current, available: a.balances.available, credit_limit: a.balances.limit, apr,
      min_payment: c?.minimum_payment_amount ?? s?.minimum_payment_amount ?? m?.next_monthly_payment ?? null,
      next_due: c?.next_payment_due_date ?? s?.next_payment_due_date ?? m?.next_payment_due_date ?? null, updated_at: new Date().toISOString(),
    }, { onConflict: 'plaid_account_id' });
  }
  const { data: accts } = await db.from('accounts').select('id, plaid_account_id').eq('plaid_item', item.id);
  const idOf = new Map((accts || []).map((a: any) => [a.plaid_account_id, a.id]));
  let cursor = item.cursor, more = true;
  while (more) {
    const t = await plaid('/transactions/sync', { access_token: token, cursor: cursor ?? undefined, count: 500 });
    const up = [...t.added, ...t.modified].map((x: any) => ({ family_id: item.family_id, account_id: idOf.get(x.account_id), plaid_txn_id: x.transaction_id, date: x.date, name: x.name,
      merchant: x.merchant_name, amount: x.amount, category: x.personal_finance_category?.primary ?? null, pending: x.pending }));
    if (up.length) await db.from('transactions').upsert(up, { onConflict: 'plaid_txn_id' });
    if (t.removed.length) await db.from('transactions').delete().in('plaid_txn_id', t.removed.map((r: any) => r.transaction_id));
    cursor = t.next_cursor; more = t.has_more;
  }
  await db.from('plaid_items').update({ cursor, updated_at: new Date().toISOString(), status: 'good' }).eq('id', item.id);
}
