import { Pressable, View } from 'react-native';
import { Screen, Gutter } from '@/components/screen';
import { Text } from '@/components/text';
import { Icon } from '@/components/icon';
import { Rail } from '@/components/rail';
import { ContentTile } from '@/components/content-tile';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { useHome } from '@/hooks/use-home';
import { supabase } from '@/lib/supabase';
import { ageOn, stageFor } from '@/lib/family';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
/** What a child sees when she signs in on her own device. Sections are chosen by parents in Settings → Kids' profiles. */
export default function Kid() {
  const { theme: t } = useTheme(); const { family } = useFamily(); const h = useHome(family?.id); const [me, setMe] = useState<any>(null);
  useEffect(() => { supabase.auth.getUser().then(async ({ data }) => { const { data: m } = await supabase.from('family_members').select('*').eq('user_id', data.user?.id).single(); setMe(m); }); }, []);
  if (!me || !family) return null;
  const S = (s: string) => (me.kid_sections || []).includes(s); const mine = h.kidChores.filter(c => c.member_slug === me.slug); const done = mine.filter(c => h.todayDone['kid:' + c.id] !== undefined).length;
  return <Screen title={'Hi, ' + me.name + '!'}>
    {S('chores') && <Gutter style={{ gap: 10 }}>
      <Text v="title2">My chores today</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>{mine.map((c, i) => <Icon key={c.id} name="star" size={28} color={i < done ? t.area.faith[0] : t.paper[3]} />)}</View>
      {mine.map(c => { const on = h.todayDone['kid:' + c.id] !== undefined; return <Pressable key={c.id} onPress={() => h.check('kid:' + c.id, me.slug)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, backgroundColor: on ? t.area.girls[0] : t.paper[0] }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: on ? 0 : 2, borderColor: t.ink[4], backgroundColor: on ? 'rgba(255,255,255,.3)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on && <Icon name="check" color="#fff" />}</View>
        <Text v="title3" color={on ? '#fff' : t.ink[1]} style={{ fontFamily: t.font.display }}>{c.title}</Text></Pressable>; })}
      {mine.length > 0 && done === mine.length && <Text v="title3" style={{ textAlign: 'center' }}>All done. Great job!</Text>}
    </Gutter>}
    {me.private_ok && <Gutter style={{ marginTop: 20 }}><Pressable onPress={() => router.push('/goals')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: t.paper[0] }}><Icon name="compass" size={26} color={t.area.growth[0]} /><View style={{ flex: 1 }}><Text v="title3" style={{ fontFamily: t.font.display }}>My goals</Text><Text v="footnote" color={t.ink[3]}>Only you can see these</Text></View><Icon name="chevron-right" color={t.ink[4]} /></Pressable></Gutter>}
    {S('feelings') && <Rail title="How do you feel?" itemWidth={120} data={stageFor(ageOn(me.birthday)).feelings} render={f => <ContentTile size="sm" area="girls" icon="smile" title={f} onPress={() => supabase.from('checkins').insert({ family_id: family.id, for_date: new Date().toISOString().slice(0, 10), question: me.name + ' feels', answers: { [me.name]: f } })} />} />}
  </Screen>;
}
