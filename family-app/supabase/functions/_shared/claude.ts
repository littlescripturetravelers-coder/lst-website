// All AI goes through here. Model names are configurable so they can be upgraded without code changes.
// Cost rule: every feature defaults to the low-cost model. Raise a model only with the owner's OK.
const KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
export const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-haiku-4-5';
export const MODEL_FAST = Deno.env.get('CLAUDE_MODEL_FAST') ?? 'claude-haiku-4-5';
export type Msg = { role: 'user' | 'assistant'; content: any };
export async function claude(opts: { system: string; messages: Msg[]; tools?: any[]; model?: string; max_tokens?: number; stream?: boolean }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: opts.model ?? MODEL, max_tokens: opts.max_tokens ?? 1500, system: opts.system, messages: opts.messages, tools: opts.tools, stream: opts.stream }),
  });
  if (!res.ok) throw new Error('Claude ' + res.status + ': ' + await res.text());
  return opts.stream ? res : res.json();
}
export const text = (r: any) => (r.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
export function json<T = any>(s: string): T { return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); }
