/**
 * ImageField — camera or gallery picker with thumbnail strip.
 * Sensitive images (stool, skin) have blur-on-load ("tap to reveal").
 * Returns an array of local URIs; the log submission layer uploads them.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
  Alert, Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FieldDefinition } from '@lumen/shared';
import { useTheme, createThemedStyles } from '../../theme/ThemeContext';
import { typography } from '../../theme/typography';
import { permissionService, PermissionType } from '../../services/permissionService';
import { ContextualPermissionModal } from '../permissions/ContextualPermissionModal';

interface Props {
  field: FieldDefinition;
  value: string[];          // local URIs
  onChange: (uris: string[]) => void;
}

const MAX_IMAGES = 4;

export function ImageField({ field, value, onChange }: Props) {
  const styles = useStyles();
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const sensitive = field.sensitive ?? false;

  const [activePermModal, setActivePermModal] = useState<PermissionType | null>(null);

  const launchPicker = async (source: 'camera' | 'gallery') => {
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            exif: false,  // strip EXIF including GPS
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            exif: false,
          });

      if (result.canceled) return;

      const newUris = result.assets.map(a => a.uri);
      const combined = [...value, ...newUris].slice(0, MAX_IMAGES);
      onChange(combined);
    } catch (e) {
      console.warn('[ImageField] launchPicker error:', e);
    }
  };

  const requestAndLaunch = async (source: 'camera' | 'gallery') => {
    const permType: PermissionType = source === 'camera' ? 'camera' : 'mediaLibrary';
    const check = await permissionService.checkPermission(permType);

    if (check.granted) {
      await launchPicker(source);
      return;
    }

    const req = await permissionService.requestPermission(permType);
    if (req.granted) {
      await launchPicker(source);
      return;
    }

    // Denied -> show contextual modal with guidance & settings link
    setActivePermModal(permType);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    setRevealed(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Thumbnail strip */}
      {value.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {value.map((uri, idx) => (
            <View key={uri + idx} style={styles.thumbWrapper}>
              <Image
                source={{ uri }}
                style={[styles.thumb, sensitive && !revealed[idx] && styles.thumbBlurred]}
                resizeMode="cover"
              />
              {/* Reveal overlay for sensitive images */}
              {sensitive && !revealed[idx] && (
                <Pressable
                  style={styles.blurOverlay}
                  onPress={() => setRevealed(prev => ({ ...prev, [idx]: true }))}
                  accessibilityLabel="Tap to reveal image"
                  accessibilityRole="button"
                >
                  <Text style={styles.blurLabel}>👁 Tap to view</Text>
                </Pressable>
              )}
              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => remove(idx)}
                accessibilityLabel="Remove image"
                accessibilityRole="button"
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add buttons */}
      {value.length < MAX_IMAGES && (
        <View style={styles.addRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => requestAndLaunch('camera')}
            accessibilityLabel="Take a photo"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnIcon}>📷</Text>
            <Text style={styles.addBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => requestAndLaunch('gallery')}
            accessibilityLabel="Choose from library"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnIcon}>🖼️</Text>
            <Text style={styles.addBtnText}>Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {sensitive && (
        <View style={styles.sensitiveNote}>
          <Text style={styles.sensitiveText}>🔒 Sensitive — stored privately, blurred by default</Text>
        </View>
      )}

      {field.helpText ? <Text style={styles.hint}>{field.helpText}</Text> : null}

      {activePermModal && (
        <ContextualPermissionModal
          visible={Boolean(activePermModal)}
          permissionType={activePermModal}
          onGranted={async () => {
            const src = activePermModal === 'camera' ? 'camera' : 'gallery';
            setActivePermModal(null);
            await launchPicker(src);
          }}
          onDismiss={() => setActivePermModal(null)}
        />
      )}
    </View>
  );
}

const THUMB = 96;

const useStyles = createThemedStyles((palette) => ({
  wrapper: { gap: 10 },
  strip: { gap: 10, paddingVertical: 4 },
  thumbWrapper: { position: 'relative' },
  thumb: {
    width: THUMB, height: THUMB,
    borderRadius: 12,
    backgroundColor: palette.surfaceAlt,
  },
  thumbBlurred: { opacity: 0.05 },
  blurOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: palette.surfaceAlt + 'CC',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  blurLabel: { ...typography.caption, color: palette.textSecondary, textAlign: 'center' },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: palette.error,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.white,
  },
  removeBtnText: { ...typography.caption, color: palette.white, fontWeight: '700', lineHeight: 14 },
  addRow: { flexDirection: 'row', gap: 10 },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    borderWidth: 1.5, borderColor: palette.border, borderStyle: 'dashed',
    borderRadius: 14, minHeight: 52,
  },
  addBtnIcon: { fontSize: 18 },
  addBtnText: { ...typography.smallBold, color: palette.textSecondary },
  sensitiveNote: {
    backgroundColor: palette.warning + '22',
    borderRadius: 10, padding: 10,
  },
  sensitiveText: { ...typography.small, color: palette.textSecondary },
  hint: { ...typography.small, color: palette.textSecondary },
}));
