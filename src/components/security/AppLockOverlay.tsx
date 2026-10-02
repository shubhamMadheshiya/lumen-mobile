/**
 * AppLockOverlay — Full-screen biometric lock screen for Lumen.
 * Protects clinical logs, symptoms, photos, and medication data when Biometric App Lock is enabled.
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ShieldCheck, Fingerprint, Lock, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { useSecurityStore } from '../../store/securityStore';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';

export function AppLockOverlay() {
  const { palette } = useTheme();
  const { isLocked, isAuthenticating, biometricType, authError, authenticate } = useSecurityStore();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  // Only display overlay if user is logged into an account and app lock is active
  if (!isAuthenticated || !isLocked) {
    return null;
  }

  const handleUnlockPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await authenticate('Unlock Lumen');
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLogoutPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await logout();
    useSecurityStore.getState().unlockApp();
    router.replace('/(auth)/login');
  };

  const biometricLabel =
    biometricType === 'FACE'
      ? 'Unlock with Face ID'
      : biometricType === 'FINGERPRINT'
      ? 'Unlock with Fingerprint'
      : 'Unlock with Biometrics or Passcode';

  return (
    <Modal
      visible={isLocked}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Decorative ambient glow */}
        <View
          style={[
            styles.glowCircle,
            { backgroundColor: palette.primary + '18' },
          ]}
        />

        <View style={styles.centerContent}>
          {/* Lock Icon Emblem */}
          <View style={[styles.emblemContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.innerBadge, { backgroundColor: palette.primary + '14' }]}>
              <ShieldCheck size={48} color={palette.primary} strokeWidth={2.2} />
            </View>
          </View>

          <Text style={[styles.title, { color: palette.text }]}>Lumen is Locked</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Your health logs and sensitive medical data are protected.
          </Text>

          {authError ? (
            <View style={[styles.errorBox, { backgroundColor: palette.error + '14', borderColor: palette.error + '33' }]}>
              <Text style={[styles.errorText, { color: palette.error }]}>{authError}</Text>
            </View>
          ) : null}

          {/* Primary Unlock Action */}
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: palette.primary }]}
            onPress={handleUnlockPress}
            disabled={isAuthenticating}
            activeOpacity={0.85}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Fingerprint size={22} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.unlockButtonText}>{biometricLabel}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.passcodeHint, { color: palette.textDisabled }]}>
            You can also use your device PIN or pattern
          </Text>
        </View>

        {/* Footer Emergency Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: palette.border }]}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={palette.textSecondary} />
            <Text style={[styles.logoutText, { color: palette.textSecondary }]}>Log Out of Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '22%',
    alignSelf: 'center',
  },
  centerContent: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  emblemContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  innerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  errorBox: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  unlockButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  passcodeHint: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
  },
  logoutText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
});
