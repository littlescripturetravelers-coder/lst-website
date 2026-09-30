export const todayISO = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return todayISO(d); };
export const addMonths = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return todayISO(d); };
export const daysBetween = (a: string, b: string) => Math.round((+new Date(b + 'T12:00:00') - +new Date(a + 'T12:00:00')) / 864e5);
export const fmtLong = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
export const monthYear = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
export const fmtTime = (t?: string | null) => { if (!t) return ''; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };
export const fmtDay = (iso: string, today = todayISO()) => iso === today ? 'Today' : iso === addDays(today, 1) ? 'Tomorrow' : iso === addDays(today, -1) ? 'Yesterday'
  : new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export const inDays = (d: number) => d === 0 ? 'today' : d === 1 ? 'tomorrow' : d > 0 ? 'in ' + d + ' days' : d === -1 ? 'yesterday' : Math.abs(d) + ' days ago';
export const ordinal = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
