import * as L from 'lucide-react-native';
import { useTheme } from '@/theme/theme-provider';
const pascal = (n: string) => n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
/** Lucide icon by kebab-case name (same names as the design system). */
export function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const { theme } = useTheme(); const C = (L as any)[pascal(name)] ?? L.Sparkles;
  return <C size={size} color={color ?? theme.ink[2]} strokeWidth={2} />;
}
