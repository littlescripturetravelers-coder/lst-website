import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, TextInput, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import type { LinkSuccess } from 'react-native-plaid-link-sdk';
import Constants from 'expo-constants';
// Plaid is a native module that isn't inside Expo Go (the free preview app), so it only loads in the App Store version.
const IN_EXPO_GO = Constants.executionEnvironment === 'storeClient';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Plaid: typeof import('react-native-plaid-link-sdk') | null = IN_EXPO_GO ? null : require('react-native-plaid-link-sdk');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { supabase, fn } from '@/lib/supabase';
import { useFamily } from '@/hooks/use-family';
const money = (n: number) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
/** Linked accounts (Plaid, read-only) + the advisor chat (supabase/functions/advisor). */
export default function Advisor() {
  const { theme: t } = useTheme(); const { family } = useFamily();
  const [accts, setAccts] = useState<any[]>([]); const [linkToken, setLinkToken] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([]); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const scroll = useRef<ScrollView>(null);
  const load = async () => { if (!family) return; setAccts((await supabase.from('accounts').select('*').eq('family_id', family.id)).data || []); setMsgs(((await supabase.from('advisor_messages').select('role, content').eq('family_id', family.id).order('created_at').limit(40)).data) || []); };
  useEffect(() => { load(); fn('plaid-link-token').then(r => setLinkToken(r.link_token)).catch(() => {}); }, [family?.id]);
  const ask = async (text: string) => { if (!text.trim()) return; setQ(''); setMsgs(m => [...m, { role: 'user', content: text }]); setBusy(true);
    try { const r = await fn('advisor', { message: text }); setMsgs(m => [...m, { role: 'assistant', content: r.answer }]); } finally { setBusy(false); setTimeout(() => scroll.current?.scrollToEnd(), 50); } };
  const cash = accts.filter(a => a.type === 'depository' || a.type === 'investment').reduce((s, a) => s + Number(a.balance || 0), 0), owe = accts.filter(a => a.type === 'credit' || a.type === 'loan').reduce((s, a) => s + Number(a.balance || 0), 0);
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.paper[1] }}><KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
    <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}><Text v="largeTitle" style={{ flex: 1 }}>Money advisor</Text><Text color={t.brand[500]} onPress={() => router.back()}>More</Text></View>
      <View style={{ flexDirection: 'row', gap: 8 }}><Card style={{ flex: 1 }} padding={12}><Text v="footnote" color={t.ink[3]}>Cash & savings</Text><Text v="title2">{money(cash)}</Text></Card><Card style={{ flex: 1 }} padding={12}><Text v="footnote" color={t.ink[3]}>Owed</Text><Text v="title2">{money(owe)}</Text></Card></View>
      <Card padding={0}>{accts.map((a, i) => <ListRow key={a.id} icon={a.type === 'credit' ? 'credit-card' : a.type === 'loan' ? 'landmark' : 'wallet'} iconColor={a.type === 'credit' ? t.danger[0] : a.type === 'loan' ? t.area.home[0] : t.area.money[0]}
        title={a.name} subtitle={a.institution + ' ••' + a.mask + (a.apr ? ' · ' + a.apr + '% APR' : '') + (a.min_payment ? ' · min ' + money(a.min_payment) : '')} value={money(Number(a.balance || 0))} divider={i < accts.length - 1} />)}</Card>
      {IN_EXPO_GO && <Text v="footnote" color={t.ink[3]}>Linking banks works in the App Store version of the app.</Text>}
      {linkToken && Plaid && <Plaid.PlaidLink tokenConfig={{ token: linkToken }} onSuccess={async (s: LinkSuccess) => { await fn('plaid-exchange', { public_token: s.publicToken, institution: s.metadata.institution?.name }); load(); }}>
        <Button full variant="secondary" icon="link" title="Link a bank, card or loan" /></Plaid.PlaidLink>}
      {msgs.map((m, i) => <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: 12, borderRadius: 14, backgroundColor: m.role === 'user' ? t.brand[500] : t.paper[0], borderWidth: m.role === 'user' ? 0 : 1, borderColor: t.line[1] }}>
        <Text v="callout" color={m.role === 'user' ? t.ink.inverse : t.ink[1]}>{m.content}</Text></View>)}
      {busy && <Text color={t.ink[3]}>Looking at your accounts…</Text>}
      {!msgs.length && ['What’s the fastest way out of debt?', 'Can we afford a $2,000 trip in June?', 'How big should our emergency fund be?', 'Where are we overspending this month?'].map(p => <Pressable key={p} onPress={() => ask(p)} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.line[2], backgroundColor: t.paper[0] }}><Text weight="bold">{p}</Text></Pressable>)}
      <Text v="caption" color={t.ink[3]}>For education and planning. For investments, taxes or legal questions, check with a licensed professional. Access is read-only.</Text>
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: .5, borderColor: t.line[2], backgroundColor: t.paper[1] }}>
      <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => ask(q)} placeholder="Ask about your money…" placeholderTextColor={t.ink[4]} style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 16, fontSize: 16, fontFamily: t.font.body, color: t.ink[1], backgroundColor: t.paper[0] }} />
      <Pressable onPress={() => ask(q)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.brand[500], alignItems: 'center', justifyContent: 'center' }}><Icon name="arrow-up" color={t.ink.inverse} /></Pressable>
    </View>
  </KeyboardAvoidingView></SafeAreaView>;
}
