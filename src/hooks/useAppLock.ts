/**
 * useAppLock Hook — Listens to application foreground/background lifecycle state
 * and automatically locks Lumen when the user switches apps or minimizes the app.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSecurityStore } from '../store/securityStore';
import { useAuthStore } from '../store/authStore';

export function useAppLock() {
  const { initSecurity, lockApp, authenticate, isAppLockEnabled } = useSecurityStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Initialize security settings on app startup
  useEffect(() => {
    initSecurity();
  }, [initSecurity]);

  // Monitor AppState transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If user navigated away from the app into the background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has returned to foreground
        if (isAppLockEnabled && isAuthenticated) {
          lockApp();
          // Prompt biometrics immediately upon return to foreground
          authenticate('Unlock Lumen with Biometrics or Passcode');
        }
      } else if (nextAppState === 'background') {
        // As soon as the app enters background, engage lock so preview snapshot in app switcher is secure
        if (isAppLockEnabled && isAuthenticated) {
          lockApp();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, isAuthenticated, lockApp, authenticate]);
}
