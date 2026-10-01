/**
 * CalendarHeatMap — month grid with per-day symptom severity colouring.
 * Tap a day to select it; use prev/next arrows to move between months.
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

export interface DaySeverity {
  date: string; // 'YYYY-MM-DD'
  maxSeverity: number; // 0–10; 0 means logged but no severity; -1 means no data
  hasLogs: boolean;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  data: DaySeverity[];
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function severityColor(severity: number, primaryColor: string): string {
  if (severity < 0) return 'transparent';
  if (severity === 0) return primaryColor + '22';
  // 0–3 green-ish, 4–6 amber, 7–10 red-ish
  if (severity <= 3) return `rgba(56, 176, 120, ${0.25 + severity * 0.08})`;
  if (severity <= 6) return `rgba(251, 176, 52, ${0.3 + (severity - 4) * 0.1})`;
  return `rgba(239, 80, 80, ${0.35 + (severity - 7) * 0.1})`;
}

export function CalendarHeatMap({ year, month, data, selectedDate, onSelectDate, onPrevMonth, onNextMonth }: Props) {
  const { palette } = useTheme();
  const styles = useStyles();
  const dataMap = useMemo(() => {
    const m: Record<string, DaySeverity> = {};
    data.forEach(d => { m[d.date] = d; });
    return m;
  }, [data]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Monday-first offset: (getDay() + 6) % 7
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    // pad to full rows
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const isoDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Next month">
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week header */}
      <View style={styles.row}>
        {DAYS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayHeader}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={styles.cell} />;
            const iso = isoDate(day);
            const info = dataMap[iso];
            const bg = info ? severityColor(info.maxSeverity, palette.primary) : 'transparent';
            const isToday = iso === todayStr;
            const isSelected = iso === selectedDate;
            return (
              <TouchableOpacity
                key={col}
                style={styles.cell}
                onPress={() => onSelectDate(iso)}
                accessibilityRole="button"
                accessibilityLabel={`${day} ${MONTH_NAMES[month]}`}
              >
                <View style={[
                  styles.dayCell,
                  { backgroundColor: bg },
                  isToday && styles.today,
                  isSelected && styles.selected,
                ]}>
                  <Text style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                    isToday && !isSelected && styles.dayNumToday,
                  ]}>{day}</Text>
                  {info?.hasLogs && !isSelected && (
                    <View style={styles.dot} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Severity: </Text>
        {[0, 3, 5, 7, 10].map(s => (
          <View key={s} style={[styles.legendDot, { backgroundColor: s === 0 ? palette.primary + '22' : severityColor(s, palette.primary) }]} />
        ))}
        <Text style={styles.legendLabel}> None → High</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = 38;

const useStyles = createThemedStyles(palette => ({
  wrap: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { padding: 6 },
  navArrow: { ...typography.h3, color: palette.primary },
  monthLabel: { ...typography.bodyBold, color: palette.text },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  dayHeader: { ...typography.caption, color: palette.textDisabled, fontWeight: '700' },
  dayCell: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderColor: palette.primary },
  selected: { backgroundColor: palette.primary },
  dayNum: { ...typography.small, color: palette.text, fontWeight: '600' },
  dayNumSelected: { color: palette.white, fontWeight: '800' },
  dayNumToday: { color: palette.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.primary, position: 'absolute', bottom: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 3 },
  legendLabel: { ...typography.caption, color: palette.textDisabled },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
}));
