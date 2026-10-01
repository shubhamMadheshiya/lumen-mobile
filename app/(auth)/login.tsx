import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { ApiError } from '../../src/api/client';
import { useGoogleAuth } from '../../src/hooks/useGoogleAuth';

export default function LoginScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading: authLoading } = useAuthStore();
  const { signInWithGoogle, googleReady, isLoading: googleLoading } = useGoogleAuth();
  const isLoading = authLoading || googleLoading;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter your email and password');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/today');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      Alert.alert('Login failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🌿 Lumen</Text>
        <Text style={styles.tagline}>Track your health journey</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={palette.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={palette.placeholder}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            accessibilityLabel="Password"
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.buttonText}>{isLoading ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, (!googleReady || isLoading) && styles.buttonDisabled]}
            onPress={signInWithGoogle}
            disabled={!googleReady || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>{googleLoading ? 'Signing in with Google…' : 'Continue with Google'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>{"Don't have an account? "}<Text style={styles.linkBold}>Create one</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Lumen is a personal tracking tool, not a medical device.{'\n'}
          Always discuss health concerns with your healthcare provider.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles(palette => ({
  container: { flex: 1, backgroundColor: palette.background },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo:      { ...typography.h1, textAlign: 'center', marginBottom: 4, color: palette.text },
  tagline:   { ...typography.body, color: palette.textSecondary, textAlign: 'center', marginBottom: 40 },
  form:      { gap: 12 },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 16,
    ...typography.body,
    color: palette.text,
    minHeight: 52,
  },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: '#FFFFFF' },
  dividerRow:  { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.border },
  dividerText: { ...typography.caption, color: palette.textDisabled },
  googleButton: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10,
    backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border,
    borderRadius: 14, padding: 14, minHeight: 52,
  },
  googleIcon: { fontSize: 18, fontWeight: '700' as const, color: '#4285F4' },
  googleText: { ...typography.button, color: palette.text },
  link:     { alignItems: 'center' as const, marginTop: 8 },
  linkText: { ...typography.body, color: palette.textSecondary },
  linkBold: { color: palette.primary, fontWeight: '700' as const },
  disclaimer: {
    ...typography.caption,
    color: palette.textDisabled,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 18,
  },
}));
