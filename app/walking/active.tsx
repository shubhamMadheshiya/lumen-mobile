import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeGoBack } from '../../src/utils/navigation';
import { Pause, Play, Square, Footprints } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { typography } from '../../src/theme/typography';
import { useActivityStore } from '../../src/store/activityStore';

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const hh = h > 0 ? `${h < 10 ? '0' : ''}${h}:` : '';
  const mm = `${m < 10 ? '0' : ''}${m}`;
  const ss = `${s < 10 ? '0' : ''}${s}`;
  return `${hh}${mm}:${ss}`;
}

function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm <= 0 || !isFinite(paceMinPerKm)) return '--:--';
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ActiveWalkingScreen() {
  const {
    isTracking,
    isPaused,
    activeSeconds,
    distanceMeters,
    steps,
    currentSpeedKmh,
    averagePaceMinPerKm,
    startWalking,
    pauseWalking,
    resumeWalking,
    stopWalking,
    discardWalking,
  } = useActivityStore();

  useEffect(() => {
    // If not already tracking, start session on mount
    if (!isTracking) {
      startWalking('Outdoor Walk');
    }
  }, []);

  const handlePauseResume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      await resumeWalking();
    } else {
      await pauseWalking();
    }
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Finish Walking Session',
      'Would you like to complete and save this walk to your daily timeline?',
      [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await discardWalking();
            safeGoBack('/walking');
          },
        },
        {
          text: 'Save Walk',
          style: 'default',
          onPress: async () => {
            const completed = await stopWalking();
            if (completed) {
              router.replace('/walking/summary');
            } else {
              safeGoBack('/walking');
            }
          },
        },
      ]
    );
  };

  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const speedDisplay = (currentSpeedKmh || 0).toFixed(2);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.activePill}>
          <View style={[styles.pulseDot, isPaused && styles.pulseDotPaused]} />
          <Text style={styles.activePillText}>{isPaused ? 'PAUSED' : 'WALKING'}</Text>
        </View>
      </View>

      {/* Main Clock */}
      <View style={styles.timerWrap}>
        <Text style={styles.timerText}>{formatTimer(activeSeconds)}</Text>
        <Text style={styles.timerLabel}>Active Duration</Text>
      </View>

      {/* Main Metrics 2x2 Grid */}
      <View style={styles.metricsContainer}>
        {/* Distance */}
        <View style={styles.metricTile}>
          <Text style={styles.metricVal}>{distanceKm}</Text>
          <Text style={styles.metricLabel}>Distance (km)</Text>
        </View>

        {/* Pace */}
        <View style={styles.metricTile}>
          <Text style={styles.metricVal}>{formatPace(averagePaceMinPerKm)}</Text>
          <Text style={styles.metricLabel}>Avg Pace (min/km)</Text>
        </View>

        {/* Speed */}
        <View style={styles.metricTile}>
          <Text style={styles.metricVal}>{speedDisplay}</Text>
          <Text style={styles.metricLabel}>Avg Speed (km/h)</Text>
        </View>

        {/* Steps */}
        <View style={styles.metricTile}>
          <View style={styles.stepsRow}>
            <Footprints size={18} color="#06B6D4" />
            <Text style={styles.metricVal}>{steps.toLocaleString()}</Text>
          </View>
          <Text style={styles.metricLabel}>Steps</Text>
        </View>
      </View>

      {/* Controls: PAUSE / RESUME & STOP */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.pauseBtn, isPaused && styles.resumeBtn]}
          onPress={handlePauseResume}
          activeOpacity={0.85}
        >
          {isPaused ? (
            <>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.btnText}>RESUME</Text>
            </>
          ) : (
            <>
              <Pause size={24} color="#FFFFFF" />
              <Text style={styles.btnText}>PAUSE</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.stopBtn]}
          onPress={handleStop}
          activeOpacity={0.85}
        >
          <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.btnText}>STOP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#09090E',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  pulseDotPaused: {
    backgroundColor: '#FFA726',
  },
  activePillText: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  timerWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timerText: {
    ...typography.h1,
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  timerLabel: {
    ...typography.caption,
    color: '#9CA3AF',
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 20,
  },
  metricTile: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    ...typography.h1,
    fontSize: 28,
    color: '#FFFFFF',
  },
  metricLabel: {
    ...typography.caption,
    color: '#9CA3AF',
    marginTop: 6,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 10,
  },
  pauseBtn: {
    backgroundColor: '#4B5563',
  },
  resumeBtn: {
    backgroundColor: '#06B6D4',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    ...typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
