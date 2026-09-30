import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { Text } from './text';
import { Icon } from './icon';
export function ListRow({ icon, iconColor, leading, title, subtitle, value, trailing, chevron, onPress, divider = true }: { icon?: string; iconColor?: string; leading?: React.ReactNode; title: string; subtitle?: string; value?: string; trailing?: React.ReactNode; chevron?: boolean; onPress?: () => void; divider?: boolean }) {
  const { theme: t } = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingLeft: 16, backgroundColor: pressed && onPress ? t.paper[2] : 'transparent' })}>
    {leading ?? (icon && <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: iconColor ?? t.brand[500], alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={17} color="#fff" /></View>)}
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingRight: 16, alignSelf: 'stretch', borderBottomWidth: divider ? .5 : 0, borderColor: t.line[2] }}>
      <View style={{ flex: 1 }}><Text>{title}</Text>{subtitle && <Text v="footnote" color={t.ink[3]}>{subtitle}</Text>}</View>
      {value && <Text color={t.ink[3]}>{value}</Text>}{trailing}{chevron && <Icon name="chevron-right" size={18} color={t.ink[4]} />}
    </View>
  </Pressable>;
}
