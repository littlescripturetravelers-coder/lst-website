import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { type as T } from '@/theme/tokens';
type V = keyof typeof T;
export function Text({ v = 'body', color, weight, style, ...p }: TextProps & { v?: V; color?: string; weight?: 'regular' | 'bold' | 'heavy' }) {
  const { theme } = useTheme(); const t: any = T[v];
  const display = ['hero', 'largeTitle', 'title1', 'title2'].includes(v), shout = v === 'shout', over = v === 'overline';
  const fontFamily = shout ? theme.font.shout : display ? theme.font.display : weight === 'heavy' || over ? theme.font.heavy : weight === 'bold' || ['title3', 'headline'].includes(v) ? theme.font.bold : theme.font.body;
  const s = theme.scale ?? 1;
  // In-app size slider multiplies on top of iOS Dynamic Type (allowFontScaling stays on, capped so layouts hold).
  return <RNText maxFontSizeMultiplier={1.6} {...p} style={[{ fontFamily, fontSize: Math.round(t.size * s), lineHeight: Math.round(t.line * s), color: color ?? (display ? theme.ink.title : theme.ink[1]), letterSpacing: t.tracking, textTransform: over || shout ? 'uppercase' : undefined }, style]} />;
}
