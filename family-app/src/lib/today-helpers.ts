export { fmtLong, inDays, todayISO, fmtTime, fmtDay } from './dates';
import { fmtDay, fmtTime } from './dates';
export const fmtWhen = (r: { due_date?: string | null; due_time?: string | null }) => r.due_date ? fmtDay(r.due_date) + (r.due_time ? ', ' + fmtTime(r.due_time.slice(0, 5)) : '') : '';
