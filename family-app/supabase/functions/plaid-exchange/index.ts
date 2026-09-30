// Exchanges the public token from Plaid Link, stores the access token in Vault, then runs a first sync.
import { familyFor, ok, cors } from '../_shared/ctx.ts';
import { plaid } from '../_shared/plaid.ts';
import { syncItem } from '../plaid-webhook/sync.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const f = await familyFor(req); const { public_token, institution } = await req.json();
  const x = await plaid('/item/public_token/exchange', { public_token });
  const { data: secretId } = await f.db.rpc('vault_create_secret', { secret: x.access_token, name: 'plaid:' + x.item_id });
  const { data: item } = await f.db.from('plaid_items').insert({ family_id: f.family.id, item_id: x.item_id, institution, vault_secret_id: secretId }).select().single();
  await syncItem(f.db, item);
  return ok({ ok: true });
});
