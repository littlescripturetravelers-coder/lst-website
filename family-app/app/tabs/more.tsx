import { router } from 'expo-router';
import { Screen, Gutter, SectionHead } from '@/components/screen';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { useTheme } from '@/theme/theme-provider';
import { useFamily } from '@/hooks/use-family';
import { kidsLabel } from '@/lib/brand';
export default function More() {
  const { theme: t } = useTheme(); const { family } = useFamily();
  return <Screen title="More">
    <SectionHead title="Plan" />
    <Gutter><Card padding={0}>
      <ListRow icon="bot" iconColor={t.area.money[0]} title="Money advisor" subtitle="Linked banks, cards & loans" chevron onPress={() => router.push('/advisor')} />
      <ListRow icon="house" iconColor={t.area.home[0]} title="Home upkeep" subtitle="Cleaning, yard, vehicles, seasonal" chevron onPress={() => router.push('/home')} />
      <ListRow icon="heart-pulse" iconColor={t.area.health[0]} title="Health" subtitle="Check-ups, screenings, staying strong" chevron onPress={() => router.push('/health')} />
      <ListRow icon="compass" iconColor={t.area.growth[0]} title="Goals" subtitle="Roles, big rocks, weekly planning" chevron divider={false} onPress={() => router.push('/goals')} />
    </Card></Gutter>
    <SectionHead title="Think & learn" />
    <Gutter><Card padding={0}>
      <ListRow icon="lamp" iconColor={t.area.faith[0]} title="Morning Lantern" subtitle="Today’s couple scripture study" chevron onPress={() => router.push('/lantern')} />
      <ListRow icon="puzzle" iconColor={t.area.girls[0]} title="Tonight’s story activity" subtitle={'Learn the story with ' + kidsLabel(family)} chevron onPress={() => router.push('/story-activity')} />
      <ListRow icon="lightbulb" iconColor={t.gold[600]} title="Think it through" subtitle="Work a problem into a plan" chevron onPress={() => router.push('/think')} />
      <ListRow icon="graduation-cap" iconColor={t.brand[500]} title="Family Life Educator" subtitle="Ask, build programs, handouts" chevron divider={false} onPress={() => router.push('/educator')} />
    </Card></Gutter>
    <SectionHead title="" />
    <Gutter><Card padding={0}><ListRow icon="settings" iconColor={t.ink[3]} title="Settings" subtitle="Family, colors, fonts, notifications, Siri & Alexa" chevron divider={false} onPress={() => router.push('/settings')} /></Card></Gutter>
  </Screen>;
}
