import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUser, UpdateProfileDto } from '@lumen/shared';
import { api, saveTokens, clearTokens, getAccessToken } from '../api/client';
import { useConfigStore } from './configStore';
import { useDaySessionStore } from './daySessionStore';
import { useQuickLogStore } from './quickLogStore';
import { useActivityStore } from './activityStore';
import { useReminderStore } from './reminderStore';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  fetchProfile: () => Promise<IUser | null>;
  updateProfile: (patch: UpdateProfileDto) => Promise<IUser>;
  logout: () => Promise<void>;
  setUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: IUser }>(
        '/auth/login',
        { email, password },
      );
      await saveTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: IUser }>(
        '/auth/register',
        { email, password, name },
      );
      await saveTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: IUser }>(
        '/auth/google',
        { idToken },
      );
      await saveTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const token = await getAccessToken();
      if (!token) return null;
      const user = await api.get<IUser>('/auth/me');
      if (user) {
        set({ user, isAuthenticated: true });
        return user;
      }
      return null;
    } catch (err: any) {
      if (err?.statusCode === 401) {
        set({ user: null, isAuthenticated: false });
      }
      return null;
    }
  },

  updateProfile: async (patch: UpdateProfileDto) => {
    set({ isLoading: true });
    try {
      const updatedUser = await api.patch<IUser>('/auth/me', patch);
      set({ user: updatedUser });
      return updatedUser;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore network errors during logout
    }
    await clearTokens();

    try {
      await AsyncStorage.multiRemove([
        'lumen:activity:history_v1',
        'lumen:reminders:cache_v1',
      ]);
    } catch {}

    set({ user: null, isAuthenticated: false });

    // Reset dependent application stores
    useConfigStore.setState({ config: null, lastFetchedAt: null, isLoading: false });
    useDaySessionStore.setState({ todaySession: null, isLoading: false });
    useQuickLogStore.setState({ todayTaps: {}, undoEntry: null, undoTimer: null });
    useActivityStore.setState({
      activeSession: null,
      isTracking: false,
      isPaused: false,
      activeSeconds: 0,
      distanceMeters: 0,
      steps: 0,
      currentSpeedKmh: 0,
      averagePaceMinPerKm: 0,
      routePoints: [],
      history: [],
      todaySummary: null,
      isLoading: false,
      error: null,
    });
    useReminderStore.setState({ reminders: [], isLoading: false, error: null });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
