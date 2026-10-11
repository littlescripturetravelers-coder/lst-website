// Face ID lock for the Marriage tab, so the kids can't open it on a parent's phone.
// It locks again whenever the app goes to the background or a different tab is chosen. On by default; a parent can turn it off.
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const KEY = 'marriage-lock';
let unlocked = false; let enabled = true; let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
AsyncStorage.getItem(KEY).then(v => { enabled = v !== 'off'; loaded = true; emit(); }).catch(() => { loaded = true; emit(); });
AppState.addEventListener('change', s => { if (s === 'background' && unlocked) { unlocked = false; emit(); } });

export const lockCouple = () => { if (unlocked) { unlocked = false; emit(); } };

/** Ask for Face ID (or the iPhone passcode). Returns true when it worked. With no passcode set on the phone, it opens. */
export async function unlockCouple(reason = 'Open your Marriage section') {
  const level = await LocalAuthentication.getEnrolledLevelAsync().catch(() => LocalAuthentication.SecurityLevel.NONE);
  if (level === LocalAuthentication.SecurityLevel.NONE) { unlocked = true; emit(); return true; }
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancel', disableDeviceFallback: false });
  if (r.success) { unlocked = true; emit(); }
  return r.success;
}

/** Turning the lock off needs Face ID too, so a child can't switch it off. */
export async function setCoupleLock(on: boolean) {
  if (!on && !(await unlockCouple('Turn off the Marriage lock'))) return false;
  enabled = on; await AsyncStorage.setItem(KEY, on ? 'on' : 'off'); emit(); return true;
}

export function useCoupleLock() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick(x => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return { ready: loaded, enabled, locked: enabled && !unlocked };
}
