import { useEffect, useState } from 'react';
import { View, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Text } from './text';
import { Button } from './button';
import { useTheme } from '@/theme/theme-provider';
import { router } from 'expo-router';
import { APP_NAME } from '@/lib/brand';
/** Email magic-link sign in. Both parents sign in to the same family (see supabase/seed.sql). */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { theme: t } = useTheme(); const [session, setSession] = useState<any>(undefined); const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  useEffect(() => { if (!session) return; supabase.from('family_members').select('family_id, role').eq('user_id', session.user.id).maybeSingle().then(({ data }) => { if (!data) router.replace('/onboarding'); else if (data.role === 'daughter' || data.role === 'son') router.replace('/kid'); }); }, [session?.user?.id]);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe(); }, []);
  if (session === undefined) return null;
  if (session) return <>{children}</>;
  return <View style={{ flex: 1, backgroundColor: t.brand[500], justifyContent: 'center', padding: 28, gap: 16 }}>
    <Text v="hero" color={t.ink.inverse}>{APP_NAME}</Text><Text color={t.ink.inverse}>Your family’s calendar, reminders, ideas and faith, all in one place.</Text><View style={{ width: 48, height: 2, backgroundColor: t.gold[600] }} />
    {sent ? <Text color={t.ink.inverse}>Check your email for a sign-in link.</Text> : <>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={t.brand[200]} style={{ height: 48, borderRadius: 8, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,.1)', color: t.ink.inverse, fontSize: 17 }} />
      <Button variant="cta" full title="Send sign-in link" onPress={async () => { await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'lewisfamily://' } }); setSent(true); }} />
    </>}
  </View>;
}
