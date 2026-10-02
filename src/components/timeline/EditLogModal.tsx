import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  X,
  Clock,
  Trash2,
  Check,
  FileText,
  Sliders,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import {
  ILogEntry,
  ICategory,
  IQuestion,
  IOption,
  IQuickAction,
  Answer,
} from '@lumen/shared';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

interface Props {
  visible: boolean;
  entry: ILogEntry | null;
  onClose: () => void;
  categories: ICategory[];
  questions: IQuestion[];
  options: IOption[];
  quickActions?: IQuickAction[];
  onDeleted?: (id: string) => void;
  onUpdated?: (updated: ILogEntry) => void;
}

export function EditLogModal({
  visible,
  entry,
  onClose,
  categories,
  questions,
  options,
  quickActions = [],
  onDeleted,
  onUpdated,
}: Props) {
  const { palette, colorScheme } = useTheme();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [note, setNote] = useState('');
  const [occurredAt, setOccurredAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('time');
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Pre-fill state whenever modal opens with a new entry
  useEffect(() => {
    if (entry) {
      setNote(entry.note || '');
      setOccurredAt(new Date(entry.occurredAt));
      setAnswers(JSON.parse(JSON.stringify(entry.answers || [])));
    }
  }, [entry]);

  if (!entry) return null;

  const isQuickAction = entry.source === 'quick_action' || !!entry.quickActionId;
  const qa = quickActions.find((a) => a._id === entry.quickActionId);
  const cat = categories.find((c) => c._id === entry.categoryId);
  const title = isQuickAction ? qa?.label ?? 'Quick Tap' : cat?.name ?? 'Log Entry';
  const icon = isQuickAction ? qa?.icon ?? '⚡' : cat?.icon ?? '📝';
  const accentColor = isQuickAction
    ? qa?.color ?? palette.primary
    : cat?.color ?? palette.primary;

  const handleDateChange = (_e: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setOccurredAt(selectedDate);
    }
  };

  const openPicker = (mode: 'date' | 'time') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res: any = await api.patch(`/logs/${entry._id}`, {
        note: note.trim() || undefined,
        occurredAt: occurredAt.toISOString(),
        answers,
      });

      const updatedEntry = res?.data ?? res;
      queryClient.invalidateQueries({ queryKey: ['day-entries'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdated?.(updatedEntry);
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not update log entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Log Entry',
      `Permanently remove this "${title}" record? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await api.delete(`/logs/${entry._id}`);
              queryClient.invalidateQueries({ queryKey: ['day-entries'] });
              queryClient.invalidateQueries({ queryKey: ['timeline-summary'] });
              onDeleted?.(entry._id);
              onClose();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete entry.');
            }
          },
        },
      ]
    );
  };

  const formatDisplayTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1F1C18' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: accentColor + '20', borderColor: accentColor + '40' },
                ]}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: palette.text }]}>{title}</Text>
                <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
                  Edit recorded log details
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Timestamp Adjuster */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                Timestamp
              </Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: isDark ? '#2B2620' : '#F5EFE6',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  onPress={() => openPicker('time')}
                  activeOpacity={0.8}
                >
                  <Clock size={16} color={palette.primary} />
                  <Text style={[styles.timeChipText, { color: palette.text }]}>
                    {formatDisplayTime(occurredAt)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: isDark ? '#2B2620' : '#F5EFE6',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  onPress={() => openPicker('date')}
                  activeOpacity={0.8}
                >
                  <Calendar size={16} color={palette.primary} />
                  <Text style={[styles.timeChipText, { color: palette.text }]}>
                    {formatDisplayDate(occurredAt)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={occurredAt}
                  mode={datePickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Answer details snapshot */}
            {answers.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                  Recorded Options & Values
                </Text>
                <View style={styles.answersList}>
                  {answers.map((ans, idx) => {
                    const opt = options.find((o) => o._id === ans.optionId);
                    const optLabel =
                      ans.optionLabelSnapshot ??
                      opt?.label ??
                      (ans.optionId === '__other__' ? ans.otherText : 'Selected');

                    return (
                      <View
                        key={`ans-${idx}`}
                        style={[
                          styles.answerItem,
                          {
                            backgroundColor: isDark ? '#28231C' : '#FAF6F0',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        ]}
                      >
                        <View style={styles.answerHeader}>
                          <Text style={[styles.answerLabel, { color: palette.text }]}>
                            {optLabel}
                          </Text>
                          {ans.values && ans.values.length > 0 && (
                            <View style={styles.valuesList}>
                              {ans.values.map((v, vIdx) => (
                                <Text
                                  key={`v-${vIdx}`}
                                  style={[styles.answerValueBadge, { color: palette.primary }]}
                                >
                                  {v.fieldKey}: {String(v.value)}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Notes Field */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                  Personal Notes
                </Text>
                <FileText size={14} color={palette.textDisabled} />
              </View>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: isDark ? '#2B2620' : '#F5EFE6',
                    color: palette.text,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                placeholder="Add context, triggers, dosage or details…"
                placeholderTextColor={palette.placeholder}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Delete button option */}
            <TouchableOpacity
              style={styles.deleteLink}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.deleteLinkText}>Delete this log entry</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#2E2A24' : '#F0E8DC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={[styles.cancelBtnText, { color: palette.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: palette.primary },
                isSaving && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Update Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '700',
    fontSize: 18,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    marginTop: 16,
  },
  section: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeChipText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14.5,
    minHeight: 80,
  },
  answersList: {
    gap: 8,
  },
  answerItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerLabel: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  valuesList: {
    flexDirection: 'row',
    gap: 6,
  },
  answerValueBadge: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  deleteLinkText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
