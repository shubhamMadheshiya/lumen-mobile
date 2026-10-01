/**
 * Production Notification & Reminder Service for Lumen.
 * - Manages local notification scheduling (One-time, Daily, Weekly, Custom Days, Interval, Inactivity, Snooze).
 * - Interactive action categories (Water quick log, Start walking, Stand up, Bedtime).
 * - Background action response handling that integrates directly into the Tracking Engine.
 * - Guaranteed Android notification channel initialization with High Importance & Sound.
 * - Test alarm function for instant verification.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { IReminder, WeekDay } from '@lumen/shared';
import { api } from '../api/client';
import { useQuickLogStore } from '../store/quickLogStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let N: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  N = require('expo-notifications');
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Graceful fallback for environments where expo-notifications is not available
}

const MAPPING_KEY = 'lumen:notif:mapping_v2'; // { reminderId: string[] (notificationIds) }
const CHANNEL_ID = 'lumen-reminders-v2';

export const NOTIF_CATEGORIES = {
  WATER: 'lumen_category_water',
  WALK: 'lumen_category_walk',
  STAND: 'lumen_category_stand',
  SLEEP: 'lumen_category_sleep',
  DEFAULT: 'lumen_category_default',
};

export const NOTIF_ACTIONS = {
  LOG_250ML: 'action_log_250ml',
  LOG_500ML: 'action_log_500ml',
  START_WALK: 'action_start_walk',
  IM_MOVING: 'action_im_moving',
  START_SLEEP: 'action_start_sleep',
  SNOOZE_10: 'action_snooze_10',
  SNOOZE_15: 'action_snooze_15',
  DISMISS: 'action_dismiss',
};

/**
 * Configure actionable interactive categories in native OS.
 */
export async function setupNotificationCategories(): Promise<void> {
  if (!N || typeof N.setNotificationCategoryAsync !== 'function') return;

  try {
    await Promise.all([
      N.setNotificationCategoryAsync(NOTIF_CATEGORIES.WATER, [
        { identifier: NOTIF_ACTIONS.LOG_250ML, buttonTitle: '💧 +250 ml', options: { opensAppToForeground: false } },
        { identifier: NOTIF_ACTIONS.LOG_500ML, buttonTitle: '💧 +500 ml', options: { opensAppToForeground: false } },
        { identifier: NOTIF_ACTIONS.SNOOZE_10, buttonTitle: '⏱ Snooze 10m', options: { opensAppToForeground: false } },
      ]),
      N.setNotificationCategoryAsync(NOTIF_CATEGORIES.WALK, [
        { identifier: NOTIF_ACTIONS.START_WALK, buttonTitle: '🚶 Start Walking', options: { opensAppToForeground: true } },
        { identifier: NOTIF_ACTIONS.SNOOZE_15, buttonTitle: '⏱ Snooze 15m', options: { opensAppToForeground: false } },
      ]),
      N.setNotificationCategoryAsync(NOTIF_CATEGORIES.STAND, [
        { identifier: NOTIF_ACTIONS.IM_MOVING, buttonTitle: '🧍 I’m Moving', options: { opensAppToForeground: false } },
        { identifier: NOTIF_ACTIONS.SNOOZE_10, buttonTitle: '⏱ Snooze 10m', options: { opensAppToForeground: false } },
      ]),
      N.setNotificationCategoryAsync(NOTIF_CATEGORIES.SLEEP, [
        { identifier: NOTIF_ACTIONS.START_SLEEP, buttonTitle: '😴 Start Sleep', options: { opensAppToForeground: true } },
        { identifier: NOTIF_ACTIONS.SNOOZE_15, buttonTitle: '⏱ Snooze 15m', options: { opensAppToForeground: false } },
      ]),
    ]);
  } catch (err) {
    console.warn('[Notifications] Failed to setup categories:', err);
  }
}

/**
 * Ensure the Android notification channel exists with MAX importance, vibration, sound, and lights.
 * Required for Android 8.0+ (API 26+) for audible reminder alarms.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (!N || Platform.OS !== 'android' || typeof N.setNotificationChannelAsync !== 'function') return;
  try {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lumen Reminders & Alarms',
      description: 'Daily and scheduled alarms for hydration, medications, and wellness checks',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to ensure Android notification channel:', err);
  }
}

/**
 * Request notification permissions and register the Android channel.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!N) return false;
  try {
    await ensureNotificationChannel();

    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') {
      await setupNotificationCategories();
      return true;
    }

    const { status } = await N.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (status !== 'granted') return false;

    await ensureNotificationChannel();
    await setupNotificationCategories();
    return true;
  } catch {
    return false;
  }
}

async function loadMapping(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(MAPPING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMapping(map: Record<string, string[]>): Promise<void> {
  try {
    await AsyncStorage.setItem(MAPPING_KEY, JSON.stringify(map));
  } catch {}
}

const WEEKDAY_TO_NUMBER: Record<WeekDay, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

function resolveCategory(category: string): string {
  switch (category) {
    case 'HYDRATION': return NOTIF_CATEGORIES.WATER;
    case 'MOVEMENT': return NOTIF_CATEGORIES.STAND;
    case 'EXERCISE': return NOTIF_CATEGORIES.WALK;
    case 'SLEEP': return NOTIF_CATEGORIES.SLEEP;
    default: return NOTIF_CATEGORIES.DEFAULT;
  }
}

function parseTime(timeStr?: string, defaultH = 9, defaultM = 0): { hour: number; minute: number } {
  if (!timeStr) return { hour: defaultH, minute: defaultM };
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return {
    hour: isNaN(h) ? defaultH : Math.min(23, Math.max(0, h)),
    minute: isNaN(m) ? defaultM : Math.min(59, Math.max(0, m)),
  };
}

/**
 * Schedule a reminder into native notification triggers with sound, vibration, and channels.
 */
export async function scheduleReminder(reminder: IReminder): Promise<void> {
  if (!N) return;

  await ensureNotificationChannel();
  const map = await loadMapping();

  // Cancel any existing scheduled notifications for this reminder ID
  if (map[reminder._id] && Array.isArray(map[reminder._id])) {
    for (const notifId of map[reminder._id]) {
      await N.cancelScheduledNotificationAsync(notifId).catch(() => {});
    }
    delete map[reminder._id];
  }

  // If reminder is disabled or archived, save cleared mapping and exit
  if ((!reminder.enabled && reminder.isActive !== true) || !!reminder.archivedAt) {
    await saveMapping(map);
    return;
  }

  const categoryId = resolveCategory(reminder.category);
  const scheduledIds: string[] = [];

  const commonContent = {
    title: reminder.notificationTitle || reminder.name,
    body: reminder.notificationMessage || reminder.message || 'Scheduled Reminder',
    data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
    categoryIdentifier: categoryId,
    sound: 'default',
    priority: 'max',
    vibrate: [0, 250, 250, 250],
    ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
  };

  try {
    const scheduleType = reminder.scheduleType || 'DAILY';

    // 1. ONE-TIME
    if (scheduleType === 'ONE_TIME' && (reminder.targetDate || reminder.targetTime)) {
      const dateStr = reminder.targetDate || new Date().toISOString().slice(0, 10);
      const { hour, minute } = parseTime(reminder.targetTime, 9, 0);
      const targetDate = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

      // If time has passed today, schedule for tomorrow
      if (targetDate.getTime() <= Date.now()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const id = await N.scheduleNotificationAsync({
        content: commonContent,
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
      scheduledIds.push(id);
    }
    // 2. DAILY
    else if (scheduleType === 'DAILY' || (reminder.type === 'time' && reminder.schedule)) {
      const { hour, minute } = parseTime(reminder.targetTime || reminder.schedule, 9, 0);

      const id = await N.scheduleNotificationAsync({
        content: commonContent,
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
      scheduledIds.push(id);
    }
    // 3. WEEKLY / CUSTOM DAYS
    else if ((scheduleType === 'WEEKLY' || scheduleType === 'CUSTOM_DAYS') && reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
      const { hour, minute } = parseTime(reminder.targetTime, 9, 0);

      for (const day of reminder.daysOfWeek) {
        const weekday = WEEKDAY_TO_NUMBER[day] || 2;
        const id = await N.scheduleNotificationAsync({
          content: {
            ...commonContent,
            body: reminder.notificationMessage || 'Time for your scheduled routine',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            repeats: true,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          },
        });
        scheduledIds.push(id);
      }
    }
    // 4. INTERVAL (e.g. 08:00 to 22:00 every X minutes)
    else if (scheduleType === 'INTERVAL') {
      const intervalMin = Math.max(15, reminder.intervalMinutes || 60);
      const { hour: startH, minute: startM } = parseTime(reminder.windowStartTime, 8, 0);
      const { hour: endH, minute: endM } = parseTime(reminder.windowEndTime, 22, 0);

      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;

      for (let m = startTotalMinutes; m <= endTotalMinutes; m += intervalMin) {
        const slotHour = Math.floor(m / 60);
        const slotMinute = m % 60;

        const id = await N.scheduleNotificationAsync({
          content: {
            ...commonContent,
            body: reminder.notificationMessage || 'Hydration & Movement check-in',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour: slotHour,
            minute: slotMinute,
            repeats: true,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          },
        });
        scheduledIds.push(id);
      }
    }
    // 5. INACTIVITY / STAND
    else if (scheduleType === 'INACTIVITY' || reminder.type === 'inactivity') {
      const thresholdMinutes = reminder.inactivityThresholdMinutes || reminder.inactivityMinutes || 45;
      const seconds = Math.max(60, thresholdMinutes * 60);

      const id = await N.scheduleNotificationAsync({
        content: {
          ...commonContent,
          title: reminder.notificationTitle || 'Time to Stand & Move',
          body: reminder.notificationMessage || 'You’ve been resting for a while. Take a light movement break.',
          categoryIdentifier: NOTIF_CATEGORIES.STAND,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: true,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
      scheduledIds.push(id);
    }

    if (scheduledIds.length > 0) {
      map[reminder._id] = scheduledIds;
    }
  } catch (err) {
    console.warn('[Notifications] Scheduling error for reminder:', reminder.name, err);
  }

  await saveMapping(map);
}

/**
 * Snooze a reminder by scheduling an audible notification in X minutes.
 */
export async function snoozeReminder(
  reminderId: string,
  snoozeMinutes: number = 10,
  title?: string,
  message?: string
): Promise<void> {
  if (!N) return;

  await ensureNotificationChannel();

  try {
    await N.scheduleNotificationAsync({
      content: {
        title: title ? `⏱ (Snoozed) ${title}` : '⏱ Reminder Snoozed',
        body: message || `Snoozed for ${snoozeMinutes} minutes`,
        data: { reminderId, isSnoozed: true },
        sound: 'default',
        priority: 'max',
        vibrate: [0, 250, 250, 250],
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, snoozeMinutes * 60),
        repeats: false,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });

    // Notify backend
    api.post(`/reminders/${reminderId}/snooze`, { snoozeMinutes }).catch(() => {});
  } catch (err) {
    console.warn('[Notifications] Snooze error:', err);
  }
}

/**
 * Fires a test notification in 3 seconds so the user can verify sound and banner.
 */
export async function sendTestReminderNotification(): Promise<boolean> {
  if (!N) return false;

  await requestNotificationPermissions();
  await ensureNotificationChannel();

  try {
    await N.scheduleNotificationAsync({
      content: {
        title: '🔔 Lumen Alarm Test',
        body: 'Your reminder alarms, sound, and notifications are working properly! 🎉',
        sound: 'default',
        priority: 'max',
        vibrate: [0, 250, 250, 250],
        categoryIdentifier: NOTIF_CATEGORIES.WATER,
        data: { test: true },
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
        repeats: false,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return true;
  } catch (err) {
    console.error('[Notifications] Failed to send test notification:', err);
    return false;
  }
}

/**
 * Diagnostic check of notification and alarm system.
 */
export async function checkNotificationAlarmStatus(): Promise<{
  isSupported: boolean;
  hasPermission: boolean;
  channelConfigured: boolean;
  scheduledCount: number;
}> {
  if (!N) {
    return {
      isSupported: false,
      hasPermission: false,
      channelConfigured: false,
      scheduledCount: 0,
    };
  }

  try {
    const { status } = await N.getPermissionsAsync();
    const hasPermission = status === 'granted';

    let channelConfigured = true;
    if (Platform.OS === 'android' && typeof N.getNotificationChannelAsync === 'function') {
      const channel = await N.getNotificationChannelAsync(CHANNEL_ID);
      channelConfigured = !!channel;
    }

    const scheduled = typeof N.getAllScheduledNotificationsAsync === 'function'
      ? await N.getAllScheduledNotificationsAsync()
      : [];

    return {
      isSupported: true,
      hasPermission,
      channelConfigured,
      scheduledCount: scheduled.length,
    };
  } catch {
    return {
      isSupported: true,
      hasPermission: false,
      channelConfigured: false,
      scheduledCount: 0,
    };
  }
}

/**
 * Cancels all scheduled native notifications for a given reminder ID.
 */
export async function cancelReminder(reminderId: string): Promise<void> {
  const map = await loadMapping();
  if (map[reminderId] && Array.isArray(map[reminderId])) {
    if (N && typeof N.cancelScheduledNotificationAsync === 'function') {
      for (const id of map[reminderId]) {
        await N.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }
    delete map[reminderId];
    await saveMapping(map);
  }
}

/**
 * Handle notification action button interactions.
 */
export async function handleNotificationActionResponse(response: any): Promise<void> {
  const actionIdentifier = response.actionIdentifier;
  const data = response.notification.request.content.data || {};
  const reminderId = data.reminderId;

  // Log action completion to backend
  if (reminderId) {
    api.post(`/reminders/${reminderId}/event`, {
      status: 'COMPLETED',
      actionTaken: actionIdentifier,
    }).catch(() => {});
  }

  switch (actionIdentifier) {
    case NOTIF_ACTIONS.LOG_250ML:
      if (data.linkedQuickActionId) {
        useQuickLogStore.getState().tap(data.linkedQuickActionId);
      }
      break;

    case NOTIF_ACTIONS.LOG_500ML:
      if (data.linkedQuickActionId) {
        useQuickLogStore.getState().tap(data.linkedQuickActionId);
      }
      break;

    case NOTIF_ACTIONS.START_WALK:
      router.push('/walking/active');
      break;

    case NOTIF_ACTIONS.START_SLEEP:
      router.push('/(tabs)/today');
      break;

    case NOTIF_ACTIONS.IM_MOVING:
      if (data.linkedQuickActionId) {
        useQuickLogStore.getState().tap(data.linkedQuickActionId);
      }
      break;

    case NOTIF_ACTIONS.SNOOZE_10:
      if (reminderId) {
        await snoozeReminder(reminderId, 10);
      }
      break;

    case NOTIF_ACTIONS.SNOOZE_15:
      if (reminderId) {
        await snoozeReminder(reminderId, 15);
      }
      break;

    default:
      // Default notification body tap
      if (data.linkedQuickActionId) {
        router.push('/(tabs)/today');
      }
      break;
  }
}

export async function syncReminders(reminders: IReminder[]): Promise<void> {
  for (const r of reminders) {
    await scheduleReminder(r);
  }
}
