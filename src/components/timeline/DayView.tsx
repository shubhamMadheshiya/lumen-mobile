/**
 * DayView — vertical timeline for a single day.
 * Groups entries into hour buckets; draws a vertical line on the left.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { ILogEntry, ICategory, IOption, IQuestion } from '@lumen/shared';
import { TimelineItem } from './TimelineItem';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  date: string; // 'YYYY-MM-DD'
  entries: ILogEntry[];
  categories: ICategory[];
  questions: IQuestion[];
  options: IOption[];
  loading: boolean;
}

interface HourBucket {
  hour: number;
  label: string;
  entries: ILogEntry[];
}

function toHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function DayView({ date, entries, categories, questions, options, loading }: Props) {
  const buckets = useMemo<HourBucket[]>(() => {
    const map: Record<number, ILogEntry[]> = {};
    entries.forEach(e => {
      const h = new Date(e.occurredAt).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(e);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([h, items]) => ({
        hour: Number(h),
        label: toHourLabel(Number(h)),
        entries: items.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()),
      }));
  }, [entries]);

  const formattedDate = useMemo(() => {
    const d = new Date(date + 'T12:00:00');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }, [date]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyText}>Nothing logged on {formattedDate}.</Text>
        <Text style={styles.emptyHint}>Tap + Log on the Home screen to add an entry.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.dateLabel}>{formattedDate}</Text>
      <Text style={styles.countLabel}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</Text>

      {buckets.map(bucket => (
        <View key={bucket.hour} style={styles.bucket}>
          {/* Hour label + vertical line */}
          <View style={styles.hourRow}>
            <View style={styles.hourLabelWrap}>
              <Text style={styles.hourLabel}>{bucket.label}</Text>
            </View>
            <View style={styles.line} />
          </View>

          {/* Entries in this bucket */}
          <View style={styles.entriesWrap}>
            {bucket.entries.map(entry => {
              const cat = categories.find(c => c._id === entry.categoryId);
              const q = questions.find(q => q._id === entry.questionId);
              const opts = options.filter(o => entry.answers.some(a => a.optionId === o._id));
              return (
                <TimelineItem
                  key={entry._id}
                  entry={entry}
                  category={cat}
                  question={q}
                  options={opts}
                />
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { ...typography.body, color: palette.textSecondary, textAlign: 'center' },
  emptyHint: { ...typography.small, color: palette.textDisabled, textAlign: 'center' },
  dateLabel: { ...typography.h3, color: palette.text, marginBottom: 2 },
  countLabel: { ...typography.small, color: palette.textSecondary, marginBottom: 16 },
  bucket: { marginBottom: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  hourLabelWrap: { width: 54 },
  hourLabel: { ...typography.caption, color: palette.textDisabled, fontWeight: '700' },
  line: { flex: 1, height: 1, backgroundColor: palette.border },
  entriesWrap: { paddingLeft: 4 },
});
