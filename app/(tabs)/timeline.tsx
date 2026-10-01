/**
 * Timeline tab — calendar heat-map + day-by-day log view.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useConfigStore } from '../../src/store/configStore';
import { CalendarHeatMap } from '../../src/components/timeline/CalendarHeatMap';
import { DayView } from '../../src/components/timeline/DayView';
import { useTimelineSummary, useDayEntries } from '../../src/hooks/useTimelineSummary';
import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { api } from '../../src/api/client';

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export default function TimelineScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const today = toISO(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [showCalendar, setShowCalendar] = useState(true);

  const { config } = useConfigStore();
  const { data: summary = [], isLoading: summaryLoading } = useTimelineSummary(calYear, calMonth);
  const { data: entries = [], isLoading: entriesLoading } = useDayEntries(selectedDate);

  const categories = config?.categories ?? [];
  const questions = config?.questions ?? [];
  const options = config?.options ?? [];
  const quickActions = config?.quickActions ?? [];

  const prevMonth = useCallback(() => {
    setCalMonth(m => {
      if (m === 0) { setCalYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCalMonth(m => {
      if (m === 11) { setCalYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const jumpToDate = (date: string) => {
    setSelectedDate(date);
    const d = new Date(date + 'T12:00:00');
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  // Swipe between days via arrow buttons
  const prevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    jumpToDate(toISO(d));
  };

  const nextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const next = toISO(d);
    if (next <= today) jumpToDate(next);
  };

  const isToday = selectedDate === today;

  // Active category filter
  const [filterCatId, setFilterCatId] = useState<string | null>(null);
  const filteredEntries = filterCatId
    ? entries.filter(e => e.categoryId === filterCatId)
    : entries;

  const usedCatIds = [...new Set(entries.map(e => e.categoryId).filter(Boolean))];
  const usedCats = categories.filter(c => usedCatIds.includes(c._id));

  // Day summary metrics
  const dayStats = useMemo(() => {
    const quickTapCount = filteredEntries.filter(e => e.source === 'quick_action' || !!e.quickActionId).length;
    const detailedCount = filteredEntries.length - quickTapCount;
    return {
      total: filteredEntries.length,
      quickTaps: quickTapCount,
      detailed: detailedCount,
    };
  }, [filteredEntries]);

  // Handle entry deletion
  const handleDeleteEntry = async (id: string) => {
    try {
      await api.delete(`/logs/${id}`);
      queryClient.invalidateQueries({ queryKey: ['day-entries', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
    } catch {
      Alert.alert('Error', 'Failed to delete log entry.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Timeline</Text>
        <TouchableOpacity onPress={() => setShowCalendar(v => !v)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{showCalendar ? 'Hide calendar' : 'Show calendar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar heat map */}
        {showCalendar && (
          <View style={styles.calWrap}>
            <CalendarHeatMap
              year={calYear}
              month={calMonth}
              data={summary}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </View>
        )}

        {/* Day nav bar */}
        <View style={styles.dayNav}>
          <TouchableOpacity onPress={prevDay} style={styles.dayNavBtn} accessibilityRole="button" accessibilityLabel="Previous day">
            <Text style={styles.dayNavArrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => jumpToDate(today)} accessibilityRole="button">
            <Text style={styles.dayLabel}>
              {isToday ? 'Today'
                : new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextDay} style={[styles.dayNavBtn, isToday && styles.dim]} disabled={isToday} accessibilityRole="button" accessibilityLabel="Next day">
            <Text style={styles.dayNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Summary Stats Banner (when there are entries) */}
        {dayStats.total > 0 && (
          <View style={styles.statsBanner}>
            <View style={styles.statPill}>
              <Text style={styles.statPillVal}>{dayStats.total}</Text>
              <Text style={styles.statPillLabel}>Total Logs</Text>
            </View>
            {dayStats.quickTaps > 0 && (
              <View style={styles.statPill}>
                <Text style={styles.statPillVal}>⚡ {dayStats.quickTaps}</Text>
                <Text style={styles.statPillLabel}>Quick Taps</Text>
              </View>
            )}
            {dayStats.detailed > 0 && (
              <View style={styles.statPill}>
                <Text style={styles.statPillVal}>📋 {dayStats.detailed}</Text>
                <Text style={styles.statPillLabel}>Detailed</Text>
              </View>
            )}
          </View>
        )}

        {/* Category filter chips */}
        {usedCats.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, filterCatId === null && styles.filterChipActive]}
              onPress={() => setFilterCatId(null)}
            >
              <Text style={[styles.filterText, filterCatId === null && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {usedCats.map(cat => (
              <TouchableOpacity
                key={cat._id}
                style={[styles.filterChip, filterCatId === cat._id && { borderColor: cat.color, backgroundColor: cat.color + '14' }]}
                onPress={() => setFilterCatId(filterCatId === cat._id ? null : cat._id)}
              >
                {cat.icon && <Text style={styles.filterIcon}>{cat.icon}</Text>}
                <Text style={[styles.filterText, filterCatId === cat._id && { color: cat.color }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Day entries */}
        <View style={styles.dayViewWrap}>
          <DayView
            date={selectedDate}
            entries={filteredEntries}
            categories={categories}
            questions={questions}
            options={options}
            quickActions={quickActions}
            loading={entriesLoading}
            onDeleteEntry={handleDeleteEntry}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(palette => ({
  safe: { flex: 1, backgroundColor: palette.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  heading: { ...typography.h2, color: palette.text },
  toggleBtn: { padding: 6 },
  toggleText: { ...typography.small, color: palette.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  calWrap: { padding: 12, paddingBottom: 4, backgroundColor: palette.background },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  dayNavBtn: { padding: 6 },
  dayNavArrow: { ...typography.h3, color: palette.primary },
  dayLabel: { ...typography.bodyBold, color: palette.text },
  dim: { opacity: 0.3 },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border + '55',
    backgroundColor: palette.surfaceAlt,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statPillVal: {
    ...typography.caption,
    fontWeight: '700',
    color: palette.text,
    fontSize: 12,
  },
  statPillLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 11,
  },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface },
  filterChipActive: { borderColor: palette.primary, backgroundColor: palette.primary + '14' },
  filterIcon: { fontSize: 13 },
  filterText: { ...typography.small, color: palette.textSecondary, fontWeight: '600' },
  filterTextActive: { color: palette.primary },
  dayViewWrap: { minHeight: 300 },
}));
