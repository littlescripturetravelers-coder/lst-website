// Each child's growth page: what they're working on (checklists by area and age band) and things to do together (activities, one-on-one time with each parent).
// Keys in the data are stored in kid_progress (migration 0020): never rename one. Add new items with new keys.
export type Domain = 'body' | 'words' | 'thinking' | 'heart' | 'faith' | 'life';
export const DOMAINS: [Domain, string, string][] = [
  ['body', 'Body', 'bike'], ['words', 'Words', 'message-circle'], ['thinking', 'Thinking', 'puzzle'], ['heart', 'Heart', 'heart'], ['faith', 'Faith', 'sun'], ['life', 'Life skills', 'shirt'],
];
export type Band = 'toddler' | 'preschool' | 'kinder' | 'middle' | 'tween' | 'teen';
export const BANDS: Band[] = ['toddler', 'preschool', 'kinder', 'middle', 'tween', 'teen'];
/** toddler 0–2, preschool 3–4, kinder 5–6, middle 7–9, tween 10–12, teen 13+. */
export const bandFor = (age: number): Band => age <= 2 ? 'toddler' : age <= 4 ? 'preschool' : age <= 6 ? 'kinder' : age <= 9 ? 'middle' : age <= 12 ? 'tween' : 'teen';
export const nextBand = (b: Band): Band | null => BANDS[BANDS.indexOf(b) + 1] ?? null;

export type Skill = { key: string; text: string };
export type Activity = {
  key: string; domain: Domain; bands: Band[]; title: string; summary: string; why: string; steps: string[];
  minutes: number; cost: 'Free' | 'Under $5' | 'Under $20'; place: 'Inside' | 'Outside' | 'Anywhere'; christian?: boolean;
};
/** One-on-one time with one parent: the same shape, domain is what it mostly helps. */
export type OneOnOne = Activity;

/** "{name}" in the catalog becomes the child's name. */
export const named = (s: string, name: string) => s.replace(/\{name\}/g, name);

/** The Monday of the week, so one-on-one picks and idea order stay put all week and change the next. */
export const mondayOf = (iso: string) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
/** The same order every time for the same seed (so lists don't jump around), a different order for a different seed. */
export function shuffled<T>(list: T[], seed: string): T[] {
  let h = 2166136261; for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out = list.slice(); for (let i = out.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
