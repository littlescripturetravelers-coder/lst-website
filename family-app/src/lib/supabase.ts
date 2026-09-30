import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
const storage = { getItem: (k: string) => SecureStore.getItemAsync(k), setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v, { accessGroup: 'group.com.lewisfamily.app' }), removeItem: (k: string) => SecureStore.deleteItemAsync(k) };
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
// Mirror the session to a fixed keychain item so the Siri App Intents can read it.
supabase.auth.onAuthStateChange((_e, session) => { session ? SecureStore.setItemAsync('sb-session', JSON.stringify(session), { accessGroup: 'group.com.lewisfamily.app' }) : SecureStore.deleteItemAsync('sb-session'); });
/** Call an Edge Function with the signed-in user's JWT. */
export async function fn<T = any>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as any });
  if (error) throw error; return data as T;
}
