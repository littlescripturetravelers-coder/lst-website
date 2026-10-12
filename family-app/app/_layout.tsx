import '@/lib/web-alert';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { StatusBar } from 'expo-status-bar';
function ThemedStatusBar() { const { theme } = useTheme(); return <StatusBar style={theme.dark ? 'light' : 'dark'} />; }
import { SessionGate } from '@/components/session-gate';
export default function Root() {
  // Only NestWork's fonts (the LST fonts) load at start; every other font choice (the Coral look's Fraunces and Figtree included) loads when it's picked (src/theme/fonts.ts), so the app starts fast.
  const [ok] = useFonts({
    Fredoka_600SemiBold: require('@expo-google-fonts/fredoka/Fredoka_600SemiBold.ttf'), Fredoka_700Bold: require('@expo-google-fonts/fredoka/Fredoka_700Bold.ttf'),
    Nunito_400Regular: require('@expo-google-fonts/nunito/Nunito_400Regular.ttf'), Nunito_700Bold: require('@expo-google-fonts/nunito/Nunito_700Bold.ttf'), Nunito_800ExtraBold: require('@expo-google-fonts/nunito/Nunito_800ExtraBold.ttf'),
    Anton_400Regular: require('@expo-google-fonts/anton/Anton_400Regular.ttf'),
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
      <Stack.Screen name="child" options={{ presentation: 'card' }} />
      <Stack.Screen name="reminder-sheet" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
      <Stack.Screen name="event" options={{ presentation: 'card' }} />
      <Stack.Screen name="our-list" options={{ presentation: 'card' }} />
      <Stack.Screen name="meals" options={{ presentation: 'card' }} />
      <Stack.Screen name="recipe" options={{ presentation: 'card' }} />
      <Stack.Screen name="meal-prefs" options={{ presentation: 'modal' }} />
      <Stack.Screen name="priorities" options={{ presentation: 'modal' }} />
      <Stack.Screen name="setup" options={{ presentation: 'card', gestureEnabled: false }} />
      <Stack.Screen name="event-edit" options={{ presentation: 'modal' }} />
    </Stack>
  </SessionGate></ThemeProvider>;
}
