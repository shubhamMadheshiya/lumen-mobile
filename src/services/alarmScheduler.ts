import { NativeModules, Platform } from 'react-native';

const { AlarmScheduler } = NativeModules;

/**
 * Schedule a native Android exact alarm via AlarmManager.
 * Falls back silently on iOS or if module unavailable.
 */
export async function scheduleNativeAlarm(
  reminderId: string,
  title: string,
  body: string,
  triggerAtMs: number,
): Promise<void> {
  if (Platform.OS !== 'android' || !AlarmScheduler) return;
  try {
    await AlarmScheduler.scheduleAlarm(reminderId, title, body, triggerAtMs);
  } catch (e) {
    console.warn('[AlarmScheduler] scheduleAlarm failed:', e);
  }
}

export async function cancelNativeAlarm(reminderId: string): Promise<void> {
  if (Platform.OS !== 'android' || !AlarmScheduler) return;
  try {
    await AlarmScheduler.cancelAlarm(reminderId);
  } catch (e) {
    console.warn('[AlarmScheduler] cancelAlarm failed:', e);
  }
}
