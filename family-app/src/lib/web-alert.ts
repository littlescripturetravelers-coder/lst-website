// On the web app, React Native's Alert does nothing, so questions like "Delete this event?" use the browser's own boxes instead.
// One button: a message. Two: OK/Cancel. More: asked one at a time ("Delete this event only?", then the next choice).
import { Alert, Platform } from 'react-native';
type Btn = { text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (Alert as any).alert = (title: string, message?: string, buttons?: Btn[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const acts = (buttons || []).filter(b => b.style !== 'cancel');
    if (!buttons?.length) { window.alert(text); return; }
    if (acts.length <= 1 && buttons.length === 1) { window.alert(text); acts[0]?.onPress?.(); return; }
    if (acts.length === 1) { if (window.confirm(text + '\n\n' + (acts[0].text ?? 'OK') + '?')) acts[0].onPress?.(); else buttons.find(b => b.style === 'cancel')?.onPress?.(); return; }
    for (const b of acts) if (window.confirm(text + '\n\n' + (b.text ?? 'OK') + '?')) { b.onPress?.(); return; }
    buttons.find(b => b.style === 'cancel')?.onPress?.();
  };
}
export {};
