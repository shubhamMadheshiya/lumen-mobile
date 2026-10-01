import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type GlowingBorderHue = 'purple' | 'cyan' | 'pink' | 'green' | boolean;

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurTint;
  onPress?: () => void;
  /** Stagger delay in milliseconds for sequential entrance */
  delay?: number;
  /** Enable or disable sequential entry animation (default: true) */
  animatedEntry?: boolean;
  /** High-priority neon border glow (e.g., for active workout or live pass) */
  glowingBorder?: GlowingBorderHue;
  /** Enable subtle haptic pulse on press (default: true) */
  hapticFeedback?: boolean;
  testID?: string;
}

const GLOW_COLORS: Record<string, [string, string, string]> = {
  purple: ['rgba(139, 92, 246, 0.7)', 'rgba(109, 40, 217, 0.3)', 'rgba(139, 92, 246, 0.1)'],
  cyan: ['rgba(6, 182, 212, 0.7)', 'rgba(8, 145, 178, 0.3)', 'rgba(6, 182, 212, 0.1)'],
  pink: ['rgba(236, 72, 153, 0.7)', 'rgba(219, 39, 119, 0.3)', 'rgba(236, 72, 153, 0.1)'],
  green: ['rgba(34, 197, 94, 0.7)', 'rgba(22, 163, 74, 0.3)', 'rgba(34, 197, 94, 0.1)'],
};

/**
 * Production-grade Cult.fit Aurora Glassmorphism Card
 * - Refractive bevel: Top border rgba(255, 255, 255, 0.22) & subtle sides/bottom (0.06)
 * - Animated tactile press scaling with haptic feedback
 * - Ambient neon glow border option
 * - Entrance stagger animation via Reanimated
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  intensity = 25,
  tint = 'dark',
  onPress,
  delay = 0,
  animatedEntry = true,
  glowingBorder = false,
  hapticFeedback = true,
  testID,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withTiming(0.97, { duration: 100 });
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  }, [onPress, hapticFeedback, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, {
        damping: 14,
        stiffness: 260,
        mass: 0.8,
      });
    }
  }, [onPress, scale]);

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowKey = typeof glowingBorder === 'string' ? glowingBorder : glowingBorder ? 'cyan' : null;
  const glowGradient = glowKey ? GLOW_COLORS[glowKey] : null;

  const cardInner = (
    <View style={styles.cardWrapper}>
      {/* Optional Neon Glowing Border Gradient */}
      {glowGradient ? (
        <LinearGradient
          colors={glowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Glass Container */}
      <View
        style={[
          styles.outerContainer,
          glowGradient && styles.glowPadding,
        ]}
      >
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />

        {/* Fallback translucent background */}
        <View style={styles.fallbackFill} pointerEvents="none" />

        {/* Refractive Top Light Reflection Inset */}
        <View style={styles.specularHighlight} pointerEvents="none" />

        {/* Card Content Body */}
        <View style={[styles.innerContent, contentStyle]}>{children}</View>
      </View>
    </View>
  );

  const interactiveWrapper = onPress ? (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {cardInner}
    </Pressable>
  ) : (
    cardInner
  );

  if (animatedEntry) {
    return (
      <Animated.View
        entering={FadeInDown.delay(delay).duration(450).springify().damping(18)}
        style={[animatedPressStyle, style]}
      >
        {interactiveWrapper}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedPressStyle, style]}>
      {interactiveWrapper}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  outerContainer: {
    borderRadius: 24,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)', // Optical top reflection
    borderLeftColor: 'rgba(255, 255, 255, 0.06)',
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Translucent fallback
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glowPadding: {
    margin: 1.2, // Reveals the subtle gradient underneath as a border
    backgroundColor: 'rgba(9, 9, 14, 0.75)',
  },
  fallbackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  innerContent: {
    padding: 20,
  },
});

export default GlassCard;
