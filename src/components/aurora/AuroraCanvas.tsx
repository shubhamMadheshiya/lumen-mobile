import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AuroraCanvasProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Dynamic Ambient Background ("Breathing Aurora")
 * - Deep container color: #09090E
 * - Organic floating & breathing orbs in slow 6–10s desynchronized cycles
 * - Electric Purple (#8B5CF6), Cyan (#06B6D4), and Neon Pink (#EC4899)
 */
export const AuroraCanvas: React.FC<AuroraCanvasProps> = ({ children, style }) => {
  // Orb 1: Electric Purple (#8B5CF6) - Top Right
  const scalePurple = useSharedValue(0.95);
  const transXPurple = useSharedValue(-15);
  const transYPurple = useSharedValue(-10);

  // Orb 2: Cyan (#06B6D4) - Mid Left
  const scaleCyan = useSharedValue(1.1);
  const transXCyan = useSharedValue(20);
  const transYCyan = useSharedValue(10);

  // Orb 3: Neon Pink (#EC4899) - Lower Center/Right
  const scalePink = useSharedValue(0.92);
  const transXPink = useSharedValue(-20);
  const transYPink = useSharedValue(18);

  useEffect(() => {
    // Electric Purple floating cycle (~7.5s)
    scalePurple.value = withRepeat(
      withTiming(1.15, { duration: 7500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transXPurple.value = withRepeat(
      withTiming(25, { duration: 8200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transYPurple.value = withRepeat(
      withTiming(28, { duration: 9100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Cyan floating cycle (~8.5s)
    scaleCyan.value = withRepeat(
      withTiming(0.92, { duration: 8800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transXCyan.value = withRepeat(
      withTiming(-25, { duration: 7200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transYCyan.value = withRepeat(
      withTiming(-22, { duration: 9500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Neon Pink breathing cycle (~7.0s)
    scalePink.value = withRepeat(
      withTiming(1.14, { duration: 6800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transXPink.value = withRepeat(
      withTiming(24, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transYPink.value = withRepeat(
      withTiming(-20, { duration: 7400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [
    scalePurple,
    transXPurple,
    transYPurple,
    scaleCyan,
    transXCyan,
    transYCyan,
    scalePink,
    transXPink,
    transYPink,
  ]);

  const animatedPurpleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scalePurple.value },
      { translateX: transXPurple.value },
      { translateY: transYPurple.value },
    ],
  }));

  const animatedCyanStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleCyan.value },
      { translateX: transXCyan.value },
      { translateY: transYCyan.value },
    ],
  }));

  const animatedPinkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scalePink.value },
      { translateX: transXPink.value },
      { translateY: transYPink.value },
    ],
  }));

  return (
    <View style={[styles.canvas, style]}>
      {/* Background Animated Vector Orbs Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Blob 1: Electric Purple (#8B5CF6) */}
        <Animated.View
          style={[styles.blobContainer, styles.purpleOrbWrapper, animatedPurpleStyle]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9', 'transparent']}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={styles.orbGradient}
          />
        </Animated.View>

        {/* Blob 2: Cyan (#06B6D4) */}
        <Animated.View
          style={[styles.blobContainer, styles.cyanOrbWrapper, animatedCyanStyle]}
        >
          <LinearGradient
            colors={['#06B6D4', '#0891B2', 'transparent']}
            start={{ x: 0.1, y: 0.2 }}
            end={{ x: 0.85, y: 0.85 }}
            style={styles.orbGradient}
          />
        </Animated.View>

        {/* Blob 3: Neon Pink (#EC4899) */}
        <Animated.View
          style={[styles.blobContainer, styles.pinkOrbWrapper, animatedPinkStyle]}
        >
          <LinearGradient
            colors={['#EC4899', '#DB2777', 'transparent']}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.9, y: 1.0 }}
            style={styles.orbGradient}
          />
        </Animated.View>
      </View>

      {/* Foreground UI Components */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#09090E', // Required Cult.fit dark background
    position: 'relative',
    overflow: 'hidden',
  },
  blobContainer: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  purpleOrbWrapper: {
    top: -SCREEN_WIDTH * 0.15,
    right: -SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_WIDTH * 0.88,
    opacity: 0.65,
  },
  cyanOrbWrapper: {
    top: SCREEN_HEIGHT * 0.24,
    left: -SCREEN_WIDTH * 0.24,
    width: SCREEN_WIDTH * 0.84,
    height: SCREEN_WIDTH * 0.84,
    opacity: 0.55,
  },
  pinkOrbWrapper: {
    bottom: SCREEN_HEIGHT * 0.12,
    right: -SCREEN_WIDTH * 0.14,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    opacity: 0.52,
  },
});

export default AuroraCanvas;
