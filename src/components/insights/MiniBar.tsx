/**
 * MiniBar — a tiny bar chart built from Views (no extra library).
 * Used for sparklines in stat cards.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

interface Props {
  values: number[];  // raw values; auto-scales to max
  color?: string;
  height?: number;
  showLabels?: boolean;
  labels?: string[];
}

export function MiniBar({ values, color, height = 40, showLabels = false, labels }: Props) {
  const { palette } = useTheme();
  const styles = useStyles();
  const barColor = color ?? palette.primary;
  const max = Math.max(...values, 1);
  return (
    <View style={styles.wrap}>
      <View style={[styles.bars, { height }]}>
        {values.map((v, i) => (
          <View key={i} style={styles.barWrap}>
            <View style={[styles.bar, { height: (v / max) * height, backgroundColor: barColor }]} />
          </View>
        ))}
      </View>
      {showLabels && labels && (
        <View style={styles.labelRow}>
          {labels.map((l, i) => (
            <Text key={i} style={styles.label} numberOfLines={1}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(palette => ({
  wrap: { gap: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 3, minHeight: 2 },
  labelRow: { flexDirection: 'row', gap: 3 },
  label: { flex: 1, ...typography.caption, color: palette.textDisabled, textAlign: 'center', fontSize: 8 },
}));
