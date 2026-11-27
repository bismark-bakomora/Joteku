import { useTheme } from '@/context/ThemeContext';
import { StyleSheet } from 'react-native';
import { Palette } from './colors';

type Styles = Parameters<typeof StyleSheet.create>[0];

// Builds a screen's styles from the active palette. Use it in place of
// StyleSheet.create whenever a style needs a colour:
//
//   const useStyles = makeStyles((colors) => ({ title: { color: colors.text } }));
//   ...inside the component: const styles = useStyles();
//
// Each palette's styles are built once and reused.
export function makeStyles<S extends Styles>(build: (colors: Palette) => S & Styles) {
  const built = new Map<Palette, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const { colors } = useTheme();
    const cached = built.get(colors);
    if (cached) {
      return cached;
    }
    const styles = StyleSheet.create(build(colors));
    built.set(colors, styles);
    return styles;
  };
}
