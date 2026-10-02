/**
 * PressableScale
 * High-performance, native-driver spring scale component.
 * Delivers crisp tactile micro-interactions with physical spring feedback
 * and coordinated haptics across all primary buttons, chips, and cards.
 */
import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  activeOpacity?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  style,
  activeScale = 0.96,
  activeOpacity = 1,
  haptic = 'light',
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: PressableScaleProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const triggerHaptic = useCallback(async () => {
    if (disabled || haptic === 'none') return;
    try {
      switch (haptic) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch {
      // Haptics unavailable on web or restricted platforms
    }
  }, [disabled, haptic]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;
      triggerHaptic();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: activeScale,
          friction: 8,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: activeOpacity,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPressIn?.(e);
    },
    [disabled, activeScale, activeOpacity, scaleAnim, opacityAnim, triggerHaptic, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();

      onPressOut?.(e);
    },
    [disabled, scaleAnim, opacityAnim, onPressOut]
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
