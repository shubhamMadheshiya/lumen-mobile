/**
 * Security & Biometric App Lock Store for Lumen.
 * Manages:
 * 1. Biometric hardware & enrollment verification via expo-local-authentication.
 * 2. Persistent App Lock preference ('lumen:security:app_lock').
 * 3. App lock / unlock state transitions upon app startup and foregrounding.
 */
import { Platform } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export const APP_LOCK_STORAGE_KEY = 'lumen:security:app_lock';

interface SecurityState {
  isAppLockEnabled: boolean;
  isLocked: boolean;
  isAuthenticating: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'FACE' | 'FINGERPRINT' | 'IRIS' | 'BIOMETRICS';
  authError: string | null;
  isInitialized: boolean;

  // Actions
  initSecurity: () => Promise<void>;
  toggleAppLock: (enable: boolean) => Promise<{ success: boolean; message?: string }>;
  authenticate: (prompt?: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isAppLockEnabled: false,
  isLocked: false,
  isAuthenticating: false,
  hasHardware: false,
  isEnrolled: false,
  biometricType: 'BIOMETRICS',
  authError: null,
  isInitialized: false,

  initSecurity: async () => {
    try {
      const [hasHardware, isEnrolled, supportedTypes, savedLockPref] = await Promise.all([
        LocalAuthentication.hasHardwareAsync().catch(() => false),
        LocalAuthentication.isEnrolledAsync().catch(() => false),
        LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => [] as LocalAuthentication.AuthenticationType[]),
        AsyncStorage.getItem(APP_LOCK_STORAGE_KEY).catch(() => null),
      ]);

      let biometricType: 'FACE' | 'FINGERPRINT' | 'IRIS' | 'BIOMETRICS' = 'BIOMETRICS';
      if (Platform.OS === 'ios') {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = 'FACE';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = 'FINGERPRINT';
        }
      } else {
        // Android / other: prefer FINGERPRINT when available
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = 'FINGERPRINT';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = 'FACE';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometricType = 'IRIS';
        }
      }

      const isEnabled = savedLockPref === 'true';

      set({
        hasHardware,
        isEnrolled,
        biometricType,
        isAppLockEnabled: isEnabled,
        isLocked: isEnabled, // If app lock is enabled, lock on initial cold start
        isInitialized: true,
      });

      // Automatically trigger biometric authentication prompt on cold start if locked
      if (isEnabled) {
        get().authenticate('Unlock Lumen with Biometrics or Passcode');
      }
    } catch (err) {
      console.warn('[SecurityStore] Failed to initialize security:', err);
      set({ isInitialized: true });
    }
  },

  toggleAppLock: async (enable: boolean) => {
    const { hasHardware, isEnrolled, biometricType } = get();

    if (enable) {
      if (!hasHardware) {
        return {
          success: false,
          message: 'Biometric hardware is not available on this device.',
        };
      }
      if (!isEnrolled) {
        return {
          success: false,
          message: 'No biometrics are enrolled. Please set up fingerprint or face recognition in device settings.',
        };
      }

      // Verify biometrics before enabling
      set({ isAuthenticating: true, authError: null });
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to enable App Lock',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Device Passcode',
          disableDeviceFallback: false,
        });

        if (!result.success) {
          set({ isAuthenticating: false });
          return { success: false, message: 'Authentication was cancelled or failed.' };
        }

        await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, 'true');
        set({ isAppLockEnabled: true, isLocked: false, isAuthenticating: false });
        return { success: true };
      } catch (e: any) {
        set({ isAuthenticating: false, authError: e?.message });
        return { success: false, message: e?.message || 'Biometric authentication failed.' };
      }
    } else {
      // Disabling app lock also requires verification for security
      set({ isAuthenticating: true, authError: null });
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to disable App Lock',
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Device Passcode',
          disableDeviceFallback: false,
        });

        if (!result.success) {
          set({ isAuthenticating: false });
          return { success: false, message: 'Authentication was cancelled or failed.' };
        }

        await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, 'false');
        set({ isAppLockEnabled: false, isLocked: false, isAuthenticating: false });
        return { success: true };
      } catch (e: any) {
        set({ isAuthenticating: false });
        return { success: false, message: e?.message || 'Authentication error.' };
      }
    }
  },

  authenticate: async (prompt = 'Unlock Lumen') => {
    const { isAuthenticating, isAppLockEnabled } = get();
    if (!isAppLockEnabled) {
      set({ isLocked: false });
      return true;
    }
    if (isAuthenticating) return false;

    set({ isAuthenticating: true, authError: null });

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        set({ isLocked: false, isAuthenticating: false, authError: null });
        return true;
      } else {
        set({
          isLocked: true,
          isAuthenticating: false,
          authError: result.error === 'user_cancel' ? 'Authentication cancelled' : 'Authentication failed. Please try again.',
        });
        return false;
      }
    } catch (err: any) {
      console.warn('[SecurityStore] Authentication error:', err);
      set({
        isLocked: true,
        isAuthenticating: false,
        authError: err?.message || 'Biometric verification error.',
      });
      return false;
    }
  },

  lockApp: () => {
    const { isAppLockEnabled } = get();
    if (isAppLockEnabled) {
      set({ isLocked: true });
    }
  },

  unlockApp: () => {
    set({ isLocked: false, authError: null });
  },
}));
