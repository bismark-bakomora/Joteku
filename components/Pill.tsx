import { colors, radii, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type PillTone = 'gold' | 'light' | 'neutral' | 'secondary';

type PillProps = {
  label: string;
  tone?: PillTone;
  icon?: keyof typeof Ionicons.glyphMap;
  dotColor?: string;
  uppercase?: boolean;
};

const tones: Record<PillTone, { background: string; text: string }> = {
  gold: { background: colors.goldSoft, text: colors.onGoldSoft },
  light: { background: colors.surface, text: colors.text },
  neutral: { background: colors.surfaceHigh, text: colors.textSubtle },
  secondary: { background: colors.secondaryTint, text: colors.onSecondaryTint },
};

export function Pill({ label, tone = 'neutral', icon, dotColor, uppercase = false }: PillProps) {
  const palette = tones[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      {icon ? <Ionicons color={palette.text} name={icon} size={14} /> : null}
      <Text
        numberOfLines={1}
        style={[styles.label, { color: palette.text }, uppercase ? styles.uppercase : undefined]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  label: {
    ...typography.labelSm,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
