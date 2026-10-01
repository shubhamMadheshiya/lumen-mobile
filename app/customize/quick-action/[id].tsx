/**
 * Quick action editor — create or edit a home-screen one-tap button.
 * Mode: counter | timer | toggle
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useConfigStore } from '../../../src/store/configStore';
import { api } from '../../../src/api/client';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { IconPicker } from '../../../src/components/customize/IconPicker';
import { ColorSwatchPicker } from '../../../src/components/customize/ColorSwatchPicker';

type Mode = 'counter' | 'timer' | 'toggle';

const MODES: { key: Mode; icon: string; label: string; description: string }[] = [
  { key: 'counter', icon: '🔢', label: 'Counter', description: 'Each tap adds 1 (or a custom amount) to a running total' },
  { key: 'timer', icon: '⏱️', label: 'Timer', description: 'First tap starts, second tap stops and records duration' },
  { key: 'toggle', icon: '✅', label: 'Toggle', description: 'On / Off state – shows whether something has happened today' },
];

export default function QuickActionEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { config, fetchConfig, invalidate } = useConfigStore();

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [color, setColor] = useState(palette.primary);
  const [mode, setMode] = useState<Mode>('counter');
  const [unit, setUnit] = useState('');
  const [defaultValue, setDefaultValue] = useState('1');
  const [dailyGoal, setDailyGoal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  useEffect(() => {
    if (!isNew && config) {
      const action = config.quickActions?.find(a => a._id === id);
      if (action) {
        setLabel(action.label);
        setIcon(action.icon ?? '⚡');
        setColor(action.color ?? palette.primary);
        setMode(action.mode as Mode);
        setUnit(action.unit ?? '');
        setDefaultValue(action.defaultValue != null ? String(action.defaultValue) : '1');
        setDailyGoal(action.dailyGoal != null ? String(action.dailyGoal) : '');
      }
    }
  }, [id, config]);

  const validate = () => {
    if (!label.trim()) { Alert.alert('Name required', 'Give this button a name.'); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        label: label.trim(), icon, color, mode,
        unit: unit.trim() || undefined,
        defaultValue: defaultValue !== '' ? Number(defaultValue) : undefined,
        dailyGoal: dailyGoal !== '' ? Number(dailyGoal) : undefined,
      };
      if (isNew) {
        await api.post('/quick-actions', body);
      } else {
        await api.patch(`/quick-actions/${id}`, body);
      }
      invalidate(); await fetchConfig();
      router.replace('/customize/quick-actions');
    } finally { setSaving(false); }
  };

  const archive = () => {
    Alert.alert(`Archive "${label}"?`, 'You can restore it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', style: 'destructive',
        onPress: async () => {
          await api.post(`/quick-actions/${id}/archive`, {});
          invalidate(); await fetchConfig();
          router.back();
        },
      },
    ]);
  };

  const ModeCard = ({ item }: { item: typeof MODES[0] }) => (
    <TouchableOpacity
      style={[styles.modeCard, mode === item.key && { borderColor: color, backgroundColor: color + '14' }]}
      onPress={() => setMode(item.key)}
      accessibilityRole="radio"
      accessibilityState={{ selected: mode === item.key }}
    >
      <Text style={styles.modeIcon}>{item.icon}</Text>
      <View style={styles.modeText}>
        <Text style={[styles.modeName, mode === item.key && { color }]}>{item.label}</Text>
        <Text style={styles.modeDesc}>{item.description}</Text>
      </View>
      <View style={[styles.radioOuter, mode === item.key && { borderColor: color }]}>
        {mode === item.key && <View style={[styles.radioInner, { backgroundColor: color }]} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: isNew ? 'New button' : 'Edit button', headerRight: () => (
        <TouchableOpacity onPress={save} disabled={saving} accessibilityRole="button">
          <Text style={[styles.saveBtn, saving && styles.saveBtnDim]}>Save</Text>
        </TouchableOpacity>
      )}} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Live preview */}
        <View style={styles.previewArea}>
          <View style={[styles.previewBtn, { backgroundColor: color + '1A', borderColor: color + '55' }]}>
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={[styles.previewLabel, { color }]} numberOfLines={1}>{label || 'Button name'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Water, Walked, Medication"
          placeholderTextColor={palette.textDisabled}
          autoFocus={isNew}
          accessibilityLabel="Button name"
        />

        <Text style={styles.sectionLabel}>Icon</Text>
        <IconPicker value={icon} onChange={setIcon} />

        <Text style={styles.sectionLabel}>Color</Text>
        <ColorSwatchPicker value={color} onChange={setColor} />

        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.modeList}>
          {MODES.map(m => <ModeCard key={m.key} item={m} />)}
        </View>

        {mode !== 'toggle' && (
          <>
            <Text style={styles.sectionLabel}>Unit (optional)</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="ml, glass, steps, min…"
              placeholderTextColor={palette.textDisabled}
              accessibilityLabel="Unit"
            />

            {mode === 'counter' && (
              <>
                <Text style={styles.sectionLabel}>Amount per tap</Text>
                <TextInput
                  style={styles.input}
                  value={defaultValue}
                  onChangeText={setDefaultValue}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={palette.textDisabled}
                  accessibilityLabel="Amount per tap"
                />
              </>
            )}

            <Text style={styles.sectionLabel}>Daily goal (optional)</Text>
            <TextInput
              style={styles.input}
              value={dailyGoal}
              onChangeText={setDailyGoal}
              keyboardType="numeric"
              placeholder="e.g. 8 (glasses), 10000 (steps)"
              placeholderTextColor={palette.textDisabled}
              accessibilityLabel="Daily goal"
            />
          </>
        )}

        {!isNew && (
          <TouchableOpacity style={styles.archiveBtn} onPress={archive} accessibilityRole="button">
            <Text style={styles.archiveBtnText}>Archive this button</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { padding: 20, gap: 6 },
  previewArea: { alignItems: 'center', paddingVertical: 20 },
  previewBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 24, paddingVertical: 18, minWidth: 100,
  },
  previewIcon: { fontSize: 32 },
  previewLabel: { ...typography.bodyBold, maxWidth: 120 },
  sectionLabel: { ...typography.label, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 4 },
  input: {
    backgroundColor: palette.surface, borderRadius: 12,
    borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: 16, paddingVertical: 13,
    ...typography.body, color: palette.text,
  },
  modeList: { gap: 8 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: palette.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: palette.border, padding: 14,
  },
  modeIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  modeText: { flex: 1 },
  modeName: { ...typography.bodyBold, color: palette.text },
  modeDesc: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  saveBtn: { ...typography.bodyBold, color: palette.primary, paddingHorizontal: 4 },
  saveBtnDim: { opacity: 0.4 },
  archiveBtn: { marginTop: 32, borderRadius: 14, borderWidth: 1, borderColor: palette.error + '55', padding: 14, alignItems: 'center' },
  archiveBtnText: { ...typography.bodyBold, color: palette.error },
});
