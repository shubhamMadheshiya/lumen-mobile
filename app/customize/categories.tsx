/**
 * Categories list — shows all user categories with active/archived badge.
 * Tap to edit, swipe-or-press ↑↓ to reorder, "＋ New" to create.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ICategory } from '@lumen/shared';
import { useConfigStore } from '../../src/store/configStore';
import { api } from '../../src/api/client';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const ROLE_LABEL: Record<string, string> = {
  symptom: 'Symptom',
  trigger_candidate: 'Trigger',
  context: 'Context',
};

export default function CategoriesScreen() {
  const { config, fetchConfig, invalidate, isLoading } = useConfigStore();
  const [reordering, setReordering] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const categories = (config?.categories ?? []).sort((a, b) => a.order - b.order);
  const active   = categories.filter(c => c.isActive);
  const archived = categories.filter(c => !c.isActive);

  const moveUp = async (cat: ICategory) => {
    const sorted = [...active];
    const idx = sorted.findIndex(c => c._id === cat._id);
    if (idx <= 0) return;
    // Swap orders
    const ids = sorted.map(c => c._id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    setReordering(true);
    try {
      await api.patch('/categories/reorder', { ids });
      invalidate(); await fetchConfig();
    } finally { setReordering(false); }
  };

  const moveDown = async (cat: ICategory) => {
    const sorted = [...active];
    const idx = sorted.findIndex(c => c._id === cat._id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const ids = sorted.map(c => c._id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    setReordering(true);
    try {
      await api.patch('/categories/reorder', { ids });
      invalidate(); await fetchConfig();
    } finally { setReordering(false); }
  };

  const archive = (cat: ICategory) => {
    Alert.alert(
      `Archive "${cat.name}"?`,
      'Past logs will be kept. You can restore it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive', style: 'destructive',
          onPress: async () => {
            await api.post(`/categories/${cat._id}/archive`, {});
            invalidate(); await fetchConfig();
          },
        },
      ],
    );
  };

  const renderCategory = ({ item, index }: { item: ICategory; index: number }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={() => router.push(`/customize/category/${item._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
      >
        <View style={[styles.dot, { backgroundColor: item.color }]}>
          <Text style={styles.dotIcon}>{item.icon}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowRole}>{ROLE_LABEL[item.role] ?? item.role}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
          onPress={() => moveUp(item)}
          disabled={index === 0 || reordering}
          accessibilityLabel="Move up"
        >
          <Text style={styles.arrow}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrowBtn, index === active.length - 1 && styles.arrowBtnDisabled]}
          onPress={() => moveDown(item)}
          disabled={index === active.length - 1 || reordering}
          accessibilityLabel="Move down"
        >
          <Text style={styles.arrow}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.archiveBtn}
          onPress={() => archive(item)}
          accessibilityLabel={`Archive ${item.name}`}
        >
          <Text style={styles.archiveBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Categories' }} />

      <FlatList
        data={active}
        keyExtractor={c => c._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          isLoading ? <ActivityIndicator color={palette.primary} style={{ marginBottom: 16 }} /> : null
        }
        ListFooterComponent={
          archived.length > 0 ? (
            <View style={styles.archivedSection}>
              <Text style={styles.sectionLabel}>Archived ({archived.length})</Text>
              {archived.map(cat => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.archivedRow}
                  onPress={() => router.push(`/customize/category/${cat._id}`)}
                >
                  <Text style={styles.archivedIcon}>{cat.icon}</Text>
                  <Text style={styles.archivedName}>{cat.name}</Text>
                  <Text style={styles.archivedBadge}>Archived</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        renderItem={renderCategory}
      />

      {/* Add new category FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/customize/category/new')}
        accessibilityRole="button"
        accessibilityLabel="New category"
      >
        <Text style={styles.fabText}>＋ New category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, paddingBottom: 100, gap: 8 },
  row: {
    backgroundColor: palette.surface, borderRadius: 14,
    borderWidth: 1, borderColor: palette.border,
    overflow: 'hidden',
  },
  rowMain: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  dot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dotIcon: { fontSize: 18 },
  rowText: { flex: 1 },
  rowName: { ...typography.bodyBold, color: palette.text },
  rowRole: { ...typography.small, color: palette.textSecondary, marginTop: 1 },
  chevron: { ...typography.h4, color: palette.textDisabled },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: palette.border,
    backgroundColor: palette.surfaceAlt,
  },
  arrowBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: palette.border,
  },
  arrowBtnDisabled: { opacity: 0.3 },
  arrow: { ...typography.bodyBold, color: palette.primary },
  archiveBtn: { paddingVertical: 8, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  archiveBtnText: { ...typography.h4, color: palette.textSecondary },
  archivedSection: { marginTop: 24, gap: 8 },
  sectionLabel: {
    ...typography.label, color: palette.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginLeft: 4, marginBottom: 4,
  },
  archivedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: palette.surface, borderRadius: 12,
    borderWidth: 1, borderColor: palette.border,
    paddingHorizontal: 14, paddingVertical: 12, opacity: 0.7,
  },
  archivedIcon: { fontSize: 18 },
  archivedName: { ...typography.body, color: palette.textSecondary, flex: 1 },
  archivedBadge: {
    ...typography.caption, color: palette.textDisabled,
    backgroundColor: palette.surfaceAlt, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  fab: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    backgroundColor: palette.primary, borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 14,
    shadowColor: palette.primary, shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  fabText: { ...typography.button, color: palette.white },
});
