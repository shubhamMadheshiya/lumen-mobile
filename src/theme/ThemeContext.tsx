/**
 * ThemeContext — provides the active colour palette to components.
 *
 * Reads the system colour scheme and switches between lightTokens / darkTokens.
 * Also exposes a manual override for in-app theme switching (stored in AsyncStorage).
 *
 * Usage in a component:
 *   const { palette, colorScheme } = useTheme();
 *   const styles = useMemo(() => createStyles(palette), [palette]);
 */
import React, {
  createContext, useContext, useEffect, useState, useMemo, ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTokens, darkTokens, ThemeTokens } from './tokens';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  palette: ThemeTokens;
  colorScheme: 'light' | 'dark';
  preference: ColorScheme;
  setPreference: (scheme: ColorScheme) => void;
}

const PREF_KEY = 'lumen:theme:preference';

const ThemeContext = createContext<ThemeContextValue>({
  palette: lightTokens,
  colorScheme: 'light',
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ColorScheme>('system');

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    }).catch(() => {});
  }, []);

  const setPreference = (scheme: ColorScheme) => {
    setPreferenceState(scheme);
    AsyncStorage.setItem(PREF_KEY, scheme).catch(() => {});
  };

  const colorScheme: 'light' | 'dark' =
    preference === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : preference;
  const palette = colorScheme === 'dark' ? darkTokens : lightTokens;

  const value = useMemo<ThemeContextValue>(
    () => ({ palette, colorScheme, preference, setPreference }),
    [palette, colorScheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Convenience hook — just the palette, for migrated components. */
export function usePalette(): ThemeTokens {
  return useContext(ThemeContext).palette;
}
