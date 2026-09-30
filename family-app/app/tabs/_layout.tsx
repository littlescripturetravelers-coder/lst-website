import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme/theme-provider';
import { Icon } from '@/components/icon';
const TABS = [['index', 'Today', 'sun'], ['calendar', 'Calendar', 'calendar'], ['reminders', 'Reminders', 'list-checks'], ['family', 'Family', 'heart-handshake'], ['more', 'More', 'layout-grid']] as const;
export default function TabsLayout() {
  const { theme: t } = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: t.brand[500], tabBarInactiveTintColor: t.ink[3], tabBarStyle: { position: 'absolute', borderTopColor: t.line[2] },
    tabBarBackground: () => <BlurView intensity={60} tint={t.dark ? 'dark' : 'light'} style={{ flex: 1, backgroundColor: t.paper[1] + 'D6' }} />, tabBarLabelStyle: { fontFamily: t.font.bold, fontSize: 10 } }}>
    {TABS.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={color} /> }} />)}
  </Tabs>;
}
