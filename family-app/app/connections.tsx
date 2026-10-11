import { useEffect, useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { loadPrefs, savePrefs, deviceCalendars, addFeed, shareBusyTime, Prefs, Share, SHARE_LABEL } from '@/lib/connections';
const ORDER: Share[] = ['private', 'busy', 'details'];
/** Work and personal calendars + task feeds for the person holding this phone. Choices stay on this device. */
export default function Connections() {
  const { theme: t } = useTheme(); const { family } = useFamily();
  const [prefs, setPrefs] = useState<Prefs>({ calendars: {}, feeds: [] }); const [cals, setCals] = useState<Awaited<ReturnType<typeof deviceCalendars>>>(undefined as any);
  const [name, setName] = useState(''); const [link, setLink] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { loadPrefs().then(setPrefs); deviceCalendars().then(setCals).catch(() => setCals(null)); }, []);
  const commit = async (p: Prefs) => { setPrefs(p); await savePrefs(p); if (family) shareBusyTime(family.id).catch(() => {}); };
  const toggleCal = (id: string) => { const c = { ...prefs.calendars }; if (c[id]) delete c[id]; else c[id] = 'private'; commit({ ...prefs, calendars: c }); };
  const cycleCal = (id: string) => commit({ ...prefs, calendars: { ...prefs.calendars, [id]: ORDER[(ORDER.indexOf(prefs.calendars[id]) + 1) % 3] } });
  const cycleFeed = (id: string) => commit({ ...prefs, feeds: prefs.feeds.map(f => f.id === id ? { ...f, share: ORDER[(ORDER.indexOf(f.share) + 1) % 3] } : f) });
  const groups = (cals || []).reduce<Record<string, NonNullable<typeof cals>>>((g, c) => { (g[c.account] = g[c.account] || []).push(c); return g; }, {});
  const ShareChip = ({ s, onPress }: { s: Share; onPress: () => void }) => <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: t.line[2], borderRadius: 13, paddingHorizontal: 8, height: 26 }}><Icon name={s === 'private' ? 'lock' : s === 'busy' ? 'clock' : 'eye'} size={13} color={t.ink[2]} /><Text v="caption" weight="bold">{SHARE_LABEL[s]}</Text></Pressable>;
  return <Screen title="Work calendars" subtitle="Calendars & tasks from other apps" trailing={<Text color={t.brand[500]} onPress={() => router.back()}>Done</Text>}>
    <Gutter><Card variant="sunken"><Text v="subhead" color={t.ink[2]}>Your work items show only to you. For each one, choose whether the family sees nothing, just that you’re busy, or the details. Tap the label to change it.</Text></Card></Gutter>
    <SectionHead title="Calendars on this iPhone" />
    <Gutter style={{ gap: 10 }}>
      {cals === null && <Card><Text>Allow calendar access to show your work calendars here.</Text><View style={{ marginTop: 10 }}><Button size="sm" title="Open Settings" onPress={() => Linking.openSettings()} /></View></Card>}
      {Object.entries(groups).map(([acct, list]) => <Card key={acct} padding={0}>
        <Text v="footnote" weight="heavy" color={t.ink[3]} style={{ paddingHorizontal: 14, paddingTop: 12, textTransform: 'uppercase' }}>{acct}</Text>
        {list.map(c => { const on = !!prefs.calendars[c.id]; return <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: .5, borderColor: t.line[2] }}>
          <Pressable onPress={() => toggleCal(c.id)} hitSlop={8} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: on ? 0 : 1.5, borderColor: t.ink[4], backgroundColor: on ? c.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on && <Icon name="check" size={16} color="#fff" />}</Pressable>
          <Text style={{ flex: 1 }} onPress={() => toggleCal(c.id)}>{c.title}</Text>{on && <ShareChip s={prefs.calendars[c.id]} onPress={() => cycleCal(c.id)} />}</View>; })}
      </Card>)}
      <Card variant="accent"><Text v="subhead" weight="bold">Don’t see your work calendar?</Text><Text v="subhead" color={t.ink[2]} style={{ marginTop: 4 }}>On your iPhone, open Settings, then Apps, then Calendar, then Calendar Accounts, then Add Account. Pick Google, Microsoft Exchange (for Outlook and Microsoft 365) or another. It shows up here after that.</Text></Card>
    </Gutter>
    <SectionHead title="Task and project apps" />
    <Gutter style={{ gap: 10 }}>
      {prefs.feeds.length > 0 && <Card padding={0}>{prefs.feeds.map(f => <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: .5, borderColor: t.line[2] }}>
        <Icon name="link" size={18} color={t.ink[3]} /><Text style={{ flex: 1 }}>{f.name}</Text><ShareChip s={f.share} onPress={() => cycleFeed(f.id)} />
        <Pressable onPress={() => commit({ ...prefs, feeds: prefs.feeds.filter(x => x.id !== f.id) })} hitSlop={8}><Icon name="x" size={18} color={t.ink[3]} /></Pressable></View>)}</Card>}
      <Card>
        <Text v="subhead" color={t.ink[2]}>Asana, Todoist, Trello, Jira, ClickUp, Monday and most others give you a private calendar feed link. Look for “Subscribe”, “iCal” or “Calendar feed”, copy the link, and paste it here.</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Name (for example, Work tasks)" placeholderTextColor={t.ink[4]} style={{ marginTop: 10, height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }} />
        <TextInput value={link} onChangeText={v => { setLink(v); setErr(''); }} placeholder="Paste the link" autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholderTextColor={t.ink[4]} style={{ marginTop: 8, height: 44, borderRadius: 8, borderWidth: 1, borderColor: t.line[2], paddingHorizontal: 12, fontSize: 17, fontFamily: t.font.body, color: t.ink[1] }} />
        {!!err && <Text v="footnote" color={t.danger[0]} style={{ marginTop: 6 }}>{err}</Text>}
        <View style={{ marginTop: 10 }}><Button size="sm" icon="plus" title={busy ? 'Checking…' : 'Add link'} disabled={busy || !link.trim()} onPress={async () => { setBusy(true); const r = await addFeed(prefs, name, link); setBusy(false); if (r.error) setErr(r.error); else { setName(''); setLink(''); commit(r.prefs!); } }} /></View>
        <Text v="caption" color={t.ink[3]} style={{ marginTop: 8 }}>The link stays on this phone. The app only reads it and never changes anything in the other app.</Text>
      </Card>
    </Gutter>
  </Screen>;
}
