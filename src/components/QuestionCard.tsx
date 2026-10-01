/**
 * QuestionCard — renders one question with its options.
 * Respects conditionalDisplay: hidden when the gating question
 * hasn't selected the required option.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IQuestion, IOption, Answer } from '@lumen/shared';
import { useTheme, createThemedStyles } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { OptionSelector } from './OptionSelector';

interface Props {
  question: IQuestion;
  options: IOption[];
  answers: Answer[];
  /** All answers in the current log session — used for conditional display */
  sessionAnswers: Answer[];
  onChange: (answers: Answer[]) => void;
  tempPrefUnit?: 'C' | 'F';
}

/** Returns true if this question should be visible based on conditionalDisplay */
function isVisible(question: IQuestion, sessionAnswers: Answer[]): boolean {
  if (!question.conditionalDisplay) return true;
  const { questionId: _qid, optionId } = question.conditionalDisplay;
  // Find all answers across all questions and check if optionId is selected.
  // (We compare by optionId directly because sessionAnswers are flat across questions.)
  return sessionAnswers.some(a => a.optionId === optionId);
}

export function QuestionCard({
  question,
  options,
  answers,
  sessionAnswers,
  onChange,
  tempPrefUnit = 'C',
}: Props) {
  const { palette } = useTheme();
  const styles = useStyles();
  if (!isVisible(question, sessionAnswers)) return null;

  const activeOptions = options
    .filter(o => o.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <View style={styles.card}>
      {/* Question header */}
      <View style={styles.header}>
        {question.icon ? (
          <Text style={styles.icon}>{question.icon}</Text>
        ) : null}
        <View style={styles.titleGroup}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{question.title}</Text>
            {question.required && <Text style={styles.required}> *</Text>}
          </View>
          {question.helpText ? (
            <Text style={styles.helpText}>{question.helpText}</Text>
          ) : null}
        </View>
      </View>

      {/* Options */}
      <OptionSelector
        options={activeOptions}
        selectionType={question.selectionType}
        allowOther={question.allowOther}
        answers={answers}
        onChange={onChange}
        tempPrefUnit={tempPrefUnit}
      />
    </View>
  );
}

const useStyles = createThemedStyles(palette => ({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16, borderWidth: 1, borderColor: palette.border,
    padding: 16, gap: 14,
  },
  header: { flexDirection: 'row', gap: 10 },
  icon: { fontSize: 22, paddingTop: 2 },
  titleGroup: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { ...typography.h4, color: palette.text, flex: 1 },
  required: { ...typography.h4, color: palette.error },
  helpText: { ...typography.small, color: palette.textSecondary },
}));
