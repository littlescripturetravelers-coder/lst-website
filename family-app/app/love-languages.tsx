import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Text } from '@/components/text';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { supabase } from '@/lib/supabase';
import { LOVE, QUIZ, score, LL } from '@/lib/love-languages';
/** 10-question love-languages quiz for one spouse. Saved on their family_members row; every AI prompt reads it. */
export default function LoveLanguages() {
  const { theme: t } = useTheme(); const { who } = useLocalSearchParams<{ who: string }>(); const { family } = useFamily();
  const m = family?.members.find(x => x.id === who); const [ans, setAns] = useState<LL[]>([]); const i = ans.length;
  if (!m) return null;
  if (i === QUIZ.length) { const r = score(ans);
    return <Screen title={m.name + '’s love languages'}><Gutter style={{ gap: 10 }}>
      {r.ranked.map((l, k) => <Card key={l} variant={k === 0 ? 'accent' : 'plain'} eyebrow={k === 0 ? 'Top' : '#' + (k + 1)} title={LOVE[l].name}><Text v="subhead" color={t.ink[2]}>Try: {LOVE[l].ideas[0]}</Text></Card>)}
      <Button full variant="cta" title="Save" onPress={async () => { await supabase.from('family_members').update({ love_languages: { ...r, taken_at: new Date().toISOString() } }).eq('family_id', family!.id).eq('slug', m.id); router.back(); }} />
    </Gutter></Screen>; }
  const [a, la, b, lb] = QUIZ[i];
  return <Screen title="Love languages" subtitle={m.name + ' · ' + (i + 1) + ' of ' + QUIZ.length}><Gutter style={{ gap: 12 }}>
    <Text v="title3">Which makes you feel more loved?</Text>
    {[[a, la], [b, lb]].map(([txt, l]) => <Pressable key={l as string} onPress={() => setAns(x => [...x, l as LL])} style={{ padding: 18, borderRadius: 10, borderWidth: 1, borderColor: t.line[2], backgroundColor: t.paper[0] }}><Text v="headline">{txt}</Text></Pressable>)}
  </Gutter></Screen>;
}
