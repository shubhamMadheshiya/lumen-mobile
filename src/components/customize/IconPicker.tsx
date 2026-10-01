/**
 * IconPicker — modal grid of emoji icons the user can pick for categories,
 * questions and options. Organized into themed rows.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable,
  FlatList, TextInput, StyleSheet,
} from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

const ICON_SECTIONS = [
  {
    label: 'Symptoms & body',
    icons: ['🤒','🤧','😣','🥱','😔','😰','😤','🤢','🩸','🌡️','🫁','🫀','🦴','💪','👁️','🧠','👂','🦷','🤲'],
  },
  {
    label: 'Activities',
    icons: ['🚶','🏃','🧘','🚴','🏊','🤸','🧗','⛹️','🕺','🏋️','🛁','🚿','🪥','☀️','🌿','🏕️','😴','🛋️','🧹'],
  },
  {
    label: 'Food & drink',
    icons: ['🍽️','🥗','🥦','🍎','🥚','🥩','🐟','🧅','🌶️','🍞','🥛','☕','🍵','💧','🥤','🍷','🍺','🍫','🚬'],
  },
  {
    label: 'Health & meds',
    icons: ['💊','💉','🩺','🩻','🧬','🔬','📊','🧪','⚕️','🏥','🩹','🧴','🧻','🌡️','⏱️','🗓️','📝','📋','✅'],
  },
  {
    label: 'Mood & mind',
    icons: ['😊','😄','😐','😢','😡','😱','🥰','😴','💭','🧠','🎭','🌈','⚡','🔥','❄️','🌊','🌸','🌾','💫'],
  },
  {
    label: 'Environment',
    icons: ['☀️','🌤️','⛅','🌧️','❄️','🌨️','🌡️','💨','🌿','🏙️','🌲','🌊','🌺','🌻','🍂','🌾','🦠','🌫️','⚡'],
  },
];

const ALL_ICONS = Array.from(new Set(ICON_SECTIONS.flatMap(s => s.icons)));

interface Props {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Icon' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_ICONS.filter(i => i.includes(search))
    : ALL_ICONS;

  return (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.preview}
          onPress={() => setOpen(true)}
          accessibilityLabel={`Select icon, current: ${value || 'none'}`}
          accessibilityRole="button"
        >
          <Text style={styles.previewIcon}>{value || '+'}</Text>
          <Text style={styles.previewHint}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTouch} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose an icon</Text>
              <TouchableOpacity onPress={() => setOpen(false)} accessibilityLabel="Close">
                <Text style={styles.done}>Done</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Search emoji…"
              placeholderTextColor={palette.placeholder}
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={filtered}
              keyExtractor={i => i}
              numColumns={8}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cell, item === value && styles.cellActive]}
                  onPress={() => { onChange(item); setOpen(false); setSearch(''); }}
                  accessibilityLabel={item}
                  accessibilityRole="button"
                >
                  <Text style={styles.cellIcon}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: 12, borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  label: { ...typography.body, color: palette.text },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewIcon: { fontSize: 28 },
  previewHint: { ...typography.small, color: palette.textSecondary },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropTouch: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: palette.border,
  },
  sheetTitle: { ...typography.h4, color: palette.text },
  done: { ...typography.bodyBold, color: palette.primary },
  search: {
    margin: 12, borderWidth: 1, borderColor: palette.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    ...typography.body, color: palette.text,
    backgroundColor: palette.surfaceAlt,
  },
  grid: { paddingHorizontal: 8, paddingBottom: 32 },
  cell: {
    flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, margin: 3,
  },
  cellActive: { backgroundColor: palette.primary + '22' },
  cellIcon: { fontSize: 26 },
});
