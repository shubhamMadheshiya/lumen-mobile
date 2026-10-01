import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { safeGoBack } from '../../src/utils/navigation';
import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { useAuthStore } from '../../src/store/authStore';
import { ApiError } from '../../src/api/client';

export default function RegisterScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert('Please fill in all fields. Password must be at least 8 characters.');
      return;
    }
    try {
      await register(email.trim().toLowerCase(), password, name.trim());
      router.replace('/(tabs)/today');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      Alert.alert('Registration failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => safeGoBack('/(auth)/login')} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.sub}>Your data is private and stored securely.</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={palette.placeholder}
            value={name} onChangeText={setName} accessibilityLabel="Name" autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={palette.placeholder}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            autoComplete="email" accessibilityLabel="Email" />
          <TextInput style={styles.input} placeholder="Password (8+ characters)" placeholderTextColor={palette.placeholder}
            value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password"
            onSubmitEditing={handleRegister} returnKeyType="done" accessibilityLabel="Password" />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text style={styles.buttonText}>{isLoading ? 'Creating account…' : 'Create account'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          By creating an account you acknowledge that Lumen is a tracking tool only,
          not a medical diagnostic application. All patterns shown are observational.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles(palette => ({
  container: { flex: 1, backgroundColor: palette.background },
  scroll:    { flexGrow: 1, padding: 24, paddingTop: 60 },
  back:      { marginBottom: 24 },
  backText:  { ...typography.body, color: palette.primary },
  heading:   { ...typography.h2, color: palette.text, marginBottom: 8 },
  sub:       { ...typography.body, color: palette.textSecondary, marginBottom: 32 },
  form:      { gap: 12 },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, borderRadius: 14,
    padding: 16, ...typography.body, color: palette.text, minHeight: 52,
  },
  button: {
    backgroundColor: palette.primary, borderRadius: 14,
    padding: 16, alignItems: 'center', minHeight: 52, marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: '#FFFFFF' },
  disclaimer: {
    ...typography.caption, color: palette.textDisabled,
    textAlign: 'center', marginTop: 32, lineHeight: 18,
  },
}));
