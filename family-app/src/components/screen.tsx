import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-provider';
import { Text } from './text';
/** Root screen: large Fredoka title, optional clay/brand subtitle and trailing actions. Children get the 20px gutter unless they opt out with bleed (Rails). */
export function Screen({ title, subtitle, trailing, children }: { title: string; subtitle?: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  const { theme: t } = useTheme();
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.paper[1] }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>{subtitle && <Text v="footnote" weight="bold" color={t.brand[400]}>{subtitle}</Text>}<Text v="largeTitle">{title}</Text></View>{trailing}
      </View>
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export const Gutter = ({ children, style }: { children: React.ReactNode; style?: any }) => <View style={[{ paddingHorizontal: 20 }, style]}>{children}</View>;
export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { theme: t } = useTheme();
  return <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}><Text v="footnote" weight="heavy" color={t.ink[3]} style={{ flex: 1, textTransform: 'uppercase', letterSpacing: .8 }}>{title}</Text>{action && <Text v="subhead" weight="bold" color={t.brand[500]} onPress={onAction}>{action}</Text>}</View>;
}
