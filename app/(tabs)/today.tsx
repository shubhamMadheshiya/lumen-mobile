/**
 * Today / Home screen
 * ─ Day clock-in/out card
 * ─ Walking tracking card (distance, time, START WALKING CTA)
 * ─ Active Reminders card (Water next trigger, Stand monitoring, Bedtime)
 * ─ Quick-tap action grid (with water quantity modal)
 * ─ "Today at a glance" summary
 * ─ "Undo" toast
 * ─ Floating "+ Log" button
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Footprints, Play, Bell, ChevronRight, Droplets, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useDaySessionStore } from '../../src/store/daySessionStore';
import { useQuickLogStore } from '../../src/store/quickLogStore';
import { useActivityStore } from '../../src/store/activityStore';
import { useReminderStore } from '../../src/store/reminderStore';

import { DayClockCard } from '../../src/components/DayClockCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { UndoToast } from '../../src/components/UndoToast';
import { FlareNowButton } from '../../src/components/FlareNowButton';
import { WaterQuantityModal } from '../../src/components/WaterQuantityModal';

export default function TodayScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const { user } = useAuthStore();
  const { config, fetchConfig } = useConfigStore();
  const { fetchTodaySession } = useDaySessionStore();
  const { todayTaps, fetchTodayTaps } = useQuickLogStore();
  const { todaySummary, fetchTodaySummary, isTracking } = useActivityStore();
  const { reminders, fetchReminders } = useReminderStore();

  const [refreshing, setRefreshing] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [selectedWaterActionId, setSelectedWaterActionId] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchConfig(),
      fetchTodaySession(),
      fetchTodaySummary(),
      fetchReminders(),
      fetchTodayTaps(),
    ]);
  }, [fetchConfig, fetchTodaySession, fetchTodaySummary, fetchReminders, fetchTodayTaps]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const visibleActions = (config?.quickActions ?? []).filter(a => a.isVisible);

  // Water calculations
  const waterAction = config?.quickActions.find(a => a.templateKey === 'qa_water' || a.label.toLowerCase().includes('water'));
  const waterCount  = waterAction ? (todayTaps[waterAction._id]?.count ?? 0) : 0;
  const waterGoal   = waterAction?.dailyGoal ? Math.round(waterAction.dailyGoal / (waterAction.defaultValue ?? 250)) : 8;

  const todayDistanceKm = todaySummary?.totalDistanceKm ?? 0;
  const todayWalkingMinutes = todaySummary?.totalDurationMinutes ?? 0;

  const activeReminders = reminders.filter(r => r.enabled).slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleStartWalking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/walking/active');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.reminderIconBtn}
              onPress={() => router.push('/reminders')}
              accessibilityRole="button"
              accessibilityLabel="Open Reminders"
            >
              <Bell size={20} color={palette.text} />
              {activeReminders.length > 0 ? <View style={styles.activeNotifDot} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileAvatarBtn}
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open Profile & Settings"
            >
              <Text style={styles.avatarText}>
                {user?.name
                  ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day clock card */}
        <DayClockCard />

        {/* Flare Now shortcut */}
        <FlareNowButton />

        {/* Walking Tracker Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Walking</Text>
            <TouchableOpacity onPress={() => router.push('/walking')}>
              <Text style={styles.sectionActionText}>History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.walkingCard}>
            <View style={styles.walkingStatsRow}>
              <View style={styles.walkingMetricItem}>
                <Text style={styles.walkingMetricVal}>{todayDistanceKm.toFixed(1)} km</Text>
                <Text style={styles.walkingMetricLabel}>Today's distance</Text>
              </View>
              <View style={styles.walkingDivider} />
              <View style={styles.walkingMetricItem}>
                <Text style={styles.walkingMetricVal}>{todayWalkingMinutes} min</Text>
                <Text style={styles.walkingMetricLabel}>Today's time</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.walkingStartBtn}
              onPress={handleStartWalking}
              activeOpacity={0.88}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.walkingStartText}>
                {isTracking ? 'CONTINUE WALKING' : 'START WALKING'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Reminders Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Reminders</Text>
            <TouchableOpacity onPress={() => router.push('/reminders')}>
              <Text style={styles.sectionActionText}>Manage ({reminders.filter(r => r.enabled).length})</Text>
            </TouchableOpacity>
          </View>

          {activeReminders.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyRemindersBox}
              onPress={() => router.push('/reminders/add')}
            >
              <Clock size={20} color={palette.textSecondary} />
              <Text style={styles.emptyRemindersText}>No reminders set. Tap to add water or movement alerts.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.remindersCard}>
              {activeReminders.map((rem, idx) => (
                <TouchableOpacity
                  key={rem._id}
                  style={[styles.reminderRow, idx < activeReminders.length - 1 && styles.reminderRowBorder]}
                  onPress={() => router.push('/reminders')}
                >
                  <Text style={styles.reminderEmoji}>{rem.icon || '⏰'}</Text>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderName}>{rem.name}</Text>
                    <Text style={styles.reminderTiming}>
                      {rem.scheduleType === 'INTERVAL' ? `Every ${rem.intervalMinutes || 60}m` : (rem.targetTime || 'Daily')}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={palette.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick-tap grid */}
        {visibleActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick log</Text>
            <View style={styles.grid}>
              {visibleActions.map(action => (
                <QuickActionButton
                  key={action._id}
                  action={action}
                  onPressOverride={
                    action.templateKey === 'qa_water' || action.label.toLowerCase().includes('water')
                      ? () => {
                          setSelectedWaterActionId(action._id);
                          setWaterModalVisible(true);
                        }
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Today at a glance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <View style={styles.glanceRow}>
            <GlanceCard emoji="💧" value={`${waterCount}/${waterGoal}`} label="Water" color={palette.secondary} />
            <GlanceCard emoji="🚶" value={`${todayDistanceKm.toFixed(1)} km`} label="Walking" color={palette.primary} />
            <GlanceCard emoji="🩺" value={String(Object.values(todayTaps).filter(t => t.count > 0).length)} label="Quick logs" color={palette.catSymptom} />
          </View>
        </View>

        {/* Spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating + Log button */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/log')}
          accessibilityRole="button"
          accessibilityLabel="Log a new entry"
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabText}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Undo toast */}
      <UndoToast quickActions={config?.quickActions ?? []} />

      {/* Water Quantity Modal */}
      <WaterQuantityModal
        visible={waterModalVisible}
        onClose={() => setWaterModalVisible(false)}
        quickActionId={selectedWaterActionId || waterAction?._id}
        onLogged={() => {
          fetchTodayTaps();
        }}
      />
    </SafeAreaView>
  );
}

function GlanceCard({ emoji, value, label, color }: { emoji: string; value: string; label: string; color: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.glanceCard, { borderLeftColor: color }]}>
      <Text style={styles.glanceEmoji}>{emoji}</Text>
      <Text style={styles.glanceValue}>{value}</Text>
      <Text style={styles.glanceLabel}>{label}</Text>
    </View>
  );
}

const useStyles = createThemedStyles(palette => ({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    ...typography.h2,
    color: palette.text,
  },
  date: {
    ...typography.body,
    color: palette.textSecondary,
    marginTop: 2,
  },
  reminderIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeNotifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.text,
  },
  sectionActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: palette.primary,
  },
  walkingCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  walkingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  walkingMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  walkingMetricVal: {
    ...typography.h2,
    fontSize: 22,
    color: palette.text,
  },
  walkingMetricLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    marginTop: 2,
  },
  walkingDivider: {
    width: 1,
    height: 30,
    backgroundColor: palette.divider,
  },
  walkingStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: 9999,
    gap: 8,
  },
  walkingStartText: {
    ...typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  remindersCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  reminderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
  },
  reminderEmoji: {
    fontSize: 20,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderName: {
    ...typography.body,
    fontWeight: '700',
    color: palette.text,
  },
  reminderTiming: {
    ...typography.caption,
    color: palette.textSecondary,
    marginTop: 1,
  },
  emptyRemindersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyRemindersText: {
    ...typography.caption,
    color: palette.textSecondary,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  glanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glanceCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 4,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  glanceEmoji: {
    fontSize: 22,
  },
  glanceValue: {
    ...typography.h3,
    color: palette.text,
  },
  glanceLabel: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 24,
  },
  fabText: {
    ...typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
}));
