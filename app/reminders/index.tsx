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
import { Plus, Bell, Clock, RefreshCw, Trash2, Copy, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useReminderStore } from '../../src/store/reminderStore';
import { IReminder, ReminderCategory } from '@lumen/shared';

const CATEGORY_TABS: Array<{ label: string; value: ReminderCategory | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Hydration', value: 'HYDRATION' },
  { label: 'Movement', value: 'MOVEMENT' },
  { label: 'Sleep', value: 'SLEEP' },
  { label: 'Meds', value: 'MEDICATION' },
];

export default function RemindersScreen() {
  const {
    reminders,
    isLoading,
    fetchReminders,
    toggleReminder,
    deleteReminder,
    duplicateReminder,
    snooze,
  } = useReminderStore();

  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReminder(id);
  };

  const handleDelete = (reminder: IReminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to remove "${reminder.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteReminder(reminder._id);
          },
        },
      ]
    );
  };

  const filteredReminders = reminders.filter(r => {
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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/reminders/add')}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
        >
          <Plus size={22} color={palette.surface} />
        </TouchableOpacity>
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
                  >
                    <Copy size={16} color={palette.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.footerIconBtn}
                    onPress={() => handleDelete(reminder)}
                  >
                    <Trash2 size={16} color={palette.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
