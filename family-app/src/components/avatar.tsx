import { View } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { Text } from './text';
export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const { theme: t } = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color ?? t.brand[500], alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontFamily: t.font.display, fontSize: size * .42, lineHeight: size * .5, color: '#fff' }}>{name.slice(0, 1).toUpperCase()}</Text></View>;
}
