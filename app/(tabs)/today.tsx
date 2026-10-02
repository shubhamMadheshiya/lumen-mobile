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
  TouchableOpacity, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Footprints,
  Play,
  Bell,
  ChevronRight,
  Droplets,
  Clock,
  Stethoscope,
  Sun,
  Moon,
  Timer,
  SlidersHorizontal,
  Edit2,
  Plus,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ILogEntry } from '@lumen/shared';

import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useDaySessionStore } from '../../src/store/daySessionStore';
import { useQuickLogStore } from '../../src/store/quickLogStore';
import { useActivityStore } from '../../src/store/activityStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { useGlanceConfigStore } from '../../src/store/glanceConfigStore';
import { useDayEntries } from '../../src/hooks/useTimelineSummary';

import { DayClockCard } from '../../src/components/DayClockCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { UndoToast } from '../../src/components/UndoToast';
import { FlareNowButton } from '../../src/components/FlareNowButton';
import { WaterQuantityModal } from '../../src/components/WaterQuantityModal';
import { EditLogModal } from '../../src/components/timeline/EditLogModal';

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function getLogMeta(
  entry: ILogEntry,
  categories: any[],
  quickActions: any[],
  palette: any
) {
  const isQuickAction = entry.source === 'quick_action' || !!entry.quickActionId;
  const qa = isQuickAction ? quickActions.find(a => a._id === entry.quickActionId) : undefined;
  const cat = categories.find(c => c._id === entry.categoryId);

  const title = isQuickAction
    ? (qa?.label ?? 'Quick Tap')
    : (cat?.name ?? 'Log Entry');

  const icon = isQuickAction
    ? (qa?.icon ?? '⚡')
    : (cat?.icon ?? '📝');

  const color = isQuickAction
    ? (qa?.color ?? palette.primary)
    : (cat?.color ?? palette.primary);

  let detail = '';
  if (entry.note) {
    detail = entry.note;
  } else if (qa?.defaultValue != null) {
    detail = `+${qa.defaultValue}${qa.unit ? ' ' + qa.unit : ''}`;
  } else if (entry.answers && entry.answers.length > 0) {
    const parts: string[] = [];
    for (const ans of entry.answers) {
      for (const val of ans.values || []) {
        if (val.value != null && val.value !== '') {
          if (val.dataType === 'range') {
            parts.push(`${val.value}/10`);
          } else if (val.dataType === 'boolean') {
            parts.push(val.value ? 'Yes' : 'No');
          } else {
            parts.push(String(val.value));
          }
        }
      }
    }
    detail = parts.join(' • ');
  }

  return { title, icon, color, detail };
}

export default function TodayScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const { user, fetchProfile } = useAuthStore();
  const { config, fetchConfig } = useConfigStore();
  const { todaySession, fetchTodaySession } = useDaySessionStore();
  const { todayTaps, fetchTodayTaps } = useQuickLogStore();
  const { todaySummary, fetchTodaySummary, isTracking } = useActivityStore();
  const { reminders, fetchReminders } = useReminderStore();
  const { fetchGlanceConfig, isMetricEnabled, getActiveCount } = useGlanceConfigStore();

  const { width: windowWidth } = useWindowDimensions();
  // Screen padding is 16 on each side (32 total), and two 10px gaps between 3 columns (20 total)
  const quickActionWidth = Math.max(88, Math.floor((windowWidth - 32 - 20) / 3));

  const queryClient = useQueryClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: todayLogs = [], refetch: refetchTodayLogs } = useDayEntries(todayIso);

  const [refreshing, setRefreshing] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [selectedWaterActionId, setSelectedWaterActionId] = useState<string | undefined>(undefined);
  const [editingLog, setEditingLog] = useState<ILogEntry | null>(null);

  const sortedTodayLogs = React.useMemo(() => {
    return [...todayLogs].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [todayLogs]);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchProfile(),
      fetchConfig(),
      fetchTodaySession(),
      fetchTodaySummary(),
      fetchReminders(),
      fetchTodayTaps(),
      fetchGlanceConfig(),
      refetchTodayLogs(),
    ]);
  }, [fetchProfile, fetchConfig, fetchTodaySession, fetchTodaySummary, fetchReminders, fetchTodayTaps, fetchGlanceConfig, refetchTodayLogs]);

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

  const totalTapCount = Object.values(todayTaps).reduce((sum, t) => sum + (t?.count ?? 0), 0);
  const distinctTapCount = Object.values(todayTaps).filter(t => t.count > 0).length;
  const wakeTimeStr = todaySession?.wakeTime
    ? new Date(todaySession.wakeTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const customGoalActions = (config?.quickActions ?? []).filter(
    a => a.isVisible && a.dailyGoal && a.templateKey !== 'qa_water' && !a.label.toLowerCase().includes('water')
  );

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
                {user?.name?.trim()
                  ? user.name
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quick log</Text>
              <TouchableOpacity
                onPress={() => router.push('/customize/quick-actions')}
                style={styles.seeAllBtn}
                accessibilityRole="button"
                accessibilityLabel="Manage quick-tap buttons"
              >
                <Text style={styles.seeAllText}>Manage</Text>
                <ChevronRight size={14} color={palette.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {visibleActions.map(action => (
                <QuickActionButton
                  key={action._id}
                  action={action}
                  width={quickActionWidth}
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today at a glance</Text>
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                onPress={() => router.push('/customize/at-a-glance')}
                style={styles.customizeGlanceBtn}
                accessibilityRole="button"
                accessibilityLabel="Customize Today at a glance metrics"
              >
                <SlidersHorizontal size={13} color={palette.textSecondary} />
                <Text style={styles.customizeGlanceText}>Customize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/timeline');
                }}
                style={styles.seeAllBtn}
                accessibilityRole="button"
                accessibilityLabel="View full timeline"
              >
                <Text style={styles.seeAllText}>Timeline</Text>
                <ChevronRight size={14} color={palette.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.glanceGrid}>
            {isMetricEnabled('water') && (
              <GlanceCard
                icon={Droplets}
                value={`${waterCount}/${waterGoal}`}
                label="Water"
                subtitle={waterGoal ? `${Math.min(100, Math.round((waterCount / waterGoal) * 100))}% goal` : undefined}
                color={palette.secondary}
                onPress={() => {
                  setSelectedWaterActionId(waterAction?._id);
                  setWaterModalVisible(true);
                }}
              />
            )}

            {isMetricEnabled('walking') && (
              <GlanceCard
                icon={Footprints}
                value={`${todayDistanceKm.toFixed(1)} km`}
                label="Walking"
                subtitle={isTracking ? 'Tracking live' : `${todayWalkingMinutes} min`}
                color={palette.primary}
                onPress={handleStartWalking}
              />
            )}

            {isMetricEnabled('reminders') && (
              <GlanceCard
                icon={Bell}
                value={`${reminders.filter(r => r.enabled).length} active`}
                label="Reminders"
                subtitle={reminders.length > 0 ? `${reminders.length} total` : 'None set'}
                color={palette.catMood}
                onPress={() => router.push('/reminders')}
              />
            )}

            {isMetricEnabled('quick_logs') && (
              <GlanceCard
                icon={Stethoscope}
                value={`${totalTapCount} logged`}
                label="Quick logs"
                subtitle={`${distinctTapCount} metrics`}
                color={palette.catSymptom}
                onPress={() => router.push('/(tabs)/timeline')}
              />
            )}

            {isMetricEnabled('day_session') && (
              <GlanceCard
                icon={wakeTimeStr ? Sun : Moon}
                value={wakeTimeStr || 'Clock in'}
                label="Day session"
                subtitle={todaySession?.sleepTime ? 'Asleep' : (wakeTimeStr ? 'Active' : 'Not started')}
                color={palette.catHabits}
                onPress={() => router.push('/(tabs)/today')}
              />
            )}

            {isMetricEnabled('active_time') && (
              <GlanceCard
                icon={Timer}
                value={`${todayWalkingMinutes}m`}
                label="Active time"
                subtitle={todayWalkingMinutes > 0 ? 'Today' : 'Start now'}
                color={palette.catFood}
                onPress={handleStartWalking}
              />
            )}

            {/* Any custom Quick Actions with daily goals */}
            {customGoalActions.map(action => {
              const count = todayTaps[action._id]?.count ?? 0;
              const target = action.dailyGoal ? Math.round(action.dailyGoal / (action.defaultValue ?? 1)) : 1;
              return (
                <GlanceCard
                  key={action._id}
                  emoji={action.icon || '🎯'}
                  value={`${count}/${target}`}
                  label={action.label}
                  subtitle={`${Math.min(100, Math.round((count / target) * 100))}% goal`}
                  color={action.color || palette.primary}
                  onPress={() => router.push('/log')}
                />
              );
            })}

            {/* Empty state when all metrics are hidden */}
            {getActiveCount() === 0 && customGoalActions.length === 0 && (
              <TouchableOpacity
                style={styles.emptyGlanceBox}
                onPress={() => router.push('/customize/at-a-glance')}
                activeOpacity={0.75}
              >
                <SlidersHorizontal size={20} color={palette.primary} />
                <Text style={styles.emptyGlanceText}>
                  All glance cards are hidden. Tap to choose which metrics appear on your dashboard.
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Today's Activity & Log History */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.activityHeaderTitleRow}>
              <Text style={styles.sectionTitle}>Today's Activity</Text>
              {sortedTodayLogs.length > 0 && (
                <View style={styles.logCountBadge}>
                  <Text style={styles.logCountText}>{sortedTodayLogs.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/timeline');
              }}
              style={styles.seeAllBtn}
              accessibilityRole="button"
              accessibilityLabel="View full timeline"
            >
              <Text style={styles.seeAllText}>Timeline</Text>
              <ChevronRight size={14} color={palette.primary} />
            </TouchableOpacity>
          </View>

          {sortedTodayLogs.length === 0 ? (
            <View style={styles.emptyActivityCard}>
              <View style={[styles.emptyActivityIcon, { backgroundColor: palette.surfaceAlt }]}>
                <Clock size={20} color={palette.textDisabled} />
              </View>
              <Text style={styles.emptyActivityTitle}>No logs recorded yet today</Text>
              <Text style={styles.emptyActivitySubtitle}>
                Use Quick Taps or tap "+ Log" to record symptoms, habits, or medications.
              </Text>
              <TouchableOpacity
                style={styles.emptyLogBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/log');
                }}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.emptyLogBtnText}>Record Log</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activityList}>
              {sortedTodayLogs.slice(0, 4).map(entry => {
                const meta = getLogMeta(entry, config?.categories ?? [], config?.quickActions ?? [], palette);
                return (
                  <TouchableOpacity
                    key={entry._id}
                    style={styles.activityItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditingLog(entry);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit log ${meta.title}`}
                  >
                    <View style={[styles.activityIconBox, { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` }]}>
                      <Text style={styles.activityEmoji}>{meta.icon}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityMainRow}>
                        <Text style={styles.activityItemTitle} numberOfLines={1}>{meta.title}</Text>
                        <Text style={styles.activityTime}>{formatLogTime(entry.occurredAt)}</Text>
                      </View>
                      {meta.detail ? (
                        <Text style={styles.activityDetail} numberOfLines={1}>{meta.detail}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.activityEditBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingLog(entry);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit log entry"
                    >
                      <Edit2 size={13} color={palette.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}

              {sortedTodayLogs.length > 4 && (
                <TouchableOpacity
                  style={styles.moreLogsBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(tabs)/timeline');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreLogsText}>
                    + {sortedTodayLogs.length - 4} more logs in Timeline
                  </Text>
                  <ChevronRight size={13} color={palette.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

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

      {/* Edit Log Modal */}
      <EditLogModal
        visible={!!editingLog}
        entry={editingLog}
        onClose={() => setEditingLog(null)}
        categories={config?.categories ?? []}
        questions={config?.questions ?? []}
        options={config?.options ?? []}
        quickActions={config?.quickActions ?? []}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ['day-entries', todayIso] });
          queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
          fetchTodayTaps();
        }}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['day-entries', todayIso] });
          queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
          fetchTodayTaps();
        }}
      />
    </SafeAreaView>
  );
}

interface GlanceCardProps {
  icon?: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  emoji?: string;
  value: string;
  label: string;
  subtitle?: string;
  color: string;
  onPress?: () => void;
}

function GlanceCard({ icon: IconComponent, emoji, value, label, subtitle, color, onPress }: GlanceCardProps) {
  const { palette } = useTheme();
  const styles = useStyles();

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.glanceCard, { borderLeftColor: color }]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.glanceEmojiBox, { backgroundColor: `${color}18` }]}>
        {IconComponent ? (
          <IconComponent size={18} color={color} strokeWidth={2.2} />
        ) : (
          <Text style={styles.glanceEmoji}>{emoji}</Text>
        )}
      </View>
      <View style={styles.glanceTextCol}>
        <Text style={styles.glanceValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.glanceLabel} numberOfLines={1}>{label}</Text>
        {subtitle ? <Text style={styles.glanceSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {onPress ? <ChevronRight size={13} color={palette.textDisabled} style={styles.glanceChevron} /> : null}
    </TouchableOpacity>
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customizeGlanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  customizeGlanceText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.textSecondary,
    fontSize: 11,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeAllText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.primary,
  },
  emptyGlanceBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
  emptyGlanceText: {
    ...typography.caption,
    color: palette.textSecondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  glanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  glanceCard: {
    width: '48.5%',
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 4,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  glanceEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glanceEmoji: {
    fontSize: 18,
  },
  glanceTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  glanceValue: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  glanceLabel: {
    ...typography.caption,
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  glanceSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: palette.textDisabled,
    marginTop: 1,
  },
  glanceChevron: {
    opacity: 0.5,
  },
  activityHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: `${palette.primary}20`,
  },
  logCountText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary,
  },
  emptyActivityCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyActivityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyActivityTitle: {
    ...typography.body,
    fontWeight: '600',
    color: palette.text,
  },
  emptyActivitySubtitle: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: palette.primary,
  },
  emptyLogBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityList: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: 12,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: {
    fontSize: 17,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  activityMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityItemTitle: {
    ...typography.body,
    fontWeight: '600',
    color: palette.text,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  activityTime: {
    ...typography.caption,
    fontSize: 11,
    color: palette.textDisabled,
  },
  activityDetail: {
    ...typography.caption,
    fontSize: 12,
    color: palette.textSecondary,
  },
  activityEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  moreLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    backgroundColor: palette.surfaceAlt,
  },
  moreLogsText: {
    ...typography.caption,
    fontWeight: '600',
    color: palette.primary,
    fontSize: 12,
  },
}));
