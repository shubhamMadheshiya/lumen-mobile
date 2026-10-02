/**
 * Syncs the user's saved reminders with expo-notifications on mount.
 * Sets up action categories and handles user action button taps.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useReminderStore } from '../store/reminderStore';
import {
  syncReminders,
  ensureNotificationChannel,
  setupNotificationCategories,
  handleNotificationActionResponse,
} from '../services/notifications';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let N: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  N = require('expo-notifications');
} catch {}

export function useNotificationSync() {
  const { reminders, fetchReminders } = useReminderStore();

  useEffect(() => {
    (async () => {
      await ensureNotificationChannel();
      await setupNotificationCategories();
      await fetchReminders();
    })();
  }, []);

  useEffect(() => {
    if (reminders && reminders.length > 0) {
      syncReminders(reminders).catch(() => {});
    }
  }, [reminders]);

  useEffect(() => {
    if (!N) return;

    const responseSub = typeof N.addNotificationResponseReceivedListener === 'function'
      ? N.addNotificationResponseReceivedListener((response: any) => {
          handleNotificationActionResponse(response).catch(() => {});
        })
      : null;

    const receivedSub = typeof N.addNotificationReceivedListener === 'function'
      ? N.addNotificationReceivedListener((notification: any) => {
          console.log('[Notifications] Notification triggered:', notification.request?.identifier);
          const reminderId = notification.request?.content?.data?.reminderId;
          if (reminderId) {
            router.push(`/alarm/${reminderId}`);
          }
        })
      : null;

    return () => {
      responseSub?.remove();
      receivedSub?.remove();
    };
  }, []);
}
