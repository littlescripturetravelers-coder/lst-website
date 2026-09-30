// One membership covers the whole family (both spouses). Free during early access; when PAYWALL_ENABLED is on, RevenueCat decides.
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
export const PAYWALL_ENABLED = !!(Constants.expoConfig?.extra as any)?.paywallEnabled;
export function useMembership(familyId?: string) {
  const [plan, setPlan] = useState<'early_access' | 'trial' | 'active' | 'expired' | 'comped'>('early_access');
  useEffect(() => { if (familyId) supabase.from('families').select('plan').eq('id', familyId).single().then(({ data }) => data && setPlan(data.plan)); }, [familyId]);
  const hasAccess = !PAYWALL_ENABLED || ['early_access', 'trial', 'active', 'comped'].includes(plan);
  return { plan, hasAccess, paywallEnabled: PAYWALL_ENABLED };
}
// Launch checklist: add react-native-purchases (RevenueCat), create "family" entitlement + monthly/yearly products in App Store Connect,
// configure Purchases with the Supabase family_id as appUserID (so both spouses share it), add a RevenueCat webhook → Edge Function that updates families.plan.
