// App-level naming. The store name is generic; inside, the app wears each family's name.
import Constants from 'expo-constants';
import type { Family } from './family';
export const APP_NAME: string = (Constants.expoConfig?.extra as any)?.appName ?? 'Our Family';
/** The studio that makes NestWork. Shown as the byline "NestWork — by Lewy’s Family Studio" (sign-in screen, Settings → About, web page, brand book). */
export const STUDIO = 'Lewy’s Family Studio';
/** Names the app used before (its own Apple calendar was made with these), so that calendar is found and renamed instead of duplicated. */
export const OLD_APP_NAMES = ['Lewis Family'];
/** "The Lewis's" — uses the family's own display name if they set one. */
export const familyTitle = (f?: (Family & { display_name?: string }) | null) => f?.display_name || (f ? 'The ' + f.surname + '’s' : APP_NAME);
/** "the girls" / "the boys" / "the kids" / "Mayble" — so copy reads right for every family. */
export function kidsLabel(f?: Family | null) {
  const k = f?.members.filter(m => m.role === 'daughter' || m.role === 'son') ?? [];
  if (k.length === 1) return k[0].name;
  if (k.length && k.every(m => m.role === 'daughter')) return 'the girls';
  if (k.length && k.every(m => m.role === 'son')) return 'the boys';
  return 'the kids';
}
export const pronoun = (sex?: 'm' | 'f') => sex === 'm' ? { she: 'he', her: 'him', hers: 'his' } : { she: 'she', her: 'her', hers: 'her' };
