/**
 * UndoToast — appears for 5 seconds after a quick tap.
 * Shows "Logged {label}" and an "Undo" button.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, createThemedStyles } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { useQuickLogStore } from '../store/quickLogStore';
import { IQuickAction } from '@lumen/shared';

interface Props {
  quickActions: IQuickAction[];
}

export function UndoToast({ quickActions }: Props): React.ReactElement | null {
  const styles = useStyles();
  const { undoEntry, undo } = useQuickLogStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (undoEntry) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(4200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [undoEntry, opacity]);

  if (!undoEntry) return null;

  const action = quickActions.find(a => a._id === undoEntry.quickActionId);
  if (!action) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.message}>
        {action.icon} Logged <Text style={styles.bold}>{action.label}</Text>
      </Text>
      <TouchableOpacity onPress={undo} style={styles.undoBtn} accessibilityRole="button" accessibilityLabel="Undo this log">
        <Text style={styles.undoText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const useStyles = createThemedStyles(palette => ({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  message: {
    ...typography.body,
    color: palette.text,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: palette.text,
  },
  undoBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.primary,
    borderRadius: 8,
  },
  undoText: {
    ...typography.smallBold,
    color: '#FFFFFF',
  },
}));
