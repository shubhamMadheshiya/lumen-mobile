/**
 * Design tokens for light and dark themes.
 * Components that support dark mode import `useTheme()` and access
 * `palette` from there instead of from the static `colors.ts` file.
 *
 * Migration pattern for existing components:
 *   - Before: import { palette } from '../../theme/colors'
 *             const styles = StyleSheet.create({ ... palette.text ... })
 *   - After:  import { useTheme } from '../../theme/ThemeContext'
 *             function MyComponent() {
 *               const { palette } = useTheme()
 *               const styles = useMemo(() => createStyles(palette), [palette])
 *               ...
 *             }
 */
import { palette as lightPaletteSource } from './colors';

export type ThemeTokens = Record<keyof typeof lightPaletteSource, string>;

// Independent, immutable light design tokens so theme changes never mutate source values
export const lightTokens: ThemeTokens = Object.freeze({
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

  // Dark mode compatibility overrides
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
});

export const darkTokens: ThemeTokens = Object.freeze({
  ...lightTokens,

  // Backgrounds — dark-first
  background:    '#1A1612',
  surface:       '#252118',
  surfaceAlt:    '#2E2921',

  // Text
  text:          '#F5F0EB',
  textSecondary: '#B0A89E',
  textDisabled:  '#6B5E52',
  placeholder:   '#6B5E52',

  // Brand — same warm coral reads well on dark
  primary:       '#FF7D4D',
  secondary:     '#5EDBD2',

  // Borders
  border:        '#3D352C',
  divider:       '#3D352C',

  // Semantic (unchanged — already high-contrast)
  success:  '#66BB6A',
  warning:  '#FFA726',
  error:    '#EF5350',
  info:     '#64B5F6',
});

