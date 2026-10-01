/**
 * ColorSwatchPicker — a horizontal row of preset color swatches.
 * Used for category / option color selection.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const PRESET_COLORS = [
  '#FF6B35', '#E57373', '#EF5350', '#FF7043',
  '#FFA726', '#FFCA28', '#FFEE58', '#D4E157',
  '#66BB6A', '#26A69A', '#4ECDC4', '#26C6DA',
  '#42A5F5', '#5C6BC0', '#7E57C2', '#AB47BC',
  '#EC407A', '#8D6E63', '#78909C', '#B0BEC5',
];

interface Props {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorSwatchPicker({ value, onChange, label = 'Color' }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESET_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              { backgroundColor: color },
              color === value && styles.swatchActive,
            ]}
            onPress={() => onChange(color)}
            accessibilityLabel={color}
            accessibilityRole="radio"
            accessibilityState={{ checked: color === value }}
          >
            {color === value && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { ...typography.smallBold, color: palette.textSecondary },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  swatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3, borderColor: palette.white,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  check: { color: palette.white, fontWeight: '800', fontSize: 16 },
});
