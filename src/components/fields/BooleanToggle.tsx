import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { FieldDefinition } from '@lumen/shared';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  field: FieldDefinition;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function BooleanToggle({ field, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <Text style={styles.label}>{field.label}</Text>
        {field.helpText ? <Text style={styles.hint}>{field.helpText}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.border, true: palette.primary + '88' }}
        thumbColor={value ? palette.primary : palette.textDisabled}
        accessibilityLabel={field.label}
        accessibilityRole="switch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    minHeight: 56,
  },
  labelGroup: { flex: 1, paddingRight: 16 },
  label: { ...typography.body, color: palette.text },
  hint:  { ...typography.small, color: palette.textSecondary, marginTop: 2 },
});
