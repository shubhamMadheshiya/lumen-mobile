import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Flame, Dumbbell, Trophy, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export interface FloatingGlassNavProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'activity', label: 'Activity', icon: Flame },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: User },
];

export const FloatingGlassNav: React.FC<FloatingGlassNavProps> = ({
  initialTab = 'today',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleSelect = (id: string) => {
    setActiveTab(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabChange?.(id);
  };

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.glassBar}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.specularTopLine} pointerEvents="none" />

        <View style={styles.itemsRow}>
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelect(item.id)}
                style={styles.navItem}
              >
                {isActive ? (
                  <View style={styles.activePillGlow}>
                    <IconComponent size={20} color="#22C55E" strokeWidth={2.5} />
                    <View style={styles.activeDot} />
                  </View>
                ) : (
                  <IconComponent size={20} color="#9CA3AF" strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  glassBar: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 24, 0.65)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activePillGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginTop: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default FloatingGlassNav;
