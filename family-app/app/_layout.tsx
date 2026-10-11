import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { Figtree_400Regular, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { StatusBar } from 'expo-status-bar';
function ThemedStatusBar() { const { theme } = useTheme(); return <StatusBar style={theme.dark ? 'light' : 'dark'} />; }
import { SessionGate } from '@/components/session-gate';
export default function Root() {
  const [ok] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold, Anton_400Regular, YoungSerif_400Regular, Lora_600SemiBold, Lora_700Bold, Figtree_400Regular, Figtree_700Bold, Figtree_800ExtraBold, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
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
      <Stack.Screen name="event-edit" options={{ presentation: 'modal' }} />
    </Stack>
  </SessionGate></ThemeProvider>;
}
