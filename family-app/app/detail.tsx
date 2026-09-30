import { ScrollView, View, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDetail } from '@/lib/detail-store';
import { useTheme } from '@/theme/theme-provider';
import { Text } from '@/components/text';
import { Icon } from '@/components/icon';
import { Button } from '@/components/button';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
/** Full-screen detail for any tile: hero, why, Plan it, steps, attachments rail → attachment sheet. */
export default function Detail() {
  const { theme: t } = useTheme(); const d = getDetail(); const [att, setAtt] = useState<any>(null);
  if (!d) return null; const [tone, tint] = d.area ? t.area[d.area as keyof typeof t.area] : [t.brand[500], t.brand[50]];
  return <View style={{ flex: 1, backgroundColor: t.paper[1] }}><ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
    <View style={{ height: 260, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={d.icon ?? 'sparkles'} size={72} color={tone} />
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 12 }}><Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.9)', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron-left" /></Pressable></SafeAreaView>
    </View>
    <View style={{ padding: 20, gap: 8 }}>
      {d.eyebrow && <Text v="overline" color={t.brand[400]}>{d.eyebrow}</Text>}
      <Text v="title1">{d.title}</Text>{d.meta && <Text v="subhead" color={t.ink[3]}>{d.meta}</Text>}
      {d.why && <Text color={t.ink[2]} style={{ marginTop: 4 }}>{d.why}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {d.onPlan && <View style={{ flex: 1 }}><Button full variant="cta" icon="calendar-plus" title="Plan it" onPress={() => { d.onPlan!(); router.back(); }} /></View>}
        {d.actions?.map(a => <Button key={a.title} variant="secondary" icon={a.icon} title={a.title} onPress={a.onPress} />)}
      </View>
      {!!d.steps?.length && <><Text v="overline" color={t.brand[400]} style={{ marginTop: 20 }}>What you’ll do</Text>
        {d.steps.map((s, i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.brand[500], alignItems: 'center', justifyContent: 'center' }}><Text v="footnote" weight="heavy" color={t.ink.inverse}>{i + 1}</Text></View><Text v="callout" style={{ flex: 1 }}>{s}</Text></View>)}</>}
    </View>
    {!!d.attachments?.length && <Rail title="Attachments" subtitle="Tap to open" data={d.attachments} render={a => <ContentTile area={d.area} icon={a.type === 'scripture' ? 'book-open' : a.type === 'checklist' ? 'list-checks' : a.type === 'questions' ? 'message-circle-heart' : 'file-text'} title={a.title} meta={a.meta} onPress={() => setAtt(a)} />} />}
  </ScrollView>
  <Modal visible={!!att} presentationStyle="pageSheet" animationType="slide" onRequestClose={() => setAtt(null)}>
    {att && <ScrollView style={{ backgroundColor: t.paper[0] }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text v="title1">{att.title}</Text>{att.meta && <Text v="subhead" color={t.ink[3]}>{att.meta}</Text>}
      {att.body.map((b: string, i: number) => att.type === 'questions'
        ? <View key={i} style={{ backgroundColor: t.brand[500], borderRadius: 10, padding: 16 }}><Text v="overline" color={t.teal}>Card {i + 1} of {att.body.length}</Text><Text v="title3" color={t.ink.inverse} style={{ fontFamily: t.font.display }}>{b}</Text></View>
        : <Text key={i} style={{ fontStyle: att.type === 'scripture' && i === 0 ? 'italic' : 'normal' }}>{att.type === 'checklist' ? '○  ' : ''}{b}</Text>)}
      <Button full variant="secondary" title="Close" onPress={() => setAtt(null)} />
    </ScrollView>}
  </Modal></View>;
}
