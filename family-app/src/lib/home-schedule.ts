// Home upkeep schedule: daily dishes + laundry, a weekday cleaning focus, and seasonal house/yard tasks timed for the family's climate (from their state).
// Status is recomputed from home_task_log, so it keeps working year after year. Mirrors ../../ui_kits/family-app/home.jsx.
import { daysBetween, addDays } from './dates';
export type Freq = { type: 'daily' } | { type: 'weekday'; days: number[]; months?: number[] } | { type: 'every'; days: number; months?: number[] } | { type: 'months'; months: number[] };
export type HomeTask = { id: string; cat: string; title: string; icon: string; freq: Freq; why?: string; seasonal?: boolean };
export const HOME_CATS: Record<string, [string, string, string]> = { daily: ['Every day', 'repeat', 'var(--brand-500)'], clean: ['Cleaning', 'sparkles', 'var(--area-home)'], kitchen: ['Kitchen', 'utensils', 'var(--area-girls)'], yard: ['Yard', 'trees', 'var(--area-money)'], vehicle: ['Vehicles', 'car', 'var(--area-growth)'], systems: ['House systems', 'wrench', 'var(--area-health)'], kids: ['Kids’ chores', 'star', 'var(--area-faith)'] };
export const WEEKDAY_FOCUS: [string, string, string[]][] = [
  ['Sunday', 'Rest & reset', ['10-minute family tidy', 'Plan the week’s meals', 'Set out church clothes']],
  ['Monday', 'Kitchen', ['Wipe counters, stovetop and appliances', 'Clean out the fridge', 'Take out trash and recycling']],
  ['Tuesday', 'Bathrooms', ['Scrub toilets, sinks and mirrors', 'Wipe showers and tubs', 'Swap towels and bath mats']],
  ['Wednesday', 'Dust & surfaces', ['Dust shelves, TV and ceiling fans', 'Wipe light switches and door handles', 'Clear the “drop zone” by the door']],
  ['Thursday', 'Floors', ['Vacuum all rooms', 'Mop kitchen and bathrooms', 'Shake out entry rugs']],
  ['Friday', 'Bedrooms', ['Wash sheets and make beds', 'Tidy closets and drawers', 'Empty all trash cans']],
  ['Saturday', 'Outside & car', ['Sweep porch and entry', 'Clean out the car', 'Water plants and pull weeds']],
];
export const HOME_TASKS: HomeTask[] = [
  { id: 'dishes', cat: 'daily', title: 'Dishes', icon: 'utensils', freq: { type: 'daily' }, why: 'Run and empty the dishwasher; hand-wash pots; sink clear before bed.' },
  { id: 'laundry', cat: 'daily', title: 'Laundry', icon: 'shirt', freq: { type: 'daily' }, why: 'One load a day: wash, dry, fold and put away so it never piles up.' },
  { id: 'reset', cat: 'daily', title: '10-minute evening reset', icon: 'timer', freq: { type: 'daily' }, why: 'Everyone picks up for 10 minutes before bedtime.' },
  { id: 'trash-day', cat: 'clean', title: 'Trash cans to the curb', icon: 'trash-2', freq: { type: 'weekday', days: [3] }, why: 'Night before pickup.' },
  { id: 'fridge', cat: 'kitchen', title: 'Toss old food and wipe fridge shelves', icon: 'refrigerator', freq: { type: 'every', days: 7 } },
  { id: 'dw-filter', cat: 'kitchen', title: 'Clean dishwasher filter', icon: 'filter', freq: { type: 'every', days: 30 } },
  { id: 'disposal', cat: 'kitchen', title: 'Freshen garbage disposal (ice + lemon)', icon: 'droplets', freq: { type: 'every', days: 30 } },
  { id: 'oven', cat: 'kitchen', title: 'Deep clean oven and microwave', icon: 'flame', freq: { type: 'every', days: 90 } },
  { id: 'hvac-filter', cat: 'systems', title: 'Replace furnace/AC filter', icon: 'wind', freq: { type: 'every', days: 60 }, why: 'Every 1–3 months; monthly in allergy season.' },
  { id: 'smoke', cat: 'systems', title: 'Test smoke and CO detectors', icon: 'siren', freq: { type: 'every', days: 30 }, why: 'Press test on each one; replace batteries yearly.' },
  { id: 'gfci', cat: 'systems', title: 'Test GFCI outlets', icon: 'plug', freq: { type: 'every', days: 180 } },
  { id: 'water-heater', cat: 'systems', title: 'Flush water heater', icon: 'thermometer', freq: { type: 'every', days: 365 } },
  { id: 'dryer-vent', cat: 'systems', title: 'Clean dryer vent duct', icon: 'fan', freq: { type: 'every', days: 365 }, why: 'Prevents dryer fires and speeds drying.' },
  { id: 'extinguisher', cat: 'systems', title: 'Check fire extinguisher gauge', icon: 'shield-check', freq: { type: 'every', days: 365 } },
  { id: 'caulk', cat: 'systems', title: 'Check caulk around tubs, sinks and windows', icon: 'scan-search', freq: { type: 'every', days: 365 } },
  { id: 'weeds', cat: 'yard', title: 'Pull weeds in beds', icon: 'sprout', freq: { type: 'every', days: 14, months: [4, 5, 6, 7, 8, 9] } },
  { id: 'vents', cat: 'clean', title: 'Vacuum vents and baseboards', icon: 'wind', freq: { type: 'every', days: 90 } },
  { id: 'mattress', cat: 'clean', title: 'Rotate mattresses, wash pillows', icon: 'bed', freq: { type: 'every', days: 180 } },
];
const T = (id: string, title: string, icon: string, months: number[], why = '', cat = 'yard'): HomeTask => ({ id, title, icon, cat, freq: { type: 'months', months }, why, seasonal: true });
const MOW = (months: number[]): HomeTask => ({ id: 'mow', title: 'Mow and edge the lawn', icon: 'trees', cat: 'yard', freq: { type: 'weekday', days: [6], months }, seasonal: true });
export const COMMON: HomeTask[] = [T('windows', 'Wash windows and screens', 'app-window', [4, 9], 'Spring and fall.', 'clean'), T('furnace-svc', 'Furnace tune-up', 'heater', [9, 10], 'Before the first cold night.', 'systems'), T('smoke-batt', 'Replace smoke detector batteries', 'siren', [11], 'Pair it with the time change.', 'systems')];
export const CLIMATES: Record<string, { name: string; blurb: string; tasks: HomeTask[] }> = {
  mountain: { name: 'Mountain West', blurb: 'Cold, snowy winters · hot, dry summers', tasks: [MOW([5, 6, 7, 8, 9, 10]),
    T('sprinklers-on', 'Start up sprinklers and check heads', 'droplets', [4, 5], 'After the last hard freeze (usually early May).'), T('sprinklers-off', 'Blow out sprinkler lines', 'snowflake', [10], 'Before the first hard freeze, usually mid-October.'),
    T('hoses', 'Disconnect hoses and cover spigots', 'droplet', [10], 'Frozen hose bibs crack pipes inside the wall.', 'systems'), T('ac-svc', 'AC or evaporative cooler service', 'air-vent', [5], 'Before the first 90° week.', 'systems'),
    T('swamp-off', 'Drain and cover the evaporative cooler', 'fan', [9, 10], 'Skip if you don’t have one.', 'systems'), T('snow-gear', 'Snow shovels, ice melt, snowblower tune-up', 'snowflake', [11]),
    T('aerate', 'Aerate the lawn', 'sprout', [4, 9]), T('fertilize', 'Fertilize (winterizer in October)', 'leaf', [4, 6, 9, 10]), T('trim', 'Prune trees and shrubs while dormant', 'scissors', [2, 3]),
    T('window-wells', 'Clear window wells and check drainage', 'house', [4]), T('gutters', 'Clean gutters and downspouts', 'house', [5, 10]), T('roof-snow', 'Check roof and gutters after heavy snow', 'house', [3]),
    T('radon', 'Radon test (every 2 years)', 'shield-check', [1], 'High-radon region. Kits are cheap at hardware stores.', 'systems'), T('defensible', 'Clear brush for wildfire defensible space', 'flame', [6], 'Especially near foothills.')] },
  north: { name: 'Northern / Great Lakes', blurb: 'Long, cold winters · humid summers', tasks: [MOW([5, 6, 7, 8, 9, 10]),
    T('sprinklers-off', 'Winterize sprinklers and outdoor faucets', 'snowflake', [10]), T('sump', 'Test the sump pump', 'waves', [3, 9], 'Pour a bucket in the pit and make sure it kicks on.', 'systems'),
    T('ice-dams', 'Check for ice dams and attic frost', 'snowflake', [1, 2], '', 'systems'), T('pipes', 'Insulate exposed pipes', 'thermometer', [11], '', 'systems'), T('generator', 'Test generator / outage kit', 'battery-charging', [11], '', 'systems'),
    T('storm-windows', 'Swap screens for storm windows', 'app-window', [10], '', 'clean'), T('ac-svc', 'AC tune-up', 'air-vent', [5], '', 'systems'), T('gutters', 'Clean gutters', 'house', [5, 11]),
    T('leaves', 'Rake leaves', 'leaf', [10, 11]), T('snow-gear', 'Snow gear ready', 'snowflake', [11]), T('fertilize', 'Fertilize lawn', 'leaf', [5, 9])] },
  mixed: { name: 'Four seasons, mild winters', blurb: 'Hot summers · short winters · storms', tasks: [MOW([4, 5, 6, 7, 8, 9, 10]),
    T('ac-svc', 'AC tune-up', 'air-vent', [4], '', 'systems'), T('overseed', 'Overseed fescue lawn', 'sprout', [9]), T('storm-kit', 'Check tornado / storm shelter kit', 'cloud-lightning', [3], '', 'systems'),
    T('termite', 'Termite inspection', 'bug', [4], '', 'systems'), T('gutters', 'Clean gutters', 'house', [4, 11]), T('hoses', 'Disconnect hoses', 'droplet', [11], '', 'systems'), T('leaves', 'Rake leaves', 'leaf', [11])] },
  south: { name: 'Gulf & Southeast', blurb: 'Hot, humid · hurricane season Jun–Nov', tasks: [MOW([3, 4, 5, 6, 7, 8, 9, 10, 11]),
    T('hurricane', 'Hurricane kit, shutters and evacuation plan', 'wind', [5, 6], 'Season runs June 1 – November 30.', 'systems'), T('trim-storm', 'Trim trees away from the roof before storms', 'scissors', [5]),
    T('ac-svc', 'AC tune-up and clear the condensate line', 'air-vent', [3], '', 'systems'), T('mold', 'Check for mold and run a dehumidifier', 'droplets', [7, 8], '', 'systems'),
    T('termite', 'Termite and pest inspection', 'bug', [4], '', 'systems'), T('roof-storm', 'Check roof after storm season', 'house', [11]), T('gutters', 'Clean gutters', 'house', [11])] },
  desert: { name: 'Desert Southwest', blurb: 'Very hot summers · monsoon · mild winters', tasks: [MOW([4, 5, 6, 7, 8, 9, 10]),
    T('ac-svc', 'AC tune-up before the heat', 'air-vent', [3], '', 'systems'), T('evap-on', 'Start up the evaporative cooler', 'fan', [4], '', 'systems'), T('evap-off', 'Shut down the evaporative cooler', 'fan', [10], '', 'systems'),
    T('monsoon', 'Check roof seals and drains before monsoon', 'cloud-rain', [6], '', 'systems'), T('scorpions', 'Pest and scorpion treatment', 'bug', [4, 9], '', 'systems'),
    T('drip', 'Change drip irrigation schedule for the season', 'droplets', [4, 10]), T('overseed', 'Overseed winter rye', 'sprout', [10]), T('freeze', 'Cover pipes and plants on freeze nights', 'snowflake', [12, 1], '', 'systems')] },
  pnw: { name: 'Pacific Northwest', blurb: 'Mild, wet winters · dry summers', tasks: [MOW([3, 4, 5, 6, 7, 8, 9, 10]),
    T('moss', 'Remove moss from the roof and walkways', 'cloud-drizzle', [3]), T('gutters', 'Clean gutters (heavy leaf fall)', 'house', [3, 11]), T('crawlspace', 'Check crawlspace moisture and run a dehumidifier', 'droplets', [11], '', 'systems'),
    T('drainage', 'Check yard drainage and downspouts', 'waves', [10]), T('outage', 'Storm power-outage kit', 'battery-charging', [11], '', 'systems'), T('deck', 'Pressure wash and seal the deck', 'hammer', [6, 7])] },
  california: { name: 'California', blurb: 'Dry summers · wildfire season · earthquakes', tasks: [MOW([3, 4, 5, 6, 7, 8, 9, 10, 11]),
    T('defensible', 'Clear 100 ft of defensible space', 'flame', [4, 5], 'Before fire season.'), T('roof-debris', 'Clear roof and gutter debris', 'house', [9]), T('quake', 'Check earthquake kit and strap the water heater', 'activity', [3], '', 'systems'),
    T('irrigation', 'Set drought-friendly irrigation schedule', 'droplets', [4]), T('smoke-filters', 'Stock high-MERV filters for smoke days', 'wind', [8], '', 'systems'), T('ac-svc', 'AC tune-up', 'air-vent', [4], '', 'systems')] },
};
export const STATE_CLIMATE: Record<string, string> = { UT: 'mountain', CO: 'mountain', ID: 'mountain', MT: 'mountain', WY: 'mountain', AZ: 'desert', NV: 'desert', NM: 'desert', CA: 'california', WA: 'pnw', OR: 'pnw',
  ND: 'north', SD: 'north', NE: 'north', MN: 'north', WI: 'north', MI: 'north', IA: 'north', IL: 'north', IN: 'north', OH: 'north', PA: 'north', NY: 'north', VT: 'north', NH: 'north', ME: 'north', MA: 'north', CT: 'north', RI: 'north', NJ: 'north', AK: 'north',
  KS: 'mixed', MO: 'mixed', OK: 'mixed', AR: 'mixed', KY: 'mixed', TN: 'mixed', VA: 'mixed', WV: 'mixed', NC: 'mixed', MD: 'mixed', DE: 'mixed', DC: 'mixed',
  TX: 'south', LA: 'south', MS: 'south', AL: 'south', GA: 'south', SC: 'south', FL: 'south', HI: 'south' };
export const climateFor = (state?: string | null) => CLIMATES[STATE_CLIMATE[state ?? ''] ?? 'mixed'];
export const allHomeTasks = (state?: string | null) => [...HOME_TASKS, ...COMMON, ...climateFor(state).tasks];
export const VEHICLE_TASKS: { id: string; title: string; icon: string; miles?: number; days?: number; months?: number[]; yearlyOn?: string }[] = [
  { id: 'oil', title: 'Oil change', icon: 'droplet', miles: 5000, days: 180 },
  { id: 'rotate', title: 'Rotate tires', icon: 'circle-dot', miles: 6000, days: 180 },
  { id: 'pressure', title: 'Check tire pressure', icon: 'gauge', days: 30 },
  { id: 'fluids', title: 'Top off washer fluid, check coolant', icon: 'droplets', days: 30 },
  { id: 'wipers', title: 'Replace wiper blades', icon: 'wind', days: 365 },
  { id: 'air-filter', title: 'Engine air filter', icon: 'filter', miles: 15000, days: 365 },
  { id: 'cabin-filter', title: 'Cabin air filter', icon: 'fan', miles: 15000, days: 365 },
  { id: 'brakes', title: 'Brake inspection', icon: 'octagon-alert', miles: 12000, days: 365 },
  { id: 'battery', title: 'Test battery before winter', icon: 'battery-medium', months: [10] },
  { id: 'registration', title: 'Renew registration', icon: 'file-badge', yearlyOn: 'reg' },
  { id: 'wash', title: 'Wash and vacuum', icon: 'sparkles', days: 14 },
];
export const KID_CHORES: { min: number; list: string[] }[] = [
  { min: 2, list: ['Put toys in the bin', 'Put dirty clothes in the hamper', 'Help feed a pet'] },
  { min: 4, list: ['Make bed (with help)', 'Set napkins and spoons', 'Match socks', 'Water a plant'] },
  { min: 5, list: ['Make bed', 'Set and clear the table', 'Sort laundry by color', 'Wipe the bathroom sink'] },
  { min: 7, list: ['Load the dishwasher', 'Fold and put away laundry', 'Vacuum one room', 'Take out small trash cans'] },
  { min: 10, list: ['Wash dishes', 'Run a load of laundry', 'Clean a bathroom', 'Help cook dinner'] },
  { min: 13, list: ['Mow the lawn', 'Cook a family meal', 'Wash the car', 'Deep clean the kitchen'] },
];
export const choresFor = (age: number) => KID_CHORES.filter(k => age >= k.min).flatMap(k => k.list);
export const KID_SECTIONS: [string, string, string][] = [['chores', 'My chores', 'list-checks'], ['calendar', 'My calendar', 'calendar'], ['story', 'Tonight’s story activity', 'book-open'], ['feelings', 'Feelings check-in', 'smile'], ['ideas', 'Fun ideas', 'sparkles'], ['reminders', 'My reminders', 'bell']];
export function taskDue(task: HomeTask, last: string | null | undefined, iso: string) {
  const f: any = task.freq, m = Number(iso.slice(5, 7)), dow = new Date(iso + 'T12:00:00').getDay();
  if (f.months && f.type !== 'months' && !f.months.includes(m)) return false;
  if (f.type === 'daily') return true;
  if (f.type === 'weekday') return f.days.includes(dow);
  if (f.type === 'every') return !last || daysBetween(last, iso) >= f.days;
  if (f.type === 'months') return f.months.includes(m) && (!last || daysBetween(last, iso) > 60);
  return false;
}
export function vehicleDue(v: { miles: number; reg_due?: string | null }, t: typeof VEHICLE_TASKS[number], last: { date: string; miles?: number } | undefined, iso: string) {
  if (t.yearlyOn) return !!v.reg_due && daysBetween(iso, v.reg_due) <= 30;
  if (t.months) return t.months.includes(Number(iso.slice(5, 7))) && (!last || daysBetween(last.date, iso) > 60);
  if (!last) return true;
  return (!!t.days && daysBetween(last.date, iso) >= t.days) || (!!t.miles && last.miles != null && v.miles - last.miles >= t.miles - 300);
}
