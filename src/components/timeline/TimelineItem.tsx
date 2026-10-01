/**
 * TimelineItem — renders a single LogEntry in the day timeline.
 * Shows category colour strip, time, option chips and key field values.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ILogEntry, ICategory, IOption, IQuestion } from '@lumen/shared';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  entry: ILogEntry;
  category?: ICategory;
  question?: IQuestion;
  options: IOption[];
  onPress?: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  quick_action: 'Quick tap',
  questionnaire: 'Log',
  check_in: 'Check-in',
  reminder: 'Reminder',
  activity: 'Activity',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function renderFieldValue(value: unknown, dataType: string, unit?: string): string {
  if (value == null) return '';
  switch (dataType) {
    case 'boolean': return value ? 'Yes' : 'No';
    case 'duration': {
      const secs = Number(value);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    case 'temperature': return `${Number(value).toFixed(1)} °C`;
    case 'range': return `${value}/10`;
    case 'image': return `📷 Photo`;
    case 'location': return `🧍 Body map`;
    default: return unit ? `${value} ${unit}` : String(value);
  }
}

export function TimelineItem({ entry, category, question, options, onPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const accentColor = category?.color ?? palette.primary;

  const selectedOptions = entry.answers.map(ans => {
    const opt = options.find(o => o._id === ans.optionId);
    return { ans, opt };
  }).filter(({ opt }) => opt != null || entry.answers.length > 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { setExpanded(e => !e); onPress?.(); }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${category?.name ?? 'Log'} at ${formatTime(entry.occurredAt)}`}
    >
      {/* Colour strip */}
      <View style={[styles.strip, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {category?.icon ? <Text style={styles.catIcon}>{category.icon}</Text> : null}
            <Text style={styles.catName} numberOfLines={1}>{category?.name ?? 'Log'}</Text>
            {question && <Text style={styles.qTitle} numberOfLines={1}>{question.title}</Text>}
          </View>
          <View style={styles.meta}>
            <Text style={styles.time}>{formatTime(entry.occurredAt)}</Text>
            <Text style={[styles.sourceBadge, { borderColor: accentColor + '55', color: accentColor }]}>
              {SOURCE_LABEL[entry.source] ?? entry.source}
            </Text>
          </View>
        </View>

        {/* Option chips */}
        {entry.answers.length > 0 && (
          <View style={styles.chips}>
            {entry.answers.slice(0, expanded ? undefined : 3).map((ans, i) => {
              const opt = options.find(o => o._id === ans.optionId);
              const label = ans.optionLabelSnapshot ?? opt?.label ?? (ans.optionId === '__other__' ? ans.otherText : '?');
              return (
                <View key={i} style={[styles.chip, { borderColor: accentColor + '55', backgroundColor: accentColor + '12' }]}>
                  {opt?.icon && <Text style={styles.chipIcon}>{opt.icon}</Text>}
                  <Text style={[styles.chipText, { color: accentColor }]} numberOfLines={1}>{label}</Text>
                  {/* Key field values inline */}
                  {ans.values?.slice(0, 1).map((v, vi) => (
                    <Text key={vi} style={styles.fieldVal}>
                      {renderFieldValue(v.value, v.dataType, v.unit)}
                    </Text>
                  ))}
                </View>
              );
            })}
            {!expanded && entry.answers.length > 3 && (
              <Text style={styles.moreText}>+{entry.answers.length - 3} more</Text>
            )}
          </View>
        )}

        {/* Expanded: show all field values + note */}
        {expanded && entry.answers.map((ans, i) => (
          ans.values && ans.values.length > 1 ? (
            <View key={i} style={styles.fieldList}>
              {ans.values.slice(1).map((v, vi) => (
                <Text key={vi} style={styles.fieldDetail}>
                  {v.fieldKey}: {renderFieldValue(v.value, v.dataType, v.unit)}
                </Text>
              ))}
            </View>
          ) : null
        ))}

        {expanded && entry.note ? (
          <Text style={styles.note}>📝 {entry.note}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border, overflow: 'hidden', marginBottom: 8 },
  strip: { width: 4 },
  body: { flex: 1, padding: 12, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  catIcon: { fontSize: 16 },
  catName: { ...typography.label, color: palette.text, fontWeight: '700' },
  qTitle: { ...typography.small, color: palette.textSecondary, flex: 1 },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { ...typography.caption, color: palette.textSecondary },
  sourceBadge: { ...typography.caption, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  chipIcon: { fontSize: 12 },
  chipText: { ...typography.caption, fontWeight: '600', maxWidth: 100 },
  fieldVal: { ...typography.caption, color: palette.textSecondary, marginLeft: 2 },
  moreText: { ...typography.caption, color: palette.textDisabled, alignSelf: 'center' },
  fieldList: { gap: 2 },
  fieldDetail: { ...typography.small, color: palette.textSecondary },
  note: { ...typography.small, color: palette.textSecondary, fontStyle: 'italic' },
});
