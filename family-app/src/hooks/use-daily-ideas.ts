import { useEffect, useState } from 'react';
import { fn } from '@/lib/supabase';
export type Idea = { id: string; kind: 'couple' | 'girls'; title: string; meta?: string; why?: string; icon?: string; min_age?: number | null; steps?: string[]; attachments?: { type: string; title: string; meta?: string; body: string[] }[] };
/** Today's ideas (generated nightly on the server). "More ideas" asks for another round for the same day. */
export function useDailyIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]); const [round, setRound] = useState(0); const [loading, setLoading] = useState(false);
  const load = async (r: number) => { setLoading(true); try { setIdeas(await fn<Idea[]>('daily-ideas', { round: r })); } finally { setLoading(false); } };
  useEffect(() => { load(0); }, []);
  return { couple: ideas.filter(i => i.kind === 'couple'), girls: ideas.filter(i => i.kind === 'girls'), loading, more: () => { const r = round + 1; setRound(r); load(r); } };
}
