/**
 * Template library — browse and apply ready-made config bundles.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { api } from '../../src/api/client';
import { useConfigStore } from '../../src/store/configStore';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import type {
  TemplateCategory, TemplateQuickAction, ConditionBundle,
} from '@lumen/shared';

interface TemplateItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  questionCount?: number;
  optionCount?: number;
  isBundle?: boolean;
}

interface TemplatesResponse {
  categories: TemplateCategory[];
  quickActions: TemplateQuickAction[];
  conditionBundles: ConditionBundle[];
}

export default function TemplatesScreen() {
  const { invalidate, fetchConfig } = useConfigStore();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // api.get already unwraps the `data` field — res IS the payload
        const res = await api.get<TemplatesResponse>('/templates');

        const bundles: TemplateItem[] = (res.conditionBundles ?? []).map(b => ({
          key:         b.key,
          name:        b.label,
          description: b.description,
          icon:        b.icon,
          isBundle:    true,
        }));

        const cats: TemplateItem[] = (res.categories ?? []).map(c => ({
          key:           c.templateKey,
          name:          c.name,
          description:   `${c.role === 'symptom' ? 'Symptoms' : c.role === 'trigger_candidate' ? 'Potential triggers' : 'Context'} · ${c.questions.length} question${c.questions.length !== 1 ? 's' : ''}`,
          icon:          c.icon,
          color:         c.color,
          questionCount: c.questions.length,
        }));

        setTemplates([...bundles, ...cats]);
      } finally { setLoading(false); }
    })();
  }, []);

  const apply = async (item: TemplateItem) => {
    if (applied.has(item.key)) {
      Alert.alert('Already added', 'This template is already in your config. Any changes you made are preserved.');
      return;
    }
    Alert.alert(`Add "${item.name}"?`, item.description + '\n\nYou can edit or remove anything after adding it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add', style: 'default',
        onPress: async () => {
          setApplying(item.key);
          try {
            if (item.isBundle) {
              await api.post(`/templates/apply-bundle/${item.key}`, {});
            } else {
              await api.post('/templates/apply', { templateKeys: [item.key] });
            }
            setApplied(prev => new Set([...prev, item.key]));
            invalidate(); await fetchConfig();
          } finally { setApplying(null); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Template library' }} />
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const bundles = templates.filter(t => t.isBundle);
  const singles = templates.filter(t => !t.isBundle);

  const renderItem = ({ item }: { item: TemplateItem }) => {
    const isApplied = applied.has(item.key);
    const isApplying = applying === item.key;
    return (
      <TouchableOpacity
        style={[styles.card, isApplied && styles.cardApplied]}
        onPress={() => apply(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} template`}
        disabled={isApplying}
      >
        <View style={[styles.iconWrap, { backgroundColor: (item.color ?? palette.primary) + '22' }]}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
          {(item.questionCount != null || item.optionCount != null) && (
            <Text style={styles.cardMeta}>
              {item.questionCount ? `${item.questionCount} questions` : ''}
              {item.questionCount && item.optionCount ? ' · ' : ''}
              {item.optionCount ? `${item.optionCount} options` : ''}
            </Text>
          )}
        </View>
        {isApplying
          ? <ActivityIndicator size="small" color={palette.primary} />
          : isApplied
            ? <Text style={styles.checkmark}>✓</Text>
            : <Text style={styles.addBtn}>Add</Text>
        }
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Template library' }} />
      <FlatList
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ready-made configs</Text>
            <Text style={styles.headerSub}>Tap to add to your setup. Everything is fully editable after adding.</Text>

            {bundles.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Condition starter packs</Text>
                {bundles.map(b => (
                  <TouchableOpacity
                    key={b.key}
                    style={[styles.bundleCard, applied.has(b.key) && styles.cardApplied]}
                    onPress={() => apply(b)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.bundleIcon}>{b.icon}</Text>
                    <View style={styles.cardText}>
                      <Text style={styles.bundleName}>{b.name}</Text>
                      <Text style={styles.cardDesc}>{b.description}</Text>
                    </View>
                    {applying === b.key
                      ? <ActivityIndicator size="small" color={palette.primary} />
                      : applied.has(b.key)
                        ? <Text style={styles.checkmark}>✓</Text>
                        : <Text style={styles.addBtn}>Add all</Text>
                    }
                  </TouchableOpacity>
                ))}
              </>
            )}

            {singles.length > 0 && <Text style={styles.sectionLabel}>Individual templates</Text>}
          </View>
        }
        data={singles}
        keyExtractor={t => t.key}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  header: { gap: 8, marginBottom: 4 },
  headerTitle: { ...typography.h3, color: palette.text },
  headerSub: { ...typography.small, color: palette.textSecondary, marginBottom: 8 },
  sectionLabel: { ...typography.label, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  bundleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: palette.primary + '0E',
    borderRadius: 16, borderWidth: 1.5, borderColor: palette.primary + '33',
    padding: 14, marginBottom: 8,
  },
  bundleIcon: { fontSize: 28 },
  bundleName: { ...typography.bodyBold, color: palette.text },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: palette.surface, borderRadius: 14,
    borderWidth: 1, borderColor: palette.border,
    padding: 14, marginBottom: 8,
  },
  cardApplied: { borderColor: palette.success + '55', backgroundColor: palette.success + '08' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  cardText: { flex: 1 },
  cardName: { ...typography.bodyBold, color: palette.text },
  cardDesc: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  cardMeta: { ...typography.caption, color: palette.textDisabled, marginTop: 3 },
  addBtn: { ...typography.bodyBold, color: palette.primary, paddingHorizontal: 4 },
  checkmark: { ...typography.h4, color: palette.success },
});
