/**
 * DayClockCard — Wake up / Go to bed button (sign-in / sign-out for the day).
 * Shows as "Good morning — I'm awake" until wake-up is tapped,
 * then shows "Going to bed" until bedtime is tapped,
 * then shows a sleep summary.
 */
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { palette } from '../theme/colors';
import { typography } from '../theme/typography';
import { useDaySessionStore } from '../store/daySessionStore';

function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function DayClockCard(): React.ReactElement {
  const { todaySession, recordWakeUp, recordGoToBed, isLoading } = useDaySessionStore();

  const hasWoken  = !!todaySession?.wakeTime;
  const hasSlept  = !!todaySession?.sleepTime;

  const sleepDuration = hasSlept && todaySession?.sleepTime
    ? null
    : null; // previous sleepTime → this wakeTime computed on server

  const awakeDuration = hasWoken && todaySession?.wakeTime && !hasSlept
    ? formatDuration(Date.now() - new Date(todaySession.wakeTime).getTime())
    : null;

  const handlePress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!hasWoken) {
      await recordWakeUp();
      // Prompt morning check-in
      router.push('/check-in?type=morning');
    } else if (!hasSlept) {
      await recordGoToBed();
      // Prompt evening check-in
      router.push('/check-in?type=evening');
    }
  };

  if (hasSlept) {
    // Day closed — show summary
    return (
      <View style={[styles.card, styles.closedCard]}>
        <Text style={styles.closedEmoji}>🌙</Text>
        <Text style={styles.closedTitle}>Day complete</Text>
        <Text style={styles.closedSubtitle}>
          Awake {formatTime(todaySession?.wakeTime)} → {formatTime(todaySession?.sleepTime)}
        </Text>
      </View>
    );
  }

  if (hasWoken) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.awakeCard]}
        onPress={handlePress}
        disabled={isLoading}
        accessibilityLabel="Record going to bed"
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <View style={styles.row}>
          <Text style={styles.emoji}>🌅</Text>
          <View style={styles.textGroup}>
            <Text style={styles.title}>You're awake</Text>
            <Text style={styles.subtitle}>
              Since {formatTime(todaySession?.wakeTime)}
              {awakeDuration ? ` · ${awakeDuration}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.sleepButton}>
          <Text style={styles.sleepButtonText}>🌙  Go to bed</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Not woken yet
  return (
    <TouchableOpacity
      style={[styles.card, styles.sleepingCard]}
      onPress={handlePress}
      disabled={isLoading}
      accessibilityLabel="Record waking up"
      accessibilityRole="button"
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>☀️</Text>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Good morning!</Text>
          <Text style={styles.subtitle}>Tap when you're awake</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sleepingCard: {
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: palette.primary,
  },
  awakeCard: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: palette.border,
  },
  closedCard: {
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginRight: 14,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: palette.text,
  },
  subtitle: {
    ...typography.small,
    color: palette.textSecondary,
    marginTop: 2,
  },
  sleepButton: {
    marginTop: 12,
    backgroundColor: palette.darkBackground,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sleepButtonText: {
    ...typography.button,
    color: palette.white,
  },
  closedEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  closedTitle: {
    ...typography.h4,
    color: palette.text,
  },
  closedSubtitle: {
    ...typography.small,
    color: palette.textSecondary,
    marginTop: 4,
  },
});
