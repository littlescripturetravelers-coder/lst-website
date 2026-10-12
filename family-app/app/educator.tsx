import { createElement, useRef } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/text';
import { useTheme } from '@/theme/theme-provider';
const html = require('../assets/educator/family-life-educator.html');
/** The Family Life Educator chatbot, unchanged, with a window.claude shim that routes to the /educator Edge Function (streamed). */
const SHIM = (url: string, token: string, vars: Record<string, string>) => `
(function(){
  for (const k in ${JSON.stringify(vars)}) document.documentElement.style.setProperty(k, ${JSON.stringify(vars)}[k]);
  async function sample(messages, opts){ opts = opts || {};
    const r = await fetch('${url}/functions/v1/educator', { method:'POST', headers:{ 'content-type':'application/json', Authorization:'Bearer ${token}' }, body: JSON.stringify({ messages, deep: opts.modelTier === 'complex' }), signal: opts.signal });
    if (!r.ok) { let m = 'Something went wrong. Please try again.'; try { m = (await r.json()).message || m; } catch (_) {} opts.onText && opts.onText({ text: m }); return { text: m, truncated: false }; }
    const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '', stop = null;
    while (true) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line.startsWith('data:')) continue;
        const ev = JSON.parse(line.slice(5)); if (ev.type === 'content_block_delta' && ev.delta.text) { text += ev.delta.text; opts.onText && opts.onText({ text }); } if (ev.type === 'message_delta') stop = ev.delta.stop_reason; } }
    return { text, truncated: stop === 'max_tokens' };
  }
  const downloads = { save: async ({ filename, data }) => { const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(data); }); window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'save', filename, b64 })); } };
  window.claude = { use: async n => n === 'sample' ? sample : n === 'downloads' ? downloads : null };
})(); true;`;
export default function Educator() {
  const { theme: t } = useTheme(); const ref = useRef<WebView>(null);
  const uri = Asset.fromModule(html).uri;
  const token = (supabase as any).auth?.currentSession?.access_token ?? '';
  const vars = { '--bg': t.paper[1], '--ink': t.ink[1], '--muted': t.ink[3], '--line': t.paper[3], '--soft': t.paper[2], '--accent': t.brand[500], '--cta': t.gold[500], '--cta-ink': t.choice.brandOnly ? t.highlightInk : t.brand[500], '--band': t.brand[500], '--band-gold': t.onBrand.highlight, '--link': t.brand[500] };
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.brand[500] }}>
    <View style={{ flexDirection: 'row', padding: 12 }}><Text color={t.ink.inverse} onPress={() => router.back()}>‹ More</Text></View>
    {Platform.OS === 'web'
      // Web app: the same page in a frame, with the same shim added once it loads; saving a file downloads it.
      ? createElement('iframe', { src: uri, title: 'Family Life Educator', style: { flex: 1, border: 0, width: '100%', height: '100%', background: t.paper[1] },
          onLoad: (e: any) => { const w = e.target.contentWindow; if (!w) return;
            w.ReactNativeWebView = { postMessage: (msg: string) => { const m = JSON.parse(msg); if (m.type !== 'save') return; const a = w.document.createElement('a'); a.href = 'data:application/octet-stream;base64,' + m.b64; a.download = m.filename; a.click(); } };
            w.eval(SHIM(process.env.EXPO_PUBLIC_SUPABASE_URL!, token, vars)); } })
      : <WebView ref={ref} source={{ uri }} originWhitelist={['*']} allowFileAccess injectedJavaScriptBeforeContentLoaded={SHIM(process.env.EXPO_PUBLIC_SUPABASE_URL!, token, vars)}
      onMessage={async e => { const m = JSON.parse(e.nativeEvent.data); if (m.type === 'save') { const p = FileSystem.documentDirectory + m.filename; await FileSystem.writeAsStringAsync(p, m.b64, { encoding: FileSystem.EncodingType.Base64 }); await Sharing.shareAsync(p); } }} />}
  </SafeAreaView>;
}
