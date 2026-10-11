import { Pressable, View } from 'react-native';
import { Text } from './text';
import { useTheme } from '@/theme/theme-provider';
import { FAITH_OPTIONS, FaithKey } from '@/lib/faiths';
/** Tap to choose the family's faith (every option fits on a phone by wrapping). */
export function FaithPicker({ value, onChange }: { value?: string; onChange: (f: FaithKey) => void }) {
  const { theme: t } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{FAITH_OPTIONS.map(([k, l]) => { const on = value === k;
    return <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ paddingHorizontal: 14, height: 40, borderRadius: 20, justifyContent: 'center', borderWidth: 1.5, borderColor: on ? t.brand[500] : t.line[2], backgroundColor: on ? t.brand[500] : t.paper[0] }}>
      <Text v="subhead" weight="bold" color={on ? t.ink.inverse : t.ink[1]}>{l}</Text></Pressable>; })}</View>;
}
