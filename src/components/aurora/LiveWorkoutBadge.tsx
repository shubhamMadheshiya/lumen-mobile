import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export interface LiveWorkoutBadgeProps {
  countText?: string;
  dotColor?: string;
}

export const LiveWorkoutBadge: React.FC<LiveWorkoutBadgeProps> = ({
  countText = '1.2k Cult members working out now',
  dotColor = '#06B6D4',
}) => {
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0.8);

  useEffect(() => {
    rippleScale.value = withRepeat(
      withTiming(2.4, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    rippleOpacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [rippleScale, rippleOpacity]);

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Pulse Dot with Ping Ripple */}
      <View style={styles.dotWrapper}>
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: dotColor },
            animatedRippleStyle,
          ]}
        />
        <View style={[styles.solidDot, { backgroundColor: dotColor }]} />
      </View>

      <Text style={styles.label}>{countText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 8,
  },
  dotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ripple: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },
});

export default LiveWorkoutBadge;
