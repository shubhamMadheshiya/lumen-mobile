/**
 * Lumen Design System — colour tokens.
 * Calm, warm, non-clinical palette.
 */

export const palette = {
  // Brand
  primary:   '#FF6B35',  // warm coral/orange — action colour
  secondary: '#4ECDC4',  // teal — secondary CTA
  accent:    '#FFE66D',  // soft yellow — highlight

  // Category colours
  catSymptom:  '#E57373',  // warm red
  catFood:     '#66BB6A',  // green
  catHabits:   '#42A5F5',  // blue
  catMeds:     '#AB47BC',  // purple
  catBody:     '#8D6E63',  // brown
  catMood:     '#7E57C2',  // indigo
  catVitals:   '#EF5350',  // red

  // Severity / alert
  severityNone:   '#66BB6A',
  severityLow:    '#FFCA28',
  severityMedium: '#FFA726',
  severityHigh:   '#EF5350',

  // Neutrals (light mode)
  background:    '#FFF8F0',  // off-white warm
  surface:       '#FFFFFF',
  surfaceAlt:    '#F5F0EB',
  border:        '#E8E0D8',
  divider:       '#EDE8E4',

  text:          '#1A1A1A',
  textSecondary: '#6B5E52',
  textDisabled:  '#B0A89E',
  placeholder:   '#C4B8AE',

  // Dark mode overrides (re-defined as tokens in darkColors below)
  darkBackground:    '#1A1612',
  darkSurface:       '#252118',
  darkSurfaceAlt:    '#2E2921',
  darkBorder:        '#3D352C',
  darkText:          '#F5F0EB',
  darkTextSecondary: '#B0A89E',

  // Status
  success: '#66BB6A',
  warning: '#FFA726',
  error:   '#EF5350',
  info:    '#42A5F5',

  // Special
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof palette;

// Light and dark theme tokens
export const lightColors = {
  background:    palette.background,
  surface:       palette.surface,
  surfaceAlt:    palette.surfaceAlt,
  border:        palette.border,
  divider:       palette.divider,
  text:          palette.text,
  textSecondary: palette.textSecondary,
  textDisabled:  palette.textDisabled,
  placeholder:   palette.placeholder,
  primary:       palette.primary,
  secondary:     palette.secondary,
};

export const darkColors = {
  background:    palette.darkBackground,
  surface:       palette.darkSurface,
  surfaceAlt:    palette.darkSurfaceAlt,
  border:        palette.darkBorder,
  divider:       palette.darkBorder,
  text:          palette.darkText,
  textSecondary: palette.darkTextSecondary,
  textDisabled:  '#6B5E52',
  placeholder:   '#6B5E52',
  primary:       palette.primary,
  secondary:     palette.secondary,
};
