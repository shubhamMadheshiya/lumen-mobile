/**
 * Customize screen — entry point for the configuration builder.
 * Shows categories; tapping one drills into its questions → options → fields.
 * Users can add new categories, questions, options and fields from here.
 * Also shows quick actions, template library, medications and reminders.
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useConfigStore } from '../../src/store/configStore';

interface NavItem {
  emoji: string;
  title: string;
  subtitle: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { emoji: '🗂️', title: 'Categories & Questions', subtitle: 'Build your tracking forms', route: '/customize/categories' },
  { emoji: '⚡', title: 'Quick-tap buttons',       subtitle: 'Manage your home screen buttons', route: '/customize/quick-actions' },
  { emoji: '📚', title: 'Template library',         subtitle: 'Add ready-made trackers', route: '/customize/templates' },
  { emoji: '💊', title: 'Medications',              subtitle: 'Your medication list', route: '/customize/medications' },
  { emoji: '🔔', title: 'Reminders',               subtitle: 'Time and inactivity alerts', route: '/customize/reminders' },
  { emoji: '📏', title: 'Custom units',             subtitle: 'Add your own measurement units', route: '/customize/units' },
  { emoji: '📤', title: 'Export config',            subtitle: 'Back up or share your setup', route: '/customize/export' },
];

export default function CustomizeScreen() {
  const { config, fetchConfig, isLoading } = useConfigStore();

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Customize</Text>
        <Text style={styles.sub}>Everything here is yours — edit, hide or delete anything.</Text>

        {/* Config overview chips */}
        {config && (
          <View style={styles.chips}>
            <Chip label={`${config.categories.length} categories`} />
            <Chip label={`${config.questions.length} questions`} />
            <Chip label={`${config.quickActions.length} quick actions`} />
          </View>
        )}
        {isLoading && <ActivityIndicator color={palette.primary} style={{ marginBottom: 20 }} />}

        {/* Navigation list */}
        {NAV_ITEMS.map(item => (
          <NavCard key={item.route} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

function NavCard({ item }: { item: NavItem }) {
  return (
    <TouchableOpacity
      style={navStyles.card}
      onPress={() => router.push(item.route as never)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      activeOpacity={0.75}
    >
      <Text style={navStyles.emoji}>{item.emoji}</Text>
      <View style={navStyles.text}>
        <Text style={navStyles.title}>{item.title}</Text>
        <Text style={navStyles.subtitle}>{item.subtitle}</Text>
      </View>
      <Text style={navStyles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: { ...typography.small, color: palette.textSecondary },
});

const navStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emoji:    { fontSize: 26, marginRight: 14 },
  text:     { flex: 1 },
  title:    { ...typography.bodyBold, color: palette.text },
  subtitle: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  chevron:  { ...typography.h3, color: palette.textDisabled, marginLeft: 8 },
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { ...typography.h2, color: palette.text, marginBottom: 8 },
  sub:     { ...typography.body, color: palette.textSecondary, marginBottom: 16 },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
});
