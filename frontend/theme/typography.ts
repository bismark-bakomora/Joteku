import { TextStyle } from 'react-native';

export const fontFamilies = {
  headline: 'Epilogue_600SemiBold',
  headlineBold: 'Epilogue_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.headlineBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.28,
  },
  headline: {
    fontFamily: fontFamilies.headline,
    fontSize: 24,
    lineHeight: 32,
  },
  title: {
    fontFamily: fontFamilies.headline,
    fontSize: 18,
    lineHeight: 24,
  },
  titleLg: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 18,
    lineHeight: 26,
  },
  titleMd: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  titleSm: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  labelSm: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
  },
} satisfies Record<string, TextStyle>;
