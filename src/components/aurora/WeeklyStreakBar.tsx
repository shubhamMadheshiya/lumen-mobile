import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Check, Flame } from 'lucide-react-native';

export interface DayStreakItem {
  day: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  completed: boolean;
  isToday?: boolean;
}

export interface WeeklyStreakBarProps {
  days?: DayStreakItem[];
  streakCount?: number;
}

const DEFAULT_DAYS: DayStreakItem[] = [
  { day: 'M', completed: true },
  { day: 'T', completed: true },
  { day: 'W', completed: true },
  { day: 'T', completed: true },
  { day: 'F', completed: true, isToday: true },
  { day: 'S', completed: false },
  { day: 'S', completed: false },
];

export const WeeklyStreakBar: React.FC<WeeklyStreakBarProps> = ({
  days = DEFAULT_DAYS,
  streakCount = 14,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Flame size={16} color="#FF5400" />
          <Text style={styles.streakCountText}>{streakCount} Day Streak</Text>
        </View>
        <Text style={styles.streakSubText}>On fire this week!</Text>
      </View>

      <View style={styles.pillsRow}>
        {days.map((item, index) => {
          return (
            <View
              key={`${item.day}-${index}`}
              style={[
                styles.dayPill,
                item.completed && styles.dayPillActive,
                item.isToday && styles.dayPillToday,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  item.completed && styles.dayLabelActive,
                  item.isToday && styles.dayLabelToday,
                ]}
              >
                {item.day}
              </Text>

              <View
                style={[
                  styles.indicatorDot,
                  item.completed && styles.indicatorDotActive,
                  item.isToday && !item.completed && styles.indicatorDotToday,
                ]}
              >
                {item.completed ? (
                  <Check size={10} color="#09090E" strokeWidth={3} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  streakSubText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  dayPillActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  dayPillToday: {
    borderColor: '#FF5400',
    backgroundColor: 'rgba(255, 84, 0, 0.12)',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  dayLabelToday: {
    color: '#FF5400',
    fontWeight: '800',
  },
  indicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorDotActive: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  indicatorDotToday: {
    borderWidth: 1.5,
    borderColor: '#FF5400',
    backgroundColor: 'transparent',
  },
});

export default WeeklyStreakBar;
