import { fontFamilies, Palette } from '@/theme';

// Header and background styling shared by every stack navigator in the app.
export function stackScreenOptions(colors: Palette) {
  return {
    headerTintColor: colors.primary,
    headerTitleStyle: {
      fontFamily: fontFamilies.headline,
      color: colors.text,
    },
    headerStyle: { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
  };
}
