/**
 * Syncs the user's saved reminders with expo-notifications on mount.
 * Sets up action categories and handles user action button taps.
 */
import { useEffect } from 'react';
import { useReminderStore } from '../store/reminderStore';
import {
  syncReminders,
  requestNotificationPermissions,
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
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setupNotificationCategories();
        await fetchReminders();
      }
    })();
  }, []);

  useEffect(() => {
    if (reminders && reminders.length > 0) {
      syncReminders(reminders).catch(() => {});
    }
  }, [reminders]);

  useEffect(() => {
    if (!N || typeof N.addNotificationResponseReceivedListener !== 'function') return;

    const subscription = N.addNotificationResponseReceivedListener((response: any) => {
      handleNotificationActionResponse(response).catch(() => {});
    });

    return () => {
      subscription?.remove();
    };
  }, []);
}
