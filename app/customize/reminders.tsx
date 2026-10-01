/**
 * Reminders list — time-based and inactivity-based reminders.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput,
  Modal, Pressable, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { api } from '../../src/api/client';
import { scheduleReminder, cancelReminder } from '../../src/services/notifications';
import { useTheme, createThemedStyles } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';

interface IReminder {
  _id: string;
  type: 'time' | 'inactivity';
  schedule: string;
  message: string;
  isActive: boolean;
  quickActionId?: string;
}

function formatSchedule(r: IReminder): string {
  if (r.type === 'time') {
    return `Daily at ${r.schedule}`;
  }
  const [h, unit] = r.schedule.split(' ');
  return `After ${h} ${unit ?? 'h'} of no log`;
}

export default function RemindersScreen() {
  const { palette } = useTheme();
  const styles = useStyles();
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [editing, setEditing] = useState<Partial<IReminder> | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res: any = await api.get('/reminders');
    setReminders(res.data?.reminders ?? res.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.message?.trim()) { Alert.alert('Message required'); return; }
    setSaving(true);
    try {
      let saved: any;
      if (editing._id) {
        const res: any = await api.patch(`/reminders/${editing._id}`, editing);
        saved = res.data?.reminder ?? editing;
      } else {
        const res: any = await api.post('/reminders', editing);
        saved = res.data?.reminder ?? editing;
      }
      try { await (scheduleReminder as any)(saved); } catch {}
      await load();
      setEditing(null);
    } finally { setSaving(false); }
  };

  const deleteReminder = (r: IReminder) => {
    Alert.alert(`Delete this reminder?`, r.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await cancelReminder(r._id); await api.delete(`/reminders/${r._id}?permanent=true`); load(); } },
    ]);
  };

  const toggleActive = async (r: IReminder) => {
    const updated = { ...r, isActive: !r.isActive };
    await api.patch(`/reminders/${r._id}`, { isActive: updated.isActive });
    await scheduleReminder(updated as any);
    load();
  };

  const onTimePicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && date) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      setEditing(e => ({ ...e!, schedule: `${hh}:${mm}` }));
      setPickerDate(date);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') setShowTimePicker(false);
  };

  const newTimeReminder = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setEditing({ type: 'time', schedule: `${hh}:${mm}`, message: '', isActive: true });
  };

  const newInactivityReminder = () => {
    setEditing({ type: 'inactivity', schedule: '3 h', message: '', isActive: true });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Reminders' }} />

      <FlatList
        data={reminders}
        keyExtractor={r => r._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No reminders yet.</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>{item.type === 'time' ? '🔔' : '⏰'}</Text>
              <View>
                <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.rowSchedule}>{formatSchedule(item)}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Switch
                value={item.isActive}
                onValueChange={() => toggleActive(item)}
                trackColor={{ false: palette.border, true: palette.primary + '88' }}
                thumbColor={item.isActive ? palette.primary : palette.textDisabled}
                accessibilityLabel="Active"
              />
              <TouchableOpacity onPress={() => setEditing({ ...item })} accessibilityRole="button" accessibilityLabel="Edit">
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteReminder(item)} accessibilityRole="button" accessibilityLabel="Delete">
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fabSmall} onPress={newTimeReminder} accessibilityRole="button">
          <Text style={styles.fabSmallText}>🔔 Time-based</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabSmall} onPress={newInactivityReminder} accessibilityRole="button">
          <Text style={styles.fabSmallText}>⏰ Inactivity</Text>
        </TouchableOpacity>
      </View>

      {editing && (
        <Modal visible animationType="slide" transparent>
          <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.backdrop} onPress={() => setEditing(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setEditing(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
                <Text style={styles.sheetTitle}>{editing._id ? 'Edit' : 'New'} {editing.type === 'time' ? 'time' : 'inactivity'} reminder</Text>
                <TouchableOpacity onPress={save} disabled={saving}><Text style={[styles.done, saving && styles.dim]}>Save</Text></TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                <Text style={styles.fieldLabel}>Message *</Text>
                <TextInput
                  style={styles.input}
                  value={editing.message ?? ''}
                  onChangeText={v => setEditing(e => ({ ...e!, message: v }))}
                  placeholder="e.g. Time to log lunch, Take your meds"
                  placeholderTextColor={palette.textDisabled}
                  autoFocus
                />
                {editing.type === 'time' ? (
                  <>
                    <Text style={styles.fieldLabel}>Time</Text>
                    <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(true)}>
                      <Text style={styles.timeBtnText}>🕐 {editing.schedule ?? '--:--'}</Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                      <DateTimePicker
                        value={pickerDate}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimePicked}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.fieldLabel}>Trigger after no logs for</Text>
                    <View style={styles.inactivityRow}>
                      {['1 h', '2 h', '3 h', '6 h', '12 h'].map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, editing.schedule === opt && styles.chipActive]}
                          onPress={() => setEditing(e => ({ ...e!, schedule: opt }))}
                        >
                          <Text style={[styles.chipText, editing.schedule === opt && styles.chipActiveText]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                <View style={styles.toggleRow}>
                  <Text style={styles.fieldLabel}>Active</Text>
                  <Switch
                    value={editing.isActive ?? true}
                    onValueChange={v => setEditing(e => ({ ...e!, isActive: v }))}
                    trackColor={{ false: palette.border, true: palette.primary + '88' }}
                    thumbColor={editing.isActive ? palette.primary : palette.textDisabled}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(palette => ({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { ...typography.body, color: palette.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowIcon: { fontSize: 22 },
  rowMessage: { ...typography.body, color: palette.text },
  rowSchedule: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editText: { ...typography.small, color: palette.primary },
  deleteText: { ...typography.body, color: palette.textDisabled, paddingHorizontal: 4 },
  fabRow: { position: 'absolute', bottom: 20, flexDirection: 'row', alignSelf: 'center', gap: 10 },
  fabSmall: { backgroundColor: palette.primary, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 12, elevation: 6 },
  fabSmallText: { ...typography.bodyBold, color: '#FFFFFF' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: palette.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  sheetTitle: { ...typography.bodyBold, color: palette.text },
  cancel: { ...typography.body, color: palette.textSecondary },
  done: { ...typography.bodyBold, color: palette.primary },
  dim: { opacity: 0.4 },
  sheetBody: { padding: 20, gap: 6, paddingBottom: 40 },
  fieldLabel: { ...typography.label, color: palette.textSecondary, marginTop: 10 },
  input: { backgroundColor: palette.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 12, ...typography.body, color: palette.text },
  timeBtn: { backgroundColor: palette.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 12 },
  timeBtnText: { ...typography.body, color: palette.text },
  inactivityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surfaceAlt },
  chipActive: { borderColor: palette.primary, backgroundColor: palette.primary + '18' },
  chipText: { ...typography.body, color: palette.textSecondary },
  chipActiveText: { color: palette.primary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
}));
