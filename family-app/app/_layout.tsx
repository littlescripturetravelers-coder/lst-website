import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { StatusBar } from 'expo-status-bar';
function ThemedStatusBar() { const { theme } = useTheme(); return <StatusBar style={theme.dark ? 'light' : 'dark'} />; }
import { SessionGate } from '@/components/session-gate';
export default function Root() {
  // Only the NestWork fonts load at start; every other font choice (Classic's Fredoka, Nunito and Anton included) loads when it's picked (src/theme/fonts.ts), so the app starts fast.
  const [ok] = useFonts({
    Fraunces_600SemiBoldSoft: require('../assets/fonts/Fraunces_600SemiBoldSoft.ttf'), Fraunces_700BoldSoft: require('../assets/fonts/Fraunces_700BoldSoft.ttf'),
    Figtree_400Regular: require('@expo-google-fonts/figtree/Figtree_400Regular.ttf'), Figtree_700Bold: require('@expo-google-fonts/figtree/Figtree_700Bold.ttf'), Figtree_800ExtraBold: require('@expo-google-fonts/figtree/Figtree_800ExtraBold.ttf'),
  });
  if (!ok) return null;
  return <ThemeProvider><ThemedStatusBar /><SessionGate>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tabs" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="love-languages" options={{ presentation: 'modal' }} />
      <Stack.Screen name="kid" options={{ gestureEnabled: false }} />
      <Stack.Screen name="detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="reminder-sheet" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
      <Stack.Screen name="event" options={{ presentation: 'card' }} />
      <Stack.Screen name="our-list" options={{ presentation: 'card' }} />
      <Stack.Screen name="meals" options={{ presentation: 'card' }} />
      <Stack.Screen name="recipe" options={{ presentation: 'card' }} />
      <Stack.Screen name="meal-prefs" options={{ presentation: 'modal' }} />
      <Stack.Screen name="setup" options={{ presentation: 'card', gestureEnabled: false }} />
      <Stack.Screen name="event-edit" options={{ presentation: 'modal' }} />
    </Stack>
  </SessionGate></ThemeProvider>;
}
