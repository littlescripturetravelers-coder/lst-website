import { useEffect, useState } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Text } from './text';
import { Button } from './button';
import { useTheme } from '@/theme/theme-provider';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { APP_NAME, STUDIO } from '@/lib/brand';
import { NestMark } from './nest-mark';
/** Email magic-link sign in. Both parents sign in to the same family (see supabase/seed.sql). */
export function SessionGate({ children }: { children: React.ReactNode }) {
  const { theme: t } = useTheme(); const [session, setSession] = useState<any>(undefined); const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  // On the web (Add to Home Screen), the emailed link opens in Safari, which keeps a separate sign-in from the Home Screen app, so the code in the same email is typed here instead.
  const [code, setCode] = useState(''); const [codeError, setCodeError] = useState('');
  useEffect(() => { if (!session) return; supabase.from('family_members').select('family_id, role').eq('user_id', session.user.id).maybeSingle().then(({ data }) => { if (!data) router.replace('/onboarding'); else if (data.role === 'daughter' || data.role === 'son') router.replace('/kid');
    // A parent's first sign-in lands on the questionnaire (once they've answered, it lives in Settings, Personalization).
    else supabase.from('member_profiles').select('user_id').eq('user_id', session.user.id).maybeSingle().then(({ data: p }) => { if (!p) router.replace({ pathname: '/setup', params: { first: '1' } }); }); }); }, [session?.user?.id]);
  // The emailed sign-in link opens the app (lewisfamily://… in the App Store version, exp://… in Expo Go) with #access_token=…&refresh_token=…; turn that into a session.
  const url = Linking.useURL();
  useEffect(() => { if (!url) return; const q = url.split('#')[1] ?? url.split('?')[1]; if (!q) return; const p = new URLSearchParams(q); const access_token = p.get('access_token'), refresh_token = p.get('refresh_token'); if (access_token && refresh_token) supabase.auth.setSession({ access_token, refresh_token }); }, [url]);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe(); }, []);
  if (session === undefined) return null;
  if (session) return <>{children}</>;
  return <View style={{ flex: 1, backgroundColor: t.brand[500], justifyContent: 'center', padding: 28, gap: 16 }}>
    <NestMark size={88} fg={t.ink.inverse} bg={t.brand[500]} light={t.onBrand.highlight} />
    <View><Text v="hero" color={t.ink.inverse}>{APP_NAME}</Text><Text v="footnote" weight="bold" color={t.ink.inverse} style={{ opacity: .8 }}>by {STUDIO}</Text></View><Text v="title3" color={t.ink.inverse}>Family, well kept.</Text><Text color={t.ink.inverse}>Your family’s calendar, reminders, ideas and faith, all in one place.</Text><View style={{ width: 48, height: 2, backgroundColor: t.onBrand.highlight }} />
    {sent && Platform.OS === 'web' ? <>
      <Text color={t.ink.inverse}>Check your email, then type the code from it here.</Text>
      <TextInput value={code} onChangeText={c => { setCode(c.replace(/\D/g, '')); setCodeError(''); }} placeholder="Code" keyboardType="number-pad" autoComplete="one-time-code" maxLength={10} placeholderTextColor={t.brand[200]} style={{ height: 48, borderRadius: 8, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,.1)', color: t.ink.inverse, fontSize: 17 }} />
      {codeError ? <Text color={t.ink.inverse}>{codeError}</Text> : null}
      <Button variant="cta" onBrand full title="Sign in" onPress={async () => { const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'email' }); if (error) setCodeError('That code didn’t work. Check it, or send a new one.'); }} />
      <Button variant="tinted" title="Send a new code" onPress={() => { setSent(false); setCode(''); setCodeError(''); }} />
    </> : sent ? <Text color={t.ink.inverse}>Check your email for a sign-in link.</Text> : <>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={t.brand[200]} style={{ height: 48, borderRadius: 8, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,.1)', color: t.ink.inverse, fontSize: 17 }} />
      <Button variant="cta" onBrand full title="Send sign-in link" onPress={async () => { await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL('/') } }); setSent(true); }} />
    </>}
  </View>;
}
