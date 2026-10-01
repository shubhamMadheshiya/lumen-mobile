/**
 * Medical-safety disclaimer — shown at the top of every insights screen.
 * Collapsible after first read.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

export function DisclaimerBanner() {
  const { palette } = useTheme();
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => setExpanded(v => !v)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Insights disclaimer — tap to expand"
    >
      <View style={styles.row}>
        <Text style={styles.icon}>ℹ️</Text>
        <Text style={styles.title}>About these insights</Text>
        <Text style={styles.toggle}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <Text style={styles.body}>
          These patterns are based solely on your recorded data and are for{' '}
          <Text style={styles.bold}>personal observation only</Text>. They show correlations, not causes.
          {'\n\n'}Never start, stop or change medication, diet or treatment based on this app.
          Always discuss patterns with a qualified healthcare professional before making any decisions.
        </Text>
      )}
      {!expanded && (
        <Text style={styles.summary}>Patterns, not causes · Not medical advice · Discuss with your doctor</Text>
      )}
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles(palette => ({
  banner: {
    backgroundColor: palette.info + '14',
    borderRadius: 14, borderWidth: 1.5, borderColor: palette.info + '44',
    padding: 14, gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  title: { ...typography.label, color: palette.info, fontWeight: '700', flex: 1 },
  toggle: { ...typography.caption, color: palette.info },
  summary: { ...typography.small, color: palette.info + 'CC', lineHeight: 18 },
  body: { ...typography.small, color: palette.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: palette.text },
}));
