import { colors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type PhotoTone = 'green' | 'brown' | 'cream';

type PhotoPlaceholderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: PhotoTone;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: ReactNode;
};

const tones: Record<PhotoTone, { background: string; icon: string }> = {
  green: { background: colors.primary, icon: colors.primarySoftDim },
  brown: { background: colors.secondarySoft, icon: colors.onSecondarySoft },
  cream: { background: colors.surfaceHigh, icon: colors.secondary },
};

// Stands in for a real photo until Joteku supplies its own pictures.
export function PhotoPlaceholder({
  icon,
  tone = 'cream',
  iconSize = 40,
  style,
  accessibilityLabel,
  children,
}: PhotoPlaceholderProps) {
  const palette = tones[tone];

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      style={[styles.wrap, { backgroundColor: palette.background }, style]}
    >
      <Ionicons color={palette.icon} name={icon} size={iconSize} />
      {children ? <View style={StyleSheet.absoluteFill}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
