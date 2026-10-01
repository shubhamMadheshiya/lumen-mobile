/**
 * Options list for a question.
 * ↑↓ to reorder, tap to edit, "＋ New option" at bottom.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { IOption } from '@lumen/shared';
import { useConfigStore } from '../../../src/store/configStore';
import { api } from '../../../src/api/client';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';

export default function OptionsScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { config, fetchConfig, invalidate } = useConfigStore();
  const [reordering, setReordering] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const question = config?.questions.find(q => q._id === questionId);
  const options = (config?.options ?? [])
    .filter(o => o.questionId === questionId)
    .sort((a, b) => a.order - b.order);

  const active   = options.filter(o => o.isActive);
  const archived = options.filter(o => !o.isActive);

  const move = async (opt: IOption, direction: 'up' | 'down') => {
    const idx = active.findIndex(o => o._id === opt._id);
    const ids = active.map(o => o._id);
    if (direction === 'up' && idx > 0) [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    else if (direction === 'down' && idx < active.length - 1) [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    else return;
    setReordering(true);
    try { await api.patch('/options/reorder', { ids }); invalidate(); await fetchConfig(); }
    finally { setReordering(false); }
  };

  const archive = (opt: IOption) => {
    Alert.alert(`Archive "${opt.label}"?`, 'Past logs are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', style: 'destructive',
        onPress: async () => {
          await api.post(`/options/${opt._id}/archive`, {});
          invalidate(); await fetchConfig();
        },
      },
    ]);
  };

  const renderRow = ({ item, index }: { item: IOption; index: number }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={() => router.push(`/customize/option/${item._id}?questionId=${questionId}`)}
        accessibilityRole="button"
      >
        {item.icon ? <Text style={styles.icon}>{item.icon}</Text>
          : <View style={[styles.dot, { backgroundColor: item.color ?? palette.border }]} />}
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowMeta}>
            {item.fields.length} field{item.fields.length !== 1 ? 's' : ''}
            {item.allowComment ? ' · Comment' : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.arrowBtn, index === 0 && styles.dim]} onPress={() => move(item, 'up')} disabled={index === 0 || reordering} accessibilityLabel="Move up">
          <Text style={styles.arrow}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.arrowBtn, index === active.length - 1 && styles.dim]} onPress={() => move(item, 'down')} disabled={index === active.length - 1 || reordering} accessibilityLabel="Move down">
          <Text style={styles.arrow}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={() => archive(item)} accessibilityLabel="Archive">
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: question ? `Options: ${question.title}` : 'Options' }} />

      <FlatList
        data={active}
        keyExtractor={o => o._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No options yet.</Text>
            <Text style={styles.emptyHint}>Add options for people to select.</Text>
          </View>
        }
        ListFooterComponent={
          archived.length > 0 ? (
            <View style={styles.archivedSection}>
              <Text style={styles.sectionLabel}>Archived ({archived.length})</Text>
              {archived.map(o => (
                <TouchableOpacity key={o._id} style={styles.archivedRow} onPress={() => router.push(`/customize/option/${o._id}?questionId=${questionId}`)}>
                  <Text style={styles.archivedLabel}>{o.label}</Text>
                  <Text style={styles.archivedBadge}>Archived</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        renderItem={renderRow}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/customize/option/new?questionId=${questionId}`)}
        accessibilityRole="button"
        accessibilityLabel="New option"
      >
        <Text style={styles.fabText}>＋ New option</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  list: { padding: 16, paddingBottom: 100, gap: 8 },
  row: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  rowMain: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  icon: { fontSize: 20 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  rowText: { flex: 1 },
  rowLabel: { ...typography.bodyBold, color: palette.text },
  rowMeta: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  chevron: { ...typography.h4, color: palette.textDisabled },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surfaceAlt },
  arrowBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRightWidth: 1, borderRightColor: palette.border },
  dim: { opacity: 0.3 },
  arrow: { ...typography.bodyBold, color: palette.primary },
  moreBtn: { paddingVertical: 8, paddingHorizontal: 20, alignItems: 'center' },
  moreText: { ...typography.h4, color: palette.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { ...typography.body, color: palette.textSecondary },
  emptyHint: { ...typography.small, color: palette.textDisabled },
  archivedSection: { marginTop: 24, gap: 6 },
  sectionLabel: { ...typography.label, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
  archivedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 12, opacity: 0.7 },
  archivedLabel: { ...typography.body, color: palette.textSecondary, flex: 1 },
  archivedBadge: { ...typography.caption, color: palette.textDisabled, backgroundColor: palette.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: palette.primary, borderRadius: 24, paddingHorizontal: 28, paddingVertical: 14, shadowColor: palette.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabText: { ...typography.button, color: palette.white },
});
