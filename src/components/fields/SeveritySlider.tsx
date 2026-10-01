/**
 * SeveritySlider — a large, finger-friendly range slider.
 * Min/max labels, colour interpolation (green → yellow → red).
 * Used for pain severity, urgency, mood, stress, etc.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder, LayoutChangeEvent,
} from 'react-native';
import { FieldDefinition } from '@lumen/shared';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  field: FieldDefinition;
  value: number;
  onChange: (v: number) => void;
}

/** Lerp between two colours (hex) by t ∈ [0, 1]. */
function lerpColor(from: string, to: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function thumbColor(value: number, min: number, max: number): string {
  const t = (value - min) / Math.max(max - min, 1);
  if (t < 0.5) return lerpColor('#66BB6A', '#FFCA28', t * 2);
  return lerpColor('#FFCA28', '#EF5350', (t - 0.5) * 2);
}

const TRACK_HEIGHT = 8;
const THUMB_SIZE   = 36;

export function SeveritySlider({ field, value, onChange }: Props) {
  const min  = field.min  ?? 0;
  const max  = field.max  ?? 10;
  const step = field.step ?? 1;
  const [trackWidth, setTrackWidth] = useState(0);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const snap  = (v: number) => clamp(Math.round(v / step) * step);

  const xToValue = useCallback(
    (x: number) => snap(min + (x / trackWidth) * (max - min)),
    [trackWidth, min, max, step, snap],
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      const x = e.nativeEvent.locationX;
      onChange(xToValue(x));
    },
    onPanResponderMove: (e) => {
      const x = e.nativeEvent.locationX;
      onChange(xToValue(x));
    },
  });

  const fillRatio = (value - min) / Math.max(max - min, 1);
  const color     = thumbColor(value, min, max);

  const minLabel = field.helpText ? field.helpText.split(',')[0]?.trim() : String(min);
  const maxLabel = field.helpText ? field.helpText.split(',').slice(-1)[0]?.trim() : String(max);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrapper}>
      {/* Value bubble */}
      <View style={styles.valueBubble}>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
        <Text style={styles.valueLabel}>{field.label}</Text>
      </View>

      {/* Track + thumb */}
      <View
        style={styles.trackContainer}
        onLayout={onLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={field.label}
        accessibilityValue={{ min, max, now: value }}
      >
        {/* Track background */}
        <View style={styles.track}>
          {/* Fill */}
          <View style={[styles.fill, { width: `${fillRatio * 100}%`, backgroundColor: color }]} />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: fillRatio * trackWidth - THUMB_SIZE / 2,
              borderColor: color,
            },
          ]}
        />
      </View>

      {/* Min / max labels */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>{minLabel}</Text>
        <Text style={styles.labelText}>{maxLabel}</Text>
      </View>

      {/* Tick marks for small ranges (e.g. 0–10) */}
      {max - min <= 10 && (
        <View style={styles.ticks}>
          {Array.from({ length: max - min + 1 }, (_, i) => (
            <Text
              key={i}
              style={[styles.tick, i === value - min && { color: color, fontWeight: '700' }]}
            >
              {min + i}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  valueBubble: { alignItems: 'center' },
  valueText: { ...typography.h1, lineHeight: 36, fontWeight: '800' },
  valueLabel: { ...typography.small, color: palette.textSecondary, marginTop: 2 },
  trackContainer: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: palette.border,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: palette.surface,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelText: { ...typography.small, color: palette.textSecondary },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  tick: { ...typography.caption, color: palette.textDisabled },
});
