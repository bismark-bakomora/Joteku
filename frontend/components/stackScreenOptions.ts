import { colors, fontFamilies } from '@/theme';

// Header and background styling shared by every stack navigator in the app.
export const stackScreenOptions = {
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontFamily: fontFamilies.headline,
    color: colors.text,
  },
  headerStyle: { backgroundColor: colors.background },
  contentStyle: { backgroundColor: colors.background },
};
