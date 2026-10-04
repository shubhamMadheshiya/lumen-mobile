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
    let isMounted = true;
    (async () => {
      try {
        await ensureNotificationChannel();
        await setupNotificationCategories();
        if (isMounted) {
          await fetchReminders().catch(() => {});
        }
        // Handle tap on notification that launched the app from killed/background state
        if (N && typeof N.getLastNotificationResponseAsync === 'function') {
          const lastResponse = await N.getLastNotificationResponseAsync();
          if (lastResponse) {
            const reminderId = lastResponse.notification?.request?.content?.data?.reminderId;
            if (reminderId) {
              router.push(`/alarm/${reminderId}`);
            }
          }
        }
      } catch (err) {
        console.warn('[useNotificationSync] Startup sync error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (reminders && reminders.length > 0) {
      syncReminders(reminders).catch(() => {});
    }
  }, [reminders]);

  useEffect(() => {
    if (!N) return;

    // Fired when user taps a notification action button
    const responseSub = typeof N.addNotificationResponseReceivedListener === 'function'
      ? N.addNotificationResponseReceivedListener((response: any) => {
          const reminderId = response.notification?.request?.content?.data?.reminderId;
          // Default tap (no action button) → open alarm screen
          if (
            response.actionIdentifier === N.DEFAULT_ACTION_IDENTIFIER &&
            reminderId
          ) {
            router.push(`/alarm/${reminderId}`);
            return;
          }
          handleNotificationActionResponse(response).catch(() => {});
        })
      : null;

    // Fired when notification arrives while app is in foreground
    const receivedSub = typeof N.addNotificationReceivedListener === 'function'
      ? N.addNotificationReceivedListener((notification: any) => {
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
