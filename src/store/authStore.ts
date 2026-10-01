import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUser, UpdateProfileDto } from '@lumen/shared';
import { api, saveTokens, clearTokens, getAccessToken } from '../api/client';
import { useConfigStore } from './configStore';
import { useDaySessionStore } from './daySessionStore';
import { useQuickLogStore } from './quickLogStore';
import { useActivityStore } from './activityStore';
import { useReminderStore } from './reminderStore';

const USER_CACHE_KEY = 'lumen:auth:user_v1';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initAuth: () => Promise<void>;
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

  initAuth: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      // Instantly load cached user profile so initials and name are ready on frame 1
      const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        try {
          const user = JSON.parse(cached);
          if (user && user._id) {
            set({ user, isAuthenticated: true });
          }
        } catch {}
      } else {
        set({ isAuthenticated: true });
      }

      // Simultaneously fetch fresh profile from API in background
      await get().fetchProfile();
    } catch {}
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: IUser }>(
        '/auth/login',
        { email, password },
      );
      await saveTokens(data.accessToken, data.refreshToken);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user)).catch(() => {});
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
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user)).catch(() => {});
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
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user)).catch(() => {});
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
        AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)).catch(() => {});
        return user;
      }
      return null;
    } catch (err: any) {
      if (err?.statusCode === 401) {
        set({ user: null, isAuthenticated: false });
        AsyncStorage.removeItem(USER_CACHE_KEY).catch(() => {});
      }
      return null;
    }
  },

  updateProfile: async (patch: UpdateProfileDto) => {
    set({ isLoading: true });
    try {
      const updatedUser = await api.patch<IUser>('/auth/me', patch);
      set({ user: updatedUser });
      AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser)).catch(() => {});
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
        USER_CACHE_KEY,
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

  setUser: (user) => {
    AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)).catch(() => {});
    set({ user, isAuthenticated: true });
  },
}));

// Early rehydration to prevent any avatar or name flicker on cold launch
AsyncStorage.getItem(USER_CACHE_KEY)
  .then(cached => {
    if (cached) {
      try {
        const user = JSON.parse(cached);
        if (user && user._id && !useAuthStore.getState().user) {
          useAuthStore.setState({ user, isAuthenticated: true });
        }
      } catch {}
    }
  })
  .catch(() => {});

