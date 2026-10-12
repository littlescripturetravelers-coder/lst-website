// Web app (Safari, Add to Home Screen): a plain date or time field that opens Safari's own picker, with the same props the app uses.
import { createElement } from 'react';
import { useTheme } from '@/theme/theme-provider';
const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
type Props = { value: Date; mode?: 'date' | 'time'; minimumDate?: Date; onChange?: (e: unknown, d?: Date) => void; [k: string]: unknown };
export default function DateTimePicker({ value, mode = 'date', minimumDate, onChange }: Props) {
  const { theme: t } = useTheme();
  const v = mode === 'time' ? pad(value.getHours()) + ':' + pad(value.getMinutes()) : isoDate(value);
  return createElement('input', {
    type: mode, value: v, min: mode === 'date' && minimumDate ? isoDate(minimumDate) : undefined,
    onChange: (e: { target: { value: string } }) => { const x = e.target.value; if (!x) return; const d = new Date(value);
      if (mode === 'time') { const [h, m] = x.split(':').map(Number); d.setHours(h, m, 0, 0); } else { const [y, mo, da] = x.split('-').map(Number); d.setFullYear(y, mo - 1, da); }
      onChange?.({ type: 'set' }, d); },
    style: { font: 'inherit', fontSize: 16, padding: '6px 10px', borderRadius: 8, border: '1px solid ' + t.line[2], background: t.paper[2], color: t.ink[1], fontFamily: t.font.body },
  });
}
