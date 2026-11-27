import { storage } from '@/lib/storage';
import { darkColors, lightColors, Palette } from '@/theme/colors';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

// 'system' follows the phone's own light or dark setting.
export type AppearancePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

type ThemeValue = {
  colors: Palette;
  scheme: ColorScheme;
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
  // False until the saved preference is read, so the app never flashes the wrong mode.
  ready: boolean;
};

const APPEARANCE_KEY = 'appearance';

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

// Tells the phone too, so keyboards, alerts and the status bar match the app.
// Browsers cannot be told, so the web build only changes the app's own colours.
function applyToPhone(preference: AppearancePreference) {
  if (Platform.OS === 'web') {
    return;
  }
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const phoneScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    storage.get<AppearancePreference>(APPEARANCE_KEY).then((saved) => {
      if (!active) {
        return;
      }
      if (saved === 'light' || saved === 'dark') {
        setPreferenceState(saved);
        applyToPhone(saved);
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    applyToPhone(next);
    storage.set(APPEARANCE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme = preference === 'system' ? (phoneScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      preference,
      setPreference,
      ready,
    }),
    [scheme, preference, setPreference, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
