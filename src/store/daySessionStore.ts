import { create } from 'zustand';
import { IDaySession } from '@lumen/shared';
import { api } from '../api/client';

interface DaySessionState {
  todaySession: IDaySession | null;
  isLoading: boolean;

  fetchTodaySession: () => Promise<void>;
  recordWakeUp: (time?: Date) => Promise<void>;
  recordGoToBed: (time?: Date) => Promise<void>;
}

export const useDaySessionStore = create<DaySessionState>((set, get) => ({
  todaySession: null,
  isLoading: false,

  fetchTodaySession: async () => {
    set({ isLoading: true });
    try {
      const today = new Date().toISOString().slice(0, 10);
      const sessions = await api.get<IDaySession[]>(`/day-sessions?from=${today}&to=${today}`);
      set({ todaySession: sessions[0] ?? null });
    } catch {
      // No session yet — that's fine
      set({ todaySession: null });
    } finally {
      set({ isLoading: false });
    }
  },

  recordWakeUp: async (time?: Date) => {
    set({ isLoading: true });
    try {
      const session = await api.post<IDaySession>('/day-sessions/wake', {
        wakeTime: time?.toISOString(),
        edited: !!time,
      });
      set({ todaySession: session });
    } finally {
      set({ isLoading: false });
    }
  },

  recordGoToBed: async (time?: Date) => {
    set({ isLoading: true });
    try {
      const session = await api.post<IDaySession>('/day-sessions/sleep', {
        sleepTime: time?.toISOString(),
        edited: !!time,
      });
      set({ todaySession: session });
    } finally {
      set({ isLoading: false });
    }
  },
}));
