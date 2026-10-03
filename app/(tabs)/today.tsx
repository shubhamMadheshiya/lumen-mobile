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
import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';

import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { useConfigStore } from '../../src/store/configStore';
import { useDaySessionStore } from '../../src/store/daySessionStore';
import { useQuickLogStore } from '../../src/store/quickLogStore';
import { useActivityStore } from '../../src/store/activityStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { useGlanceConfigStore } from '../../src/store/glanceConfigStore';
import { useSleepTrackerStore } from '../../src/store/sleepTrackerStore';
import { useWeatherStore } from '../../src/store/weatherStore';

import { DayClockCard } from '../../src/components/DayClockCard';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { LumenIcon } from '../../src/components/common/LumenLogo';
import { UndoToast } from '../../src/components/UndoToast';
import { FlareNowButton } from '../../src/components/FlareNowButton';
import { WaterQuantityModal } from '../../src/components/WaterQuantityModal';
import { WalkingBannerCard } from '../../src/components/walking/WalkingBannerCard';
import { WeatherReportModal } from '../../src/components/weather/WeatherReportModal';

export default function TodayScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user, fetchProfile } = useAuthStore();
  const { config, fetchConfig } = useConfigStore();
  const { todaySession, fetchTodaySession } = useDaySessionStore();
  const { todayTaps, fetchTodayTaps } = useQuickLogStore();
  const { todaySummary, fetchTodaySummary, isTracking, activePacingAlert } = useActivityStore();
  const { reminders, fetchReminders } = useReminderStore();
  const { fetchGlanceConfig, isMetricEnabled, getActiveCount } = useGlanceConfigStore();
  const { isSleeping, lastSleepRecord, loadState: loadSleepState } = useSleepTrackerStore();
  const {
    weather,
    assessment,
    activeFlareAlert,
    permissionStatus,
    initWeather,
    fetchWeather,
    requestPermissionAndFetch,
  } = useWeatherStore();

  const { width: windowWidth } = useWindowDimensions();
  // Screen padding is 16 on each side (32 total), and two 10px gaps between 3 columns (20 total)
  const quickActionWidth = Math.max(88, Math.floor((windowWidth - 32 - 20) / 3));

  const [refreshing, setRefreshing] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [selectedWaterActionId, setSelectedWaterActionId] = useState<string | undefined>(undefined);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);

  // Time tracker for dynamic daytime vs evening (9:30 PM = 21:30 = 1290 minutes) card positions
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000); // 30-second live check
    return () => clearInterval(interval);
  }, []);

  // Daytime active mode: Awake (not sleeping) AND before 9:30 PM (21:30 = 1290 minutes)
  const isDaytimeMode = useMemo(() => {
    if (isSleeping) return false;
    // 9:30 PM cutoff: 21 * 60 + 30 = 1290 minutes
    if (currentTimeMinutes >= 1290) return false;
    // Early morning before 4:00 AM if user hasn't woken up today
    if (currentTimeMinutes < 240 && !lastSleepRecord?.wakeTime) return false;
    return true;
  }, [isSleeping, currentTimeMinutes, lastSleepRecord]);

  const loadData = useCallback(async () => {
    await Promise.allSettled([
      fetchProfile(),
      fetchConfig(),
      fetchTodaySession(),
      fetchTodaySummary(),
      fetchReminders(),
      fetchTodayTaps(),
      fetchGlanceConfig(),
      loadSleepState(),
      initWeather(),
    ]);
  }, [fetchProfile, fetchConfig, fetchTodaySession, fetchTodaySummary, fetchReminders, fetchTodayTaps, fetchGlanceConfig, loadSleepState, initWeather]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      loadData(),
      fetchWeather({ force: true, isUserRefresh: true }),
    ]);
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
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <LumenIcon size={18} />
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: palette.primary, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Lumen
              </Text>
            </View>
            <Text style={styles.greeting}>{greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.reminderIconBtn}
              onPress={() => router.push('/reminders')}
              accessibilityRole="button"
              accessibilityLabel="Open Reminders & Alerts"
            >
              <Bell size={20} color={palette.text} />
              {activeReminders.length > 0 ||
              (activeFlareAlert && !activeFlareAlert.dismissed) ||
              (activePacingAlert && !activePacingAlert.dismissed) ? (
                <View style={styles.activeNotifDot} />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileAvatarBtn}
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open Profile & Settings"
            >
              <LinearGradient
                colors={['#FFA448', '#FF581E']}
                start={{ x: 0.15, y: 0.1 }}
                end={{ x: 0.85, y: 0.95 }}
                style={styles.avatarGradient}
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
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daytime Position 1: Walking Tracker Card */}
        {isDaytimeMode && (
          <WalkingBannerCard
            distanceKm={todayDistanceKm}
            durationMinutes={todayWalkingMinutes}
            onPressHistory={() => router.push('/walking')}
            onPressWeather={() => setWeatherModalVisible(true)}
          />
        )}

        {/* Night / Wind-down Position 1: Day clock / Sleep card */}
        {!isDaytimeMode && (
          <DayClockCard />
        )}

        {/* Position 2: Quick Log shortcut */}
        <FlareNowButton />

        {/* Night / Wind-down Position 3: Walking Tracker Card (placed after Quick Log) */}
        {!isDaytimeMode && (
          <WalkingBannerCard
            distanceKm={todayDistanceKm}
            durationMinutes={todayWalkingMinutes}
            onPressHistory={() => router.push('/walking')}
            onPressWeather={() => setWeatherModalVisible(true)}
          />
        )}

        {/* Active Reminders Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Reminders</Text>
            <TouchableOpacity onPress={() => router.push('/reminders?mode=reminders')}>
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
                  onPress={() => router.push('/reminders?mode=reminders')}
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
              <Text style={styles.sectionTitle}>Quick Taps</Text>
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
                onPress={() => router.push('/reminders?mode=reminders')}
              />
            )}

            {isMetricEnabled('quick_logs') && (
              <GlanceCard
                icon={Stethoscope}
                value={`${totalTapCount} logged`}
                label="Quick taps"
                subtitle={`${distinctTapCount} metrics`}
                color={palette.catSymptom}
                onPress={() => router.push('/(tabs)/timeline')}
              />
            )}

            {isMetricEnabled('day_session') && (
              <GlanceCard
                icon={isSleeping ? Moon : (lastSleepRecord ? Moon : (wakeTimeStr ? Sun : Moon))}
                value={
                  isSleeping
                    ? 'In bed'
                    : lastSleepRecord
                      ? `${Math.floor(lastSleepRecord.durationMinutes / 60)}h ${lastSleepRecord.durationMinutes % 60}m`
                      : (wakeTimeStr || 'Clock in')
                }
                label="Sleep session"
                subtitle={
                  isSleeping
                    ? 'Sleeping now'
                    : lastSleepRecord
                      ? (lastSleepRecord.durationMinutes >= 420 ? '7–8h goal met' : 'Under 7h goal')
                      : (todaySession?.sleepTime ? 'Asleep' : (wakeTimeStr ? 'Active' : 'Not started'))
                }
                color={
                  isSleeping
                    ? '#6366F1'
                    : lastSleepRecord?.durationMinutes && lastSleepRecord.durationMinutes >= 420
                      ? '#10B981'
                      : palette.catHabits
                }
                onPress={() => {
                  if (isDaytimeMode) {
                    router.push('/settings');
                  } else {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }
                }}
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

      {/* Weather Report Modal */}
      <WeatherReportModal
        visible={weatherModalVisible}
        onClose={() => setWeatherModalVisible(false)}
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
    paddingBottom: 110,
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
  dateAndWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  weatherChipEmoji: {
    fontSize: 12,
  },
  weatherChipText: {
    ...typography.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: palette.text,
  },
  weatherChipRiskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  date: {
    ...typography.body,
    fontSize: 13,
    color: palette.textSecondary,
  },
  reminderIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  activeNotifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5E20',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowColor: '#FF5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
}));
