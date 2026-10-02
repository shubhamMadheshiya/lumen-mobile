/**
 * TimelineItem — renders a single LogEntry in the day timeline.
 * Shows category colour strip, time, option chips and key field values.
 * Full support for Quick Action taps (icon, label, values) and deletion.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ILogEntry, ICategory, IOption, IQuestion, IQuickAction } from '@lumen/shared';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

interface Props {
  entry: ILogEntry;
  category?: ICategory;
  question?: IQuestion;
  options: IOption[];
  quickAction?: IQuickAction;
  onPress?: () => void;
  onEdit?: (entry: ILogEntry) => void;
  onDelete?: (id: string) => void;
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

export function TimelineItem({ entry, category, question, options, quickAction, onPress, onEdit, onDelete }: Props) {
  const { palette } = useTheme();
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  const isQuickAction = entry.source === 'quick_action' || !!entry.quickActionId;
  const title = isQuickAction
    ? (quickAction?.label ?? 'Quick Tap')
    : (category?.name ?? 'Log');
  const icon = isQuickAction
    ? (quickAction?.icon ?? '⚡')
    : (category?.icon ?? null);
  const accentColor = isQuickAction
    ? (quickAction?.color ?? palette.primary)
    : (category?.color ?? palette.primary);

  const quickValueText = quickAction?.defaultValue != null
    ? `+${quickAction.defaultValue}${quickAction.unit ? ' ' + quickAction.unit : ''}`
    : null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Log Entry',
      `Are you sure you want to remove this "${title}" log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete?.(entry._id);
          },
        },
      ]
    );
  };

  const handleCardPress = () => {
    if (onEdit) {
      onEdit(entry);
    } else {
      setExpanded(e => !e);
      onPress?.();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${title} at ${formatTime(entry.occurredAt)}`}
    >
      {/* Colour strip */}
      <View style={[styles.strip, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {icon ? <Text style={styles.catIcon}>{icon}</Text> : null}
            <Text style={styles.catName} numberOfLines={1}>{title}</Text>
            {question && <Text style={styles.qTitle} numberOfLines={1}>{question.title}</Text>}
          </View>
          <View style={styles.meta}>
            <Text style={styles.time}>{formatTime(entry.occurredAt)}</Text>
            <View style={styles.badgeRow}>
              <Text style={[styles.sourceBadge, { borderColor: accentColor + '55', color: accentColor, backgroundColor: accentColor + '0D' }]}>
                {SOURCE_LABEL[entry.source] ?? entry.source}
              </Text>
              {onEdit && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(entry);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.trashBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Edit entry"
                >
                  <Edit2 size={13} color={palette.textSecondary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.trashBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Delete entry"
                >
                  <Trash2 size={13} color={palette.textDisabled} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Quick action value pill */}
        {isQuickAction && quickValueText && (
          <View style={styles.chips}>
            <View style={[styles.chip, { borderColor: accentColor + '55', backgroundColor: accentColor + '14' }]}>
              <Text style={[styles.chipText, { color: accentColor, fontWeight: '700' }]}>{quickValueText}</Text>
            </View>
          </View>
        )}

        {/* Option chips for questionnaires */}
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

        {entry.note ? (
          <Text style={styles.note}>📝 {entry.note}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles(palette => ({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  strip: { width: 5 },
  body: { flex: 1, padding: 12, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 },
  catIcon: { fontSize: 16 },
  catName: { ...typography.bodyBold, fontSize: 15, color: palette.text, fontWeight: '700' },
  qTitle: { ...typography.small, color: palette.textSecondary, flex: 1 },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { ...typography.caption, color: palette.textSecondary, fontSize: 11, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceBadge: { ...typography.caption, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1.5, fontSize: 10, fontWeight: '600' },
  trashBtn: { padding: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  chipIcon: { fontSize: 12 },
  chipText: { ...typography.caption, fontWeight: '600', maxWidth: 120 },
  fieldVal: { ...typography.caption, color: palette.textSecondary, marginLeft: 2 },
  moreText: { ...typography.caption, color: palette.textDisabled, alignSelf: 'center' },
  fieldList: { gap: 2, marginTop: 4, paddingLeft: 4 },
  fieldDetail: { ...typography.small, color: palette.textSecondary },
  note: { ...typography.small, color: palette.textSecondary, fontStyle: 'italic', marginTop: 2 },
}));
