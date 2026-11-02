import { NativeModules, Platform } from 'react-native';

const { AlarmScheduler } = NativeModules;

export interface NativeAlarmSchedule {
  /** Minutes after midnight at which this alarm may run. */
  timesOfDayMinutes?: number[];
  /** Calendar weekday values: 1 (Sunday) through 7 (Saturday). */
  daysOfWeek?: number[];
  /** Tone id from SOUND_OPTIONS; 'default' rings the phone's own alarm tone. */
  soundId?: string;
}

export interface AlarmCapabilities {
  exactAlarmsAllowed: boolean;
  fullScreenIntentAllowed: boolean;
  /** "Appear on top": the alarm screen may open over other apps, not only as a popup. */
  overlayAllowed: boolean;
}

/**
 * True when the native Android alarm (plugins/withLumenAlarm) is in this build. It then owns
 * ringing for time-based reminders — on the alarm stream, over the lock screen — so the
 * expo-notifications copy is not also scheduled (that would ring twice).
 */
export function isNativeAlarmAvailable(): boolean {
  return Platform.OS === 'android' && !!AlarmScheduler?.scheduleAlarm;
}

/** A snooze gets its own alarm so it never replaces the reminder's next regular occurrence. */
export function snoozeAlarmKey(reminderId: string): string {
  return `${reminderId}::snooze`;
}

/**
 * Schedule a native Android exact alarm via AlarmManager.
 * Falls back silently on iOS or if module unavailable.
 */
export async function scheduleNativeAlarm(
  key: string,
  title: string,
  body: string,
  triggerAtMs: number,
  schedule?: NativeAlarmSchedule,
): Promise<void> {
  if (!isNativeAlarmAvailable()) return;
  try {
    await AlarmScheduler.scheduleAlarm(
      key,
      title,
      body,
      triggerAtMs,
      schedule?.timesOfDayMinutes ?? [],
      schedule?.daysOfWeek ?? [],
      schedule?.soundId ?? 'default',
    );
  } catch (e) {
    console.warn('[AlarmScheduler] scheduleAlarm failed:', e);
  }
}

/** Android 12+ exact-alarm, Android 14+ full-screen intent, and "Appear on top" access. */
export async function getAlarmCapabilities(): Promise<AlarmCapabilities> {
  if (Platform.OS !== 'android' || !AlarmScheduler?.getCapabilities) {
    return { exactAlarmsAllowed: true, fullScreenIntentAllowed: true, overlayAllowed: true };
  }
  try {
    const caps = await AlarmScheduler.getCapabilities();
    return { overlayAllowed: false, ...caps };
  } catch {
    return { exactAlarmsAllowed: false, fullScreenIntentAllowed: false, overlayAllowed: false };
  }
}

export async function openOverlaySettings(): Promise<void> {
  if (Platform.OS === 'android' && AlarmScheduler?.openOverlaySettings) {
    await AlarmScheduler.openOverlaySettings();
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS === 'android' && AlarmScheduler?.openExactAlarmSettings) {
    await AlarmScheduler.openExactAlarmSettings();
  }
}

export async function openFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS === 'android' && AlarmScheduler?.openFullScreenIntentSettings) {
    await AlarmScheduler.openFullScreenIntentSettings();
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

export async function cancelAllNativeAlarms(): Promise<void> {
  if (Platform.OS !== 'android' || !AlarmScheduler) return;
  try {
    if (typeof AlarmScheduler.cancelAllAlarms === 'function') {
      await AlarmScheduler.cancelAllAlarms();
    }
  } catch (e) {
    console.warn('[AlarmScheduler] cancelAllAlarms failed:', e);
  }
}

export async function cancelOrphanNativeAlarms(activeReminderIds: string[]): Promise<void> {
  if (Platform.OS !== 'android' || !AlarmScheduler) return;
  try {
    if (typeof AlarmScheduler.cancelOrphanAlarms === 'function') {
      await AlarmScheduler.cancelOrphanAlarms(activeReminderIds);
    }
  } catch (e) {
    console.warn('[AlarmScheduler] cancelOrphanAlarms failed:', e);
  }
}

export async function getPendingAlarm(): Promise<string | null> {
  if (Platform.OS !== 'android' || !AlarmScheduler?.getPendingAlarm) {
    return null;
  }
  try {
    return await AlarmScheduler.getPendingAlarm();
  } catch {
    return null;
  }
}
