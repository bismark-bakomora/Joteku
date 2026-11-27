import { makeStyles, Palette, radii, shadows, sizes, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ActionTone = 'neutral' | 'secondary' | 'primary';

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  tone?: ActionTone;
};

const tones = (colors: Palette): Record<ActionTone, { background: string; icon: string }> => ({
  neutral: { background: colors.surfaceHigh, icon: colors.secondary },
  secondary: { background: colors.secondarySoft, icon: colors.onSecondarySoft },
  primary: { background: colors.primarySoft, icon: colors.primary },
});

export function ActionRow({ icon, title, subtitle, onPress, tone = 'neutral' }: ActionRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const palette = tones(colors)[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : undefined]}
    >
      <View style={[styles.iconTile, { backgroundColor: palette.background }]}>
        <Ionicons color={palette.icon} name={icon} size={26} />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      <Ionicons color={colors.outline} name="chevron-forward" size={22} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconTile: {
    width: sizes.tapTarget,
    height: sizes.tapTarget,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.titleMd,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSubtle,
  },
}));
