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

export const lightTokens: ThemeTokens = lightPaletteSource;

export const darkTokens: ThemeTokens = {
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
};
