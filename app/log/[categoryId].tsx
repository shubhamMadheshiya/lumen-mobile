/**
 * Question sheet for a specific category.
 * Renders all active questions via QuestionCard, manages answer state,
 * supports backdating and "Same as yesterday" shortcut, then submits.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, Platform, Modal, Pressable,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { uuidv4 } from '../../src/utils/uuid';
import { IQuestion, IOption, ICategory, Answer, ILogEntry } from '@lumen/shared';
import { useConfigStore } from '../../src/store/configStore';
import { useDaySessionStore } from '../../src/store/daySessionStore';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/api/client';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { QuestionCard } from '../../src/components/QuestionCard';
import { validateAnswers } from '../../src/utils/validateAnswers';
import { uploadAnswerImages } from '../../src/utils/uploadAnswerImages';

function fmt(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const date = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const isToday = new Date().toDateString() === d.toDateString();
  return isToday ? `Today at ${h12}:${m} ${period}` : `${date} at ${h12}:${m} ${period}`;
}

export default function QuestionSheet() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { config } = useConfigStore();
  const { todaySession } = useDaySessionStore();
  const { user } = useAuthStore();

  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, Answer[]>>({});
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState('');

  const category: ICategory | undefined = config?.categories.find(c => c._id === categoryId);
  const questions: IQuestion[] = (config?.questions ?? [])
    .filter(q => q.categoryId === categoryId && q.isActive)
    .sort((a, b) => a.order - b.order);
  const optionsByQuestion: Record<string, IOption[]> = {};
  for (const q of questions) {
    optionsByQuestion[q._id] = (config?.options ?? [])
      .filter(o => o.questionId === q._id && o.isActive)
      .sort((a, b) => a.order - b.order);
  }

  // All current answers flat — used for conditionalDisplay evaluation
  const allAnswers = Object.values(answersByQuestion).flat();

  const tempPrefUnit = user?.preferences.tempUnit ?? 'C';

  const setQAnswers = useCallback(
    (questionId: string, answers: Answer[]) => {
      setAnswersByQuestion(prev => ({ ...prev, [questionId]: answers }));
    },
    [],
  );

  // "Same as yesterday" — fetch the last log for this category
  const loadYesterday = async () => {
    try {
      const yesterday = new Date(Date.now() - 86400000);
      const from = yesterday.toISOString().slice(0, 10);
      const logs = await api.get<ILogEntry[]>(`/logs?from=${from}&to=${from}&category=${categoryId}&limit=1`);
      if (!logs.length) { Alert.alert('No data', "No logs found for yesterday."); return; }
      const last = logs[0];
      if (!last) return;
      // Rebuild answersByQuestion from the last log's answers
      const byQ: Record<string, Answer[]> = {};
      for (const answer of last.answers) {
        // We don't know which questionId the answer belongs to exactly from the flat list,
        // but we match by optionId to the question it belongs to
        const option = config?.options.find(o => o._id === answer.optionId);
        if (!option) continue;
        const qId = option.questionId;
        if (!byQ[qId]) byQ[qId] = [];
        byQ[qId].push({ ...answer });
      }
      setAnswersByQuestion(byQ);
    } catch {
      Alert.alert('Error', "Could not load yesterday's log.");
    }
  };

  const validate = (): string | null => {
    for (const q of questions) {
      if (!q.required) continue;
      const answers = answersByQuestion[q._id] ?? [];
      if (answers.length === 0) {
        return `"${q.title}" is required — please select at least one option.`;
      }
    }
    // Validate field values against field definitions
    const allOptions = Object.values(optionsByQuestion).flat();
    const allAns = Object.values(answersByQuestion).flat();
    return validateAnswers(allAns, allOptions);
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) { Alert.alert('Missing answer', error); return; }

    const rawAns = Object.values(answersByQuestion).flat();
    if (rawAns.length === 0) {
      Alert.alert('Nothing selected', 'Please select at least one option before logging.');
      return;
    }

    setIsSubmitting(true);
    try {
      const allAns = await uploadAnswerImages(rawAns);
      await api.post('/logs', {
        clientId: uuidv4(),
        daySessionId: todaySession?._id,
        source: 'questionnaire',
        categoryId,
        questionId: questions[0]?._id,           // primary question ref
        questionVersion: questions[0]?.version ?? 1,
        occurredAt: occurredAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        answers: allAns,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Log failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPickerChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setOccurredAt(date);
  };

  if (!category) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Log' }} />
        <Text style={styles.errorText}>Category not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: category.name }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Log time row */}
        <TouchableOpacity
          style={styles.timeRow}
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel={`Log time: ${fmt(occurredAt)}`}
          accessibilityRole="button"
        >
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timeText}>{fmt(occurredAt)}</Text>
          <Text style={styles.timeEdit}>Change</Text>
        </TouchableOpacity>

        {/* Yesterday shortcut */}
        <TouchableOpacity
          style={styles.yesterdayBtn}
          onPress={loadYesterday}
          accessibilityRole="button"
          accessibilityLabel="Copy from yesterday"
        >
          <Text style={styles.yesterdayText}>📋  Same as yesterday</Text>
        </TouchableOpacity>

        {/* Question cards */}
        {questions.map((q) => (
          <QuestionCard
            key={q._id}
            question={q}
            options={optionsByQuestion[q._id] ?? []}
            answers={answersByQuestion[q._id] ?? []}
            sessionAnswers={allAnswers}
            onChange={(ans) => setQAnswers(q._id, ans)}
            tempPrefUnit={tempPrefUnit}
          />
        ))}

        {questions.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No questions configured for this category yet.</Text>
            <Text style={styles.emptyHint}>Go to Customize → Categories to add questions.</Text>
          </View>
        )}

        {/* Optional note */}
        <View style={styles.noteWrapper}>
          <Text style={styles.noteLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add any extra context or notes…"
            placeholderTextColor={palette.placeholder}
            multiline
            maxLength={1000}
            accessibilityLabel="Optional note"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Submit button pinned to bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Log now"
        >
          {isSubmitting
            ? <ActivityIndicator color={palette.white} />
            : <Text style={styles.submitText}>Log now</Text>}
        </TouchableOpacity>
      </View>

      {/* Date/time picker — iOS modal, Android native */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>When did this happen?</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={occurredAt}
                mode="datetime"
                display="spinner"
                onChange={onPickerChange}
                maximumDate={new Date()}
                textColor={palette.text}
              />
            </View>
          </Pressable>
        </Modal>
      )}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={occurredAt}
          mode="datetime"
          display="default"
          onChange={onPickerChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.body, color: palette.error },
  scroll: { padding: 16, gap: 14 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: palette.surface,
    borderRadius: 12, borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  timeIcon: { fontSize: 16 },
  timeText: { ...typography.smallBold, color: palette.text, flex: 1 },
  timeEdit: { ...typography.small, color: palette.primary },
  yesterdayBtn: {
    backgroundColor: palette.secondary + '18',
    borderRadius: 12, borderWidth: 1, borderColor: palette.secondary + '44',
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  yesterdayText: { ...typography.smallBold, color: palette.secondary },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: 14, borderWidth: 1, borderColor: palette.border,
    padding: 20, alignItems: 'center', gap: 6,
  },
  emptyText: { ...typography.body, color: palette.textSecondary, textAlign: 'center' },
  emptyHint: { ...typography.small, color: palette.textDisabled, textAlign: 'center' },
  noteWrapper: { gap: 6 },
  noteLabel: { ...typography.smallBold, color: palette.textSecondary },
  noteInput: {
    backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 14, padding: 14,
    ...typography.body, color: palette.text,
    minHeight: 72,
  },
  spacer: { height: 100 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1, borderTopColor: palette.border,
  },
  submitBtn: {
    backgroundColor: palette.primary,
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 54,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { ...typography.button, color: palette.white },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: palette.border,
  },
  pickerTitle: { ...typography.h4, color: palette.text },
  pickerDone: { ...typography.bodyBold, color: palette.primary },
});
