const ENV = Deno.env.get('PLAID_ENV') ?? 'sandbox';
export async function plaid(path: string, body: Record<string, unknown>) {
  const r = await fetch('https://' + ENV + '.plaid.com' + path, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: Deno.env.get('PLAID_CLIENT_ID'), secret: Deno.env.get('PLAID_SECRET'), ...body }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error_message || 'plaid error'); return j;
}
