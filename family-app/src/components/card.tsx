import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { Text } from './text';
export function Card({ variant = 'plain', eyebrow, title, action, children, onPress, padding = 16, style }: { variant?: 'plain' | 'sunken' | 'accent' | 'inverse'; eyebrow?: string; title?: string; action?: React.ReactNode; children?: React.ReactNode; onPress?: () => void; padding?: number; style?: ViewStyle }) {
  const { theme: t } = useTheme();
  const bg = { plain: t.paper[0], sunken: t.paper[2], accent: t.gold[50], inverse: t.brand[500] }[variant];
  const fg = variant === 'inverse' ? t.ink.inverse : t.ink[1];
  const W: any = onPress ? Pressable : View;
  return <W onPress={onPress} style={[{ backgroundColor: bg, borderRadius: radius.card, padding, borderWidth: variant === 'plain' ? 1 : 0, borderColor: t.line[1] }, style]}>
    {(eyebrow || title || action) && <View style={{ flexDirection: 'row', gap: 12, marginBottom: children ? 12 : 0 }}>
      <View style={{ flex: 1 }}>
        {eyebrow && <Text v="overline" color={variant === 'inverse' ? t.onBrand.accent : t.brand[400]} style={{ marginBottom: 4 }}>{eyebrow}</Text>}
        {title && <Text v="title2" color={fg}>{title}</Text>}
      </View>{action}
    </View>}
    {children}
  </W>;
}
