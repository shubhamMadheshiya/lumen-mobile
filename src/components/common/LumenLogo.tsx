/**
 * LumenLogo
 * Official brand identity mark & vector logo for the Lumen application.
 *
 * Symbolism:
 * - Central Core: The "Lumen" (Source of restorative light & daily energy)
 * - Protective Wings: Symmetrical restorative blossom / lotus leaves representing autoimmune immune balance & cellular recovery
 * - Horizon Cradle: Gentle rising dawn embracing the patient's wellness journey
 * - Morning Sparks: Vitality, clarity, and daily hope
 */
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export type LogoVariant = 'icon' | 'badge' | 'full';

export interface LumenLogoProps {
  size?: number;
  variant?: LogoVariant;
  showSubtitle?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LumenIcon({ size = 48, style }: { size?: number; style?: StyleProp<ViewStyle> }): React.ReactElement {
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityRole="image" accessibilityLabel="Lumen Logo">
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgLinearGradient id="lumenSunGrad" x1="30%" y1="20%" x2="70%" y2="80%">
            <Stop offset="0%" stopColor="#FFFDF0" />
            <Stop offset="40%" stopColor="#FFEF85" />
            <Stop offset="100%" stopColor="#FFA448" />
          </SvgLinearGradient>

          <SvgLinearGradient id="lumenPetalLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="60%" stopColor="#FFE0B2" />
            <Stop offset="100%" stopColor="#FFB074" />
          </SvgLinearGradient>

          <SvgLinearGradient id="lumenPetalRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFF3E0" />
            <Stop offset="60%" stopColor="#FFCC80" />
            <Stop offset="100%" stopColor="#FF9E54" />
          </SvgLinearGradient>

          <SvgLinearGradient id="lumenCradleGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#FFD180" />
            <Stop offset="50%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FFD180" />
          </SvgLinearGradient>
        </Defs>

        {/* Central rising sun sphere */}
        <Circle cx="50" cy="44" r="10.5" fill="url(#lumenSunGrad)" />

        {/* Center top flame/light crown */}
        <Path d="M 50 18 C 47.5 25 46.5 30 50 35 C 53.5 30 52.5 25 50 18 Z" fill="#FFFFFF" />

        {/* Left restorative wing / petal */}
        <Path
          d="M 50 64 C 38 60 25 48 24 33 C 35 34 45 42 50 56 Z"
          fill="url(#lumenPetalLeft)"
          fillOpacity={0.96}
        />

        {/* Right restorative wing / petal */}
        <Path
          d="M 50 64 C 62 60 75 48 76 33 C 65 34 55 42 50 56 Z"
          fill="url(#lumenPetalRight)"
          fillOpacity={0.96}
        />

        {/* Base rising dawn cradle arc */}
        <Path
          d="M 28 67 C 42 79 58 79 72 67 C 65 81 35 81 28 67 Z"
          fill="url(#lumenCradleGrad)"
          fillOpacity={0.96}
        />

        {/* Morning clarity sparks */}
        <Circle cx="50" cy="14" r="1.6" fill="#FFFFFF" />
        <Circle cx="21" cy="27" r="1.3" fill="#FFE66D" fillOpacity={0.9} />
        <Circle cx="79" cy="27" r="1.3" fill="#FFE66D" fillOpacity={0.9} />
      </Svg>
    </View>
  );
}

export function LumenBadge({ size = 48, style }: { size?: number; style?: StyleProp<ViewStyle> }): React.ReactElement {
  const rx = Math.round(size * 0.24);

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius: rx,
          shadowRadius: Math.round(size * 0.15),
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Lumen Emblem Badge"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          {/* Radiant Sunset/Sunrise Squircle Background */}
          <SvgLinearGradient id="badgeBgGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <Stop offset="0%" stopColor="#FFA448" />
            <Stop offset="30%" stopColor="#FF6B35" />
            <Stop offset="75%" stopColor="#FF5216" />
            <Stop offset="100%" stopColor="#D93800" />
          </SvgLinearGradient>

          {/* Ambient inner glow */}
          <SvgLinearGradient id="badgeInnerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#FFE66D" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FF6B35" stopOpacity="0.05" />
          </SvgLinearGradient>

          <SvgLinearGradient id="badgeSunGrad" x1="30%" y1="20%" x2="70%" y2="80%">
            <Stop offset="0%" stopColor="#FFFDF0" />
            <Stop offset="40%" stopColor="#FFEF85" />
            <Stop offset="100%" stopColor="#FFA448" />
          </SvgLinearGradient>

          <SvgLinearGradient id="badgePetalLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="60%" stopColor="#FFE0B2" />
            <Stop offset="100%" stopColor="#FFB074" />
          </SvgLinearGradient>

          <SvgLinearGradient id="badgePetalRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFF3E0" />
            <Stop offset="60%" stopColor="#FFCC80" />
            <Stop offset="100%" stopColor="#FF9E54" />
          </SvgLinearGradient>

          <SvgLinearGradient id="badgeCradleGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#FFD180" />
            <Stop offset="50%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FFD180" />
          </SvgLinearGradient>
        </Defs>

        {/* Squircle Background */}
        <Rect x="2" y="2" width="96" height="96" rx="24" fill="url(#badgeBgGrad)" />

        {/* Refined Glass Edge Highlight */}
        <Rect
          x="3.5"
          y="3.5"
          width="93"
          height="93"
          rx="22.5"
          fill="none"
          stroke="rgba(255, 255, 255, 0.32)"
          strokeWidth="1.5"
        />

        {/* Ambient Halo Circle */}
        <Circle cx="50" cy="48" r="26" fill="url(#badgeInnerGlow)" opacity={0.6} />

        {/* Central Sun Circle */}
        <Circle cx="50" cy="44" r="10.5" fill="url(#badgeSunGrad)" />

        {/* Crown Ray */}
        <Path d="M 50 18 C 47.5 25 46.5 30 50 35 C 53.5 30 52.5 25 50 18 Z" fill="#FFFFFF" />

        {/* Left Wing / Blossom Petal */}
        <Path
          d="M 50 64 C 38 60 25 48 24 33 C 35 34 45 42 50 56 Z"
          fill="url(#badgePetalLeft)"
          fillOpacity={0.96}
        />

        {/* Right Wing / Blossom Petal */}
        <Path
          d="M 50 64 C 62 60 75 48 76 33 C 65 34 55 42 50 56 Z"
          fill="url(#badgePetalRight)"
          fillOpacity={0.96}
        />

        {/* Rising Dawn Cradle */}
        <Path
          d="M 28 67 C 42 79 58 79 72 67 C 65 81 35 81 28 67 Z"
          fill="url(#badgeCradleGrad)"
          fillOpacity={0.96}
        />

        {/* Spark Accents */}
        <Circle cx="50" cy="14" r="1.6" fill="#FFFFFF" />
        <Circle cx="21" cy="27" r="1.3" fill="#FFE66D" fillOpacity={0.9} />
        <Circle cx="79" cy="27" r="1.3" fill="#FFE66D" fillOpacity={0.9} />
      </Svg>
    </View>
  );
}

export function LumenLogo({
  size = 48,
  variant = 'badge',
  showSubtitle = true,
  style,
}: LumenLogoProps): React.ReactElement {
  const { palette, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  if (variant === 'icon') {
    return <LumenIcon size={size} style={style} />;
  }

  if (variant === 'badge') {
    return <LumenBadge size={size} style={style} />;
  }

  // Full variant: Badge + Wordmark + Subtitle
  const badgeSize = Math.max(40, Math.round(size * 0.7));
  const fontSize = Math.max(22, Math.round(size * 0.44));
  const subFontSize = Math.max(10, Math.round(fontSize * 0.4));

  return (
    <View style={[styles.fullContainer, style]} accessibilityRole="header">
      <LumenBadge size={badgeSize} />
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text
            style={[
              styles.brandName,
              {
                fontSize,
                color: palette.text,
              },
            ]}
          >
            Lumen
          </Text>
          <View style={styles.sparkleDot} />
        </View>
        {showSubtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: subFontSize,
                color: palette.textSecondary,
              },
            ]}
          >
            Autoimmune Health Companion
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandName: {
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sparkleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
