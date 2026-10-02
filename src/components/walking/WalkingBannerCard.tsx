/**
 * WalkingBannerCard
 * Dynamic landscape banner card for Walking with time-of-day backgrounds:
 * - Morning: Sunrise over rolling hills with cypress trees & winding path (morning.png)
 * - Afternoon: Sunny daytime with bright meadow, trees & trail (afternoon.png)
 * - Evening: Golden hour sunset with warm skies & glowing path (evening.png)
 * - Night: Midnight starry sky with constellations, crescent moon & firefly trail (night.png)
 *
 * Designed with a seamless, continuous dark vignette on the left for crisp white typography,
 * while keeping the scenic artwork completely clear, vibrant, and free of visual artifacts.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Image,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useActivityStore } from '../../store/activityStore';
import { useWeatherStore } from '../../store/weatherStore';
import { useTheme } from '../../theme/ThemeContext';
import { PressableScale } from '../common/PressableScale';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface WalkingBannerCardProps {
  style?: StyleProp<ViewStyle>;
  overrideTimeOfDay?: TimeOfDay;
  distanceKm?: number;
  durationMinutes?: number;
  onPressHistory?: () => void;
  onPressWeather?: () => void;
  showTimeSwitcher?: boolean;
}

/**
 * Calculates current time of day period:
 * Morning:   05:00 – 11:59
 * Afternoon: 12:00 – 16:59
 * Evening:   17:00 – 19:59 (Golden hour & sunset)
 * Night:     20:00 – 04:59 (Starry sky with crescent moon)
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

const BACKGROUND_IMAGES: Record<TimeOfDay, any> = {
  morning: require('../../../assets/walking/morning.png'),
  afternoon: require('../../../assets/walking/afternoon.png'),
  evening: require('../../../assets/walking/evening.png'),
  night: require('../../../assets/walking/night.png'),
};

/**
 * Walking Person ISO Icon
 */
function WalkingPersonIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="4" r="2.3" fill={color} />
      <Path
        d="M13.6 8.5 C13 7.8 12.2 7.5 11.2 7.5 C10.2 7.5 9.3 8 8.8 8.8 L6 13 L7.8 14.2 L9.8 11.2 L10.5 14.8 L7.5 20.5 L9.5 21.5 L12.2 16.2 L14.5 18.5 L14.5 22 L16.8 22 L16.8 17.2 L14.2 14.5 L14.8 11.5 C15.8 12.8 17.2 13.5 18.8 13.5 L18.8 11.5 C17.5 11.5 16.3 10.8 15.5 9.8 L14.2 8.5 Z"
        fill={color}
      />
    </Svg>
  );
}

export function WalkingBannerCard({
  style,
  overrideTimeOfDay,
  distanceKm,
  durationMinutes,
  onPressHistory,
  onPressWeather,
}: WalkingBannerCardProps) {
  const { palette } = useTheme();
  const { todaySummary, isTracking } = useActivityStore();
  const { weather, permissionStatus, requestPermissionAndFetch } = useWeatherStore();

  const activeTimeOfDay: TimeOfDay = useMemo(() => {
    if (overrideTimeOfDay) return overrideTimeOfDay;
    return getCurrentTimeOfDay();
  }, [overrideTimeOfDay]);

  const handleStartWalking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/walking/active');
  };

  const handleOpenHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPressHistory) {
      onPressHistory();
    } else {
      router.push('/walking');
    }
  };

  const hasRealActivity =
    (distanceKm !== undefined && distanceKm > 0) ||
    (todaySummary?.totalDistanceKm !== undefined && todaySummary.totalDistanceKm > 0);

  const todayDistanceKm = hasRealActivity
    ? distanceKm ?? todaySummary?.totalDistanceKm ?? 3.4
    : 3.4;

  const todayWalkingMinutes = hasRealActivity
    ? durationMinutes ?? todaySummary?.totalDurationMinutes ?? 42
    : 42;

  return (
    <View style={[styles.cardContainer, style]}>
      {/* 1. Background Illustrated Scenery from User (Landscape on right, open on left) */}
      <Image
        source={BACKGROUND_IMAGES[activeTimeOfDay]}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* 2. Seamless Cinematic Vignette (Rich smooth dark contrast on left, fading to transparent on right) */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.62)',
          'rgba(0, 0, 0, 0.46)',
          'rgba(0, 0, 0, 0.24)',
          'rgba(0, 0, 0, 0.06)',
          'transparent',
        ]}
        locations={[0, 0.28, 0.52, 0.72, 0.90]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 3. Subtle bottom shadow vignette to ground the CTA button naturally */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.18)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 4. Card Content Overlay (Fonts, Icons, Metrics, Buttons) */}
      <View style={styles.contentWrap}>
        {/* Tappable Card Area (Header + Stats -> Opens Walking History) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenHistory}
          style={styles.cardPressableArea}
          accessibilityRole="button"
          accessibilityLabel="Open walking history"
        >
          {/* Top Header Row: Walking Icon + Title on left, Weather on right */}
          <View style={styles.topRow}>
            <View style={styles.titleGroup}>
              <WalkingPersonIcon size={20} color="#FFFFFF" />
              <Text style={styles.cardTitle}>Walking</Text>
              <ChevronRight
                size={16}
                color="rgba(255, 255, 255, 0.75)"
                style={{ marginLeft: 1 }}
              />
            </View>

            {weather ? (
              <TouchableOpacity
                style={styles.weatherBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  onPressWeather?.();
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Current weather: ${weather.temperatureC} degrees, ${weather.weatherLabel}`}
              >
                <Text style={styles.weatherBadgeEmoji}>{weather.weatherEmoji}</Text>
                <Text style={styles.weatherBadgeTemp}>{weather.temperatureC}°C</Text>
                <Text style={styles.weatherBadgeCity} numberOfLines={1}>{weather.cityName}</Text>
              </TouchableOpacity>
            ) : permissionStatus === 'denied' ? (
              <TouchableOpacity
                style={styles.weatherBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  requestPermissionAndFetch();
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Enable location for weather"
              >
                <Text style={styles.weatherBadgeEmoji}>🌤️</Text>
                <Text style={styles.weatherBadgeTemp}>Weather</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Middle Stats Row (Today's distance & Today's time) */}
          <View style={styles.statsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Today's distance</Text>
              <Text style={styles.metricVal}>
                {todayDistanceKm.toFixed(1)}{' '}
                <Text style={styles.metricUnit}>km</Text>
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Today's time</Text>
              <Text style={styles.metricVal}>
                {todayWalkingMinutes}{' '}
                <Text style={styles.metricUnit}>min</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Bottom CTA Button: START WALKING (or CONTINUE WALKING) with app primary color */}
        <PressableScale
          style={[
            styles.startBtn,
            {
              backgroundColor: palette.primary,
              shadowColor: palette.primary,
            },
          ]}
          onPress={handleStartWalking}
          haptic="medium"
          activeScale={0.97}
          accessibilityRole="button"
          accessibilityLabel={isTracking ? 'Continue walking session' : 'Start walking'}
        >
          <View style={styles.startBtnContent}>
            <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 7 }} />
            <Text style={styles.startBtnText}>
              {isTracking ? 'CONTINUE WALKING' : 'START WALKING'}
            </Text>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 188,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
    marginHorizontal: 0,
    backgroundColor: 'transparent',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    justifyContent: 'space-between',
    minHeight: 188,
  },
  cardPressableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    gap: 5,
  },
  weatherBadgeEmoji: {
    fontSize: 13,
  },
  weatherBadgeTemp: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  weatherBadgeCity: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 95,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 2,
  },
  metricCol: {
    justifyContent: 'center',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 11.5,
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.15,
    textShadowColor: 'rgba(0, 0, 0, 0.40)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.50)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginHorizontal: 16,
  },
  startBtn: {
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
