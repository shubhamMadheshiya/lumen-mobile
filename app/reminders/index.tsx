import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Bell, Clock, RefreshCw, Trash2, Copy, ChevronLeft, RotateCcw, BellRing } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useReminderStore } from '../../src/store/reminderStore';
import { sendTestReminderNotification, requestNotificationPermissions } from '../../src/services/notifications';
import { IReminder, ReminderCategory } from '@lumen/shared';

type ReminderTabValue = ReminderCategory | 'ALL' | 'ARCHIVED';

const CATEGORY_TABS: Array<{ label: string; value: ReminderTabValue }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Hydration', value: 'HYDRATION' },
  { label: 'Movement', value: 'MOVEMENT' },
  { label: 'Sleep', value: 'SLEEP' },
  { label: 'Meds', value: 'MEDICATION' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function RemindersScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const {
    reminders,
    isLoading,
    fetchReminders,
    toggleReminder,
    deleteReminder,
    unarchiveReminder,
    permanentDeleteReminder,
    duplicateReminder,
    snooze,
  } = useReminderStore();

  const [selectedCategory, setSelectedCategory] = useState<ReminderTabValue>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  const [isTestingAlarm, setIsTestingAlarm] = useState(false);

  const handleTestAlarm = async () => {
    setIsTestingAlarm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const granted = await requestNotificationPermissions();
    if (!granted) {
      setIsTestingAlarm(false);
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your phone settings so Lumen alarms can ring.'
      );
      return;
    }

    const success = await sendTestReminderNotification();
    setIsTestingAlarm(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🔔 Alarm Scheduled (3 Seconds)',
        'Lock your phone or leave the app open — your reminder alarm will fire in 3 seconds with sound and vibration!',
        [{ text: 'Got it!' }]
      );
    } else {
      Alert.alert(
        'Test Failed',
        'Could not schedule test alarm. Ensure notification permissions are granted in phone settings.'
      );
    }
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReminder(id);
  };

  const handleDelete = (reminder: IReminder) => {
    Alert.alert(
      'Archive Reminder',
      `Archive "${reminder.name}"? You can view or restore it in the Archived tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteReminder(reminder._id);
          },
        },
      ]
    );
  };

  const handlePermanentDelete = (reminder: IReminder) => {
    Alert.alert(
      'Delete Forever',
      `Permanently remove "${reminder.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            permanentDeleteReminder(reminder._id);
          },
        },
      ]
    );
  };

  const handleRestore = (reminder: IReminder) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    unarchiveReminder(reminder._id);
    Alert.alert('Restored', `Reminder "${reminder.name}" is active again.`);
  };

  const filteredReminders = reminders.filter(r => {
    const isArchived = !!r.archivedAt;
    if (selectedCategory === 'ARCHIVED') return isArchived;
    if (isArchived) return false;
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  const formatScheduleText = (r: IReminder) => {
    if (r.scheduleType === 'INTERVAL') {
      return `Every ${r.intervalMinutes || 60}m (${r.windowStartTime || '08:00'} – ${r.windowEndTime || '22:00'})`;
    }
    if (r.scheduleType === 'WEEKLY' || r.scheduleType === 'CUSTOM_DAYS') {
      const days = r.daysOfWeek?.join(', ') || 'Selected days';
      return `${days} at ${r.targetTime || '09:00'}`;
    }
    if (r.scheduleType === 'INACTIVITY') {
      return `After ${r.inactivityThresholdMinutes || 45}m inactivity`;
    }
    if (r.scheduleType === 'ONE_TIME') {
      return `Once on ${r.targetDate || 'date'} at ${r.targetTime || '09:00'}`;
    }
    return `Every day at ${r.targetTime || r.schedule || '09:00'}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestAlarm}
            disabled={isTestingAlarm}
            accessibilityRole="button"
            accessibilityLabel="Test Alarm"
          >
            <BellRing size={15} color={palette.primary} />
            <Text style={styles.testBtnText}>{isTestingAlarm ? 'Testing...' : 'Test Alarm'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/reminders/add')}
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
          >
            <Plus size={22} color={palette.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORY_TABS.map(tab => {
            const isActive = selectedCategory === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(tab.value)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={48} color={palette.placeholder} />
            <Text style={styles.emptyTitle}>No reminders scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+" button to set your hydration, movement, or bedtime schedules.
            </Text>
          </View>
        ) : (
          filteredReminders.map(reminder => (
            <View key={reminder._id} style={styles.reminderCard}>
              <View style={styles.cardMain}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{reminder.icon || '⏰'}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.reminderTitle} numberOfLines={1}>
                    {reminder.name}
                  </Text>
                  <Text style={styles.reminderSubtitle} numberOfLines={1}>
                    {formatScheduleText(reminder)}
                  </Text>
                  {reminder.notificationMessage ? (
                    <Text style={styles.reminderMessage} numberOfLines={1}>
                      "{reminder.notificationMessage}"
                    </Text>
                  ) : null}
                </View>

                <Switch
                  value={reminder.enabled}
                  onValueChange={() => handleToggle(reminder._id)}
                  trackColor={{ false: palette.border, true: palette.secondary }}
                  thumbColor={palette.surface}
                />
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                {reminder.archivedAt ? (
                  <>
                    <TouchableOpacity
                      style={styles.footerAction}
                      onPress={() => handleRestore(reminder)}
                      accessibilityRole="button"
                      accessibilityLabel="Restore reminder"
                    >
                      <RotateCcw size={14} color={palette.secondary} />
                      <Text style={[styles.footerActionText, { color: palette.secondary }]}>Restore reminder</Text>
                    </TouchableOpacity>

                    <View style={styles.footerRight}>
                      <TouchableOpacity
                        style={styles.footerIconBtn}
                        onPress={() => handlePermanentDelete(reminder)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete forever"
                      >
                        <Trash2 size={16} color={palette.error} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.footerAction}
                      onPress={() => snooze(reminder._id, reminder.snoozeDurationMinutes)}
                    >
                      <Clock size={14} color={palette.textSecondary} />
                      <Text style={styles.footerActionText}>Snooze {reminder.snoozeDurationMinutes || 10}m</Text>
                    </TouchableOpacity>

                    <View style={styles.footerRight}>
                      <TouchableOpacity
                        style={styles.footerIconBtn}
                        onPress={() => duplicateReminder(reminder._id)}
                        accessibilityLabel="Duplicate"
                      >
                        <Copy size={16} color={palette.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.footerIconBtn}
                        onPress={() => handleDelete(reminder)}
                        accessibilityLabel="Archive"
                      >
                        <Trash2 size={16} color={palette.error} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(palette => ({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: palette.primary + '16',
    borderWidth: 1,
    borderColor: palette.primary + '40',
  },
  testBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: palette.primary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: {
    backgroundColor: palette.text,
    borderColor: palette.text,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  filterChipTextActive: {
    color: palette.surface,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...typography.h3,
    color: palette.text,
    marginTop: 16,
  },
  emptySubtitle: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  reminderCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  reminderTitle: {
    ...typography.h3,
    fontSize: 16,
    color: palette.text,
  },
  reminderSubtitle: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  reminderMessage: {
    ...typography.caption,
    color: palette.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    marginTop: 14,
    paddingTop: 10,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerActionText: {
    ...typography.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerIconBtn: {
    padding: 4,
  },
}));
