/**
 * DayView — vertical timeline for a single day.
 * Groups entries into hour buckets; draws a vertical line on the left.
 * Fully supports Quick Actions, custom units, and entry deletion.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ActivityIndicator,
} from 'react-native';
import { ILogEntry, ICategory, IOption, IQuestion, IQuickAction } from '@lumen/shared';
import { TimelineItem } from './TimelineItem';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

interface Props {
  date: string; // 'YYYY-MM-DD'
  entries: ILogEntry[];
  categories: ICategory[];
  questions: IQuestion[];
  options: IOption[];
  quickActions?: IQuickAction[];
  loading: boolean;
  onDeleteEntry?: (id: string) => void;
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

export function DayView({
  date,
  entries,
  categories,
  questions,
  options,
  quickActions = [],
  loading,
  onDeleteEntry,
}: Props) {
  const { palette } = useTheme();
  const styles = useStyles();

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
        <Text style={styles.emptyHint}>Tap quick actions or + Log on the Home screen to add an entry.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.dateLabel}>{formattedDate}</Text>
        <Text style={styles.countBadge}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {buckets.map((bucket, index) => (
        <View key={bucket.hour} style={[styles.bucket, index === 0 && styles.firstBucket]}>
          {/* Hour label + horizontal divider line */}
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
              const qa = quickActions.find(q => q._id === entry.quickActionId);

              return (
                <TimelineItem
                  key={entry._id}
                  entry={entry}
                  category={cat}
                  question={q}
                  options={opts}
                  quickAction={qa}
                  onDelete={onDeleteEntry}
                />
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
    </View>
  );
}

const useStyles = createThemedStyles(palette => ({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  center: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: { fontSize: 44 },
  emptyText: { ...typography.body, color: palette.textSecondary, textAlign: 'center', fontWeight: '500' },
  emptyHint: { ...typography.small, color: palette.textDisabled, textAlign: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: { ...typography.h3, fontSize: 18, color: palette.text, fontWeight: '700' },
  countBadge: {
    ...typography.caption,
    color: palette.primary,
    backgroundColor: palette.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '700',
  },
  bucket: { marginBottom: 16 },
  firstBucket: { marginTop: 4 },
  hourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  hourLabelWrap: { minWidth: 62, paddingRight: 8 },
  hourLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  line: { flex: 1, height: 1, backgroundColor: palette.border },
  entriesWrap: { paddingLeft: 4 },
}));
