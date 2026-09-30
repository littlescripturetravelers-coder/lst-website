import { FlatList, View } from 'react-native';
import { Text } from './text';
import { useTheme } from '@/theme/theme-provider';
/** Swipeable horizontal row of choices. Put edge-to-edge; the 20px inset aligns the first tile with the gutter. */
export function Rail<T>({ title, subtitle, action, onAction, data, render, itemWidth = 156, gap = 12 }: { title?: string; subtitle?: string; action?: string; onAction?: () => void; data: T[]; render: (x: T, i: number) => React.ReactElement; itemWidth?: number; gap?: number }) {
  const { theme: t } = useTheme();
  return <View style={{ marginTop: 24 }}>
    {(title || action) && <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 10 }}>
      <View style={{ flex: 1 }}>{title && <Text v="title2" numberOfLines={1}>{title}</Text>}{subtitle && <Text v="footnote" color={t.ink[3]}>{subtitle}</Text>}</View>
      {action && <Text v="subhead" weight="bold" color={t.brand[500]} onPress={onAction}>{action}</Text>}
    </View>}
    <FlatList horizontal data={data} keyExtractor={(_, i) => String(i)} renderItem={({ item, index }) => render(item, index)} showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap }} snapToInterval={itemWidth + gap} decelerationRate="fast" snapToAlignment="start" />
  </View>;
}
