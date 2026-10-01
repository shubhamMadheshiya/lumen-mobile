import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IQuestion } from '@lumen/shared';

export const MAX_QUICK_LOG_QUESTIONS = 5;
const STORAGE_KEY = 'lumen:quick_log_questions_v1';

interface QuickLogConfigState {
  selectedQuestionIds: string[];
  isLoaded: boolean;

  loadSelectedQuestions: (availableQuestions: IQuestion[]) => Promise<string[]>;
  toggleQuestion: (questionId: string) => Promise<{ success: boolean; message?: string }>;
  setSelectedQuestionIds: (ids: string[]) => Promise<void>;
  resetToDefaults: (availableQuestions: IQuestion[]) => Promise<void>;
}

export const useQuickLogConfigStore = create<QuickLogConfigState>((set, get) => ({
  selectedQuestionIds: [],
  isLoaded: false,

  loadSelectedQuestions: async (availableQuestions: IQuestion[]) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter to only questions that actually still exist and are active
          const validIds = parsed.filter(id =>
            availableQuestions.some(q => q._id === id && q.isActive)
          ).slice(0, MAX_QUICK_LOG_QUESTIONS);

          if (validIds.length > 0) {
            set({ selectedQuestionIds: validIds, isLoaded: true });
            return validIds;
          }
        }
      }
    } catch {}

    // Default fallback: select first up to 5 active questions
    const defaults = availableQuestions
      .filter(q => q.isActive)
      .slice(0, MAX_QUICK_LOG_QUESTIONS)
      .map(q => q._id);

    set({ selectedQuestionIds: defaults, isLoaded: true });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults)).catch(() => {});
    return defaults;
  },

  toggleQuestion: async (questionId: string) => {
    const current = get().selectedQuestionIds;
    const exists = current.includes(questionId);

    if (exists) {
      const next = current.filter(id => id !== questionId);
      set({ selectedQuestionIds: next });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { success: true };
    }

    if (current.length >= MAX_QUICK_LOG_QUESTIONS) {
      return {
        success: false,
        message: `Maximum ${MAX_QUICK_LOG_QUESTIONS} questions allowed in Quick Log. Please uncheck another question first.`,
      };
    }

    const next = [...current, questionId];
    set({ selectedQuestionIds: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { success: true };
  },

  setSelectedQuestionIds: async (ids: string[]) => {
    const trimmed = ids.slice(0, MAX_QUICK_LOG_QUESTIONS);
    set({ selectedQuestionIds: trimmed, isLoaded: true });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  },

  resetToDefaults: async (availableQuestions: IQuestion[]) => {
    const defaults = availableQuestions
      .filter(q => q.isActive)
      .slice(0, MAX_QUICK_LOG_QUESTIONS)
      .map(q => q._id);

    set({ selectedQuestionIds: defaults, isLoaded: true });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  },
}));
