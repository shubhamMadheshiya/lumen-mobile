import React from 'react';
import { TextInput, Text, View } from 'react-native';
import { FieldDefinition } from '@lumen/shared';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';

interface Props {
  field: FieldDefinition;
  value: string;
  onChange: (v: string) => void;
}

export function StringField({ field, value, onChange }: Props) {
  const { palette } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrapper}>
      {field.helpText ? <Text style={styles.hint}>{field.helpText}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder ?? field.label}
        placeholderTextColor={palette.placeholder}
        multiline={false}
        returnKeyType="done"
        accessibilityLabel={field.label}
      />
    </View>
  );
}

const useStyles = createThemedStyles((palette) => ({
  wrapper: { gap: 6 },
  hint: { ...typography.small, color: palette.textSecondary },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: 14,
    ...typography.body,
    color: palette.text,
    minHeight: 48,
  },
}));
