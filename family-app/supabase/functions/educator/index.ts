// Proxies the Family Life Educator chatbot (running in a WebView) to Claude, streaming text back as SSE.
// The chatbot's own system prompt travels in its first message; we add current family context.
import { familyFor, cors } from '../_shared/ctx.ts';
import { claude, MODEL } from '../_shared/claude.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const f = await familyFor(req);
  const { messages, deep } = await req.json();
  const res = await claude({ system: 'Current family (use for personalization): ' + JSON.stringify(f.context), messages, stream: true, max_tokens: deep ? 8000 : 3000, model: Deno.env.get(deep ? 'CLAUDE_MODEL_DEEP' : 'CLAUDE_MODEL') ?? MODEL }) as Response;
  return new Response(res.body, { headers: { ...cors, 'content-type': 'text/event-stream' } });
});
