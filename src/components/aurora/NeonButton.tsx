import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export type NeonButtonVariant = 'neonGreen' | 'hotPink' | 'cyan' | 'electricPurple';
export type NeonButtonSize = 'sm' | 'md' | 'lg';

export interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: NeonButtonVariant;
  size?: NeonButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  testID?: string;
}

const COLOR_MAP: Record<NeonButtonVariant, { bg: string; text: string; shadow: string }> = {
  neonGreen: { bg: '#22C55E', text: '#09090E', shadow: '#22C55E' },
  hotPink: { bg: '#EC4899', text: '#FFFFFF', shadow: '#EC4899' },
  cyan: { bg: '#06B6D4', text: '#09090E', shadow: '#06B6D4' },
  electricPurple: { bg: '#8B5CF6', text: '#FFFFFF', shadow: '#8B5CF6' },
};

/**
 * Enhanced Cult.fit Neon Button
 * - Hairline top highlight border simulating refractive beveled glass/resin
 * - Reanimated tactile press scaling (0.97) + Haptic Light feedback
 * - Vivid radial backlight glow matching button hue
 */
export const NeonButton: React.FC<NeonButtonProps> = ({
  label,
  onPress,
  variant = 'neonGreen',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
  hapticFeedback = true,
  testID,
}) => {
  const scale = useSharedValue(1);
  const { bg, text, shadow } = COLOR_MAP[variant];

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 90 });
    if (hapticFeedback && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [disabled, loading, hapticFeedback, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.buttonBase,
          styles[size],
          {
            backgroundColor: bg,
            shadowColor: shadow,
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
      >
        {/* Hairline Refractive Top Highlight */}
        <View style={styles.topBevelHighlight} pointerEvents="none" />

        {loading ? (
          <ActivityIndicator size="small" color={text} />
        ) : (
          <>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
            <Text
              style={[
                styles.labelText,
                styles[`label_${size}`],
                { color: text },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)', // Refractive resin/glass top bevel
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topBevelHighlight: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  iconSlot: {
    marginRight: 6,
  },
  sm: {
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  labelText: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  label_sm: {
    fontSize: 13,
  },
  label_md: {
    fontSize: 15,
  },
  label_lg: {
    fontSize: 17,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default NeonButton;
