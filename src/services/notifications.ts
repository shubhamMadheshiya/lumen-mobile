/**
 * Production Notification & Reminder Service for Lumen.
 * - Manages local notification scheduling (One-time, Daily, Weekly, Custom Days, Interval, Snooze).
 * - Interactive action categories (Water quick log, Start walking, Stand up, Bedtime).
 * - Background action response handling that integrates directly into the Tracking Engine.
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
    }),
  });
} catch {
  // Graceful fallback for Expo Go / mock environments
}

const MAPPING_KEY = 'lumen:notif:mapping_v2'; // { reminderId: string[] (notificationIds) }

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
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') {
      await setupNotificationCategories();
      return true;
    }
    const { status } = await N.requestPermissionsAsync();
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('lumen-reminders-v2', {
        name: 'Lumen Reminders',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

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

/**
 * Schedule a generic or specific reminder rule into native notification triggers.
 */
export async function scheduleReminder(reminder: IReminder): Promise<void> {
  if (!N) return;

  const map = await loadMapping();

  // Cancel any existing scheduled notifications for this reminder ID
  if (map[reminder._id] && Array.isArray(map[reminder._id])) {
    for (const notifId of map[reminder._id]) {
      await N.cancelScheduledNotificationAsync(notifId).catch(() => {});
    }
    delete map[reminder._id];
  }

  // If reminder is disabled, save cleared mapping and exit
  if (!reminder.enabled && reminder.isActive !== true) {
    await saveMapping(map);
    return;
  }

  const categoryId = resolveCategory(reminder.category);
  const scheduledIds: string[] = [];

  try {
    const scheduleType = reminder.scheduleType || 'DAILY';

    // 1. ONE-TIME
    if (scheduleType === 'ONE_TIME' && (reminder.targetDate || reminder.targetTime)) {
      const dateStr = reminder.targetDate || new Date().toISOString().slice(0, 10);
      const timeStr = reminder.targetTime || '09:00';
      const targetDate = new Date(`${dateStr}T${timeStr}:00`);

      if (targetDate.getTime() > Date.now()) {
        const id = await N.scheduleNotificationAsync({
          content: {
            title: reminder.notificationTitle || reminder.name,
            body: reminder.notificationMessage || reminder.message || 'Scheduled Reminder',
            data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
            categoryIdentifier: categoryId,
            ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
          },
          trigger: targetDate,
        });
        scheduledIds.push(id);
      }
    }
    // 2. DAILY
    else if (scheduleType === 'DAILY' || (reminder.type === 'time' && reminder.schedule)) {
      const timeStr = reminder.targetTime || reminder.schedule || '09:00';
      const [hStr, mStr] = timeStr.split(':');
      const hour = parseInt(hStr, 10) || 9;
      const minute = parseInt(mStr, 10) || 0;

      const id = await N.scheduleNotificationAsync({
        content: {
          title: reminder.notificationTitle || reminder.name,
          body: reminder.notificationMessage || reminder.message || 'Scheduled Reminder',
          data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
          categoryIdentifier: categoryId,
          ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
        },
        trigger: {
          hour,
          minute,
          repeats: true,
          type: N.SchedulableTriggerInputTypes.DAILY,
        },
      });
      scheduledIds.push(id);
    }
    // 3. WEEKLY / CUSTOM DAYS
    else if ((scheduleType === 'WEEKLY' || scheduleType === 'CUSTOM_DAYS') && reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
      const [hStr, mStr] = (reminder.targetTime || '09:00').split(':');
      const hour = parseInt(hStr, 10) || 9;
      const minute = parseInt(mStr, 10) || 0;

      for (const day of reminder.daysOfWeek) {
        const weekday = WEEKDAY_TO_NUMBER[day] || 2;
        const id = await N.scheduleNotificationAsync({
          content: {
            title: reminder.notificationTitle || reminder.name,
            body: reminder.notificationMessage || 'Time for your scheduled routine',
            data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
            categoryIdentifier: categoryId,
            ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
          },
          trigger: {
            weekday,
            hour,
            minute,
            repeats: true,
            type: N.SchedulableTriggerInputTypes.WEEKLY,
          },
        });
        scheduledIds.push(id);
      }
    }
    // 4. INTERVAL (e.g. 08:00 to 22:00 every 60m)
    else if (scheduleType === 'INTERVAL') {
      const interval = reminder.intervalMinutes || 60;
      const startH = parseInt((reminder.windowStartTime || '08:00').split(':')[0], 10) || 8;
      const endH = parseInt((reminder.windowEndTime || '22:00').split(':')[0], 10) || 22;

      // Project intervals for the day
      for (let h = startH; h <= endH; h += Math.max(1, Math.floor(interval / 60))) {
        const id = await N.scheduleNotificationAsync({
          content: {
            title: reminder.notificationTitle || reminder.name,
            body: reminder.notificationMessage || 'Hydration & Movement check-in',
            data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
            categoryIdentifier: categoryId,
            ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
          },
          trigger: {
            hour: h,
            minute: 0,
            repeats: true,
            type: N.SchedulableTriggerInputTypes.DAILY,
          },
        });
        scheduledIds.push(id);
      }
    }
    // 5. INACTIVITY / STAND
    else if (scheduleType === 'INACTIVITY' || reminder.type === 'inactivity') {
      const hours = reminder.inactivityThresholdMinutes
        ? reminder.inactivityThresholdMinutes / 60
        : (reminder.inactivityMinutes ? reminder.inactivityMinutes / 60 : 1);

      const d = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000);
      const id = await N.scheduleNotificationAsync({
        content: {
          title: reminder.notificationTitle || 'Time to Stand & Move',
          body: reminder.notificationMessage || 'You’ve been resting for a while. Take a light movement break.',
          data: { reminderId: reminder._id, linkedQuickActionId: reminder.linkedQuickActionId },
          categoryIdentifier: NOTIF_CATEGORIES.STAND,
          ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
        },
        trigger: {
          hour: d.getHours(),
          minute: d.getMinutes(),
          repeats: true,
          type: N.SchedulableTriggerInputTypes.DAILY,
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
 * Snooze a reminder by scheduling a one-shot notification in X minutes.
 */
export async function snoozeReminder(
  reminderId: string,
  snoozeMinutes: number = 10,
  title?: string,
  message?: string
): Promise<void> {
  if (!N) return;

  const snoozeDate = new Date(Date.now() + snoozeMinutes * 60 * 1000);

  try {
    await N.scheduleNotificationAsync({
      content: {
        title: title ? `⏱ (Snoozed) ${title}` : '⏱ Reminder Snoozed',
        body: message || `Snoozed for ${snoozeMinutes} minutes`,
        data: { reminderId, isSnoozed: true },
        ...(Platform.OS === 'android' ? { channelId: 'lumen-reminders-v2' } : {}),
      },
      trigger: snoozeDate,
    });

    // Notify backend
    api.post(`/reminders/${reminderId}/snooze`, { snoozeMinutes }).catch(() => {});
  } catch (err) {
    console.warn('[Notifications] Snooze error:', err);
  }
}

/**
 * Cancels a reminder by ID.
 */
export async function cancelReminder(reminderId: string): Promise<void> {
  const map = await loadMapping();
  if (map[reminderId] && Array.isArray(map[reminderId])) {
    if (N) {
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
        // Log twice or log 500ml directly
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
