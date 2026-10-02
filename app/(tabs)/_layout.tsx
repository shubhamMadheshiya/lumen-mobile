import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  Home,
  CalendarDays,
  Sparkles,
  SlidersHorizontal,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabLayout() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  // Dynamically account for Android 3-button navigation bar (~48dp), gesture pill (~16-24dp), and iOS Home Indicator (~34dp)
  const bottomInset = insets.bottom;
  const baseContentHeight = 60;
  const tabHeight = baseContentHeight + bottomInset;
  const tabPaddingBottom = bottomInset > 0 ? bottomInset + 2 : (Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textDisabled,
        tabBarBackground: () => <CurvedTabBarBackground tabHeight={tabHeight} />,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: tabHeight,
          paddingBottom: tabPaddingBottom,
          paddingTop: 6,
          overflow: 'visible',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon IconComponent={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon IconComponent={CalendarDays} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarButton: () => (
            <CenterAddButton onPress={() => router.push('/log')} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/log');
          },
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon IconComponent={Sparkles} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="customize"
        options={{
          title: 'Customize',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon IconComponent={SlidersHorizontal} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Animated Tab Bar Icon
 * Delivers playful spring scale bounce on selection + active dot indicator
 */
function AnimatedTabBarIcon({
  IconComponent,
  color,
  focused,
}: {
  IconComponent: React.ComponentType<{ size: number; color: any; strokeWidth: number }>;
  color: any;
  focused: boolean;
}) {
  const { palette } = useTheme();
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.95)).current;
  const dotScaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            friction: 4,
            tension: 220,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 110,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(dotScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(dotScaleAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scaleAnim, dotScaleAnim]);

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconComponent size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
      </Animated.View>
      <Animated.View
        style={[
          styles.tabActiveDot,
          {
            backgroundColor: palette.primary,
            transform: [{ scale: dotScaleAnim }],
            opacity: dotScaleAnim,
          },
        ]}
      />
    </View>
  );
}

function CurvedTabBarBackground({ tabHeight }: { tabHeight?: number }) {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const barHeight = tabHeight ?? (60 + insets.bottom);
  const notchHalfWidth = 50;
  const notchDepth = 37;
  const cx = width / 2;

  const leftX = cx - notchHalfWidth;
  const rightX = cx + notchHalfWidth;

  // Smooth cubic bezier curved scoop that sweeps down around the elevated + button
  const fillPath = `
    M 0 0
    L ${leftX} 0
    C ${cx - 28} 0, ${cx - 23} ${notchDepth}, ${cx} ${notchDepth}
    C ${cx + 23} ${notchDepth}, ${cx + 28} 0, ${rightX} 0
    L ${width} 0
    L ${width} ${barHeight}
    L 0 ${barHeight}
    Z
  `;

  // Continuous border stroke along the top edge, curving down around the notch
  const strokePath = `
    M 0 0.5
    L ${leftX} 0.5
    C ${cx - 28} 0.5, ${cx - 23} ${notchDepth + 0.5}, ${cx} ${notchDepth + 0.5}
    C ${cx + 23} ${notchDepth + 0.5}, ${cx + 28} 0.5, ${rightX} 0.5
    L ${width} 0.5
  `;

  return (
    <View style={[StyleSheet.absoluteFill, { height: barHeight }]} pointerEvents="none">
      <Svg width={width} height={barHeight} style={StyleSheet.absoluteFill}>
        <Path d={fillPath} fill={palette.surface} />
        <Path
          d={strokePath}
          fill="none"
          stroke={palette.border}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

/**
 * Center Add Button
 * Floating central hub with:
 * 1. Ambient breathing pulse halo
 * 2. Physical spring compression on touch
 * 3. 45° rotation micro-animation
 */
function CenterAddButton({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Ambient gentle breathing halo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.centerButtonContainer} pointerEvents="box-none">
      {/* Ambient breathing halo ring */}
      <Animated.View
        style={[
          styles.ambientHalo,
          {
            backgroundColor: palette.primary,
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.18],
              outputRange: [0.26, 0.05],
            }),
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.centerButton,
            {
              backgroundColor: palette.primary,
              shadowColor: palette.primary,
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel="Log a new metric"
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ambientHalo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
