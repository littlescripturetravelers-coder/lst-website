import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter } from '@/components/screen';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useReminders } from '@/hooks/use-reminders';
import { supabase } from '@/lib/supabase';
import { addDays, todayISO } from '@/lib/dates';
const STEPS = ['Name it', 'Facts & feelings', 'Ask why', 'Their side', 'Ideas', 'Choose & plan'];
const PROMPTS = ['What’s happening? Describe it like a camera would.', 'What do we know for sure? What do we feel or assume?', 'Why does it happen? Keep asking why until you reach something you can change.', 'How does each person see it? What does each one need?', 'List every idea. No judging yet.', 'Which idea has the most impact for the least effort, and fits our mission? Write it as a plan.'];
/** Six-step critical-thinking flow; the chosen idea becomes a daily reminder + a one-week check-in. */
export default function Think() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const rem = useReminders(family?.id);
  const [step, setStep] = useState(0); const [a, setA] = useState<string[]>(Array(6).fill(''));
  const finish = async () => { if (!family) return; await supabase.from('think_sessions').insert({ family_id: family.id, what: a[0], facts: [a[1]], whys: [a[2]], sides: { all: a[3] }, ideas: a[4].split('\n').filter(Boolean), step: 6 });
    await rem.add({ title: 'Try: ' + a[5].split('\n')[0], due_date: todayISO(), due_time: '19:00', repeat: 'daily', on_calendar: true, alert: 'at', source: 'think' });
    await rem.add({ title: 'Check in: is it helping?', due_date: addDays(todayISO(), 7), due_time: '20:30', on_calendar: true, alert: 'at', source: 'think' }); router.back(); };
  return <Screen title={STEPS[step]} subtitle={'Step ' + (step + 1) + ' of 6'} trailing={<Text color={t.brand[500]} onPress={() => step ? setStep(step - 1) : router.back()}>{step ? 'Back' : 'Close'}</Text>}>
    <Gutter style={{ gap: 12 }}>
      {step === 0 && <Card variant="inverse"><Text v="shout" color={t.ink.inverse}>One problem. <Text v="shout" color={t.gold[500]}>One next step.</Text></Text></Card>}
      <Text color={t.ink[2]}>{PROMPTS[step]}</Text>
      <TextInput multiline value={a[step]} onChangeText={v => setA(x => x.map((y, i) => i === step ? v : y))} style={{ minHeight: 140, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], padding: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1], backgroundColor: t.paper[0] }} />
      <View>{step < 5 ? <Button full size="lg" title={'Next: ' + STEPS[step + 1]} onPress={() => setStep(step + 1)} /> : <Button full size="lg" variant="cta" icon="calendar-plus" title="Make it a plan" onPress={finish} />}</View>
    </Gutter>
  </Screen>;
}
