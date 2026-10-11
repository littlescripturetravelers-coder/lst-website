import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
// The shared keychain group (so Siri can read the session) only exists in the App Store build; Expo Go isn't allowed to use it.
const KEYCHAIN = Constants.executionEnvironment === 'storeClient' ? {} : { accessGroup: 'group.com.lewisfamily.app' };
const storage = { getItem: (k: string) => SecureStore.getItemAsync(k), setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v, KEYCHAIN), removeItem: (k: string) => SecureStore.deleteItemAsync(k) };
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
// Mirror the session to a fixed keychain item so the Siri App Intents can read it.
supabase.auth.onAuthStateChange((_e, session) => { session ? SecureStore.setItemAsync('sb-session', JSON.stringify(session), KEYCHAIN).catch(() => {}) : SecureStore.deleteItemAsync('sb-session'); });
/** Call an Edge Function with the signed-in user's JWT. */
export async function fn<T = any>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as any });
  if (error) throw error; return data as T;
}
