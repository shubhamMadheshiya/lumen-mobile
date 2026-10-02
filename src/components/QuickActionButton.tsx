/**
 * QuickActionButton
 * One tap = instant log with haptic feedback + undo toast.
 * Long-press = opens the detail sheet.
 */
import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  DimensionValue,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, createThemedStyles } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { useQuickLogStore } from '../store/quickLogStore';
import { IQuickAction } from '@lumen/shared';

interface Props {
  action: IQuickAction;
  onLongPress?: () => void;
  onPressOverride?: () => void;
  width?: DimensionValue;
}

export function QuickActionButton({ action, onLongPress, onPressOverride, width }: Props): React.ReactElement {
  const { palette } = useTheme();
  const styles = useStyles();
  const { todayTaps, tap } = useQuickLogStore();
  const tapData = todayTaps[action._id];
  const count = tapData?.count ?? 0;
  const lastAt = tapData?.lastAt
    ? new Date(tapData.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Physical press spring animation
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = React.useRef(new Animated.Value(1)).current;
  const prevCount = React.useRef(count);

  // Pop the badge whenever count changes
  React.useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      prevCount.current = count;
      Animated.sequence([
        Animated.spring(badgeScaleAnim, {
          toValue: 1.35,
          friction: 4,
          tension: 240,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, badgeScaleAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.90,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onPressOverride) {
      onPressOverride();
      return;
    }

    await tap(action._id);
  }, [action._id, tap, onPressOverride]);

  return (
    <Animated.View style={[styles.wrapper, width !== undefined ? { width } : null, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: action.color + '22' }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        delayLongPress={500}
        accessibilityLabel={`${action.label}, tapped ${count} times today`}
        accessibilityRole="button"
        activeOpacity={0.92}
      >
        {/* Count badge with pop animation */}
        {count > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                backgroundColor: action.color,
                transform: [{ scale: badgeScaleAnim }],
              },
            ]}
          >
            <Text style={styles.badgeText}>{count}</Text>
          </Animated.View>
        )}

        {/* Icon */}
        <Text style={styles.icon}>{action.icon}</Text>

        {/* Label */}
        <Text style={styles.label} numberOfLines={2}>{action.label}</Text>

        {/* Last tap time */}
        {lastAt && (
          <Text style={styles.lastAt}>at {lastAt}</Text>
        )}

        {/* Daily goal progress ring for water etc. */}
        {action.dailyGoal && count > 0 && (
          <View style={styles.goalBar}>
            <View
              style={[
                styles.goalFill,
                {
                  backgroundColor: action.color,
                  width: `${Math.min(100, (count / action.dailyGoal) * 100)}%` as `${number}%`,
                },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const useStyles = createThemedStyles(palette => ({
  wrapper: {
    width: '31.3%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: palette.border,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  icon: {
    fontSize: 28,
    lineHeight: 34,
  },
  label: {
    ...typography.caption,
    color: palette.text,
    textAlign: 'center',
    marginTop: 2,
  },
  lastAt: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  goalBar: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: palette.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalFill: {
    height: 3,
    borderRadius: 2,
  },
}));
