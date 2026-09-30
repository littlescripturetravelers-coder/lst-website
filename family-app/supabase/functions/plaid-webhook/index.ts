import { admin, ok } from '../_shared/ctx.ts';
import { syncItem } from './sync.ts';
// Plaid posts SYNC_UPDATES_AVAILABLE / DEFAULT_UPDATE; cron posts CRON_REFRESH. In production verify Plaid's signed JWT header (/webhook_verification_key/get).
Deno.serve(async req => {
  const db = admin(); const b = await req.json().catch(() => ({}));
  const q = db.from('plaid_items').select('*'); const { data: items } = b.item_id ? await q.eq('item_id', b.item_id) : await q;
  for (const it of items || []) await syncItem(db, it).catch(async e => { console.error(e); await db.from('plaid_items').update({ status: 'error' }).eq('id', it.id); });
  return ok({ ok: true });
});
