/**
 * EnumChips — horizontal scrollable (or wrapping) chips for enum field values.
 * Supports single or multi-select; each chip can carry a custom color.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { FieldDefinition, EnumValue } from '@lumen/shared';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  field: FieldDefinition;
  value: string | string[];         // single key or array of keys
  multiSelect?: boolean;
  onChange: (v: string | string[]) => void;
}

function isSelected(key: string, value: string | string[]): boolean {
  return Array.isArray(value) ? value.includes(key) : value === key;
}

export function EnumChips({ field, value, multiSelect = false, onChange }: Props) {
  const items: EnumValue[] = field.enumValues ?? [];

  const toggle = (key: string) => {
    if (multiSelect) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      const next = arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key];
      onChange(next);
    } else {
      onChange(isSelected(key, value) ? '' : key);
    }
  };

  const wrap = items.length > 4;

  const chips = items.map((item) => {
    const selected = isSelected(item.value, value);
    const chipColor = item.color ?? palette.primary;
    return (
      <TouchableOpacity
        key={item.value}
        style={[
          styles.chip,
          selected && { backgroundColor: chipColor, borderColor: chipColor },
        ]}
        onPress={() => toggle(item.value)}
        accessibilityRole="checkbox"
        accessibilityLabel={item.label}
        accessibilityState={{ checked: selected }}
      >
        {item.icon ? <Text style={styles.chipIcon}>{item.icon}</Text> : null}
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      {wrap ? (
        <View style={styles.wrapRow}>{chips}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {chips}
        </ScrollView>
      )}
      {field.helpText ? <Text style={styles.hint}>{field.helpText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  scrollContent: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: palette.border,
    backgroundColor: palette.surface,
    minHeight: 40,
  },
  chipIcon: { fontSize: 16 },
  chipText: { ...typography.smallBold, color: palette.text },
  chipTextSelected: { color: palette.white },
  hint: { ...typography.small, color: palette.textSecondary },
});
