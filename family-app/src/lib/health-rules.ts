// Screening / prevention rules. Sources: USPSTF recommendations, AAP Bright Futures periodicity schedule, CDC immunization schedules.
// Update a rule here when guidance changes; the app recomputes everyone's status from birthdays + health_log.
import { addMonths, daysBetween, todayISO } from './dates';
import { ageOn, Member, stageFor } from './family';
export type HealthRule = { id: string; title: string; icon: string; min: number; max: number; every: number; sex?: 'm' | 'f'; why: string; steps?: string[] };
export const HEALTH_RULES: HealthRule[] = [
  // children
  { id: 'wellchild', title: 'Well-child visit', icon: 'stethoscope', min: 0, max: 17, every: 12, why: 'Growth, development, blood pressure, vision and hearing checks, plus shots that are due.', steps: ['Book around her birthday month', 'Bring questions about sleep, eating and feelings', 'Ask which vaccines are due'] },
  { id: 'kdental', title: 'Dental cleaning + fluoride', icon: 'smile', min: 1, max: 17, every: 6, why: 'Every 6 months. Fluoride varnish at visits helps prevent cavities.' },
  { id: 'kvision', title: 'Vision screening', icon: 'eye', min: 3, max: 17, every: 12, why: 'Yearly from age 3 (usually done at the well-child visit).' },
  { id: 'khearing', title: 'Hearing screening', icon: 'ear', min: 4, max: 10, every: 12, why: 'At ages 4, 5, 6, 8 and 10, usually at the well-child visit.' },
  { id: 'boost46', title: 'Kindergarten vaccine boosters', icon: 'syringe', min: 4, max: 6, every: 0, why: 'DTaP, polio, MMR and chickenpox boosters between the 4th and 6th birthday.' },
  { id: 'vax11', title: 'Pre-teen vaccines', icon: 'syringe', min: 11, max: 12, every: 0, why: 'Tdap, HPV and meningococcal vaccines at 11–12.' },
  { id: 'lipid911', title: 'Cholesterol check', icon: 'droplet', min: 9, max: 11, every: 0, why: 'Once between ages 9 and 11.' },
  { id: 'kdepress', title: 'Depression screening', icon: 'heart-pulse', min: 12, max: 17, every: 12, why: 'Yearly from age 12 at the check-up.' },
  // everyone
  { id: 'flu', title: 'Flu shot', icon: 'syringe', min: 0.5, max: 120, every: 12, why: 'Every fall for everyone 6 months and older.' },
  // adults
  { id: 'physical', title: 'Annual physical', icon: 'stethoscope', min: 18, max: 120, every: 12, why: 'A yearly check-in with your doctor: weight, blood pressure, mood and anything new.' },
  { id: 'bp', title: 'Blood pressure', icon: 'heart-pulse', min: 18, max: 120, every: 12, why: 'At least yearly from 40 (every 3–5 years before 40 if normal).' },
  { id: 'lipids', title: 'Cholesterol panel', icon: 'droplet', min: 20, max: 120, every: 60, why: 'Every 4–6 years, or more often if your numbers are borderline.' },
  { id: 'a1c', title: 'Diabetes screening (A1C)', icon: 'activity', min: 35, max: 70, every: 36, why: 'Every 3 years from 35, especially with extra weight or family history.' },
  { id: 'adental', title: 'Dental cleaning', icon: 'smile', min: 18, max: 120, every: 6, why: 'Every 6 months.' },
  { id: 'eye', title: 'Eye exam', icon: 'eye', min: 18, max: 120, every: 24, why: 'Every 2 years; a baseline exam at 40 catches early eye disease.' },
  { id: 'skin', title: 'Skin check', icon: 'sun', min: 30, max: 120, every: 12, why: 'Yearly look at moles and spots, especially with sun exposure.' },
  { id: 'tdap', title: 'Tetanus booster (Td/Tdap)', icon: 'syringe', min: 18, max: 120, every: 120, why: 'Every 10 years.' },
  { id: 'colon', title: 'Colon cancer screening', icon: 'shield-check', min: 45, max: 75, every: 120, why: 'Starts at 45. Colonoscopy every 10 years, or a stool test more often.' },
  { id: 'shingles', title: 'Shingles vaccine', icon: 'syringe', min: 50, max: 120, every: 0, why: 'Two doses from age 50.' },
  { id: 'mammo', title: 'Mammogram', icon: 'shield-check', sex: 'f', min: 40, max: 74, every: 24, why: 'Every 2 years from 40.' },
  { id: 'cervical', title: 'Cervical screening (HPV/Pap)', icon: 'shield-check', sex: 'f', min: 21, max: 65, every: 60, why: 'HPV test every 5 years from 30 (or Pap every 3 years).' },
  { id: 'bone', title: 'Bone density scan', icon: 'bone', sex: 'f', min: 65, max: 120, every: 24, why: 'From 65, or earlier with risk factors.' },
  { id: 'prostate', title: 'Prostate screening talk', icon: 'message-circle', sex: 'm', min: 55, max: 69, every: 24, why: 'Talk with your doctor about PSA testing from 55 (earlier with family history).' },
];
export type HealthStatus = 'overdue' | 'due' | 'soon' | 'ok';
export type HealthItem = HealthRule & { last: string | null; due: string; status: HealthStatus };
export function screeningsFor(m: Member, log: Record<string, string>, iso = todayISO()) {
  const age = ageOn(m.birthday, iso); const now: HealthItem[] = []; const later: (HealthRule & { startsOn: string })[] = [];
  for (const r of HEALTH_RULES) {
    if (r.sex && r.sex !== m.sex) continue;
    if (age > r.max) continue;
    if (age < r.min) { const startsOn = addMonths(m.birthday, Math.round(r.min * 12)); if (daysBetween(iso, startsOn) < 365 * 12) later.push({ ...r, startsOn }); continue; }
    const last = log[r.id] ?? null;
    if (r.every === 0) { if (!last) now.push({ ...r, last, due: iso, status: 'due' }); continue; }
    const due = last ? addMonths(last, r.every) : iso; const dd = daysBetween(iso, due);
    now.push({ ...r, last, due, status: !last ? 'due' : dd < 0 ? 'overdue' : dd <= 60 ? 'soon' : 'ok' });
  }
  const rank = { overdue: 0, due: 1, soon: 2, ok: 3 };
  now.sort((a, b) => rank[a.status] - rank[b.status] || a.due.localeCompare(b.due));
  return { age, now, later: later.sort((a, b) => a.startsOn.localeCompare(b.startsOn)) };
}
export function fitnessFocus(m: Member, iso = todayISO()) {
  const age = ageOn(m.birthday, iso);
  if (m.role === 'daughter' || m.role === 'son') { const s = stageFor(age); return [`Sleep ${s.sleep}`, s.move, `Screens: ${s.screen}`, 'Brush twice with fluoride toothpaste']; }
  const base = ['150 minutes of moderate activity a week', 'Strength training 2–3 days a week', 'Sleep 7–9 hours', 'Know your numbers: BP, cholesterol, A1C, waist'];
  if (age >= 40 && m.sex === 'f') base.push('Calcium + vitamin D (ask your doctor)', 'Pelvic floor exercises', 'Talk about perimenopause symptoms');
  if (age >= 38 && m.sex === 'm') base.push('Baseline eye exam at 40', 'Cardiovascular risk check', 'Daily mobility for back and hips');
  if (age >= 50) base.push('Balance practice 3× a week');
  return base;
}
