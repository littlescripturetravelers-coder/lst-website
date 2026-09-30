import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { palette } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeChoice = { preset: string; brand: string; highlight: string; paper: string; ink: string; display: DisplayFont; ui: UiFont; mode?: ThemeMode; textScale?: number };
export type DisplayFont = 'fredoka' | 'youngSerif' | 'lora' | 'nunito';
export type UiFont = 'nunito' | 'figtree' | 'atkinson' | 'system';
export const PRESETS: ThemeChoice[] = [
  { preset: 'evening', brand: '#1B2D5F', highlight: '#F5C518', paper: '#F4EFE6', ink: '#1B2D5F', display: 'fredoka', ui: 'nunito' },
  { preset: 'clay', brand: '#A8502F', highlight: '#F2B84B', paper: '#FAF6EF', ink: '#2A211B', display: 'fredoka', ui: 'nunito' },
  { preset: 'sage', brand: '#355845', highlight: '#E9C46A', paper: '#F2F0E8', ink: '#1F2E26', display: 'fredoka', ui: 'nunito' },
  { preset: 'plum', brand: '#4E3563', highlight: '#F0B37E', paper: '#F6F1EE', ink: '#2B2135', display: 'fredoka', ui: 'nunito' },
];
const FONT = {
  display: { fredoka: ['Fredoka_600SemiBold', 'Fredoka_700Bold'], youngSerif: ['YoungSerif_400Regular', 'YoungSerif_400Regular'], lora: ['Lora_600SemiBold', 'Lora_700Bold'], nunito: ['Nunito_800ExtraBold', 'Nunito_800ExtraBold'] },
  ui: { nunito: ['Nunito_400Regular', 'Nunito_700Bold', 'Nunito_800ExtraBold'], figtree: ['Figtree_400Regular', 'Figtree_700Bold', 'Figtree_800ExtraBold'], atkinson: ['AtkinsonHyperlegible_400Regular', 'AtkinsonHyperlegible_700Bold', 'AtkinsonHyperlegible_700Bold'], system: ['System', 'System', 'System'] },
} as const;
// oklch-ish mixing approximated in sRGB — good enough for tints/shades.
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, p: number) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v * p + B[i] * (1 - p))); };

export function buildTheme(t: ThemeChoice, systemDark = false) {
  const B = t.brand, H = t.highlight, P = t.paper, I = t.ink;
  const dark = t.mode === 'dark' || (t.mode === 'auto' && systemDark);
  const scale = t.textScale ?? 1;
  if (dark) {
    const bg = mix(B, '#070a14', .42), card = mix(B, '#0b0f1c', .55), light = mix(P, B, .94);
    const areaDark = Object.fromEntries(Object.entries(palette.area).map(([k, [c]]) => [k, [c, mix(c, bg, .24)]])) as any;
    return {
      choice: t, dark: true, scale, highlightInk: bg,
      brand: { 50: mix(B, '#141a2e', .6), 100: mix(B, '#1c2440', .7), 200: mix(B, '#ffffff', .6), 300: mix(B, '#ffffff', .45), 400: mix(B, '#ffffff', .35), 500: mix(B, '#ffffff', .3), 600: mix(B, '#ffffff', .22), 700: mix(B, '#ffffff', .15) },
      gold: { 50: mix(H, bg, .16), 100: mix(H, bg, .3), 500: H, 600: mix(H, '#000000', .82) },
      paper: { 0: card, 1: bg, 2: mix(B, '#0a0d18', .48), 3: mix(B, '#1a2033', .62) },
      ink: { 1: light, 2: mix(light, bg, .82), 3: mix(light, bg, .64), 4: mix(light, bg, .42), inverse: bg },
      line: { 1: mix(B, '#20283d', .62), 2: mix(B, '#2a3350', .66) },
      teal: '#0E6A72', area: areaDark, success: ['#7CC79B', '#1f3a2c'], warning: ['#F0B57A', '#3d2a1a'], danger: ['#F08A7E', '#3d1f1c'],
      font: fontsFor(t),
    };
  }
  return {
    choice: t, dark: false, scale, highlightInk: B,
    brand: { 50: mix(B, '#ffffff', .07), 100: mix(B, '#ffffff', .14), 200: mix(B, '#ffffff', .3), 300: mix(B, '#ffffff', .5), 400: mix(B, '#ffffff', .72), 500: B, 600: mix(B, '#000000', .85), 700: mix(B, '#000000', .7) },
    gold: { 50: mix(H, '#ffffff', .14), 100: mix(H, '#ffffff', .3), 500: H, 600: mix(H, '#000000', .82) },
    paper: { 0: '#FFFFFF', 1: P, 2: mix(P, I, .92), 3: mix(P, I, .84) },
    ink: { 1: I, 2: mix(I, P, .82), 3: mix(I, P, .64), 4: mix(I, P, .4), inverse: P },
    line: { 1: mix(P, I, .9), 2: mix(P, I, .84) },
    teal: palette.teal, area: palette.area, success: palette.success, warning: palette.warning, danger: palette.danger,
    font: fontsFor(t),
  };
}
const fontsFor = (t: ThemeChoice) => ({ display: FONT.display[t.display][0], displayBold: FONT.display[t.display][1], body: FONT.ui[t.ui][0], bold: FONT.ui[t.ui][1], heavy: FONT.ui[t.ui][2], shout: 'Anton_400Regular' });
export type Theme = ReturnType<typeof buildTheme>;
const Ctx = createContext<{ theme: Theme; setChoice: (c: ThemeChoice) => void }>({ theme: buildTheme(PRESETS[0]), setChoice: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>({ ...PRESETS[0], mode: 'auto', textScale: 1 });
  const systemDark = useColorScheme() === 'dark';
  useEffect(() => { AsyncStorage.getItem('theme').then(v => v && setChoice(JSON.parse(v))); }, []);
  const value = useMemo(() => ({ theme: buildTheme(choice, systemDark), setChoice: (c: ThemeChoice) => { setChoice(c); AsyncStorage.setItem('theme', JSON.stringify(c)); } }), [choice, systemDark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
