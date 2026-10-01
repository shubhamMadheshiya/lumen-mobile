import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Tabs, router } from 'expo-router';
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textDisabled,
        tabBarBackground: () => <CurvedTabBarBackground />,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 76 : 64,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
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
            <Home size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, focused }) => (
            <CalendarDays size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
            <Sparkles size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="customize"
        options={{
          title: 'Customize',
          tabBarIcon: ({ color, focused }) => (
            <SlidersHorizontal size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

function CurvedTabBarBackground() {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();

  const barHeight = Platform.OS === 'ios' ? 76 : 64;
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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

function CenterAddButton({ onPress }: { onPress: () => void }) {
  const { palette } = useTheme();

  return (
    <View style={styles.centerButtonContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.centerButton,
          {
            backgroundColor: palette.primary,
            shadowColor: palette.primary,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Log a new metric"
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
