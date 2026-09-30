import { Image, Pressable, View } from 'react-native';
import { useTheme } from '@/theme/theme-provider';
import { radius, Area } from '@/theme/tokens';
import { Text } from './text';
import { Icon } from './icon';
const SIZES = { sm: [120, 96], md: [156, 120], wide: [272, 150], tall: [150, 200] } as const;
export function ContentTile({ title, eyebrow, meta, icon = 'sparkles', area, image, leading, size = 'md', badge, attachments, selected, onPress }:
  { title: string; eyebrow?: string; meta?: string; icon?: string; area?: Area; image?: string; leading?: React.ReactNode; size?: keyof typeof SIZES; badge?: string; attachments?: number; selected?: boolean; onPress?: () => void }) {
  const { theme: t } = useTheme(); const [w, h] = SIZES[size];
  const [tone, tint] = area ? t.area[area] : [t.brand[500], t.brand[50]];
  return <Pressable onPress={onPress} style={({ pressed }) => ({ width: w, gap: 8, transform: [{ scale: pressed ? .97 : 1 }] })}>
    <View style={{ width: w, height: h, borderRadius: radius.card, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: selected ? 2 : 0, borderColor: t.brand[500] }}>
      {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} /> : leading ?? <Icon name={icon} size={size === 'sm' ? 30 : 40} color={tone} />}
      {badge && <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: t.brand[500], borderRadius: radius.xs, paddingHorizontal: 7, paddingVertical: 3 }}><Text v="overline" color={t.ink.inverse}>{badge}</Text></View>}
      {!!attachments && <View style={{ position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', gap: 3, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.92)', borderRadius: radius.xs, paddingHorizontal: 7, paddingVertical: 3 }}><Icon name="paperclip" size={12} /><Text v="caption" weight="bold">{attachments}</Text></View>}
    </View>
    <View style={{ paddingHorizontal: 2 }}>
      {eyebrow && <Text v="overline" color={t.brand[400]}>{eyebrow}</Text>}
      <Text v="subhead" weight="bold" numberOfLines={2}>{title}</Text>
      {meta && <Text v="footnote" color={t.ink[3]} numberOfLines={1}>{meta}</Text>}
    </View>
  </Pressable>;
}
