import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';
import { Text } from './text';
import { Icon } from './icon';
type Variant = 'primary' | 'cta' | 'tinted' | 'secondary' | 'ghost' | 'destructive';
/** onBrand: the button sits on the main color (an inverse card or the sign-in screen), so a highlight button uses the on-brand colors. */
export function Button({ title, onPress, variant = 'primary', size = 'md', icon, full, disabled, onBrand }: { title: string; onPress?: () => void; variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: string; full?: boolean; disabled?: boolean; onBrand?: boolean }) {
  const { theme: t } = useTheme();
  const v = { primary: [t.brand[500], t.ink.inverse], cta: onBrand ? [t.onBrand.highlight, t.onBrand.highlightInk] : [t.gold[500], t.highlightInk], tinted: [t.brand[50], t.brand[700]], secondary: [t.paper[0], t.ink[1]], ghost: ['transparent', t.brand[500]], destructive: [t.danger[0], t.dark ? t.ink.inverse : '#fff'] }[variant];
  const h = { sm: 32, md: 44, lg: 52 }[size];
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => ({ height: h, paddingHorizontal: size === 'sm' ? 14 : 20, borderRadius: radius.button, backgroundColor: disabled ? t.paper[2] : v[0],
    borderWidth: variant === 'secondary' ? 1 : 0, borderColor: t.line[2], alignSelf: full ? 'stretch' : 'flex-start', opacity: pressed ? .85 : 1, transform: [{ scale: pressed ? .97 : 1 }] })}>
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} color={disabled ? t.ink[4] : v[1]} />}
      <Text v={size === 'sm' ? 'subhead' : 'headline'} weight="bold" color={disabled ? t.ink[4] : v[1]}>{title}</Text>
    </View>
  </Pressable>;
}
