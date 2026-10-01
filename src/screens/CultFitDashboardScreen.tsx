import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Flame,
  Zap,
  Activity,
  Trophy,
  Dumbbell,
  ChevronRight,
  Bell,
  Clock,
  Sparkles,
  HeartPulse,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import {
  AuroraCanvas,
  GlassCard,
  NeonButton,
  CalorieRing,
  WeeklyStreakBar,
  LiveWorkoutBadge,
  IconBadge,
  FloatingGlassNav,
} from '../components/aurora';

export const CultFitDashboardScreen: React.FC = () => {
  const [booked, setBooked] = useState(false);

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <AuroraCanvas>
      <StatusBar barStyle="light-content" backgroundColor="#09090E" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.eliteBadge}>
                <Sparkles size={11} color="#8B5CF6" />
                <Text style={styles.eliteBadgeText}>CULT.PASS ELITE</Text>
              </View>
              <View style={styles.streakBadge}>
                <Flame size={12} color="#FF5400" />
                <Text style={styles.streakBadgeText}>14-Day Streak</Text>
              </View>
            </View>
            <Text style={styles.greetingTitle}>Hey, Alex 👋</Text>
            <Text style={styles.greetingSubtitle}>Ready for today's session?</Text>
          </View>

          <Pressable
            style={styles.notificationBtn}
            onPress={handleNotificationPress}
          >
            <Bell size={20} color="#FFFFFF" strokeWidth={2} />
            <View style={styles.unreadPing} />
          </Pressable>
        </View>

        {/* Scrollable Dashboard Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Live Workout Pulse Badge */}
          <View style={styles.liveBadgeWrapper}>
            <LiveWorkoutBadge
              countText="1.2k Cult members working out now"
              dotColor="#06B6D4"
            />
          </View>

          {/* Hero Workout Card */}
          <GlassCard
            delay={100}
            glowingBorder="purple"
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>FEATURED TODAY</Text>
              </View>
              <View style={styles.timeTag}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.timeTagText}>07:00 PM • 50 mins</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>SNC — Strength & Conditioning</Text>
            <Text style={styles.heroTrainer}>Coach Marcus • Cult Indiranagar</Text>

            {/* Quick Metrics Bar */}
            <View style={styles.heroStatsBox}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Target Burn</Text>
                <Text style={styles.heroStatValue}>520 kcal</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Intensity</Text>
                <Text style={[styles.heroStatValue, { color: '#EC4899' }]}>
                  High Pace
                </Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Format</Text>
                <Text style={styles.heroStatValue}>Group Studio</Text>
              </View>
            </View>

            {/* Neon Green CTA */}
            <NeonButton
              label={booked ? '✓ Workout Booked' : 'Book Workout'}
              variant="neonGreen"
              size="md"
              fullWidth
              onPress={() => setBooked(!booked)}
              icon={
                <Dumbbell
                  size={18}
                  color="#09090E"
                  strokeWidth={2.5}
                />
              }
            />
          </GlassCard>

          {/* Weekly Streak Bar Card */}
          <GlassCard delay={180} style={styles.streakCard}>
            <WeeklyStreakBar streakCount={14} />
          </GlassCard>

          {/* Section: Daily Performance Stats */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Daily Performance</Text>
            <Text style={styles.sectionLink}>View History</Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {/* Calorie Ring Tracker Card */}
            <GlassCard delay={240} style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <IconBadge
                  icon={<Flame size={18} color="#FB923C" />}
                  tintColor="#FB923C"
                />
                <Text style={styles.metricPillTag}>TODAY</Text>
              </View>

              <View style={styles.calorieRingWrapper}>
                <CalorieRing current={540} target={750} size={100} strokeWidth={8} />
              </View>

              <View style={styles.calorieStatsBottom}>
                <Text style={styles.calorieNumber}>540</Text>
                <Text style={styles.calorieUnit}>/ 750 kcal burned</Text>
              </View>
            </GlassCard>

            {/* Right Column: Heart Rate & Intensity Score */}
            <View style={styles.metricsCol}>
              {/* Heart Rate Metric */}
              <GlassCard delay={300} style={styles.subMetricCard}>
                <View style={styles.metricHeaderRow}>
                  <IconBadge
                    icon={<HeartPulse size={18} color="#F43F5E" />}
                    tintColor="#F43F5E"
                    size={38}
                  />
                  <Text style={[styles.metricPillTag, { color: '#F43F5E' }]}>
                    LIVE
                  </Text>
                </View>
                <Text style={styles.subMetricVal}>138</Text>
                <Text style={styles.subMetricSub}>Avg BPM • Peak 164</Text>
              </GlassCard>

              {/* Cult Energy Score Metric */}
              <GlassCard delay={360} style={styles.subMetricCard}>
                <View style={styles.metricHeaderRow}>
                  <IconBadge
                    icon={<Zap size={18} color="#22D3EE" />}
                    tintColor="#22D3EE"
                    size={38}
                  />
                  <Text style={[styles.metricPillTag, { color: '#22D3EE' }]}>
                    +18%
                  </Text>
                </View>
                <Text style={styles.subMetricVal}>94</Text>
                <Text style={styles.subMetricSub}>Cult Intensity Score</Text>
              </GlassCard>
            </View>
          </View>

          {/* Section: Live & Upcoming Cult Sessions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Upcoming Sessions</Text>
            <Text style={styles.sectionLink}>Schedule</Text>
          </View>

          {/* Session 1: Burn HIIT */}
          <GlassCard
            delay={420}
            onPress={() => {}}
            style={styles.sessionCard}
          >
            <View style={styles.sessionRow}>
              <IconBadge
                icon={<Activity size={20} color="#EC4899" />}
                tintColor="#EC4899"
                size={44}
              />
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Burn HIIT — Extreme</Text>
                <Text style={styles.sessionMeta}>
                  08:30 PM • 45m • Shweta Mehta
                </Text>
              </View>
              <NeonButton
                label="Book"
                variant="hotPink"
                size="sm"
                onPress={() => {}}
              />
            </View>
          </GlassCard>

          {/* Session 2: Yoga & Mobility */}
          <GlassCard
            delay={480}
            onPress={() => {}}
            style={styles.sessionCard}
          >
            <View style={styles.sessionRow}>
              <IconBadge
                icon={<Trophy size={20} color="#8B5CF6" />}
                tintColor="#8B5CF6"
                size={44}
              />
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Vinyasa Flow & Restore</Text>
                <Text style={styles.sessionMeta}>
                  Tomorrow, 06:30 AM • 60m • Kabir S.
                </Text>
              </View>
              <NeonButton
                label="Reserve"
                variant="cyan"
                size="sm"
                onPress={() => {}}
              />
            </View>
          </GlassCard>

          {/* Bottom spacing to clear floating dock */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Floating Glass Navigation Bar */}
        <FloatingGlassNav initialTab="today" />
      </SafeAreaView>
    </AuroraCanvas>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  eliteBadgeText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 84, 0, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 84, 0, 0.3)',
  },
  streakBadgeText: {
    color: '#FF5400',
    fontSize: 10,
    fontWeight: '700',
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF', // Crisp white headers
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF', // Muted grey secondary labels
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadPing: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  liveBadgeWrapper: {
    marginBottom: 12,
    marginTop: 4,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroTrainer: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 16,
  },
  heroStatsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  streakCard: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 13,
    color: '#06B6D4',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  metricPillTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  calorieRingWrapper: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieStatsBottom: {
    alignItems: 'center',
    marginTop: 6,
  },
  calorieNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calorieUnit: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  metricsCol: {
    flex: 1,
    gap: 12,
  },
  subMetricCard: {
    flex: 1,
  },
  subMetricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  subMetricSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default CultFitDashboardScreen;
