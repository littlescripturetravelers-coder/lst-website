// Every font except the NestWork defaults loaded at start (Fraunces and Figtree in app/_layout.tsx), including Classic's Fredoka, Nunito and Anton.
// They load only when someone opens the font choices or picks one, so the app still starts fast.
import * as Font from 'expo-font';

const FILES: Record<string, number> = {
  Fredoka_600SemiBold: require('@expo-google-fonts/fredoka/Fredoka_600SemiBold.ttf'),
  Fredoka_700Bold: require('@expo-google-fonts/fredoka/Fredoka_700Bold.ttf'),
  Nunito_400Regular: require('@expo-google-fonts/nunito/Nunito_400Regular.ttf'),
  Nunito_700Bold: require('@expo-google-fonts/nunito/Nunito_700Bold.ttf'),
  Nunito_800ExtraBold: require('@expo-google-fonts/nunito/Nunito_800ExtraBold.ttf'),
  Anton_400Regular: require('@expo-google-fonts/anton/Anton_400Regular.ttf'),
  YoungSerif_400Regular: require('@expo-google-fonts/young-serif/400Regular/YoungSerif_400Regular.ttf'),
  Lora_600SemiBold: require('@expo-google-fonts/lora/Lora_600SemiBold.ttf'),
  Lora_700Bold: require('@expo-google-fonts/lora/Lora_700Bold.ttf'),
  Figtree_400Regular: require('@expo-google-fonts/figtree/Figtree_400Regular.ttf'),
  Figtree_700Bold: require('@expo-google-fonts/figtree/Figtree_700Bold.ttf'),
  Figtree_800ExtraBold: require('@expo-google-fonts/figtree/Figtree_800ExtraBold.ttf'),
  AtkinsonHyperlegible_400Regular: require('@expo-google-fonts/atkinson-hyperlegible/AtkinsonHyperlegible_400Regular.ttf'),
  AtkinsonHyperlegible_700Bold: require('@expo-google-fonts/atkinson-hyperlegible/AtkinsonHyperlegible_700Bold.ttf'),
  PlayfairDisplay_600SemiBold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_600SemiBold.ttf'),
  PlayfairDisplay_700Bold: require('@expo-google-fonts/playfair-display/PlayfairDisplay_700Bold.ttf'),
  Merriweather_400Regular: require('@expo-google-fonts/merriweather/Merriweather_400Regular.ttf'),
  Merriweather_700Bold: require('@expo-google-fonts/merriweather/Merriweather_700Bold.ttf'),
  DMSerifDisplay_400Regular: require('@expo-google-fonts/dm-serif-display/DMSerifDisplay_400Regular.ttf'),
  Poppins_400Regular: require('@expo-google-fonts/poppins/Poppins_400Regular.ttf'),
  Poppins_600SemiBold: require('@expo-google-fonts/poppins/Poppins_600SemiBold.ttf'),
  Poppins_700Bold: require('@expo-google-fonts/poppins/Poppins_700Bold.ttf'),
  Poppins_800ExtraBold: require('@expo-google-fonts/poppins/Poppins_800ExtraBold.ttf'),
  Quicksand_400Regular: require('@expo-google-fonts/quicksand/Quicksand_400Regular.ttf'),
  Quicksand_600SemiBold: require('@expo-google-fonts/quicksand/Quicksand_600SemiBold.ttf'),
  Quicksand_700Bold: require('@expo-google-fonts/quicksand/Quicksand_700Bold.ttf'),
  Comfortaa_600SemiBold: require('@expo-google-fonts/comfortaa/Comfortaa_600SemiBold.ttf'),
  Comfortaa_700Bold: require('@expo-google-fonts/comfortaa/Comfortaa_700Bold.ttf'),
  Raleway_400Regular: require('@expo-google-fonts/raleway/Raleway_400Regular.ttf'),
  Raleway_700Bold: require('@expo-google-fonts/raleway/Raleway_700Bold.ttf'),
  Raleway_800ExtraBold: require('@expo-google-fonts/raleway/Raleway_800ExtraBold.ttf'),
  Montserrat_400Regular: require('@expo-google-fonts/montserrat/Montserrat_400Regular.ttf'),
  Montserrat_700Bold: require('@expo-google-fonts/montserrat/Montserrat_700Bold.ttf'),
  Montserrat_800ExtraBold: require('@expo-google-fonts/montserrat/Montserrat_800ExtraBold.ttf'),
  Caveat_600SemiBold: require('@expo-google-fonts/caveat/Caveat_600SemiBold.ttf'),
  Caveat_700Bold: require('@expo-google-fonts/caveat/Caveat_700Bold.ttf'),
  Pacifico_400Regular: require('@expo-google-fonts/pacifico/Pacifico_400Regular.ttf'),
  Inter_400Regular: require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/Inter_800ExtraBold.ttf'),
  Lato_400Regular: require('@expo-google-fonts/lato/Lato_400Regular.ttf'),
  Lato_700Bold: require('@expo-google-fonts/lato/Lato_700Bold.ttf'),
  OpenSans_400Regular: require('@expo-google-fonts/open-sans/OpenSans_400Regular.ttf'),
  OpenSans_700Bold: require('@expo-google-fonts/open-sans/OpenSans_700Bold.ttf'),
  OpenSans_800ExtraBold: require('@expo-google-fonts/open-sans/OpenSans_800ExtraBold.ttf'),
  SourceSans3_400Regular: require('@expo-google-fonts/source-sans-3/SourceSans3_400Regular.ttf'),
  SourceSans3_700Bold: require('@expo-google-fonts/source-sans-3/SourceSans3_700Bold.ttf'),
  SourceSans3_800ExtraBold: require('@expo-google-fonts/source-sans-3/SourceSans3_800ExtraBold.ttf'),
  WorkSans_400Regular: require('@expo-google-fonts/work-sans/WorkSans_400Regular.ttf'),
  WorkSans_700Bold: require('@expo-google-fonts/work-sans/WorkSans_700Bold.ttf'),
  WorkSans_800ExtraBold: require('@expo-google-fonts/work-sans/WorkSans_800ExtraBold.ttf'),
};

/** Loads the given extra font names (others, like Fraunces or System, are skipped). Safe to call often. */
export async function loadFonts(names: readonly string[]) {
  const want = Object.fromEntries(names.filter(n => FILES[n] && !Font.isLoaded(n)).map(n => [n, FILES[n]]));
  if (Object.keys(want).length) await Font.loadAsync(want).catch(() => {});
}
export const loadAllFonts = () => loadFonts(Object.keys(FILES));
