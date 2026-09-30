// Single source of truth for anything age-based. Never store an age: compute it.
import { todayISO, daysBetween } from './dates';
export type Role = 'dad' | 'mom' | 'daughter' | 'son';
export type Member = { id: string; name: string; full: string; role: Role; sex: 'm' | 'f'; birthday: string; color: string; love_languages?: { ranked: string[] } };
export type Family = { id: string; surname: string; display_name?: string; faith?: 'lds' | 'christian' | 'none'; anniversary: string; members: Member[] };
export const SEED_FAMILY: Omit<Family, 'id'> = {
  surname: 'Lewis', anniversary: '2019-09-28',
  members: [
    { id: 'levi', name: 'Levi', full: 'Levi Lewis', role: 'dad', sex: 'm', birthday: '1986-10-21', color: '#4F63A0' },
    { id: 'lindy', name: 'Lindy', full: 'Lindy Frost', role: 'mom', sex: 'f', birthday: '1983-08-22', color: '#B5536B' },
    { id: 'mayble', name: 'Mayble', full: 'Mayble Lynn', role: 'daughter', sex: 'f', birthday: '2021-04-13', color: '#D9823A' },
    { id: 'esmay', name: 'Esmay', full: 'Esmay', role: 'daughter', sex: 'f', birthday: '2022-11-15', color: '#2E8C94' },
  ],
};
export const ageOn = (bday: string, iso = todayISO()) => { const [by, bm, bd] = bday.split('-').map(Number), [y, m, d] = iso.split('-').map(Number); return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0); };
export const nextOccurrence = (orig: string, iso = todayISO()) => { const md = orig.slice(4); const y = Number(iso.slice(0, 4)); let n = y + md; if (n < iso) n = (y + 1) + md; return { date: n, days: daysBetween(iso, n), years: Number(n.slice(0, 4)) - Number(orig.slice(0, 4)) }; };
export const children = (f: Family) => f.members.filter(m => m.role === 'daughter' || m.role === 'son');
export const parents = (f: Family) => f.members.filter(m => m.role === 'dad' || m.role === 'mom');
export const yearsMarried = (f: Family, iso = todayISO()) => ageOn(f.anniversary, iso);

export type Stage = { max: number; label: string; growth: [string, string, number][]; feelings: string[]; say: [string, string][]; lens: string; tip: string; sleep: string; move: string; screen: string };
export const STAGES: Stage[] = [
  { max: 2, label: 'Toddler', growth: [['Emotional', 'Big feelings, short fuse; needs you to stay close', 50], ['Language', 'Learning new words every week', 60], ['Physical', 'Walking, climbing, exploring everything', 70], ['Spiritual', 'Learns reverence by watching you', 60]],
    feelings: ['Happy', 'Sad', 'Mad', 'Scared'], say: [['“No!”', '“Feet stay on the floor. Let’s climb outside.”'], ['“Stop crying.”', '“You’re sad. I’m holding you.”']],
    lens: 'At this age she can’t control big feelings yet. She borrows your calm.', tip: 'keep it short, stay close, and expect a mess', sleep: '11–14 hours with naps', move: 'Active play several times a day', screen: 'Avoid screens except video calls' },
  { max: 4, label: 'Preschool', growth: [['Emotional', 'Can wait a short time with help', 45], ['Language', 'Uses 4–5 word sentences and asks “why?”', 70], ['Physical', 'Pedals a tricycle, climbs well', 65], ['Social', 'Starting to play with other kids, not just beside them', 50], ['Spiritual', 'Folds arms and says short prayers with help', 80]],
    feelings: ['Happy', 'Sad', 'Mad', 'Scared', 'Silly', 'Tired'], say: [['“Be nice to your sister.”', '“Gentle hands. Show me gentle.”'], ['“Hurry up!”', '“Shoes on, then we go see the ducks.”'], ['“Stop crying.”', '“You’re sad. I’m right here. Let’s take a big breath.”']],
    lens: 'At 3–4 she can’t yet wait, plan ahead or switch tasks easily. Routines, pictures and a choice of two help most.', tip: 'offer two choices, keep it short, and expect some mess', sleep: '10–13 hours including naps', move: 'Active play throughout the day', screen: 'Up to 1 hour of quality shows, watched together' },
  { max: 6, label: 'Kindergarten', growth: [['Emotional', 'Names 6+ feelings and calms down with help', 65], ['Social', 'Takes turns and follows game rules', 55], ['Language', 'Retells a story in order', 80], ['Physical', 'Hops, skips, learning to ride a bike', 60], ['Learning', 'Knows letter sounds; counts to 20 and beyond', 70], ['Spiritual', 'Says her own simple prayer', 80]],
    feelings: ['Happy', 'Sad', 'Mad', 'Scared', 'Frustrated', 'Proud', 'Nervous', 'Jealous'], say: [['“Stop crying, it’s fine.”', '“You’re really sad the game is over. I’m here.”'], ['“Because I said so.”', '“We leave at 5 so we have time for dinner. Two more minutes.”'], ['“Good job.”', '“You kept trying even when it was hard.”']],
    lens: 'At 5–6 she can name feelings and follow simple rules, but she still needs you calm before she can calm down.', tip: 'give her a job with a real result and praise the effort', sleep: '10–13 hours', move: '60 minutes of active play a day', screen: 'Consistent limits; screens off an hour before bed' },
  { max: 9, label: 'Middle childhood', growth: [['Emotional', 'Uses a calm-down plan on her own sometimes', 55], ['Social', 'Cares a lot about fairness and friends', 60], ['Learning', 'Reads on her own and explains her thinking', 65], ['Responsibility', 'Does 2–3 chores without reminders', 50], ['Spiritual', 'Reads scripture with the family and asks questions', 60]],
    feelings: ['Happy', 'Sad', 'Mad', 'Scared', 'Frustrated', 'Proud', 'Embarrassed', 'Disappointed', 'Grateful', 'Lonely'], say: [['“You’re fine.”', '“That sounds really hard. Want to talk now or at bedtime?”'], ['“Why can’t you be more like…”', '“What’s one thing you’d do differently next time?”']],
    lens: 'At 7–9 fairness and friends matter a lot. Explain the why, and let her help solve it.', tip: 'let her plan part of it and lead the way', sleep: '9–12 hours', move: '60 minutes a day, including running and jumping', screen: 'Agree on a family media plan together' },
  { max: 12, label: 'Tween', growth: [['Emotional', 'Handles bigger feelings, sometimes privately', 55], ['Social', 'Friend groups shift; peer opinion grows', 50], ['Body', 'Puberty may begin. Talk early and plainly', 40], ['Responsibility', 'Manages homework and a small allowance', 55], ['Spiritual', 'Building her own testimony; asks honest questions', 55]],
    feelings: ['Happy', 'Sad', 'Mad', 'Anxious', 'Embarrassed', 'Proud', 'Insecure', 'Grateful', 'Lonely', 'Overwhelmed'], say: [['“You’re too young to understand.”', '“Here’s what I know, and here’s what I’m still wondering about.”'], ['“Fix your attitude.”', '“You seem upset. I’m here when you want to talk.”']],
    lens: 'At 10–12 she needs more privacy and more say. Listen first; skip the lecture.', tip: 'give her real choices and a bit of independence', sleep: '9–12 hours', move: '60 minutes a day; add strength play 3 days a week', screen: 'Phones out of bedrooms at night' },
  { max: 120, label: 'Teen', growth: [['Emotional', 'Mood swings are normal; watch for lasting changes', 50], ['Social', 'Wants independence and belonging', 55], ['Health', 'Sleep, screens and food choices matter more', 50], ['Responsibility', 'Driving, a job, managing money with help', 45], ['Spiritual', 'Chooses her own faith practices', 55]],
    feelings: ['Happy', 'Stressed', 'Anxious', 'Hopeful', 'Conflicted', 'Proud', 'Lonely', 'Grateful', 'Overwhelmed'], say: [['“As long as you live under my roof…”', '“Help me understand how you see it.”'], ['“Everyone does that at your age.”', '“That matters to you. Tell me more.”']],
    lens: 'Teens need connection more than control. Stay curious and keep the door open.', tip: 'invite her; don’t assign it', sleep: '8–10 hours', move: '60 minutes a day', screen: 'Model it: phones down at dinner' },
];
export const stageFor = (age: number) => STAGES.find(s => age <= s.max)!;

/** Compact description sent with every AI prompt so answers always match current ages. */
export function familyContext(f: Family, iso = todayISO()) {
  return {
    today: iso, surname: f.surname, yearsMarried: yearsMarried(f, iso), faith: f.faith === 'christian' ? 'Christian' : f.faith === 'none' ? undefined : 'The Church of Jesus Christ of Latter-day Saints',
    members: f.members.map(m => ({ name: m.name, role: m.role, age: ageOn(m.birthday, iso), stage: m.role === 'daughter' || m.role === 'son' ? stageFor(ageOn(m.birthday, iso)).label : undefined })),
    rules: 'Warm, plain, practical. Say "Heavenly Father", never "God". No guilt, no emoji.',
  };
}
export function upcomingDates(f: Family, iso = todayISO()) {
  const out: ({ kind: 'birthday' | 'anniversary'; id: string; title: string; date: string; days: number; years: number; member?: Member })[] = f.members.map(m => { const n = nextOccurrence(m.birthday, iso); return { kind: 'birthday' as const, id: 'bd-' + m.id, title: m.name + ' turns ' + n.years, ...n, member: m }; });
  const a = nextOccurrence(f.anniversary, iso);
  out.push({ kind: 'anniversary', id: 'anniv', title: a.years + ' years married', ...a, member: undefined });
  return out.sort((x, y) => x.days - y.days);
}
