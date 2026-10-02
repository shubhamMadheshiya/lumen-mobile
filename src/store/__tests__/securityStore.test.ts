import { useSecurityStore, APP_LOCK_STORAGE_KEY } from '../securityStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

describe('Security Store — Biometric App Lock Architecture', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useSecurityStore.setState({
      isAppLockEnabled: false,
      isLocked: false,
      isAuthenticating: false,
      hasHardware: false,
      isEnrolled: false,
      biometricType: 'BIOMETRICS',
      authError: null,
      isInitialized: false,
    });
  });

  it('1. Initializes security with biometric hardware, enrollment, and saved preference', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, 'true');
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    await useSecurityStore.getState().initSecurity();

    const state = useSecurityStore.getState();
    expect(state.hasHardware).toBe(true);
    expect(state.isEnrolled).toBe(true);
    expect(state.biometricType).toBe('FINGERPRINT');
    expect(state.isAppLockEnabled).toBe(true);
    expect(state.isInitialized).toBe(true);
  });

  it('2. Rejects enabling app lock if device has no biometric hardware', async () => {
    useSecurityStore.setState({ hasHardware: false, isEnrolled: false });

    const result = await useSecurityStore.getState().toggleAppLock(true);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Biometric hardware is not available');
    expect(useSecurityStore.getState().isAppLockEnabled).toBe(false);
  });

  it('3. Rejects enabling app lock if no biometrics are enrolled', async () => {
    useSecurityStore.setState({ hasHardware: true, isEnrolled: false });

    const result = await useSecurityStore.getState().toggleAppLock(true);
    expect(result.success).toBe(false);
    expect(result.message).toContain('No biometrics are enrolled');
    expect(useSecurityStore.getState().isAppLockEnabled).toBe(false);
  });

  it('4. Successfully verifies and enables App Lock when hardware and enrollment exist', async () => {
    useSecurityStore.setState({ hasHardware: true, isEnrolled: true });
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    const result = await useSecurityStore.getState().toggleAppLock(true);
    expect(result.success).toBe(true);
    expect(useSecurityStore.getState().isAppLockEnabled).toBe(true);

    const saved = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
    expect(saved).toBe('true');
  });

  it('5. Successfully verifies and disables App Lock', async () => {
    useSecurityStore.setState({ isAppLockEnabled: true, hasHardware: true, isEnrolled: true });
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    const result = await useSecurityStore.getState().toggleAppLock(false);
    expect(result.success).toBe(true);
    expect(useSecurityStore.getState().isAppLockEnabled).toBe(false);

    const saved = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
    expect(saved).toBe('false');
  });

  it('6. Locks app if app lock is enabled, unlocks upon successful authentication', async () => {
    useSecurityStore.setState({ isAppLockEnabled: true, isLocked: false });

    useSecurityStore.getState().lockApp();
    expect(useSecurityStore.getState().isLocked).toBe(true);

    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    const authSuccess = await useSecurityStore.getState().authenticate();
    expect(authSuccess).toBe(true);
    expect(useSecurityStore.getState().isLocked).toBe(false);
  });
});
