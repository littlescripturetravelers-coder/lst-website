import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { palette } from './tokens';
import { loadFonts } from './fonts';

/** Background looks: Light (white), Dark (black), Traditional navy, Gray, Tan, or Match iPhone (Light by day, Dark at night). */
export type ThemeMode = 'light' | 'dark' | 'navy' | 'gray' | 'tan' | 'auto';
export const LOOKS: [ThemeMode, string, string][] = [['light', 'Light', '#FFFFFF'], ['dark', 'Dark', '#000000'], ['navy', 'Traditional navy', '#1B2D5F'], ['gray', 'Gray', '#E6E8EC'], ['tan', 'Tan', '#F4EFE6'], ['auto', 'Match iPhone', '']];
const LOOK_PAPER: Partial<Record<ThemeMode, string>> = { light: '#FFFFFF', gray: '#E6E8EC' }; // tan uses the theme's own warm paper (linen for the default theme)
/** label: the name shown in Settings (signature looks). brandOnly: a one-color brand (NestWork) — cards and lines are tints of the main color,
 * titles and labels use it, and anything that would sit "highlight on main color" turns white instead, so nothing ever disappears. */
export type ThemeChoice = { preset: string; brand: string; highlight: string; paper: string; ink: string; display: DisplayFont; ui: UiFont; mode?: ThemeMode; textScale?: number; label?: string; brandOnly?: boolean };
export type DisplayFont = 'fraunces' | 'fredoka' | 'youngSerif' | 'lora' | 'nunito' | 'playfair' | 'merriweather' | 'dmSerif' | 'poppins' | 'quicksand' | 'comfortaa' | 'raleway' | 'montserrat' | 'caveat' | 'pacifico';
export type UiFont = 'nunito' | 'figtree' | 'atkinson' | 'system' | 'inter' | 'lato' | 'openSans' | 'sourceSans' | 'workSans' | 'poppins' | 'quicksand' | 'raleway' | 'montserrat' | 'merriweather';
// NestWork is the default look: the LST colors and fonts (navy, gold and linen; Fredoka, Nunito and Anton), which is also the app's original look.
// Coral is the coral-and-white look (Fraunces + Figtree), kept as a one-tap choice. Preset keys are stored on phones: never rename them.
export const NESTWORK: ThemeChoice = { preset: 'evening', label: 'NestWork', brand: '#1B2D5F', highlight: '#F5C518', paper: '#F4EFE6', ink: '#1B2D5F', display: 'fredoka', ui: 'nunito', mode: 'tan' };
export const CORAL: ThemeChoice = { preset: 'nestwork', label: 'Coral', brandOnly: true, brand: '#F2665A', highlight: '#F2665A', paper: '#FFFFFF', ink: '#3A3A3C', display: 'fraunces', ui: 'figtree', mode: 'light' };
export const PRESETS: ThemeChoice[] = [
  NESTWORK, CORAL,
  { preset: 'clay', brand: '#A8502F', highlight: '#F2B84B', paper: '#FAF6EF', ink: '#2A211B', display: 'fredoka', ui: 'nunito' },
  { preset: 'sage', brand: '#355845', highlight: '#E9C46A', paper: '#F2F0E8', ink: '#1F2E26', display: 'fredoka', ui: 'nunito' },
  { preset: 'plum', brand: '#4E3563', highlight: '#F0B37E', paper: '#F6F1EE', ink: '#2B2135', display: 'fredoka', ui: 'nunito' },
  { preset: 'ocean', brand: '#1F5F8B', highlight: '#F6C453', paper: '#F1F6F9', ink: '#13293D', display: 'fredoka', ui: 'nunito' },
  { preset: 'forest', brand: '#2F5233', highlight: '#E9C46A', paper: '#F1F3EC', ink: '#1C2B1E', display: 'fredoka', ui: 'nunito' },
  { preset: 'rose', brand: '#9E3D5C', highlight: '#F4B9B2', paper: '#FBF3F3', ink: '#2E1A22', display: 'fredoka', ui: 'nunito' },
  { preset: 'sunset', brand: '#C2552D', highlight: '#F7B267', paper: '#FBF4EC', ink: '#2B1A12', display: 'fredoka', ui: 'nunito' },
  { preset: 'slate', brand: '#3F4E63', highlight: '#7FD1CC', paper: '#F1F3F6', ink: '#1D2430', display: 'fredoka', ui: 'nunito' },
  { preset: 'berry', brand: '#6B2D5C', highlight: '#F2A65A', paper: '#F8F1F5', ink: '#2A1424', display: 'fredoka', ui: 'nunito' },
  { preset: 'mocha', brand: '#6B4A3A', highlight: '#E3B778', paper: '#F6F0EA', ink: '#2B1F18', display: 'fredoka', ui: 'nunito' },
  { preset: 'teal', brand: '#1E6F72', highlight: '#F4D35E', paper: '#EEF6F5', ink: '#14302F', display: 'fredoka', ui: 'nunito' },
  { preset: 'lavender', brand: '#6A5A9E', highlight: '#F7C59F', paper: '#F5F3FA', ink: '#24203A', display: 'fredoka', ui: 'nunito' },
  { preset: 'mint', brand: '#2F7A63', highlight: '#F2CC8F', paper: '#EFF7F2', ink: '#173229', display: 'fredoka', ui: 'nunito' },
  { preset: 'coral', brand: '#C2504E', highlight: '#FFD166', paper: '#FDF4F1', ink: '#3A1F1E', display: 'fredoka', ui: 'nunito' },
  { preset: 'charcoal', brand: '#2E2E33', highlight: '#E4B363', paper: '#F3F3F2', ink: '#1A1A1E', display: 'fredoka', ui: 'nunito' },
  { preset: 'gold', brand: '#7A5E14', highlight: '#F5C518', paper: '#FAF6EA', ink: '#2A2210', display: 'fredoka', ui: 'nunito' },
  { preset: 'sky', brand: '#2F6E96', highlight: '#FFC857', paper: '#F2F7FB', ink: '#16324A', display: 'fredoka', ui: 'nunito' },
  { preset: 'cranberry', brand: '#8E1B32', highlight: '#F4C95D', paper: '#FAF2F2', ink: '#2D0F16', display: 'fredoka', ui: 'nunito' },
  { preset: 'olive', brand: '#5B6B2E', highlight: '#E9A23B', paper: '#F4F4EA', ink: '#24291A', display: 'fredoka', ui: 'nunito' },
];
export const ACCENTS = ['#1B2D5F', '#2E6E8E', '#1F5F8B', '#2F6E96', '#1E6F72', '#2F7A63', '#355845', '#2F5233', '#5B6B2E', '#7A5E14', '#6B4A3A', '#A8502F',
  '#C2552D', '#C2504E', '#B5536B', '#9E3D5C', '#8E1B32', '#6B2D5C', '#4E3563', '#6A5A9E', '#3F4E63', '#2E2E33', '#0E5A7A', '#5C3D8A'];
export const HIGHLIGHTS = ['#F5C518', '#FFD166', '#F4D35E', '#E9C46A', '#F6C453', '#FFC857', '#E4B363', '#F2B84B', '#E9A23B', '#F7B267', '#F0B37E',
  '#F2A65A', '#F7C59F', '#F4B9B2', '#F2CC8F', '#5BD3DC', '#7FD1CC', '#A3D9A5'];
/** Font choices shown in Settings: [key, name]. */
export const DISPLAY_FONTS: [DisplayFont, string][] = [['fraunces', 'Fraunces'], ['fredoka', 'Fredoka'], ['youngSerif', 'Young Serif'], ['lora', 'Lora'], ['nunito', 'Nunito'], ['playfair', 'Playfair Display'],
  ['merriweather', 'Merriweather'], ['dmSerif', 'DM Serif'], ['poppins', 'Poppins'], ['quicksand', 'Quicksand'], ['comfortaa', 'Comfortaa'], ['raleway', 'Raleway'], ['montserrat', 'Montserrat'],
  ['caveat', 'Caveat (handwritten)'], ['pacifico', 'Pacifico (script)']];
export const UI_FONTS: [UiFont, string][] = [['nunito', 'Nunito'], ['figtree', 'Figtree'], ['atkinson', 'Atkinson Hyperlegible (easiest to read)'], ['system', 'iPhone system'], ['inter', 'Inter'],
  ['lato', 'Lato'], ['openSans', 'Open Sans'], ['sourceSans', 'Source Sans'], ['workSans', 'Work Sans'], ['poppins', 'Poppins'], ['quicksand', 'Quicksand'], ['raleway', 'Raleway'],
  ['montserrat', 'Montserrat'], ['merriweather', 'Merriweather']];
/** Font file names for each choice: display = [semibold, bold], ui = [regular, bold, heavy]. */
export const FONT_NAMES = {
  display: { fraunces: ['Fraunces_600SemiBoldSoft', 'Fraunces_700BoldSoft'], fredoka: ['Fredoka_600SemiBold', 'Fredoka_700Bold'], youngSerif: ['YoungSerif_400Regular', 'YoungSerif_400Regular'], lora: ['Lora_600SemiBold', 'Lora_700Bold'], nunito: ['Nunito_800ExtraBold', 'Nunito_800ExtraBold'],
    playfair: ['PlayfairDisplay_600SemiBold', 'PlayfairDisplay_700Bold'], merriweather: ['Merriweather_700Bold', 'Merriweather_700Bold'], dmSerif: ['DMSerifDisplay_400Regular', 'DMSerifDisplay_400Regular'],
    poppins: ['Poppins_600SemiBold', 'Poppins_700Bold'], quicksand: ['Quicksand_600SemiBold', 'Quicksand_700Bold'], comfortaa: ['Comfortaa_600SemiBold', 'Comfortaa_700Bold'],
    raleway: ['Raleway_700Bold', 'Raleway_800ExtraBold'], montserrat: ['Montserrat_700Bold', 'Montserrat_800ExtraBold'], caveat: ['Caveat_600SemiBold', 'Caveat_700Bold'], pacifico: ['Pacifico_400Regular', 'Pacifico_400Regular'] },
  ui: { nunito: ['Nunito_400Regular', 'Nunito_700Bold', 'Nunito_800ExtraBold'], figtree: ['Figtree_400Regular', 'Figtree_700Bold', 'Figtree_800ExtraBold'], atkinson: ['AtkinsonHyperlegible_400Regular', 'AtkinsonHyperlegible_700Bold', 'AtkinsonHyperlegible_700Bold'], system: ['System', 'System', 'System'],
    inter: ['Inter_400Regular', 'Inter_700Bold', 'Inter_800ExtraBold'], lato: ['Lato_400Regular', 'Lato_700Bold', 'Lato_700Bold'], openSans: ['OpenSans_400Regular', 'OpenSans_700Bold', 'OpenSans_800ExtraBold'],
    sourceSans: ['SourceSans3_400Regular', 'SourceSans3_700Bold', 'SourceSans3_800ExtraBold'], workSans: ['WorkSans_400Regular', 'WorkSans_700Bold', 'WorkSans_800ExtraBold'],
    poppins: ['Poppins_400Regular', 'Poppins_700Bold', 'Poppins_800ExtraBold'], quicksand: ['Quicksand_400Regular', 'Quicksand_700Bold', 'Quicksand_700Bold'],
    raleway: ['Raleway_400Regular', 'Raleway_700Bold', 'Raleway_800ExtraBold'], montserrat: ['Montserrat_400Regular', 'Montserrat_700Bold', 'Montserrat_800ExtraBold'],
    merriweather: ['Merriweather_400Regular', 'Merriweather_700Bold', 'Merriweather_700Bold'] },
} as const;
const FONT = FONT_NAMES;
// oklch-ish mixing approximated in sRGB — good enough for tints/shades.
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, p: number) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v * p + B[i] * (1 - p))); };
/** What sits on the main color (inverse cards, the sign-in screen): eyebrow accent, highlight and the text on a highlight button. */
const onBrandFor = (t: ThemeChoice, accent: string, highlightInk: string, inverse: string, brand: string) =>
  t.brandOnly ? { accent: inverse, highlight: inverse, highlightInk: brand } : { accent, highlight: t.highlight, highlightInk };

export function buildTheme(t: ThemeChoice, systemDark = false) {
  const look: ThemeMode = t.mode === 'auto' ? (systemDark ? 'dark' : 'light') : t.mode ?? 'tan';
  const B = t.brand, H = t.highlight, P = LOOK_PAPER[look] ?? t.paper, I = t.ink;
  const scale = t.textScale ?? 1;
  if (look === 'dark') {
    // True black, like iPhone dark mode.
    const bg = '#000000', light = '#F2F2F7';
    const areaDark = Object.fromEntries(Object.entries(palette.area).map(([k, [c]]) => [k, [c, mix(c, bg, .26)]])) as any;
    return {
      choice: t, dark: true, scale, highlightInk: bg,
      brand: { 50: mix(B, '#000000', .3), 100: mix(B, '#000000', .42), 200: mix(B, '#ffffff', .6), 300: mix(B, '#ffffff', .45), 400: mix(B, '#ffffff', .35), 500: mix(B, '#ffffff', .3), 600: mix(B, '#ffffff', .22), 700: mix(B, '#ffffff', .15) },
      gold: { 50: mix(H, bg, .16), 100: mix(H, bg, .3), 500: H, 600: mix(H, '#000000', .82) },
      paper: { 0: '#1C1C1E', 1: bg, 2: '#2C2C2E', 3: '#3A3A3C' },
      ink: { 1: light, 2: mix(light, bg, .8), 3: mix(light, bg, .6), 4: mix(light, bg, .4), inverse: bg, title: light, label: mix(light, bg, .6) },
      line: { 1: '#2C2C2E', 2: '#3A3A3C' },
      teal: '#0E6A72', area: areaDark, success: ['#7CC79B', '#1f3a2c'], warning: ['#F0B57A', '#3d2a1a'], danger: ['#F08A7E', '#3d1f1c'],
      font: fontsFor(t), onBrand: onBrandFor(t, '#0E6A72', bg, bg, mix(B, '#ffffff', .3)),
    };
  }
  if (look === 'navy') {
    const bg = mix(B, '#070a14', .42), card = mix(B, '#0b0f1c', .55), light = mix(P, B, .94);
    const areaDark = Object.fromEntries(Object.entries(palette.area).map(([k, [c]]) => [k, [c, mix(c, bg, .24)]])) as any;
    return {
      choice: t, dark: true, scale, highlightInk: bg,
      brand: { 50: mix(B, '#141a2e', .6), 100: mix(B, '#1c2440', .7), 200: mix(B, '#ffffff', .6), 300: mix(B, '#ffffff', .45), 400: mix(B, '#ffffff', .35), 500: mix(B, '#ffffff', .3), 600: mix(B, '#ffffff', .22), 700: mix(B, '#ffffff', .15) },
      gold: { 50: mix(H, bg, .16), 100: mix(H, bg, .3), 500: H, 600: mix(H, '#000000', .82) },
      paper: { 0: card, 1: bg, 2: mix(B, '#0a0d18', .48), 3: mix(B, '#1a2033', .62) },
      ink: { 1: light, 2: mix(light, bg, .82), 3: mix(light, bg, .64), 4: mix(light, bg, .42), inverse: bg, title: light, label: mix(light, bg, .64) },
      line: { 1: mix(B, '#20283d', .62), 2: mix(B, '#2a3350', .66) },
      teal: '#0E6A72', area: areaDark, success: ['#7CC79B', '#1f3a2c'], warning: ['#F0B57A', '#3d2a1a'], danger: ['#F08A7E', '#3d1f1c'],
      font: fontsFor(t), onBrand: onBrandFor(t, '#0E6A72', bg, bg, mix(B, '#ffffff', .3)),
    };
  }
  if (t.brandOnly) {
    // One-color brand: white page, cards and lines in light tints of the main color, charcoal reading text, titles and labels in the main color.
    const T = (p: number) => mix(P, B, p);
    return {
      choice: t, dark: false, scale, highlightInk: '#FFFFFF',
      brand: { 50: T(.93), 100: T(.86), 200: T(.7), 300: T(.5), 400: mix(B, '#ffffff', .72), 500: B, 600: B, 700: B },
      gold: { 50: T(.93), 100: T(.86), 500: H, 600: H },
      paper: { 0: '#FFFFFF', 1: P, 2: T(.93), 3: T(.86) },
      ink: { 1: I, 2: mix(I, P, .82), 3: mix(I, P, .64), 4: mix(I, P, .4), inverse: P, title: B, label: B },
      line: { 1: T(.82), 2: T(.7) },
      // Area colors keep their meaning on icons and dots; their soft backgrounds become the light coral tint.
      teal: palette.teal, area: Object.fromEntries(Object.entries(palette.area).map(([k, [c]]) => [k, [c, T(.93)]])) as unknown as typeof palette.area, success: palette.success, warning: palette.warning, danger: palette.danger,
      font: fontsFor(t), onBrand: onBrandFor(t, palette.teal, '#FFFFFF', '#FFFFFF', B),
    };
  }
  return {
    choice: t, dark: false, scale, highlightInk: B,
    brand: { 50: mix(B, '#ffffff', .07), 100: mix(B, '#ffffff', .14), 200: mix(B, '#ffffff', .3), 300: mix(B, '#ffffff', .5), 400: mix(B, '#ffffff', .72), 500: B, 600: mix(B, '#000000', .85), 700: mix(B, '#000000', .7) },
    gold: { 50: mix(H, '#ffffff', .14), 100: mix(H, '#ffffff', .3), 500: H, 600: mix(H, '#000000', .82) },
    paper: { 0: '#FFFFFF', 1: P, 2: mix(P, I, .92), 3: mix(P, I, .84) },
    ink: { 1: I, 2: mix(I, P, .82), 3: mix(I, P, .64), 4: mix(I, P, .4), inverse: P, title: I, label: mix(I, P, .64) },
    line: { 1: mix(P, I, .9), 2: mix(P, I, .84) },
    teal: palette.teal, area: palette.area, success: palette.success, warning: palette.warning, danger: palette.danger,
    font: fontsFor(t), onBrand: onBrandFor(t, palette.teal, B, P, B),
  };
}
// The "shout" style uses Anton, except with Fraunces titles, where it uses Fraunces Bold so NestWork has no extra font.
const shoutFont = (t: ThemeChoice) => t.display === 'fraunces' ? FONT.display.fraunces[1] : 'Anton_400Regular';
const fontsFor = (t: ThemeChoice) => ({ display: (FONT.display[t.display] ?? FONT.display.fraunces)[0], displayBold: (FONT.display[t.display] ?? FONT.display.fraunces)[1], body: (FONT.ui[t.ui] ?? FONT.ui.figtree)[0], bold: (FONT.ui[t.ui] ?? FONT.ui.figtree)[1], heavy: (FONT.ui[t.ui] ?? FONT.ui.figtree)[2], shout: shoutFont(t) });
export type Theme = ReturnType<typeof buildTheme>;
const Ctx = createContext<{ theme: Theme; setChoice: (c: ThemeChoice) => void }>({ theme: buildTheme(NESTWORK), setChoice: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Everyone starts on NestWork; a saved choice (Coral or anything picked in Settings) replaces it as soon as it's read.
  const [choice, setChoice] = useState<ThemeChoice>({ ...NESTWORK, textScale: 1 });
  const systemDark = useColorScheme() === 'dark'; const [ready, setReady] = useState(false);
  // Extra fonts load before the theme switches to them, so text never flashes in a missing font.
  const apply = async (c: ThemeChoice) => { await loadFonts([...(FONT.display[c.display] ?? []), ...(FONT.ui[c.ui] ?? []), shoutFont(c)]); setChoice(c); };
  // Wait for the saved look (a few milliseconds) so someone on another look never sees NestWork flash first.
  // One time only: a saved coral look (the default for a short while) moves to NestWork's LST colors (keeping text size). Picking Coral after that sticks.
  useEffect(() => { (async () => {
    const [v, moved] = await Promise.all([AsyncStorage.getItem('theme'), AsyncStorage.getItem('theme-lst')]);
    let c: ThemeChoice | null = v ? JSON.parse(v) : null;
    if (!moved) { if (c?.preset === 'nestwork') { c = { ...NESTWORK, textScale: c.textScale ?? 1 }; await AsyncStorage.setItem('theme', JSON.stringify(c)); } await AsyncStorage.setItem('theme-lst', '1'); }
    if (c) await apply(c);
  })().catch(() => {}).finally(() => setReady(true)); }, []);
  const value = useMemo(() => ({ theme: buildTheme(choice, systemDark), setChoice: (c: ThemeChoice) => { apply(c); AsyncStorage.setItem('theme', JSON.stringify(c)); } }), [choice, systemDark]);
  return <Ctx.Provider value={value}>{ready ? children : null}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
