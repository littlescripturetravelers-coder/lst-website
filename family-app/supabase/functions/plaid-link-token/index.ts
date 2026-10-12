import { familyFor, ok, cors } from '../_shared/ctx.ts';
import { plaid } from '../_shared/plaid.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const f = await familyFor(req);
  const j = await plaid('/link/token/create', { user: { client_user_id: f.uid }, client_name: 'NestWork', language: 'en', country_codes: ['US'],
    products: ['transactions'], required_if_supported_products: ['liabilities'], optional_products: ['investments'],
    webhook: Deno.env.get('SUPABASE_URL') + '/functions/v1/plaid-webhook' });
  return ok({ link_token: j.link_token });
});
