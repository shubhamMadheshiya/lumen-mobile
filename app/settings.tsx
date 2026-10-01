/**
 * Settings screen — profile, theme, units, app lock, data export, delete account.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import { api } from '../src/api/client';
import { buttonProps } from '../src/utils/accessibility';
import { typography } from '../src/theme/typography';

type ThemePref = 'system' | 'light' | 'dark';

const THEME_OPTIONS: { key: ThemePref; label: string; icon: string }[] = [
  { key: 'system', label: 'System', icon: '🌐' },
  { key: 'light',  label: 'Light',  icon: '☀️' },
  { key: 'dark',   label: 'Dark',   icon: '🌙' },
];

const TEMP_OPTIONS = [
  { key: 'C', label: '°C (Celsius)' },
  { key: 'F', label: '°F (Fahrenheit)' },
];

export default function SettingsScreen() {
  const { palette, preference, setPreference } = useTheme();
  const { user, logout } = useAuthStore();
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [appLock, setAppLock] = useState(false);

  const styles = makeStyles(palette);

  const handleLogout = () => {
    Alert.alert('Log out', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes ALL your data — logs, config and account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/me');
              logout();
            } catch {
              Alert.alert('Error', 'Could not delete your account. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Back' }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email ?? '—'}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{user?.name ?? '—'}</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.section}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.groupLabel}>Theme</Text>
          <View style={styles.segRow}>
            {THEME_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.seg, preference === opt.key && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                onPress={() => setPreference(opt.key)}
                {...buttonProps(`${opt.label} theme`, false)}
              >
                <Text style={styles.segIcon}>{opt.icon}</Text>
                <Text style={[styles.segLabel, preference === opt.key && { color: palette.white }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Units */}
        <Text style={styles.section}>Units</Text>
        <View style={styles.card}>
          <Text style={styles.groupLabel}>Temperature</Text>
          <View style={styles.segRow}>
            {TEMP_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.seg, tempUnit === opt.key && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                onPress={() => setTempUnit(opt.key as 'C' | 'F')}
                {...buttonProps(opt.label, false)}
              >
                <Text style={[styles.segLabel, tempUnit === opt.key && { color: palette.white }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security */}
        <Text style={styles.section}>Security</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowLast]}>
            <View>
              <Text style={styles.rowLabel}>App lock</Text>
              <Text style={styles.rowSub}>Require Face ID / fingerprint on open</Text>
            </View>
            <Switch
              value={appLock}
              onValueChange={setAppLock}
              trackColor={{ false: palette.border, true: palette.primary + '88' }}
              thumbColor={appLock ? palette.primary : palette.textDisabled}
              accessibilityLabel="App lock"
            />
          </View>
        </View>

        {/* Data */}
        <Text style={styles.section}>Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/reports')}
            {...buttonProps('Export health data')}
          >
            <Text style={styles.rowLabel}>Export health data</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/customize/export')}
            {...buttonProps('Export / import config')}
          >
            <Text style={styles.rowLabel}>Export / import config</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={handleLogout}
            {...buttonProps('Log out')}
          >
            <Text style={[styles.rowLabel, { color: palette.warning }]}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity onPress={handleDeleteAccount} {...buttonProps('Delete account and all data')}>
            <Text style={styles.dangerText}>Delete account and all data</Text>
            <Text style={styles.dangerSub}>Permanent. Cannot be undone.</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ReturnType<typeof import('../src/theme/ThemeContext').useTheme>['palette']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.background },
    scroll: { padding: 20, gap: 6 },
    section: { ...typography.label, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 6 },
    card: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { ...typography.body, color: palette.text },
    rowValue: { ...typography.body, color: palette.textSecondary },
    rowSub: { ...typography.small, color: palette.textDisabled, marginTop: 2 },
    chevron: { ...typography.h4, color: palette.textDisabled },
    groupLabel: { ...typography.label, color: palette.textSecondary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    segRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
    seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surfaceAlt },
    segIcon: { fontSize: 14 },
    segLabel: { ...typography.small, color: palette.textSecondary, fontWeight: '600' },
    dangerCard: { borderColor: palette.error + '44', backgroundColor: palette.error + '08', marginTop: 12, padding: 16 },
    dangerText: { ...typography.bodyBold, color: palette.error },
    dangerSub: { ...typography.small, color: palette.error + 'AA', marginTop: 3 },
  });
}
