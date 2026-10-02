/**
 * DayView — vertical timeline for a single day.
 * Groups entries into hour buckets; draws a vertical line on the left.
 * Fully supports Quick Actions, custom units, entry editing/deletion,
 * and bulk Expand all / Collapse all toggle.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  onEditEntry?: (id: string) => void;
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
  onEditEntry,
  onDeleteEntry,
}: Props) {
  const { palette } = useTheme();
  const styles = useStyles();

  // Bulk expand/collapse state: defaults to false (collapsed by default)
  const [allExpanded, setAllExpanded] = useState<boolean | null>(false);

  const toggleAllExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllExpanded(prev => (prev === true ? false : true));
  };

  const buckets = useMemo<HourBucket[]>(() => {
    const map: Record<number, ILogEntry[]> = {};
    entries.forEach(e => {
      const h = new Date(e.occurredAt).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(e);
    });

    return Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map(hour => ({
        hour,
        label: toHourLabel(hour),
        entries: map[hour].sort(
          (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        ),
      }));
  }, [entries]);

  const formattedDate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) return 'Today';
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }, [date]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>No logs for this day</Text>
        <Text style={styles.emptyHint}>
          Track how you feel, your meals, or symptoms to see them on your timeline.
        </Text>
        <TouchableOpacity
          style={styles.emptyAddBtn}
          onPress={() => router.push('/log' as any)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.emptyAddText}>Log an entry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.dateLabel}>{formattedDate}</Text>
          <Text style={styles.countBadge}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {/* Global Expand all / Collapse all toggle button */}
        {entries.length > 0 && (
          <TouchableOpacity
            style={styles.expandAllBtn}
            onPress={toggleAllExpanded}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={allExpanded ? 'Collapse all logs' : 'Expand all logs'}
          >
            <Text style={[styles.expandAllText, { color: palette.primary }]}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Text>
            {allExpanded ? (
              <ChevronUp size={14} color={palette.primary} />
            ) : (
              <ChevronDown size={14} color={palette.primary} />
            )}
          </TouchableOpacity>
        )}
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
              const opts = options.filter(o => entry.answers?.some(a => a.optionId === o._id));
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
                  onEdit={onEditEntry}
                  forceExpanded={allExpanded}
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
  emptyHint: { ...typography.small, color: palette.textDisabled, textAlign: 'center', maxWidth: 260 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  expandAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.primary + '12',
    borderWidth: 1,
    borderColor: palette.primary + '28',
  },
  expandAllText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11.5,
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
