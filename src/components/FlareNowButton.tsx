/**
 * FlareNowButton — one-tap shortcut to log a symptom flare.
 * Finds the first Symptoms category and navigates to its question sheet.
 * Shown prominently on the Today screen.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '../store/configStore';
import { palette } from '../theme/colors';
import { typography } from '../theme/typography';

export function FlareNowButton() {
  const { config } = useConfigStore();

  const symptomCategory = config?.categories.find(
    c => c.role === 'symptom' && c.isActive,
  );

  if (!symptomCategory) return null;

  const handlePress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push(`/log/${symptomCategory._id}`);
  };

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Log a flare now — quick symptom entry"
      activeOpacity={0.8}
    >
      <View style={styles.inner}>
        <Text style={styles.flame}>🔥</Text>
        <View>
          <Text style={styles.label}>Flare now</Text>
          <Text style={styles.sub}>Log symptoms quickly</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: palette.catSymptom + '18',
    borderWidth: 1.5,
    borderColor: palette.catSymptom + '55',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flame: { fontSize: 28 },
  label: { ...typography.bodyBold, color: palette.catSymptom },
  sub: { ...typography.small, color: palette.textSecondary, marginTop: 1 },
});
