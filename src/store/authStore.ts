import { create } from 'zustand';
import { IUser } from '@lumen/shared';
import { api, saveTokens, clearTokens } from '../api/client';

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
